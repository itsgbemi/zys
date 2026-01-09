import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ArrowUpRight, 
  Zap, 
  CheckCircle2,
  Target,
  Lightbulb,
  Calendar as CalendarIcon,
  Search,
  Sparkles,
  Mail,
  UserCheck,
  Compass
} from 'lucide-react';
import { AppView, ChatSession, Theme, DailyLog, UserProfile, ScheduledTask } from '../types';
import { CustomHamburger } from './Sidebar';

interface OverviewProps {
  onToggleMobile?: () => void;
  theme: Theme;
  sessions: ChatSession[];
  setView: (view: AppView) => void;
  updateSession?: (id: string, updates: Partial<ChatSession>) => void;
  onNewSession: (type?: 'resume' | 'cover-letter' | 'resignation-letter' | 'career-copilot', initialPrompt?: string, context?: any) => void;
  userProfile: UserProfile;
}

const Overview: React.FC<OverviewProps> = ({ onToggleMobile, theme, sessions, setView, updateSession, onNewSession, userProfile }) => {
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const cardBg = theme === 'dark' ? 'bg-[#121212] border-white/5' : 'bg-white border-slate-200 shadow-xl';

  const actions = [
    { l: 'Tailor a Resume', d: 'Architect an ATS-proof profile based on a target role.', t: 'resume', i: <FileText size={24}/>, color: 'bg-indigo-500' },
    { l: 'Draft a Cover Letter', d: 'Build a persuasive narrative for human recruiters.', t: 'cover-letter', i: <Mail size={24}/>, color: 'bg-emerald-500' },
    { l: 'Career Strategy', d: 'Prepare for interviews or map long-term growth.', t: 'career-copilot', i: <UserCheck size={24}/>, color: 'bg-amber-500' },
    { l: 'Skill Lab', d: 'Refresh your industry knowledge with interactive AI.', v: AppView.KNOWLEDGE_HUB, i: <Zap size={24}/>, color: 'bg-sky-500' }
  ];

  return (
    <div className={`flex flex-col h-full transition-colors duration-300 font-['Roboto',_sans-serif] ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-[#F8FAFC]'}`}>
      <header className={`p-4 md:p-6 border-b flex items-center justify-between sticky top-0 z-10 transition-colors ${theme === 'dark' ? 'bg-[#121212] border-white/5' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden p-2 -ml-2 transition-colors">
            <CustomHamburger theme={theme} />
          </button>
          <h2 className={`text-lg md:text-xl font-bold ${textPrimary}`}>Overview</h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl mx-auto w-full">
        <div className={`p-8 md:p-12 rounded-[40px] border mb-12 ${cardBg}`}>
          <div className="flex flex-col md:flex-row items-center gap-8 mb-10 text-center md:text-left">
            <div className="w-24 h-24 rounded-[32px] bg-[#1918f0] flex items-center justify-center text-white shadow-2xl shadow-[#1918f0]/40 flex-shrink-0 p-5">
               <img src="https://res.cloudinary.com/dqhawdcol/image/upload/v1767978528/tbkus5ht2z4okdfqwnv1.svg" className="w-full h-auto brightness-0 invert" alt="Zysculpt" />
            </div>
            <div>
              <h1 className={`text-3xl md:text-4xl font-black mb-2 tracking-tight ${textPrimary}`}>Welcome, {userProfile.fullName.split(' ')[0] || 'Pilot'}</h1>
              <p className="text-slate-500 text-lg md:text-xl font-medium">Ready to sculpt your next big move?</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {actions.map((action, i) => (
              <button key={i} onClick={() => action.v ? setView(action.v) : onNewSession(action.t as any)} className={`p-8 rounded-[32px] border transition-all text-left hover:border-[#1918f0] hover:bg-[#1918f0]/5 group flex items-start gap-6 ${theme === 'dark' ? 'border-white/5 bg-[#1a1a1a]' : 'border-slate-100 bg-slate-50 shadow-sm'}`}>
                 <div className={`p-4 rounded-3xl ${action.color} text-white flex-shrink-0 shadow-lg`}>
                   {action.i}
                 </div>
                 <div>
                    <span className={`text-xl font-black block mb-2 transition-colors ${theme === 'dark' ? 'text-white group-hover:text-[#1918f0]' : 'text-[#0F172A] group-hover:text-[#1918f0]'}`}>{action.l}</span>
                    <span className="text-sm text-slate-500 font-medium leading-relaxed">{action.d}</span>
                 </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;