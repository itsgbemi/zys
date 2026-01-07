import { GoogleGenAI, Type } from "@google/genai";
import { Message, UserProfile } from "../types";

export class AIService {
  private getApiKey(): string {
    // Priority: process.env.API_KEY (shimmed), then VITE_API_KEY (Vite direct)
    const key = (process.env as any).API_KEY || (import.meta as any).env?.VITE_API_KEY;
    if (!key) {
      console.error("Zysculpt: Gemini API Key is missing. Please set VITE_API_KEY.");
    }
    return key || '';
  }

  private getGeminiClient() {
    return new GoogleGenAI({ apiKey: this.getApiKey() });
  }

  async *generateStream(
    history: Message[],
    currentMessage: string,
    context: { 
      type: 'resume' | 'cover-letter' | 'resignation-letter' | 'career-copilot',
      userProfile?: UserProfile,
      jobDescription?: string 
    }
  ) {
    const systemInstruction = this.getSystemInstruction(context);
    const ai = this.getGeminiClient();
    const geminiModel = 'gemini-3-flash-preview';
    
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
  }

  private getSystemInstruction(context: { type: string, userProfile?: UserProfile, jobDescription?: string }): string {
    const profile = context.userProfile;
    const profileSummary = profile ? `
      USER CONTEXT:
      Name: ${profile.fullName}
      Current Title: ${profile.title}
      Background Snapshot: ${profile.baseResumeText.slice(0, 1500)}
    ` : '';

    const jobInfo = context.jobDescription ? `TARGET GOAL/JOB DESCRIPTION: ${context.jobDescription}` : '';

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

    return `${persona}\n\n${profileSummary}\n\n${jobInfo}\n\nINSTRUCTIONS: Always use Markdown. Be concise. Ask high-value questions if you need more details to "Sculpt" the final document. If a job description is provided, ensure you tailor all advice to that specific role.`;
  }

  async sculpt(prompt: string): Promise<string> {
    const ai = this.getGeminiClient();
    const geminiModel = 'gemini-3-pro-preview';
    const result = await ai.models.generateContent({
      model: geminiModel,
      contents: prompt
    });
    return result.text || "";
  }

  async generateQuiz(topic: string): Promise<any[]> {
    const ai = this.getGeminiClient();
    const prompt = `Generate 5 challenging interview/knowledge questions about "${topic}". 
    Return as JSON array: [{"question": "...", "options": ["A","B","C","D"], "correctIndex": 0}]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              },
              correctIndex: { type: Type.INTEGER }
            },
            required: ['question', 'options', 'correctIndex']
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  }
}

export const aiService = new AIService();