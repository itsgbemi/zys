export enum AppView {
  OVERVIEW = 'OVERVIEW',
  RESUME_BUILDER = 'RESUME_BUILDER',
  COVER_LETTER = 'COVER_LETTER',
  RESIGNATION_LETTER = 'RESIGNATION_LETTER',
  CAREER_COPILOT = 'CAREER_COPILOT',
  KNOWLEDGE_HUB = 'KNOWLEDGE_HUB',
  DOCUMENTS = 'DOCUMENTS',
  FIND_JOB = 'FIND_JOB',
  SETTINGS = 'SETTINGS',
}

export type Theme = 'light' | 'dark';

export interface UserProfile {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedIn: string;
  github?: string;
  portfolio?: string;
  baseResumeText: string;
  dailyAvailability: number;
  voiceId: string;
  avatarUrl?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ScheduledTask {
  id: string;
  dayNumber: number;
  task: string;
  completed: boolean;
}

export interface DailyLog {
  date: string;
  win: string;
  completed: boolean;
}

export interface CareerGoal {
  mainGoal: string;
  scheduledTasks: ScheduledTask[];
  logs: DailyLog[];
  startDate: number;
}

export interface StylePrefs {
  font: 'font-inter' | 'font-roboto' | 'font-eb-garamond' | 'font-arial' | 'font-times';
  headingColor: string;
  listStyle: 'disc' | 'circle' | 'square' | 'star';
  template?: 'modern' | 'classic' | 'minimal';
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
  stylePrefs?: StylePrefs;
}