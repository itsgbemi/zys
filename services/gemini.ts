
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Message, UserProfile } from "../types";

const MODEL_NAME = 'gemini-3-flash-preview';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  async generateChatResponse(
    history: Message[], 
    currentMessage: string, 
    context?: { 
      jobDescription?: string, 
      resumeText?: string, 
      type?: 'resume' | 'cover-letter' | 'resignation-letter' | 'career-copilot',
      userProfile?: UserProfile 
    }
  ) {
    const type = context?.type || 'resume';
    let roleDescription = 'professional career assistant';
    
    if (type === 'resume') roleDescription = 'ATS resume architect';
    if (type === 'cover-letter') roleDescription = 'persuasive cover letter writer';
    if (type === 'resignation-letter') roleDescription = 'professional resignation consultant';
    if (type === 'career-copilot') roleDescription = 'strategic career coach and growth mentor';
    
    const profile = context?.userProfile;
    const profileContext = profile ? `User Profile: ${profile.fullName}, ${profile.title}. Contact: ${profile.email}, ${profile.phone}. LinkedIn: ${profile.linkedIn}.` : '';

    const systemInstruction = `You are Zysculpt AI, a world-class ${roleDescription}.
    Your goal is to help the user build a high-impact, professional ${type.replace('-', ' ')}.
    
    ${profileContext}

    CRITICAL INSTRUCTIONS:
    1. Context - Target Info: ${context?.jobDescription || 'Not yet provided.'}
    2. Context - User Background: ${context?.resumeText || profile?.baseResumeText || 'Not yet provided.'}
    3. Ask clear, focused questions one or two at a time.
    4. Maintain a professional, expert, and encouraging tone.
    5. When ready, offer to "generate" the final document.
    ${type === 'resignation-letter' ? 'Focus on professionalism, gratitude (if applicable), and clear exit details like notice period.' : ''}
    ${type === 'career-copilot' ? 'Focus on career progression, skill mapping, and breaking down yearly goals into actionable daily targets.' : ''}
    `;

    const chat = this.ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    
    try {
      const response = await chat.sendMessageStream({ message: currentMessage });
      return response;
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  async generateCareerPlan(goal: string, availability: number): Promise<any[]> {
    const prompt = `Create a 30-day career plan for the following goal: "${goal}". 
    The user has ${availability} hours per day available.
    Return the plan as a JSON array of objects with keys: "day" (1-30) and "task" (string).
    Keep tasks specific and achievable within the time frame.`;

    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    try {
      return JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to parse AI plan", e);
      return [];
    }
  }

  async generateQuiz(topic: string): Promise<any[]> {
    const prompt = `Generate 5 challenging quiz questions about "${topic}". 
    Return as a JSON array of objects with: "question", "options" (array of 4 strings), and "correctIndex" (0-3).`;

    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    try {
      return JSON.parse(response.text);
    } catch (e) {
      return [];
    }
  }

  async sculptResume(jobDescription: string, userData: string): Promise<string> {
    const prompt = `
      As an ATS expert, take the following Job Description and User Experience data and generate a perfect resume in Markdown format.
      
      JOB DESCRIPTION:
      ${jobDescription}
      
      USER DATA/EXPERIENCE:
      ${userData}
      
      INSTRUCTIONS:
      - Use clear headings: Professional Summary, Work Experience, Skills, Education.
      - Optimize for specific keywords from the Job Description.
      - Output ONLY the resume in Markdown.
      - IMPORTANT: Format links as [actual-url](actual-url) so they are clickable and readable.
    `;

    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Failed to generate resume.";
  }

  async sculptCoverLetter(jobDescription: string, userData: string): Promise<string> {
    const prompt = `
      As a professional recruiter, write a compelling, tailored cover letter based on the Job Description and User Background.
      
      JOB DESCRIPTION:
      ${jobDescription}
      
      USER BACKGROUND:
      ${userData}
      
      INSTRUCTIONS:
      - Use a professional business letter format.
      - Make it sound natural and enthusiastic, not robotic.
      - Explicitly link user's top achievements to the specific needs of the job.
      - Output ONLY the cover letter in Markdown.
    `;

    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Failed to generate cover letter.";
  }

  async sculptResignationLetter(exitDetails: string, userData: string): Promise<string> {
    const prompt = `
      As a professional consultant, write a polite and firm resignation letter based on the provided details.
      
      EXIT DETAILS:
      ${exitDetails}
      
      USER BACKGROUND:
      ${userData}
      
      INSTRUCTIONS:
      - Use professional business letter format.
      - Ensure a positive tone.
      - Include placeholders for manager name and signature.
      - Output ONLY the letter in Markdown.
    `;

    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Failed to generate resignation letter.";
  }
}

export const geminiService = new GeminiService();
