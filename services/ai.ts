import { GoogleGenAI } from "@google/genai";
import { Message, UserProfile } from "../types";

// Bridge environment variables
const getDeepSeekKey = () => {
  // @ts-ignore
  return import.meta.env?.VITE_DEEPSEEK_API_KEY || (process.env as any).VITE_DEEPSEEK_API_KEY || '';
};

export type AIModel = 'gemini' | 'deepseek';

export class AIService {
  private getGeminiClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  async *generateStream(
    model: AIModel,
    history: Message[],
    currentMessage: string,
    context: { 
      type: 'resume' | 'cover-letter' | 'resignation-letter' | 'career-copilot',
      userProfile?: UserProfile,
      jobDescription?: string 
    }
  ) {
    const systemInstruction = this.getSystemInstruction(context);

    if (model === 'gemini') {
      const ai = this.getGeminiClient();
      const geminiModel = 'gemini-3-pro-preview';
      
      const contents = history.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      if (currentMessage) {
        contents.push({ role: 'user', parts: [{ text: currentMessage }] });
      }

      const responseStream = await ai.models.generateContentStream({
        model: geminiModel,
        contents: contents as any,
        config: { systemInstruction, temperature: 0.7 },
      });

      for await (const chunk of responseStream) {
        if (chunk.text) yield chunk.text;
      }
    } else {
      const deepseekKey = getDeepSeekKey();
      const deepseekModel = 'deepseek-chat';
      
      const messages = [
        { role: 'system', content: systemInstruction },
        ...history.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
      ];
      
      if (currentMessage) {
        messages.push({ role: 'user', content: currentMessage });
      }

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekKey}`
        },
        body: JSON.stringify({
          model: deepseekModel,
          messages,
          stream: true
        })
      });

      if (!response.ok) throw new Error(`DeepSeek Error: ${response.statusText}`);
      
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

  private getSystemInstruction(context: { type: string, userProfile?: UserProfile, jobDescription?: string }): string {
    const profile = context.userProfile;
    const profileSummary = profile ? `
      USER CONTEXT:
      Name: ${profile.fullName}
      Current Title: ${profile.title}
      Background Snapshot: ${profile.baseResumeText.slice(0, 800)}
    ` : '';

    const jobInfo = context.jobDescription ? `TARGET GOAL/JOB: ${context.jobDescription}` : '';

    let persona = '';
    switch (context.type) {
      case 'resume':
        persona = "You are an ATS Expert. Focus on quantifiable achievements and industry keywords.";
        break;
      case 'cover-letter':
        persona = "You are a Hiring Manager. Focus on cultural fit and clear value propositions.";
        break;
      case 'career-copilot':
        persona = "You are a Strategic Career Mentor. Focus on long-term growth and interview prep.";
        break;
      case 'resignation-letter':
        persona = "You are an HR Professional. Draft a firm but gracious exit statement.";
        break;
    }

    return `${persona}\n\n${profileSummary}\n\n${jobInfo}\n\nINSTRUCTIONS: Always use Markdown. Be concise. Ask high-value questions if you need more details to "Sculpt" the final document.`;
  }

  async sculpt(model: AIModel, prompt: string): Promise<string> {
    if (model === 'gemini') {
      const ai = this.getGeminiClient();
      const geminiModel = 'gemini-3-pro-preview';
      const result = await ai.models.generateContent({
        model: geminiModel,
        contents: prompt
      });
      return result.text || "";
    } else {
      const deepseekKey = getDeepSeekKey();
      const deepseekModel = 'deepseek-chat';
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekKey}`
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