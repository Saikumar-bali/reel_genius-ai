
import { GoogleGenAI, Type } from "@google/genai";
import { LyricSegment } from "../types";

export class GeminiService {
  private static instance: GeminiService;

  private constructor() {}

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateLyricsTimestamps(songTitle: string, totalDuration: number): Promise<LyricSegment[]> {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a list of catchy, poetic lyrics ONLY in Telugu language (తెలుగు) with beautiful relevant emojis for a video about "${songTitle}". 
      
      CRITICAL CONSTRAINTS:
      1. SCRIPT: Use ONLY Telugu script (తెలుగు లిపి). NO English words, NO Romanized Telugu (Telugish).
      2. EMOJIS: Include 1-2 expressive emojis at the end of every single line.
      3. FORMAT: Return valid JSON matching the schema.
      4. TIMING: Distribute these across ${totalDuration} seconds. Make sure startTime and endTime don't overlap much.
      5. TONE: Catchy, cinematic, and emotional as per the song title.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              startTime: { type: Type.NUMBER },
              endTime: { type: Type.NUMBER },
            },
            required: ["text", "startTime", "endTime"],
          },
        },
      },
    });

    try {
      const text = response.text || "[]";
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse lyrics JSON", e);
      return [];
    }
  }

  async generateEnhancementPrompt(images: string[]): Promise<string> {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `I have a series of images for a reel. Generate a cinematic prompt for professional video transitions and overlays.`,
    });
    return response.text || "Cinematic smooth professional transitions for social media reels.";
  }
}
