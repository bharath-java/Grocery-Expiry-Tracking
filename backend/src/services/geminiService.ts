import dotenv from 'dotenv';
dotenv.config();

export interface IGeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

/**
 * Premium Service layer for Gemini 1.5 Flash API completions
 */
export class GeminiService {
  private static apiKey = process.env.GEMINI_API_KEY || '';

  /**
   * Generates conversational response using system instruction and multi-turn message contexts.
   * Retries up to 2 times automatically if external endpoints encounter rate-limits or standard drops.
   */
  public static async generateContent(
    systemPrompt: string,
    history: IGeminiMessage[],
    maxRetries = 2
  ): Promise<string> {
    const geminiKey = this.apiKey;
    if (!geminiKey) {
      console.warn('GEMINI_API_KEY environment variable is missing.');
      throw new Error('API key is unconfigured');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

    let lastError: any = null;
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const payload = {
          contents: history,
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024
          }
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          // Set a robust timeout to avoid freezing requests
          signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini HTTP Error ${response.status}: ${errText}`);
        }

        const data = (await response.json()) as any;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new Error('Invalid empty candidate payload returned by Gemini API');
        }

        return text.trim();

      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini API request attempt ${attempt} failed:`, err.message || err);
        // Wait 1 second before retrying to respect standard rate limiting policies
        if (attempt <= maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    throw lastError || new Error('Failed to fetch from Gemini service');
  }
}
