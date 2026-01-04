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
  Menu
} from 'lucide-react';
import { AppView, ChatSession, Theme, DailyLog, UserProfile, ScheduledTask } from '../types';
import { ZysculptLogo } from './Sidebar';

interface OverviewProps {
  onToggleMobile?: () => void;
  theme: Theme;
  sessions: ChatSession[];
  setView: (view: AppView) => void;
  updateSession?: (id: string, updates: Partial<ChatSession>) => void;
  userProfile: UserProfile;
}

const PRO_TIPS = [
  "Upload your Master Resume in Settings to let AI know your full professional history.",
  "Ask the Career Roadmap assistant for specific skills needed for your target role.",
  "Check the Job Search section daily for new tailored opportunities.",
  "Use the Resume Builder to optimize for ATS compatibility automatically.",
  "Click any date on the calendar to see or add your professional wins."
];

const Overview: React.FC<OverviewProps> = ({ onToggleMobile, theme, sessions, setView, updateSession, userProfile }) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [winInput, setWinInput] = useState('');
  const [tipIndex, setTipIndex] = useState(0);

  const textPrimary = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const cardBg = theme === 'dark' ? 'bg-[#121212] border-white/5' : 'bg-white border-slate-200 shadow-sm';

  useEffect(() => {
    const timer = setInterval(() => setTipIndex(p => (p + 1) % PRO_TIPS.length), 8000);
    return () => clearInterval(timer);
  }, []);

  const activeGoalSession = sessions.find(s => s.type === 'career-copilot' && s.careerGoalData);
  const isOnboarded = !!userProfile.fullName && !!userProfile.baseResumeText;

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

  return (
    <div className={`flex flex-col h-full transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-[#F8FAFC]'}`}>
      <header className={`p-4 md:p-6 border-b flex items-center justify-between sticky top-0 z-10 transition-colors ${theme === 'dark' ? 'bg-[#121212] border-white/5' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden p-2 -ml-2 text-[#1918f0] transition-colors">
            <Menu size={24} />
          </button>
          <h2 className={`text-lg md:text-xl font-bold ${textPrimary}`}>Overview</h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl mx-auto w-full">
        {!isOnboarded ? (
          <div className="mb-12">
            <div className={`p-6 md:p-8 rounded-[32px] md:rounded-[40px] border-2 border-dashed ${theme === 'dark' ? 'bg-[#1918f0]/5 border-[#1918f0]/20' : 'bg-indigo-50/50 border-indigo-200'}`}>
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1 w-full">
                  <h1 className={`text-2xl md:text-3xl font-extrabold mb-4 ${textPrimary}`}>Welcome to Zysculpt</h1>
                  <p className={`text-base md:text-lg mb-6 leading-relaxed ${textSecondary}`}>Complete these steps to unlock your full AI potential.</p>
                  <div className="space-y-3">
                    {[
                      { l: 'Fill Personal Information', c: !!userProfile.fullName, v: AppView.SETTINGS },
                      { l: 'Upload Master Resume', c: !!userProfile.baseResumeText, v: AppView.SETTINGS },
                      { l: 'Start a Career Roadmap', c: !!activeGoalSession, v: AppView.CAREER_COPILOT }
                    ].map((task, idx) => (
                      <button key={idx} onClick={() => setView(task.v)} className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${task.c ? 'opacity-50' : 'hover:translate-x-1'} ${cardBg}`}>
                        {task.c ? <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={18} /> : <Circle className="text-slate-300 flex-shrink-0" size={18} />}
                        <span className={`text-sm font-bold text-left ${textPrimary} ${task.c ? 'line-through' : ''}`}>{task.l}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 md:mb-12 animate-in fade-in duration-700">
            <div className="flex items-center gap-4 mb-2">
               <ZysculptLogo theme={theme} size={40} />
               <h1 className={`text-2xl md:text-4xl font-extrabold tracking-tight ${textPrimary}`}>Welcome, {userProfile.fullName.split(' ')[0]}.</h1>
            </div>
            <p className={`${textSecondary} font-medium text-sm md:text-base`}>Ready to sculpt your professional future today?</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
          <div className="lg:col-span-2 space-y-6">
            <div className={`p-6 md:p-8 rounded-[24px] md:rounded-[32px] border ${cardBg}`}>
              <div className="flex items-center justify-between mb-8">
                <h3 className={`text-base md:text-lg font-bold flex items-center gap-2 ${textPrimary}`}><CalendarIcon size={20} className="text-[#1918f0]" /> {currentMonth}</h3>
              </div>
              <div className="grid grid-cols-7 gap-y-3 md:gap-y-4 text-center">
                {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-[10px] font-bold opacity-30">{d}</div>)}
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
              <h2 className="text-[10px] font-bold uppercase tracking-widest opacity-40 px-2">Quick Actions</h2>
              {[
                { label: 'Resume Builder', view: AppView.RESUME_BUILDER, icon: <FileText size={18} />, color: 'bg-emerald-500' },
                { label: 'Find a Job', view: AppView.FIND_JOB, icon: <Search size={18} />, color: 'bg-[#1918f0]' },
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