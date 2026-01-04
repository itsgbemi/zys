import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ArrowUpRight, 
  Zap, 
  CheckCircle2,
  Target,
  Lightbulb,
  Calendar as CalendarIcon,
  Circle,
  Layout,
  Search,
  Menu,
  Sparkles,
  Mail,
  UserCheck,
  Compass
} from 'lucide-react';
import { AppView, ChatSession, Theme, DailyLog, UserProfile, ScheduledTask } from '../types';
import { ZysculptLogo } from './Sidebar';

interface OverviewProps {
  onToggleMobile?: () => void;
  theme: Theme;
  sessions: ChatSession[];
  setView: (view: AppView) => void;
  updateSession?: (id: string, updates: Partial<ChatSession>) => void;
  onNewSession: (type?: 'resume' | 'cover-letter' | 'resignation-letter' | 'career-copilot', initialPrompt?: string) => void;
  userProfile: UserProfile;
}

const PRO_TIPS = [
  "Upload your Master Resume in Settings to let AI know your full professional history.",
  "Ask the Career Roadmap assistant for specific skills needed for your target role.",
  "Check the Job Search section daily for new tailored opportunities.",
  "Use the Resume Builder to optimize for ATS compatibility automatically.",
  "Click any date on the calendar to see or add your professional wins."
];

const Overview: React.FC<OverviewProps> = ({ onToggleMobile, theme, sessions, setView, updateSession, onNewSession, userProfile }) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [tipIndex, setTipIndex] = useState(0);

  const textPrimary = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const cardBg = theme === 'dark' ? 'bg-[#121212] border-white/5' : 'bg-white border-slate-200 shadow-sm';

  useEffect(() => {
    const timer = setInterval(() => setTipIndex(p => (p + 1) % PRO_TIPS.length), 8000);
    return () => clearInterval(timer);
  }, []);

  const activeGoalSession = sessions.find(s => s.type === 'career-copilot' && s.careerGoalData);
  
  const now = new Date();
  const currentMonth = now.toLocaleString('default', { month: 'long' });
  const currentYear = now.getFullYear();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getDay();

  const logsMap = new Map<string, DailyLog>();
  let goalStartDate = activeGoalSession?.careerGoalData?.startDate || null;
  
  sessions.forEach(s => {
    if (s.careerGoalData) s.careerGoalData.logs.forEach(l => logsMap.set(l.date, l));
  });

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const getTasksForSelectedDay = (): ScheduledTask[] => {
    if (!activeGoalSession?.careerGoalData || !goalStartDate || !selectedDay) return [];
    const start = new Date(goalStartDate);
    start.setHours(0, 0, 0, 0);
    const dayDate = new Date(currentYear, now.getMonth(), selectedDay);
    dayDate.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(dayDate.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return activeGoalSession.careerGoalData.scheduledTasks.filter(t => t.dayNumber === diffDays);
  };

  const toggleTask = (taskId: string) => {
    if (!activeGoalSession?.careerGoalData || !updateSession) return;
    const newTasks = activeGoalSession.careerGoalData.scheduledTasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    updateSession(activeGoalSession.id, {
      careerGoalData: { ...activeGoalSession.careerGoalData, scheduledTasks: newTasks }
    });
  };

  const dayTasks = getTasksForSelectedDay();

  const handleAction = (type: any, prompt?: string) => {
    onNewSession(type, prompt);
  };

  return (
    <div className={`flex flex-col h-full transition-colors duration-300 font-['Roboto',_sans-serif] ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-[#F8FAFC]'}`}>
      <header className={`p-4 md:p-6 border-b flex items-center justify-between sticky top-0 z-10 transition-colors ${theme === 'dark' ? 'bg-[#121212] border-white/5' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden p-2 -ml-2 text-[#1918f0] transition-colors">
            <Menu size={24} />
          </button>
          <h2 className={`text-lg md:text-xl font-bold ${textPrimary}`}>Overview</h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl mx-auto w-full">
        {/* Welcome Hero Section - Redesigned as requested */}
        <div className={`p-8 md:p-12 rounded-[40px] border mb-12 animate-in fade-in zoom-in-95 duration-700 ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/5' : 'bg-white border-slate-200 shadow-xl shadow-indigo-500/5'}`}>
          <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
            <div className="w-20 h-20 rounded-[32px] bg-[#1918f0] flex items-center justify-center text-white shadow-2xl shadow-[#1918f0]/40 flex-shrink-0">
               <Sparkles size={40}/>
            </div>
            <div className="text-center md:text-left">
              <h1 className={`text-4xl font-black mb-2 tracking-tight ${textPrimary}`}>Welcome to Zysculpt AI</h1>
              <p className="text-slate-500 text-xl font-medium">I'm your dedicated career architect. How can I help you today?</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { l: 'Tailor a Resume', d: 'Match your profile to a job description', t: 'resume', i: <FileText size={24}/>, color: 'bg-indigo-500' },
              { l: 'Draft a Cover Letter', d: 'Persuasive writing for specific roles', t: 'cover-letter', i: <Mail size={24}/>, color: 'bg-emerald-500' },
              { l: 'Interview Prep', d: 'Simulate high-stakes interviews', t: 'career-copilot', p: 'I want to practice for an upcoming interview.', i: <UserCheck size={24}/>, color: 'bg-amber-500' },
              { l: 'Career Advice', d: 'Navigate complex workplace transitions', t: 'career-copilot', p: 'I need career advice regarding...', i: <Compass size={24}/>, color: 'bg-sky-500' }
            ].map((action, i) => (
              <button key={i} onClick={() => handleAction(action.t as any, action.p)} className={`p-6 rounded-[32px] border transition-all text-left hover:border-[#1918f0] hover:bg-[#1918f0]/5 group ${theme === 'dark' ? 'border-white/5 bg-[#121212]' : 'border-slate-100 bg-slate-50 shadow-sm'}`}>
                 <div className={`p-3 rounded-2xl ${action.color} text-white w-fit mb-5 group-hover:scale-110 transition-transform shadow-lg shadow-${action.color.split('-')[1]}-500/20`}>
                   {action.i}
                 </div>
                 <span className={`text-base font-black block mb-1 group-hover:text-[#1918f0] transition-colors ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>{action.l}</span>
                 <span className="text-xs text-slate-500 font-medium leading-relaxed">{action.d}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
          <div className="lg:col-span-2 space-y-6">
            <div className={`p-6 md:p-8 rounded-[24px] md:rounded-[32px] border ${cardBg}`}>
              <div className="flex items-center justify-between mb-8">
                <h3 className={`text-base md:text-lg font-bold flex items-center gap-2 ${textPrimary}`}><CalendarIcon size={20} className="text-[#1918f0]" /> {currentMonth} {currentYear}</h3>
              </div>
              <div className="grid grid-cols-7 gap-y-3 md:gap-y-4 text-center">
                {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-[10px] font-bold opacity-30 uppercase">{d}</div>)}
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={i} />;
                  const dateStr = `${currentYear}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                  const hasLog = logsMap.has(dateStr);
                  const isToday = day === now.getDate();
                  const isSelected = selectedDay === day;

                  return (
                    <button key={i} onClick={() => setSelectedDay(day)} className={`w-8 h-8 md:w-10 md:h-10 mx-auto rounded-lg md:rounded-xl flex items-center justify-center text-[11px] md:text-xs font-bold transition-all
                      ${isSelected ? 'scale-110 shadow-xl z-10' : ''}
                      ${isToday ? 'bg-[#1918f0] text-white' : hasLog ? 'bg-emerald-500 text-white' : isSelected ? 'bg-[#1918f0]/10 text-[#1918f0] border-2 border-[#1918f0]' : 'hover:bg-slate-100 dark:hover:bg-white/5'}
                    `}>{day}</button>
                  );
                })}
              </div>
            </div>

            <div className={`p-6 md:p-8 rounded-[24px] md:rounded-[32px] border ${cardBg}`}>
               <div className="flex items-center justify-between mb-6">
                 <h3 className={`text-base md:text-lg font-bold ${textPrimary}`}>Plan for Day {selectedDay}</h3>
                 <Target size={20} className="text-[#1918f0]" />
               </div>
               <div className="space-y-4">
                 {dayTasks.length === 0 ? (
                   <p className={`text-sm italic ${textSecondary}`}>No active roadmap tasks for this date.</p>
                 ) : (
                   dayTasks.map(task => (
                     <div key={task.id} className={`flex items-start gap-3 p-4 rounded-2xl border transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                       <button onClick={() => toggleTask(task.id)} className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-400'}`}>
                         {task.completed && <CheckCircle2 size={12} />}
                       </button>
                       <span className={`text-sm ${task.completed ? 'line-through opacity-50' : textPrimary}`}>{task.task}</span>
                     </div>
                   ))
                 )}
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`p-6 rounded-3xl border min-h-[140px] flex flex-col transition-all duration-500 ${theme === 'dark' ? 'bg-[#1918f0]/10 border-[#1918f0]/20' : 'bg-indigo-50 border-indigo-100'}`}>
              <div className="flex items-center gap-2 mb-4 text-[#1918f0]">
                <Lightbulb size={18} />
                <h4 className="text-[10px] font-bold uppercase tracking-widest">Growth Tip</h4>
              </div>
              <p className={`text-sm leading-relaxed ${textPrimary} font-medium`}>"{PRO_TIPS[tipIndex]}"</p>
            </div>

            <div className="space-y-3">
              <h2 className="text-[10px] font-bold uppercase tracking-widest opacity-40 px-2">Knowledge Lab</h2>
              {[
                { label: 'Job Search', view: AppView.FIND_JOB, icon: <Search size={18} />, color: 'bg-[#1918f0]' },
                { label: 'Skill Lab', view: AppView.KNOWLEDGE_HUB, icon: <Zap size={18} />, color: 'bg-orange-500' },
              ].map((action, i) => (
                <button key={i} onClick={() => setView(action.view)} className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all group ${cardBg} hover:border-[#1918f0]`}>
                  <div className={`p-2.5 rounded-xl text-white ${action.color}`}>{action.icon}</div>
                  <span className={`font-bold text-sm ${textPrimary}`}>{action.label}</span>
                  <ArrowUpRight size={16} className={`ml-auto opacity-30 group-hover:translate-x-0.5 transition-transform`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;