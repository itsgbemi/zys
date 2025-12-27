
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Mail, 
  Compass, 
  ArrowUpRight, 
  Zap, 
  CheckCircle2,
  Trophy,
  X,
  Target,
  Rocket,
  Lightbulb,
  ChevronRight,
  UserCheck,
  Calendar as CalendarIcon,
  Circle,
  Layout,
  Search
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
  "Use the 'Knowledge Hub' to refresh technical skills before an interview.",
  "Your 'Base Resume' automatically informs all new AI document sessions.",
  "Ask the Copilot for a salary range for any role in the Job Search section.",
  "Consistency is key: Log at least one win daily to keep your momentum high.",
  "You can export resumes to both PDF and editable Word formats.",
  "Zysculpt links in resumes are formatted cleanly as actual URLs for recruiters.",
  "Simulate a tough performance review with the Copilot to build confidence."
];

const Overview: React.FC<OverviewProps> = ({ onToggleMobile, theme, sessions, setView, updateSession, userProfile }) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [winInput, setWinInput] = useState('');
  const [tipIndex, setTipIndex] = useState(0);

  const textPrimary = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const cardBg = theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a]' : 'bg-white border-slate-200 shadow-sm';

  useEffect(() => {
    const timer = setInterval(() => setTipIndex(p => (p + 1) % PRO_TIPS.length), 8000);
    return () => clearInterval(timer);
  }, []);

  const activeGoalSession = sessions.find(s => s.type === 'career-copilot' && s.careerGoalData);
  const isOnboarded = !!userProfile.fullName && !!userProfile.baseResumeText && !!activeGoalSession;

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

  // Logic to find task for selected day
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
    // Corrected to use activeGoalSession.id instead of undefined activeSession.id
    if (!activeGoalSession?.careerGoalData || !updateSession) return;
    const newTasks = activeGoalSession.careerGoalData.scheduledTasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    updateSession(activeGoalSession.id, {
      careerGoalData: { ...activeGoalSession.careerGoalData, scheduledTasks: newTasks }
    });
  };

  const handleLogWin = () => {
    // Corrected to use activeGoalSession.id instead of undefined activeSession.id
    if (!selectedDay || !activeGoalSession || !updateSession) return;
    const dateStr = `${currentYear}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;
    const newLog: DailyLog = { date: dateStr, win: winInput, completed: true };
    const currentLogs = activeGoalSession.careerGoalData?.logs || [];
    const updatedLogs = [...currentLogs.filter(l => l.date !== dateStr), newLog];
    updateSession(activeGoalSession.id, { careerGoalData: { ...activeGoalSession.careerGoalData!, logs: updatedLogs } });
    setWinInput('');
  };

  const dayTasks = getTasksForSelectedDay();

  return (
    <div className={`flex flex-col h-full transition-colors ${theme === 'dark' ? 'bg-[#191919]' : 'bg-[#F8FAFC]'}`}>
      <header className={`p-4 md:p-6 border-b flex items-center justify-between sticky top-0 z-10 transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden text-indigo-500"><Layout size={24} /></button>
          <h2 className={`text-lg md:text-xl font-bold ${textPrimary}`}>Command Center</h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl mx-auto w-full">
        {!isOnboarded ? (
          <div className="mb-12">
            <div className={`p-8 rounded-[40px] border-2 border-dashed ${theme === 'dark' ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50/50 border-indigo-200'}`}>
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <h1 className={`text-2xl md:text-3xl font-extrabold mb-4 ${textPrimary}`}>Launch your career journey</h1>
                  <p className={`text-lg mb-6 leading-relaxed ${textSecondary}`}>Complete these 3 steps to unlock your AI roadmap.</p>
                  <div className="space-y-3">
                    {[
                      { l: 'Complete Profile', c: !!userProfile.fullName, v: AppView.SETTINGS },
                      { l: 'Upload Base Resume', c: !!userProfile.baseResumeText, v: AppView.SETTINGS },
                      { l: 'Set Commitment & Goal', c: !!activeGoalSession, v: AppView.CAREER_COPILOT }
                    ].map((task, idx) => (
                      <button key={idx} onClick={() => setView(task.v)} className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${task.c ? 'opacity-50' : 'hover:translate-x-1'} ${cardBg}`}>
                        {task.c ? <CheckCircle2 className="text-emerald-500" size={18} /> : <Circle className="text-slate-300" size={18} />}
                        <span className={`text-sm font-bold ${textPrimary} ${task.c ? 'line-through' : ''}`}>{task.l}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-2">
               <ZysculptLogo theme={theme} size={40} />
               <h1 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${textPrimary}`}>Hello, {userProfile.fullName.split(' ')[0]}.</h1>
            </div>
            <div className="flex items-center gap-3">
               <span className={`px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-500 text-white`}>{userProfile.dailyAvailability}h commitment</span>
               <p className={`${textSecondary} font-medium`}>Goal: {activeGoalSession?.careerGoalData?.mainGoal}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 space-y-6">
            {/* Calendar */}
            <div className={`p-8 rounded-[32px] border ${cardBg}`}>
              <div className="flex items-center justify-between mb-8">
                <h3 className={`text-lg font-bold flex items-center gap-2 ${textPrimary}`}><CalendarIcon size={20} className="text-indigo-500" /> {currentMonth}</h3>
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> <span>Logs</span></div>
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> <span>Today</span></div>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-y-4 text-center">
                {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-[10px] font-bold opacity-30">{d}</div>)}
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={i} />;
                  const dateStr = `${currentYear}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                  const hasLog = logsMap.has(dateStr);
                  const isToday = day === now.getDate();
                  const isSelected = selectedDay === day;

                  return (
                    <button key={i} onClick={() => setSelectedDay(day)} className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center text-xs font-bold transition-all
                      ${isSelected ? 'scale-110 shadow-xl z-10' : ''}
                      ${isToday ? 'bg-indigo-600 text-white' : hasLog ? 'bg-emerald-500 text-white' : isSelected ? 'bg-indigo-100 text-indigo-900 border-2 border-indigo-500' : 'hover:bg-slate-100 dark:hover:bg-white/5'}
                    `}>{day}</button>
                  );
                })}
              </div>
            </div>

            {/* Daily Tasks for selected date */}
            <div className={`p-8 rounded-[32px] border ${cardBg}`}>
               <div className="flex items-center justify-between mb-6">
                 <h3 className={`text-lg font-bold ${textPrimary}`}>Tasks for Day {selectedDay}</h3>
                 <Target size={20} className="text-indigo-500" />
               </div>
               <div className="space-y-4">
                 {dayTasks.length === 0 ? (
                   <p className={`text-sm italic ${textSecondary}`}>No specific tasks generated for this date yet. Check the Career Copilot to architect your plan.</p>
                 ) : (
                   dayTasks.map(task => (
                     <div key={task.id} className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                       <button onClick={() => toggleTask(task.id)} className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-400'}`}>
                         {task.completed && <CheckCircle2 size={12} />}
                       </button>
                       <span className={`text-sm ${task.completed ? 'line-through opacity-50' : textPrimary}`}>{task.task}</span>
                     </div>
                   ))
                 )}
               </div>
               {selectedDay === now.getDate() && (
                 <div className="mt-8 pt-8 border-t border-white/5">
                   <p className="text-xs font-bold mb-3 uppercase tracking-widest opacity-40">Add a Win for Today</p>
                   <div className="flex gap-2">
                     <input value={winInput} onChange={e => setWinInput(e.target.value)} placeholder="Achieved a milestone?" className={`flex-1 p-3 text-xs rounded-xl border outline-none ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/5' : 'bg-slate-50 border-slate-200'}`} />
                     <button onClick={handleLogWin} className="px-4 bg-emerald-600 text-white rounded-xl font-bold text-xs">Save</button>
                   </div>
                 </div>
               )}
            </div>
          </div>

          <div className="space-y-6">
            <div className={`p-6 rounded-3xl border min-h-[160px] flex flex-col transition-all duration-500 ${theme === 'dark' ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
              <div className="flex items-center gap-2 mb-4 text-indigo-500">
                <Lightbulb size={18} />
                <h4 className="text-xs font-bold uppercase tracking-widest">Zysculpt Pro Tip</h4>
              </div>
              <p className={`text-sm leading-relaxed ${textPrimary} font-medium animate-in fade-in slide-in-from-right-4`}>
                "{PRO_TIPS[tipIndex]}"
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-[10px] font-bold uppercase tracking-widest opacity-40 px-2">Quick Access</h2>
              {[
                { label: 'Knowledge Hub', view: AppView.KNOWLEDGE_HUB, icon: <Zap />, color: 'bg-orange-500' },
                { label: 'Tailor Resume', view: AppView.RESUME_BUILDER, icon: <FileText />, color: 'bg-emerald-500' },
                { label: 'Find a Role', view: AppView.FIND_JOB, icon: <Search />, color: 'bg-indigo-500' },
              ].map((action, i) => (
                <button key={i} onClick={() => setView(action.view)} className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all group ${cardBg} hover:border-indigo-500`}>
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
