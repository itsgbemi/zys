
export enum AppView {
  RESUME_BUILDER = 'RESUME_BUILDER',
  FIND_JOB = 'FIND_JOB',
  SETTINGS = 'SETTINGS',
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ResumeData {
  contact: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    website?: string;
  };
  summary: string;
  experience: {
    company: string;
    role: string;
    duration: string;
    description: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    year: string;
  }[];
  skills: string[];
}
