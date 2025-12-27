
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Mail, 
  DoorOpen, 
  Search, 
  Compass, 
  ArrowUpRight, 
  Zap, 
  CheckCircle2,
  Trophy,
  Plus,
  X,
  Target,
  Rocket,
  Lightbulb,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { AppView, ChatSession, Theme, DailyLog, UserProfile } from '../types';

interface OverviewProps {
  onToggleMobile?: () => void;
  theme: Theme;
  sessions: ChatSession[];
  setView: (view: AppView) => void;
  updateSession?: (id: string, updates: Partial<ChatSession>) => void;
  userProfile: UserProfile;
}

const ZYSCULPT_TASKS = [
  { id: 't1', label: 'Complete your Professional Profile', link: AppView.SETTINGS },
  { id: 't2', label: 'Upload your Base Resume', link: AppView.SETTINGS },
  { id: 't3', label: 'Set a 1-year Career Goal', link: AppView.CAREER_COPILOT },
  { id: 't4', label: 'Tailor a Resume for a Job', link: AppView.RESUME_BUILDER },
];

const Overview: React.FC<OverviewProps> = ({ onToggleMobile, theme, sessions, setView, updateSession, userProfile }) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [winInput, setWinInput] = useState('');

  const textPrimary = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const cardBg = theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a]' : 'bg-white border-slate-200 shadow-sm';

  const careerSessions = sessions.filter(s => s.type === 'career-copilot' && s.careerGoalData);
  const activeGoalSession = careerSessions[0];
  const isOnboarded = !!userProfile.fullName && !!userProfile.baseResumeText && careerSessions.length > 0;

  // Calendar logic
  const now = new Date();
  const currentMonth = now.toLocaleString('default', { month: 'long' });
  const currentYear = now.getFullYear();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getDay();

  const logsMap = new Map<string, DailyLog>();
  let goalStartDate: number | null = activeGoalSession?.careerGoalData?.startDate || null;
  
  sessions.forEach(s => {
    if (s.careerGoalData) {
      s.careerGoalData.logs.forEach(l => logsMap.set(l.date, l));
    }
  });

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const handleLogWin = () => {
    if (!selectedDay || !activeGoalSession || !updateSession) return;
    const dateStr = `${currentYear}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;
    const newLog: DailyLog = { date: dateStr, win: winInput, completed: true };
    const currentLogs = activeGoalSession.careerGoalData?.logs || [];
    const updatedLogs = [...currentLogs.filter(l => l.date !== dateStr), newLog];
    updateSession(activeGoalSession.id, { careerGoalData: { ...activeGoalSession.careerGoalData!, logs: updatedLogs } });
    setWinInput('');
    setSelectedDay(null);
  };

  return (
    <div className={`flex flex-col h-full transition-colors ${theme === 'dark' ? 'bg-[#191919]' : 'bg-[#F8FAFC]'}`}>
      <header className={`p-4 md:p-6 border-b flex items-center justify-between sticky top-0 z-10 transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={textPrimary}>
              <path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <h2 className={`text-lg md:text-xl font-bold ${textPrimary}`}>Career Command Center</h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl mx-auto w-full">
        {!isOnboarded ? (
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className={`p-8 rounded-[40px] border-2 border-dashed ${theme === 'dark' ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50/50 border-indigo-200'}`}>
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-600 rounded-xl text-white"><Rocket size={20} /></div>
                    <h1 className={`text-2xl md:text-3xl font-extrabold ${textPrimary}`}>Start Your Career Sculpting</h1>
                  </div>
                  <p className={`text-lg mb-6 leading-relaxed ${textSecondary}`}>
                    Welcome to Zysculpt. Before we build high-impact resumes, let's establish your base Career DNA.
                  </p>
                  <div className="space-y-3">
                    {ZYSCULPT_TASKS.map((task, idx) => {
                      const isComplete = idx === 0 ? !!userProfile.fullName : idx === 1 ? !!userProfile.baseResumeText : idx === 2 ? careerSessions.length > 0 : false;
                      return (
                        <button 
                          key={task.id}
                          onClick={() => setView(task.link)}
                          className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${isComplete ? 'opacity-50 line-through' : 'hover:translate-x-1'} ${cardBg}`}
                        >
                          {isComplete ? <CheckCircle2 className="text-emerald-500" size={18} /> : <div className="w-5 h-5 rounded-full border-2 border-slate-300" />}
                          <span className={`text-sm font-bold ${textPrimary}`}>{task.label}</span>
                          {!isComplete && <ChevronRight size={14} className="ml-auto opacity-30" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="w-full md:w-1/3 aspect-square bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-[40px] flex items-center justify-center border border-white/10">
                   <Zap size={64} className="text-indigo-500 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-12">
            <h1 className={`text-3xl md:text-4xl font-extrabold mb-2 tracking-tight ${textPrimary}`}>Hello, {userProfile.fullName.split(' ')[0]}.</h1>
            <p className={`${textSecondary} font-medium`}>{userProfile.title || 'Professional'} • Goal: {activeGoalSession?.careerGoalData?.mainGoal || 'Not set'}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 space-y-8">
            <div className={`p-8 rounded-[32px] border relative ${cardBg}`}>
              <div className="flex items-center justify-between mb-8">
                <h3 className={`text-lg font-bold flex items-center gap-2 ${textPrimary}`}><CalendarIcon size={20} className="text-indigo-500" /> {currentMonth} {currentYear}</h3>
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> <span className={textSecondary}>Wins</span></div>
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div> <span className={textSecondary}>Missed</span></div>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-y-6 text-center">
                {['S','M','T','W','T','F','S'].map(d => (
                  <div key={d} className={`text-[10px] font-bold opacity-30 ${textPrimary}`}>{d}</div>
                ))}
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={i} className="w-10 h-10" />;
                  const dateStr = `${currentYear}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                  const log = logsMap.get(dateStr);
                  const isToday = day === now.getDate() && now.getMonth() === new Date().getMonth();
                  const isPast = day < now.getDate();
                  const isMissed = isPast && goalStartDate && new Date(currentYear, now.getMonth(), day).getTime() >= goalStartDate && !log;

                  let dayStyle = '';
                  if (isToday) dayStyle = 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30';
                  else if (log) dayStyle = 'bg-emerald-500 text-white';
                  else if (isMissed) dayStyle = 'bg-rose-500/20 text-rose-500 border border-rose-500/30';
                  else dayStyle = theme === 'dark' ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50';

                  return (
                    <div key={i} className="flex justify-center">
                      <button 
                        onClick={() => setSelectedDay(day)}
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-xs font-bold transition-all hover:scale-110 active:scale-95 ${dayStyle}`}
                      >
                        {day}
                      </button>
                    </div>
                  );
                })}
              </div>

              {selectedDay && (
                <div className={`absolute inset-0 z-20 flex items-center justify-center p-4 rounded-[32px] backdrop-blur-md ${theme === 'dark' ? 'bg-black/60' : 'bg-white/80'}`}>
                  <div className={`w-full max-w-sm p-8 rounded-3xl border shadow-2xl scale-in-center ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-bold flex items-center gap-2"><Target size={18} className="text-indigo-500" /> Day Log: {selectedDay}</h4>
                      <button onClick={() => setSelectedDay(null)} className="p-2 hover:bg-white/10 rounded-xl"><X size={20}/></button>
                    </div>
                    <textarea 
                      autoFocus
                      value={winInput}
                      onChange={(e) => setWinInput(e.target.value)}
                      placeholder="What was your daily win?"
                      className={`w-full p-4 text-sm rounded-2xl border mb-6 h-32 outline-none transition-all focus:border-indigo-500 ${theme === 'dark' ? 'bg-[#121212] border-white/10' : 'bg-slate-50 border-slate-200'}`}
                    />
                    <button 
                      onClick={handleLogWin}
                      disabled={!winInput.trim() || !activeGoalSession}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/30 disabled:opacity-50"
                    >
                      Log Win
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50 border-emerald-100'}`}>
              <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>
                <Lightbulb size={16} /> Zysculpt Pro Tip
              </h4>
              <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-emerald-300/80' : 'text-emerald-800'}`}>
                Did you know? You can ask the <strong>Career Copilot</strong> to simulate a job interview for specific roles you find in the Marketplace.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>Quick Actions</h2>
              {[
                { label: 'Map Trajectory', view: AppView.CAREER_COPILOT, icon: <Compass />, color: 'bg-indigo-500' },
                { label: 'Tailor Resume', view: AppView.RESUME_BUILDER, icon: <FileText />, color: 'bg-emerald-500' },
                { label: 'Draft Pitch', view: AppView.COVER_LETTER, icon: <Mail />, color: 'bg-orange-500' },
              ].map((action, i) => (
                <button 
                  key={i}
                  onClick={() => setView(action.view)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${cardBg} hover:border-indigo-500 shadow-sm`}
                >
                  <div className={`p-2.5 rounded-xl text-white ${action.color}`}>
                    {action.icon}
                  </div>
                  <span className={`font-bold text-sm ${textPrimary}`}>{action.label}</span>
                  <ArrowUpRight size={16} className={`ml-auto transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${textSecondary}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { Calendar as CalendarIcon } from 'lucide-react';
export default Overview;
