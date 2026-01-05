import { GoogleGenAI } from "@google/genai";
import { Message, UserProfile } from "../types";

const DEEPSEEK_API_KEY = process.env.VITE_DEEPSEEK_API_KEY || '';

export type AIModel = 'gemini-3-flash' | 'gemini-3-pro' | 'deepseek-v3' | 'deepseek-r1';

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
    },
    audioPart?: { inlineData: { data: string, mimeType: string } }
  ) {
    const systemInstruction = this.getSystemInstruction(context);

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
        if (chunk.text) yield chunk.text;
      }
    } else {
      const deepseekModel = model === 'deepseek-r1' ? 'deepseek-reasoner' : 'deepseek-chat';
      const messages = [{ role: 'system', content: systemInstruction }];
      history.forEach(m => messages.push({ role: m.role, content: m.content }));
      messages.push({ role: 'user', content: currentMessage || "Please continue." });

      const response = await fetch('https://api.deepseek.com/chat/completions', {
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

  private getSystemInstruction(context: { type: string, userProfile?: UserProfile, jobDescription?: string }): string {
    const profile = context.userProfile;
    const profileSummary = profile ? `
      User Context:
      Name: ${profile.fullName}
      Title: ${profile.title}
      Background: ${profile.baseResumeText.slice(0, 1000)}
    ` : '';

    const jobInfo = context.jobDescription ? `Target Job: ${context.jobDescription}` : '';

    let intent = '';
    switch (context.type) {
      case 'resume':
        intent = "You are an ATS Expert. Focus on quantifiable achievements, industry keywords, and high-impact formatting.";
        break;
      case 'cover-letter':
        intent = "You are a Recruiter. Focus on storytelling, culture fit, and proving passion for the specific role.";
        break;
      case 'career-copilot':
        intent = "You are a Strategic Career Coach. Offer rigorous interview prep, salary negotiation tactics, and clear 30-day action plans.";
        break;
      case 'resignation-letter':
        intent = "You are an HR Consultant. Help draft a graceful but firm resignation that maintains positive professional bridges.";
        break;
    }

    return `${intent}\n${profileSummary}\n${jobInfo}\n\nBe concise and professional. Use markdown.`;
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
      const response = await fetch('https://api.deepseek.com/chat/completions', {
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