
export enum AppView {
  OVERVIEW = 'OVERVIEW',
  RESUME_BUILDER = 'RESUME_BUILDER',
  COVER_LETTER = 'COVER_LETTER',
  RESIGNATION_LETTER = 'RESIGNATION_LETTER',
  CAREER_COPILOT = 'CAREER_COPILOT',
  DOCUMENTS = 'DOCUMENTS',
  FIND_JOB = 'FIND_JOB',
  SETTINGS = 'SETTINGS',
}

export type Theme = 'light' | 'dark';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  win: string;
  completed: boolean;
}

export interface CareerGoal {
  mainGoal: string;
  dailyTasks: string[];
  logs: DailyLog[];
  startDate: number;
}

export interface ChatSession {
  id: string;
  title: string;
  lastUpdated: number;
  messages: Message[];
  jobDescription?: string;
  resumeText?: string;
  finalResume?: string | null;
  type: 'resume' | 'cover-letter' | 'resignation-letter' | 'career-copilot';
  careerGoalData?: CareerGoal;
}
