import { Response } from 'express';
import { AuthRequest } from '../types';
import AIConversation from '../models/AIConversation';
import Grocery from '../models/Grocery';
import User from '../models/User';
import { GeminiService, IGeminiMessage } from '../services/geminiService';
import { sendError } from '../utils/responses';
import { GROCERY_KNOWLEDGE, formatGroceryProfile, RECOGNIZED_PRODUCTS } from '../utils/groceryKnowledge';
import { getPredefinedAgentResponse } from '../utils/agentKnowledge';

// Specialized System instructions for each independent agent
const AGENT_SYSTEM_PROMPTS = {
  alex: (userName: string, groceriesText: string) => `You are ALEX 👨🔬, a professional Expiry Prediction Specialist.
Your primary directives:
- Predict expiry dates, explain shelf life, suggest optimal storage methods (shelves, airtight containers), and warn about products expiring soon.
- Keep answers highly conversational, friendly, personalized, and freshness-focused.
- Greet the user naturally as "${userName}".
- Avoid repetitive or blank answers.
- Focus STRICTLY on expiry prediction, freshness, shelf life, and storage conditions. If the user asks about other topics, politely direct them to the appropriate expert (Maya for recipes, Buddy for waste, Sam for inventory).
- Never return generic, conversational filler replies like "I'm here to help" or "What would you like to know?". Always provide specific, highly useful food freshness answers directly.
- User active stock in fridge right now: [${groceriesText || 'None'}]`,

  maya: (userName: string, groceriesText: string) => `You are MAYA 👩🍳, a creative Recipe Specialist and culinary home helper.
Your primary directives:
- Generate recipes from available ingredients, suggest healthy alternatives, and recommend recipes for expiring items.
- Keep directions structured, fun, and easy to follow.
- Greet the user naturally as "${userName}".
- Avoid repetitive or blank answers.
- Focus STRICTLY on cooking, recipes, ingredients, and culinary preparation. If the user asks about other topics (like expiry dates or shopping lists), politely redirect them to the appropriate expert (Alex for expiry, Buddy for waste, Sam for inventory).
- Never return generic, conversational filler replies like "I'm here to help" or "What would you like to know?". Always provide concrete recipes or meal ideas directly.
- User active stock in fridge right now: [${groceriesText || 'None'}]`,

  buddy: (userName: string, groceriesText: string) => `You are BUDDY 🤝, a supportive Food Waste Prevention Specialist.
Your primary directives:
- Suggest creative ways to reduce food waste, recommend donation options, community sharing, reuse, and preservation methods (freezing, pickling, dehydrating).
- Greet the user naturally as "${userName}".
- Avoid repetitive or blank answers.
- Focus STRICTLY on food waste prevention, preservation methods (freezing, dehydrating, pickling), and reuse of leftovers. If the user asks about other topics (like cooking complex recipes or planning budgets), politely redirect them to the appropriate expert (Alex for expiry, Maya for recipes, Sam for inventory).
- Never return generic, conversational filler replies like "I'm here to help" or "What would you like to know?". Always provide specific food preservation guides or zero-waste methods directly.
- User active stock in fridge right now: [${groceriesText || 'None'}]`,

  sam: (userName: string, groceriesText: string) => `You are SAM 🛒, an Inventory & Shopping Specialist.
Your primary directives:
- Monitor inventory levels, assist in creating shopping lists, recommend products to restock, and suggest optimal purchase quantities.
- Greet the user naturally as "${userName}".
- Avoid repetitive or blank answers.
- Focus STRICTLY on inventory levels, shopping lists, purchase quantities, and budgeting. If the user asks about other topics (like recipes or spoilage signs), politely redirect them to the appropriate expert (Alex for expiry, Maya for recipes, Buddy for waste).
- Never return generic, conversational filler replies like "I'm here to help" or "What would you like to know?". Always provide direct shopping advice, item counts, or budget plans directly.
- User active stock in fridge right now: [${groceriesText || 'None'}]`
};

/**
 * Custom smart local conversational engine if Gemini fails or is unconfigured
 */
function generateLocalAgentResponse(
  agent: 'alex' | 'maya' | 'buddy' | 'sam',
  message: string,
  userName: string,
  groceries: any[],
  history: any[]
): string {
  const lowercase = message.toLowerCase().trim();

  // Handle default standard greetings
  if (lowercase === 'hi' || lowercase === 'hello' || lowercase === 'hey') {
    if (agent === 'alex') {
      return `Hi ${userName} 👋 Welcome back! I'm Alex, your Expiry Prediction Assistant. How can I help you today?`;
    }
    if (agent === 'maya') {
      return `Hi ${userName} 👋 I'm Maya, your Recipe Assistant. What ingredients do you have today?`;
    }
    if (agent === 'buddy') {
      return `Hi ${userName} 👋 I'm Buddy. Let's reduce food waste together. How can I help?`;
    }
    if (agent === 'sam') {
      return `Hi ${userName} 👋 I'm Sam, your Inventory & Shopping Assistant. What would you like to manage today?`;
    }
  }

  if (lowercase === 'how are you') {
    return `I'm doing great, ${userName} 😊 Thanks for asking! How can I assist you with your grocery tasks today?`;
  }

  // Scan history for pronoun references (e.g. Milk -> "it")
  let lastMentionedItem = '';
  for (let i = history.length - 1; i >= 0; i--) {
    const item = history[i];
    if (item.role === 'user') {
      const txt = item.content.toLowerCase();
      if (txt.includes('milk')) { lastMentionedItem = 'milk'; break; }
      if (txt.includes('banana')) { lastMentionedItem = 'banana'; break; }
      if (txt.includes('egg')) { lastMentionedItem = 'eggs'; break; }
      if (txt.includes('tomato')) { lastMentionedItem = 'tomatoes'; break; }
    }
  }

  const isItQuery = lowercase.includes('it') || lowercase.includes('that') || lowercase.includes('them') || lowercase.includes('this');

  if (isItQuery && lastMentionedItem) {
    if (lowercase.includes('store') || lowercase.includes('keep')) {
      if (lastMentionedItem === 'milk') {
        return `You should keep that milk stored on the **middle shelf** in the main compartment, ${userName}. Keep it away from door pockets where doors opening cause frequent temperature swings!`;
      }
      if (lastMentionedItem === 'banana') {
        return `Store those bananas at room temperature away from sunlight, ${userName}. Wrap their stems in plastic cling wrap to trap ripening gases and extend their freshness!`;
      }
    }
    if (lowercase.includes('cook') || lowercase.includes('make') || lowercase.includes('recipe')) {
      if (lastMentionedItem === 'milk') {
        return `You can make delicious zero-waste pancakes, oatmeal porridge, french toast, or smoothies with that milk, ${userName}! 🥞🥛`;
      }
      if (lastMentionedItem === 'eggs') {
        return `You can whip up a rapid tomato omelette, vegetable stir-fry scramble, or rich coddled eggs with those! 🍳`;
      }
    }
  }

  // Expiry audit queries
  if (lowercase.includes('expire') || lowercase.includes('soon') || lowercase.includes('what should i use')) {
    const expiring = groceries.filter(g => g.status === 'expired' || g.status === 'expiring_soon');
    if (expiring.length > 0) {
      const names = expiring.map(g => g.itemName).join(', ');
      return `⚠️ **Attention Narasimha**:
Scanning your kitchen, your **${names}** is/are expiring soon! I highly recommend consuming or freezing them within the next 24 hours to prevent waste.`;
    } else {
      return `🎉 All clear, ${userName}! None of your active groceries are expiring within the next 3 days. Your kitchen is running perfectly!`;
    }
  }

  // Handle agent specific custom fallback responses
  // Handle agent specific custom fallback responses
  if (agent === 'alex') {
    if (lowercase.includes('milk')) {
      return `🧠 **ALEX Expiry Expert**:
Here is my expiry prediction and freshness guide for **Milk**:
* **Shelf Life**: 5–7 days after opening when stored under proper refrigeration (3°C to 4°C).
* **Storage Method**: Keep it stored deep on the middle shelf of the main compartment. Avoid storing it in door pockets where doors opening cause frequent temperature swings.
* **Spoilage Signs**: Sour aroma, thick or clumpy consistency, and yellowish color.
* **Freshness Recommendations**: Keep the cap sealed tightly to prevent absorbing other food odors.`;
    }
    if (lowercase.includes('curd') || lowercase.includes('yogurt')) {
      return `🧠 **ALEX Expiry Expert**:
Here is my expiry prediction and freshness guide for **Curd (Yogurt)**:
* **Shelf Life**: 7–10 days after opening when stored under proper refrigeration.
* **Storage Method**: Keep it sealed on the top or middle shelf of the refrigerator.
* **Spoilage Signs**: Strong sour smell, visible green or white mold on the surface, or severe separation of watery whey.
* **Freshness Recommendations**: Always use a clean, completely dry spoon to scoop curd to prevent introducing bacterial contaminants!`;
    }
    if (lowercase.includes('egg')) {
      return `🧠 **ALEX Expiry Expert**:
Here is my expiry prediction and freshness guide for **Eggs**:
* **Shelf Life**: 3–5 weeks from purchase when refrigerated.
* **Storage Method**: Store them in their original carton on a main refrigerator shelf (not in the door egg holders, to protect from temperature swings).
* **Spoilage Signs**: Egg float test failure (floats to the top of a bowl of water), or a strong rotten sulfur smell when cracked.
* **Freshness Recommendations**: Keep eggs stored with pointed ends facing down to keep the air pocket at the top and maintain freshness.`;
    }
    if (lowercase.includes('bread')) {
      return `🧠 **ALEX Expiry Expert**:
Here is my expiry prediction and freshness guide for **Bread**:
* **Shelf Life**: 3–7 days at room temperature, or up to 3 months frozen.
* **Storage Method**: Store in a cool, dry bread box or freeze immediately. Avoid refrigerating, as this accelerates retrogradation and makes it go stale faster!
* **Spoilage Signs**: Visible mold spots (green, white, or black fuzz), and a dry, extremely hard texture.
* **Freshness Recommendations**: Squeeze all excess air out of the bag and seal it tightly with a twist tie after each use.`;
    }
    if (lowercase.includes('rice')) {
      return `🧠 **ALEX Expiry Expert**:
Here is my expiry prediction and freshness guide for **Rice**:
* **Shelf Life**: Dry white rice lasts indefinitely; cooked rice lasts 4–6 days when refrigerated.
* **Storage Method**: Cooked rice must be cooled quickly and kept in a shallow, airtight container in the fridge.
* **Spoilage Signs**: Unpleasant sour smell, slimy texture, or hard dry grains.
* **Freshness Recommendations**: Always reheat cooked rice thoroughly above 75°C before consuming to eliminate any potential bacterial spores.`;
    }
    if (lowercase.includes('vegetable')) {
      return `🧠 **ALEX Expiry Expert**:
Here is my expiry prediction and freshness guide for **Vegetables**:
* **Shelf Life**: 3–10 days depending on the type (leafy greens are the shortest, root vegetables are the longest).
* **Storage Method**: High-humidity crisper drawer for leafy greens, low-humidity for peppers and squash. Keep them dry!
* **Spoilage Signs**: Wilting, slimy residue, soft mushy brown spots, or mold fuzz.
* **Freshness Recommendations**: Wrap leafy greens in dry paper towels to absorb excess moisture, and do not wash them until you are ready to prepare them.`;
    }
    if (lowercase.includes('fruit')) {
      return `🧠 **ALEX Expiry Expert**:
Here is my expiry prediction and freshness guide for **Fruits**:
* **Shelf Life**: 5–14 days depending on the fruit.
* **Storage Method**: Low-humidity crisper drawer for apples/pears; counter at room temperature for bananas, citrus, and avocados until ripe.
* **Spoilage Signs**: Excessive bruising, soft mushy skin, liquid leakage, white mold, or a fermented odor.
* **Freshness Recommendations**: Keep high-ethylene producing fruits (apples, bananas, tomatoes) separated from other produce to prevent accelerated ripening!`;
    }
    return `🧠 **ALEX Expiry Assistant**:
I am here to help, ${userName}! Ask me about freshness windows, storage suggestions, or expiry forecasts for any specific item.`;
  }

  if (agent === 'maya') {
    const stockNames = groceries.slice(0, 3).map(g => g.itemName);
    if (lowercase.includes('cook') || lowercase.includes('recipe') || lowercase.includes('what can i make')) {
      if (stockNames.length > 0) {
        return `👩🍳 **MAYA Recipe Helper**:
Using your **${stockNames.join(', ')}**, here is a rapid zero-waste skillet recipe, ${userName}:

### 🍳 Active-Stock Pantry Skillet
1. Chop your available produce into fine bits.
2. Heat 1 tbsp oil in a skillet, sauté vegetables for 5 minutes.
3. Crack in eggs or add available proteins, stir gently until cooked.
4. Top with shredded cheese and fresh herbs, and serve warm!`;
      }
      return `👩🍳 **MAYA Recipe Helper**:
Your stock list is currently empty, ${userName}! But you can prepare an incredible **French Toast** or **Herb Scramble** using basic staples (eggs, bread, milk). Let me know what you have!`;
    }
    return `👩🍳 **MAYA Recipe Helper**:
I'm here to cook, ${userName}! Give me any ingredient list, and I'll generate a mouth-watering step-by-step recipe.`;
  }

  if (agent === 'buddy') {
    return `🤝 **BUDDY Waste Prevention**:
I'm here, ${userName}! Let's protect your groceries. If you have excess produce, you can blanch it in boiling water for 1 minute then freeze it, or slice and pickle it in vinegar! What items can we save today?`;
  }

  if (agent === 'sam') {
    return `🛒 **SAM Inventory Helper**:
I am monitoring your stock levels, ${userName}. Your pantry looks well organized! I recommend picking up fresh milk and produce on your next market run. What would you like to add to your shopping list today?`;
  }

  return `Hello ${userName}! I am your specialized SMART AI companion. Ask me any question, and I'll give you professional advice!`;
}

/**
 * Base Core Controller that processes agent messages using Gemini API or dynamic local matching fallbacks
 */
async function processAgentChat(
  req: AuthRequest,
  res: Response,
  agent: 'alex' | 'maya' | 'buddy' | 'sam'
) {
  try {
    const { message } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, 'User authentication required', 401);
    }

    if (!message || !message.trim()) {
      return sendError(res, 'Message content is required', 400);
    }

    // Fetch user name to personalize
    const user = await User.findById(userId).select('name');
    const userName = user?.name || 'Narasimha';

    // Fetch user groceries to inject context
    const groceries = await Grocery.find({ userId, archived: false }).select('itemName expiryDate status');
    const groceriesText = groceries.map(g => `${g.itemName} (expires ${new Date(g.expiryDate).toLocaleDateString()}, status: ${g.status})`).join(', ');

    // Retrieve or create chat conversation record
    let conversation = await AIConversation.findOne({ userId, assistant: agent });
    if (!conversation) {
      conversation = await AIConversation.create({
        userId,
        assistant: agent,
        messages: []
      });
    }

    // Append user message
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    let aiResponseText = '';

    // Intercept single product freshness query for ALEX
    const cleanWord = message.trim().toLowerCase().replace(/[.,!?;:]/g, '');
    const isSingleProductQuery = agent === 'alex' && (
      RECOGNIZED_PRODUCTS.has(cleanWord) || 
      (cleanWord.split(/\s+/).length <= 2 && !/^(hi|hello|hey|how|what|why|where|can|give|show|tell|help|good)/i.test(cleanWord))
    );

    if (isSingleProductQuery) {
      const profile = GROCERY_KNOWLEDGE[cleanWord];
      if (profile) {
        aiResponseText = formatGroceryProfile(profile);
      } else {
        const geminiKey = process.env.GEMINI_API_KEY;
        if (geminiKey) {
          try {
            const strictPrompt = `You are ALEX, an Expiry Prediction Expert. The user has queried about the item: "${cleanWord}".
You must strictly return its shelf life, storage, spoilage, freshness, and food safety recommendations using the following exact structure with no conversational prefix or suffix:

[Emoji] [Product Name]

Shelf Life:
* Room temperature: [Shelf life details at room temp]
* Refrigerator: [Shelf life details inside refrigerator]
* Freezer (if applicable): [Shelf life details in freezer, or write "Not recommended" or "Not applicable" if not suitable]

Storage Method:
* [Detail on best storage conditions, temperature, or packaging]

Spoilage Signs:
* [Detail on how to identify spoilage via look, feel, or smell]

Freshness Tips:
* [Detail on how to increase shelf life or clever longevity hacks]

Food Safety Notes:
* [Detail on important safety precautions or bacterial risk guidelines]

Do not return generic fallbacks, introductions, or conversational fillers. Direct print the requested structured layout immediately.`;
            aiResponseText = await GeminiService.generateContent(strictPrompt, [
              { role: 'user', parts: [{ text: cleanWord }] }
            ]);
          } catch (err) {
            console.error('Gemini query for dynamic product guide failed:', err);
          }
        }
      }
    }

    // Intercept Maya, Buddy, and Sam predefined target matches
    if (!aiResponseText) {
      const predefinedResponse = getPredefinedAgentResponse(agent, message);
      if (predefinedResponse) {
        aiResponseText = predefinedResponse;
      }
    }

    // Check environment key
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!aiResponseText && geminiKey) {
      try {
        const systemPrompt = AGENT_SYSTEM_PROMPTS[agent](userName, groceriesText);
        
        // Map history to Gemini API format
        const history: IGeminiMessage[] = conversation.messages.slice(-10).map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }));

        aiResponseText = await GeminiService.generateContent(systemPrompt, history);
      } catch (err) {
        console.error(`Gemini API call failed for Agent ${agent}, running fallback:`, err);
      }
    }

    // Context-aware Dynamic fallback if API key is not present or failed
    if (!aiResponseText.trim()) {
      aiResponseText = generateLocalAgentResponse(agent, message, userName, groceries, conversation.messages);
    }

    // Save AI response to persistent Mongoose history
    conversation.messages.push({
      role: 'assistant',
      content: aiResponseText,
      timestamp: new Date()
    });

    await conversation.save();

    return res.status(200).json({
      response: aiResponseText
    });

  } catch (error: any) {
    console.error(`processAgentChat error for ${agent}:`, error);
    return res.status(200).json({
      response: "Unable to reach AI service. Please try again."
    });
  }
}

// Export Chat Handlers for independent agent endpoints
export const chatAlex = async (req: AuthRequest, res: Response) => {
  return processAgentChat(req, res, 'alex');
};

export const chatMaya = async (req: AuthRequest, res: Response) => {
  return processAgentChat(req, res, 'maya');
};

export const chatBuddy = async (req: AuthRequest, res: Response) => {
  return processAgentChat(req, res, 'buddy');
};

export const chatSam = async (req: AuthRequest, res: Response) => {
  return processAgentChat(req, res, 'sam');
};
