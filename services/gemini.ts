import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Message, UserProfile } from "../types";
import { datadogLogs } from '@datadog/browser-logs';

const PRO_MODEL = 'gemini-3-pro-preview';
const FLASH_MODEL = 'gemini-3-flash-preview';

export class GeminiService {
  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  private formatProfileHeader(profile?: UserProfile): string {
    if (!profile) return '';
    return `
      CONTACT INFORMATION:
      Name: ${profile.fullName}
      Email: ${profile.email}
      Phone: ${profile.phone}
      Location: ${profile.location}
      LinkedIn: ${profile.linkedIn}
      GitHub: ${profile.github || 'Not provided'}
      Portfolio: ${profile.portfolio || 'Not provided'}
      Title: ${profile.title}
    `;
  }

  async generateChatResponse(
    history: Message[], 
    currentMessage: string, 
    context?: { 
      jobDescription?: string, 
      resumeText?: string, 
      type?: 'resume' | 'cover-letter' | 'resignation-letter' | 'career-copilot',
      userProfile?: UserProfile,
      audioPart?: { inlineData: { data: string, mimeType: string } }
    }
  ) {
    const startTime = performance.now();
    try {
      const ai = this.getClient();
      const type = context?.type || 'resume';
      const profile = context?.userProfile;
      const profileHeader = this.formatProfileHeader(profile);

      let roleSpecifics = "";
      if (type === 'resume') {
        roleSpecifics = "You are an ATS (Applicant Tracking System) Expert and Resume Architect. Your goal is to help the user build a resume that scores 95+ on ATS systems. Focus on keywords, professional formatting, and impact-driven bullet points.";
      } else if (type === 'cover-letter') {
        roleSpecifics = "You are a Senior Recruiter and Persuasive Writer. Help the user draft a cover letter that catches a human eye immediately. Focus on storytelling, cultural fit, and clear value propositions.";
      } else if (type === 'career-copilot') {
        roleSpecifics = "You are a Strategic Career Coach. Help the user with interview prep, salary negotiation, or general career strategy. Be encouraging but rigorous in your feedback.";
      } else {
        roleSpecifics = "You are a Professional HR Consultant specializing in smooth career transitions. Help the user draft a firm but graceful resignation letter.";
      }

      const systemInstruction = `${roleSpecifics}
      
      USER CONTEXT:
      ${profileHeader}
      Target Info (Job/Context): ${context?.jobDescription || 'None provided yet'}
      Base Experience: ${context?.resumeText || profile?.baseResumeText || 'None provided yet'}

      INSTRUCTIONS:
      1. Be conversational and helpful. 
      2. If details are missing, ask one or two focused questions to extract high-value information.
      3. Your ultimate goal is to gather enough data to "Sculpt" the perfect document.
      4. Use professional, modern language. Avoid clichés.
      `;

      const contents = history.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const currentParts: any[] = [];
      if (context?.audioPart) currentParts.push(context.audioPart);
      currentParts.push({ text: currentMessage || (context?.audioPart ? "Voice Message" : "Please help me.") });
      contents.push({ role: 'user', parts: currentParts });

      const result = await ai.models.generateContentStream({
        model: FLASH_MODEL,
        contents: contents as any,
        config: { systemInstruction, temperature: 0.7 },
      });

      return result;
    } catch (error: any) {
      datadogLogs.logger.error("Gemini Chat Failed", { error: error.message });
      throw error;
    }
  }

  async generateCareerPlan(goal: string, availability: number): Promise<any[]> {
    try {
      const ai = this.getClient();
      const prompt = `Create a high-impact 30-day career roadmap for the goal: "${goal}". 
      User availability: ${availability} hours/day. 
      Return as a JSON array: [{"day": 1, "task": "..."}]`;

      const response = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || '[]');
    } catch (error) { throw error; }
  }

  async generateQuiz(topic: string): Promise<any[]> {
    try {
      const ai = this.getClient();
      const prompt = `Generate 5 challenging interview/knowledge questions about "${topic}". 
      Return as JSON array: [{"question": "...", "options": ["A","B","C","D"], "correctIndex": 0}]`;

      const response = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || '[]');
    } catch (error) { throw error; }
  }

  async sculptResume(jobDescription: string, userData: string, userProfile?: UserProfile): Promise<string> {
    const ai = this.getClient();
    const prompt = `Generate an ATS-Optimized Markdown Resume.
    Target Job: ${jobDescription}
    User Data: ${userData}
    Profile: ${this.formatProfileHeader(userProfile)}
    Return ONLY the markdown. No preamble.`;

    const response = await ai.models.generateContent({ model: PRO_MODEL, contents: prompt });
    return response.text || "";
  }

  async sculptCoverLetter(jobDescription: string, userData: string, userProfile?: UserProfile): Promise<string> {
    const ai = this.getClient();
    const prompt = `Generate a persuasive Markdown Cover Letter.
    Target Job: ${jobDescription}
    User Data: ${userData}
    Profile: ${this.formatProfileHeader(userProfile)}
    Return ONLY the letter content. No preamble.`;

    const response = await ai.models.generateContent({ model: PRO_MODEL, contents: prompt });
    return response.text || "";
  }

  async sculptResignationLetter(exitDetails: string, userData: string, userProfile?: UserProfile): Promise<string> {
    const ai = this.getClient();
    const prompt = `Generate a formal Resignation Letter in Markdown.
    Context: ${exitDetails}
    Profile: ${this.formatProfileHeader(userProfile)}
    Return ONLY the letter.`;

    const response = await ai.models.generateContent({ model: PRO_MODEL, contents: prompt });
    return response.text || "";
  }
}

export const geminiService = new GeminiService();