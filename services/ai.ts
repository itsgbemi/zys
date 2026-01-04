import { GoogleGenAI } from "@google/genai";
import { Message, UserProfile } from "../types";

// Fix: Access environment variables via process.env as shimmed in index.tsx to avoid ImportMeta errors (line 5)
const DEEPSEEK_API_KEY = process.env.VITE_DEEPSEEK_API_KEY || '';

export type AIModel = 'gemini-3-flash' | 'gemini-3-pro' | 'deepseek-v3' | 'deepseek-r1';

export class AIService {
  // Lazy-load Gemini client to ensure environment variables are shimmed correctly if needed
  private getGeminiClient() {
    // Strictly following initialization rule: new GoogleGenAI({ apiKey: process.env.API_KEY })
    // process.env.API_KEY is shimmed in index.tsx from VITE_API_KEY
    return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  async *generateStream(
    model: AIModel,
    history: Message[],
    currentMessage: string,
    systemInstruction: string,
    audioPart?: { inlineData: { data: string, mimeType: string } }
  ) {
    if (model.startsWith('gemini')) {
      const gemini = this.getGeminiClient();
      const geminiModel = model === 'gemini-3-pro' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
      
      const contents = history.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const currentParts: any[] = [];
      if (audioPart) currentParts.push(audioPart);
      currentParts.push({ text: currentMessage || (audioPart ? "Voice Message" : "") });
      contents.push({ role: 'user', parts: currentParts });

      const result = await gemini.models.generateContentStream({
        model: geminiModel,
        contents: contents as any,
        config: { systemInstruction, temperature: 0.7 },
      });

      for await (const chunk of result) {
        yield chunk.text;
      }
    } else {
      // DeepSeek Logic via Direct Fetch
      const deepseekModel = model === 'deepseek-r1' ? 'deepseek-reasoner' : 'deepseek-chat';
      const messages = [{ role: 'system', content: systemInstruction }];
      history.forEach(m => messages.push({ role: m.role, content: m.content }));
      messages.push({ role: 'user', content: currentMessage });

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: deepseekModel,
          messages,
          stream: true
        })
      });

      if (!response.ok) throw new Error(`DeepSeek API error: ${response.statusText}`);
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            try {
              const json = JSON.parse(data);
              const content = json.choices[0].delta?.content;
              if (content) yield content;
            } catch (e) {}
          }
        }
      }
    }
  }

  async sculpt(model: AIModel, prompt: string): Promise<string> {
    if (model.startsWith('gemini')) {
      const gemini = this.getGeminiClient();
      const geminiModel = model === 'gemini-3-pro' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
      const result = await gemini.models.generateContent({
        model: geminiModel,
        contents: prompt
      });
      return result.text || "";
    } else {
      const deepseekModel = model === 'deepseek-r1' ? 'deepseek-reasoner' : 'deepseek-chat';
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: deepseekModel,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await response.json();
      return data.choices[0].message.content;
    }
  }
}

export const aiService = new AIService();