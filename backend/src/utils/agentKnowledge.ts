export const MAYA_KNOWLEDGE: Record<string, string> = {
  'onions tomatoes and eggs': `You can make **Egg Bhurji**.

**Ingredients**:
* 2 eggs
* 1 onion
* 1 tomato
* Salt and spices

**Steps**:
1. Saute onions.
2. Add tomatoes.
3. Add beaten eggs.
4. Cook until done.`,

  'onions, tomatoes, and eggs': `You can make **Egg Bhurji**.

**Ingredients**:
* 2 eggs
* 1 onion
* 1 tomato
* Salt and spices

**Steps**:
1. Saute onions.
2. Add tomatoes.
3. Add beaten eggs.
4. Cook until done.`,

  'leftover rice': `You can make:
* **Fried Rice**
* **Lemon Rice**
* **Curd Rice**
* **Rice Cutlets**`,

  'healthy breakfast': `You can enjoy a nutritious **Vegetable Oats Upma** made with carrots, peas, onions, and fiber-rich oats.`,

  'vegetarian dinner': `I recommend a delicious **Paneer Butter Masala** served alongside warm **Jeera Rice** and a fresh **Garden Salad**! 🧀🌾🥗`,

  'chicken and potatoes': `You can prepare a hearty **Chicken Potato Curry**.

**Ingredients**:
* 500g Chicken curry cut
* 2 large Potatoes (peeled & cubed)
* 2 Onions & 2 Tomatoes (chopped)
* 1 tbsp Ginger-garlic paste
* Spices: Turmeric, Chilli powder, Garam masala, Salt

**Steps**:
1. Sauté chopped onions until golden brown.
2. Add ginger-garlic paste and sauté for 1 minute.
3. Mix in tomatoes and spices, and cook until oil separates.
4. Add chicken pieces and potato cubes, coating them well in the spice mixture.
5. Pour in 1.5 cups of water, cover, and simmer for 20-25 minutes until chicken is tender. Serve warm with rice or roti!`
};

export const BUDDY_KNOWLEDGE: Record<string, string> = {
  'bananas are overripe': `Use them for:
* **Banana Bread**
* **Smoothies**
* **Pancakes**
* **Ice Cream**`,

  'overripe bananas': `Use them for:
* **Banana Bread**
* **Smoothies**
* **Pancakes**
* **Ice Cream**`,

  'stale bread': `Use it for:
* **Bread Crumbs**
* **Croutons**
* **Bread Pizza**
* **Bread Pudding**`,

  'reduce food waste': `Here are primary actionable guidelines:
* **Buy only what you need**: Plan meals and make shopping lists.
* **Store food properly**: Understand refrigeration zones and airtight wrapping.
* **Freeze extras**: Don't let excess food spoil, freeze it!
* **Use older items first**: Implement FIFO (First In, First Out) rules in your pantry.`,

  'preserve coriander': `To maximize freshness:
* Wash and thoroughly dry the coriander leaves.
* Wrap the leaves gently in a clean dry paper towel.
* Place inside an airtight container and store in the main compartment of your refrigerator.`,

  'coriander leaves': `To maximize freshness:
* Wash and thoroughly dry the coriander leaves.
* Wrap the leaves gently in a clean dry paper towel.
* Place inside an airtight container and store in the main compartment of your refrigerator.`,

  'too much rice': `Here is how to manage excess cooked rice safely:
* Refrigerate the cooked rice within **2 hours** of cooking.
* Reuse it on the next day to cook a beautiful **Fried Rice** or crispy **Rice Cutlets**!`
};

export const SAM_KNOWLEDGE: Record<string, string> = {
  'shopping list': `### 🛒 Your Shopping List:
* Rice
* Milk
* Eggs
* Onions
* Tomatoes
* Cooking Oil
* Bread`,

  'should i buy this week': `### 📦 Recommending Weekly Essentials:
Based on common household needs:
* **Vegetables** (Onions, Tomatoes, Potatoes)
* **Fruits** (Apples, Bananas)
* **Dairy** (Milk, Curd)
* **Proteins** (Eggs, Chicken)
* **Pantry Staples** (Rice, Wheat, Cooking Essentials)`,

  'plan groceries': `### 📊 Budget Grocery Plan (₹3000 limit):
1. **Staples (Rice, Wheat, Dal)**: ₹800 (10kg Rice, 5kg Atta, 2kg Toor Dal)
2. **Dairy (Milk, Curd, Butter)**: ₹600 (Daily milk pouches, curd tubs)
3. **Produce (Onions, Potatoes, Tomatoes, Fruits)**: ₹700 (Fresh seasonal vegetables)
4. **Proteins & Essentials (Eggs, Chicken, Oil)**: ₹600 (Farm eggs, cooking oil, spices)
5. **Packaged (Bread, Snacks)**: ₹300 (Wholewheat bread, biscuits)

**Total Estimated Cost**: ~₹2,900. Optimized for a balanced family diet!`,

  'family of 4': `For a family of 4, you should buy approximately **20–25 kg of rice per month**, depending on how often rice is served as a primary daily staple.`,

  'family of four': `For a family of 4, you should buy approximately **20–25 kg of rice per month**, depending on how often rice is served as a primary daily staple.`
};

/**
 * Scan clean user messages to return instant matching replies for specialized categories
 */
export function getPredefinedAgentResponse(agent: string, message: string): string | null {
  const clean = message.toLowerCase().trim().replace(/[.,!?;:]/g, '');

  if (agent === 'maya') {
    for (const [key, value] of Object.entries(MAYA_KNOWLEDGE)) {
      if (clean.includes(key)) return value;
    }
  }
  if (agent === 'buddy') {
    for (const [key, value] of Object.entries(BUDDY_KNOWLEDGE)) {
      if (clean.includes(key)) return value;
    }
  }
  if (agent === 'sam') {
    for (const [key, value] of Object.entries(SAM_KNOWLEDGE)) {
      if (clean.includes(key)) return value;
    }
  }
  return null;
}
