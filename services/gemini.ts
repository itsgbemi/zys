
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Message } from "../types";

const MODEL_NAME = 'gemini-3-flash-preview';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async generateChatResponse(history: Message[], currentMessage: string, context?: { jobDescription?: string, resumeText?: string }) {
    const systemInstruction = `You are Zysculpt AI, a world-class ATS (Applicant Tracking System) resume architect and recruiter.
    Your goal is to help the user build a high-impact, job-specific resume.
    
    CRITICAL INSTRUCTIONS:
    1. If a job description is provided: ${context?.jobDescription || 'Not yet provided.'}
    2. If existing resume text is provided: ${context?.resumeText || 'Not yet provided.'}
    3. If they paste a job description, analyze it for keywords and required skills.
    4. Ask clear, focused questions one or two at a time about their experience, achievements (using metrics/data), and skills if they aren't clear from the uploaded resume.
    5. Always maintain a professional, encouraging, and expert tone.
    6. When you have enough information, tell them you are ready to generate the preview.
    7. Highlight how specific details will help them pass ATS filters.
    
    CURRENT CONTEXT:
    User is currently at the: ${context?.resumeText ? 'Resume Review & Refinement' : 'Information Gathering'} stage.
    `;

    const chat = this.ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    // Format history for Gemini chat (ignoring the current message which we'll send)
    // Note: Gemini expects strictly alternating roles if we use the history object,
    // but we can also just use sendMessage for simplicity here.
    
    try {
      const response = await chat.sendMessageStream({ message: currentMessage });
      return response;
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  async sculptResume(jobDescription: string, userData: string): Promise<string> {
    const prompt = `
      As an ATS expert, take the following Job Description and User Experience data and "sculpt" a perfect resume in Markdown format.
      
      JOB DESCRIPTION:
      ${jobDescription}
      
      USER DATA/EXPERIENCE:
      ${userData}
      
      INSTRUCTIONS:
      - Use clear headings: Professional Summary, Work Experience, Skills, Education.
      - Optimize for these specific keywords found in the Job Description.
      - Ensure work experience uses Action Verbs and includes quantifiable results (X%, $Y, Z users).
      - Use a clean, standard layout that ATS systems love (no complex columns or graphics in the text).
      - Output ONLY the resume in Markdown.
    `;

    const response = await this.ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Failed to generate resume.";
  }
}

export const geminiService = new GeminiService();
