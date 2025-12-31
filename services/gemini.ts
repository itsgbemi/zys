import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Message, UserProfile } from "../types";
import { datadogLogs } from '@datadog/browser-logs';

// Using Gemini 3 Pro for complex reasoning/sculpting tasks as per guidelines
const PRO_MODEL = 'gemini-3-pro-preview';
const FLASH_MODEL = 'gemini-3-flash-preview';

/**
 * Zysculpt Gemini Service
 */
export class GeminiService {
  private getClient() {
    // Fix: Always use named parameter for apiKey and obtain exclusively from process.env.API_KEY as per guidelines.
    return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  private formatProfileHeader(profile?: UserProfile): string {
    if (!profile) return '';
    return `
      CONTACT INFORMATION (MUST BE INCLUDED IN DOCUMENT HEADER):
      Name: ${profile.fullName}
      Email: ${profile.email}
      Phone: ${profile.phone}
      Location: ${profile.location}
      LinkedIn: ${profile.linkedIn}
      GitHub: ${profile.github || ''}
      Portfolio: ${profile.portfolio || ''}
      Title: ${profile.title}
    `;
  }

  // Helper to log LLM Telemetry to Datadog
  private logTelemetry(operation: string, model: string, startTime: number, response?: any, error?: any) {
    const durationMs = performance.now() - startTime;
    
    if (error) {
      datadogLogs.logger.error(`LLM ${operation} Failed`, {
        model,
        duration_ms: durationMs,
        error: error.message,
        status: 'error',
        service: 'zysculpt' // Explicit service tagging
      });
    } else {
      // Extract usage metadata if available
      const usage = response?.usageMetadata || {};
      const inputTokens = usage.promptTokenCount || 0;
      const outputTokens = usage.candidatesTokenCount || 0;
      const totalTokens = usage.totalTokenCount || 0;

      datadogLogs.logger.info(`LLM ${operation} Success`, {
        model,
        duration_ms: durationMs,
        status: 'ok',
        service: 'zysculpt',
        llm_telemetry: {
          tokens: {
            prompt: inputTokens,
            completion: outputTokens,
            total: totalTokens
          },
          latency: durationMs,
          // Estimated cost calculation (approximate pricing for Gemini)
          // Flash: $0.075/1m in, $0.30/1m out (example rates)
          // Pro: $3.50/1m in, $10.50/1m out (example rates)
          estimated_cost_usd: model.includes('flash') 
            ? (inputTokens * 0.000000075) + (outputTokens * 0.00000030)
            : (inputTokens * 0.0000035) + (outputTokens * 0.0000105)
        }
      });
    }
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
      let roleDescription = 'professional career assistant';
      
      if (type === 'resume') roleDescription = 'ATS resume architect';
      if (type === 'cover-letter') roleDescription = 'persuasive cover letter writer';
      if (type === 'resignation-letter') roleDescription = 'professional resignation consultant';
      if (type === 'career-copilot') roleDescription = 'strategic career coach and growth mentor';
      
      const profile = context?.userProfile;
      const profileHeader = this.formatProfileHeader(profile);

      const systemInstruction = `You are Zysculpt AI, a world-class ${roleDescription}.
      Your goal is to help the user build a high-impact, professional ${type.replace('-', ' ')}.
      
      ${profileHeader}

      CRITICAL INSTRUCTIONS:
      1. Context - Target Info: ${context?.jobDescription || 'Not yet provided.'}
      2. Context - User Background: ${context?.resumeText || profile?.baseResumeText || 'Not yet provided.'}
      3. Ask clear, focused questions one or two at a time.
      4. Maintain a professional, expert, and encouraging tone.
      5. When ready, offer to "generate" the final document.
      `;

      const contents = history.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const currentParts: any[] = [];
      if (context?.audioPart) {
        currentParts.push(context.audioPart);
      }
      if (currentMessage.trim() || !context?.audioPart) {
        currentParts.push({ text: currentMessage || "I've sent a voice message." });
      }

      contents.push({ role: 'user', parts: currentParts });

      const result = await ai.models.generateContentStream({
        model: FLASH_MODEL,
        contents: contents as any,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      // For streams, we log success here, though token counts might be harder to get from the stream object immediately
      // without consuming it. We log the init success.
      this.logTelemetry('Chat Stream', FLASH_MODEL, startTime, { usageMetadata: { totalTokenCount: 0 } }); 
      return result;

    } catch (error: any) {
      this.logTelemetry('Chat Stream', FLASH_MODEL, startTime, null, error);
      throw error;
    }
  }

  async generateCareerPlan(goal: string, availability: number): Promise<any[]> {
    const startTime = performance.now();
    try {
      const ai = this.getClient();
      const prompt = `Create a 30-day career plan for the following goal: "${goal}". 
      The user has ${availability} hours per day available.
      Return the plan as a JSON array of objects with keys: "day" (1-30) and "task" (string).`;

      // Fix: Used ai.models.generateContent directly to comply with current SDK guidelines.
      const response = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.INTEGER },
                task: { type: Type.STRING }
              },
              required: ['day', 'task']
            }
          }
        }
      });
      
      this.logTelemetry('Career Plan', FLASH_MODEL, startTime, response);
      // Fix: Extraction via .text property as per guidelines (not .text()).
      return JSON.parse(response.text || '[]');
    } catch (error: any) {
      this.logTelemetry('Career Plan', FLASH_MODEL, startTime, null, error);
      throw error;
    }
  }

  async generateQuiz(topic: string): Promise<any[]> {
    const startTime = performance.now();
    try {
      const ai = this.getClient();
      const prompt = `Generate 5 challenging quiz questions about "${topic}". 
      Return as a JSON array of objects with: "question", "options" (array of 4 strings), and "correctIndex" (0-3).`;

      // Fix: Used ai.models.generateContent directly to comply with current SDK guidelines.
      const response = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.INTEGER }
              },
              required: ['question', 'options', 'correctIndex']
            }
          }
        }
      });

      this.logTelemetry('Quiz', FLASH_MODEL, startTime, response);
      // Fix: Extraction via .text property as per guidelines (not .text()).
      return JSON.parse(response.text || '[]');
    } catch (error: any) {
      this.logTelemetry('Quiz', FLASH_MODEL, startTime, null, error);
      throw error;
    }
  }

  async sculptResume(jobDescription: string, userData: string, userProfile?: UserProfile): Promise<string> {
    const startTime = performance.now();
    try {
      const ai = this.getClient();
      const profileHeader = this.formatProfileHeader(userProfile);
      
      const prompt = `
        As an expert ATS Resume Writer, generate a complete, high-impact resume in Markdown format.
        
        --------------------------
        USER PROFILE (USE THIS EXACT DATA FOR THE HEADER):
        ${profileHeader}
        --------------------------
        JOB DESCRIPTION (TARGET):
        ${jobDescription}
        --------------------------
        USER EXPERIENCE/BACKGROUND DATA:
        ${userData}
        --------------------------
        
        STRICT OUTPUT RULES:
        1.  OUTPUT ONLY THE RESUME MARKDOWN. DO NOT INCLUDE ANY CONVERSATIONAL TEXT, META-COMMENTARY, OR PREAMBLE LIKE "Here is your resume".
        2.  Use the Name and Contact Info from the USER PROFILE section at the top. DO NOT USE PLACEHOLDERS if data is available.
        3.  If specific experience details are missing in the background data, imply them intelligently based on the Job Description but do not leave bracketed placeholders like "[Insert Date]" unless absolutely necessary.
        4.  Format links as [url](url).
        5.  Structure: Header -> Professional Summary -> Experience -> Skills -> Education.
      `;

      // Fix: Using direct model call for text generation.
      const response = await ai.models.generateContent({
        model: PRO_MODEL,
        contents: prompt,
      });
      
      this.logTelemetry('Sculpt Resume', PRO_MODEL, startTime, response);
      // Fix: Extraction via .text property.
      return response.text || "Failed to generate resume.";
    } catch (error: any) {
      this.logTelemetry('Sculpt Resume', PRO_MODEL, startTime, null, error);
      throw error;
    }
  }

  async sculptCoverLetter(jobDescription: string, userData: string, userProfile?: UserProfile): Promise<string> {
    const startTime = performance.now();
    try {
      const ai = this.getClient();
      const profileHeader = this.formatProfileHeader(userProfile);

      const prompt = `
        As a Senior Recruiter, write a persuasive Cover Letter in Markdown format.
        
        --------------------------
        USER PROFILE (SENDER):
        ${profileHeader}
        --------------------------
        JOB DESCRIPTION (RECIPIENT CONTEXT):
        ${jobDescription}
        --------------------------
        USER BACKGROUND:
        ${userData}
        --------------------------
        
        STRICT OUTPUT RULES:
        1.  OUTPUT ONLY THE COVER LETTER CONTENT. NO CHAT, NO META-COMMENTARY.
        2.  Use the Name/Email/Phone from USER PROFILE in the signature and header.
        3.  Do not use placeholders like "[Your Name]". Use the actual name provided: ${userProfile?.fullName}.
        4.  Make the tone professional, enthusiastic, and confident.
      `;

      // Fix: Using direct model call for text generation.
      const response = await ai.models.generateContent({
        model: PRO_MODEL,
        contents: prompt,
      });

      this.logTelemetry('Sculpt Cover Letter', PRO_MODEL, startTime, response);
      // Fix: Extraction via .text property.
      return response.text || "Failed to generate cover letter.";
    } catch (error: any) {
      this.logTelemetry('Sculpt Cover Letter', PRO_MODEL, startTime, null, error);
      throw error;
    }
  }

  async sculptResignationLetter(exitDetails: string, userData: string, userProfile?: UserProfile): Promise<string> {
    const startTime = performance.now();
    try {
      const ai = this.getClient();
      const profileHeader = this.formatProfileHeader(userProfile);

      const prompt = `
        Write a professional, formal Resignation Letter in Markdown.
        
        --------------------------
        USER PROFILE (SENDER):
        ${profileHeader}
        --------------------------
        EXIT DETAILS:
        ${exitDetails}
        --------------------------
        USER BACKGROUND:
        ${userData}
        --------------------------
        
        STRICT OUTPUT RULES:
        1.  OUTPUT ONLY THE LETTER. NO CONVERSATIONAL TEXT.
        2.  Use the actual name from USER PROFILE.
        3.  Keep the tone polite, firm, and grateful.
      `;

      // Fix: Using direct model call for text generation.
      const response = await ai.models.generateContent({
        model: PRO_MODEL,
        contents: prompt,
      });

      this.logTelemetry('Sculpt Resignation', PRO_MODEL, startTime, response);
      // Fix: Extraction via .text property.
      return response.text || "Failed to generate resignation letter.";
    } catch (error: any) {
      this.logTelemetry('Sculpt Resignation', PRO_MODEL, startTime, null, error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();