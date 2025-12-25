
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Mail, 
  DoorOpen, 
  Search, 
  Compass, 
  ArrowUpRight, 
  Zap, 
  Clock, 
  CheckCircle2,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Target
} from 'lucide-react';
import { AppView, ChatSession, Theme, DailyLog } from '../types';

interface OverviewProps {
  onToggleMobile?: () => void;
  theme: Theme;
  sessions: ChatSession[];
  setView: (view: AppView) => void;
  updateSession?: (id: string, updates: Partial<ChatSession>) => void;
}

const MOTIVATIONAL_QUOTES = [
  "The only way to do great work is to love what you do.",
  "Your career is a marathon, not a sprint. Pace yourself.",
  "Opportunities don't happen, you create them.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "Believe you can and you're halfway there.",
  "Dream big. Start small. But most importantly, start.",
  "Action is the foundational key to all success."
];

const Overview: React.FC<OverviewProps> = ({ onToggleMobile, theme, sessions, setView, updateSession }) => {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isQuoteVisible, setIsQuoteVisible] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [winInput, setWinInput] = useState('');

  const textPrimary = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const cardBg = theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a]' : 'bg-white border-slate-200 shadow-sm';

  useEffect(() => {
    const interval = setInterval(() => {
      setIsQuoteVisible(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
        setIsQuoteVisible(true);
      }, 500);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const careerSessions = sessions.filter(s => s.type === 'career-copilot' && s.careerGoalData);
  const activeGoalSession = careerSessions[0]; // Simplified to the first career goal session

  const stats = [
    { label: 'Documents', value: sessions.filter(s => s.finalResume).length, icon: <FileText className="text-indigo-500" /> },
    { label: 'Wins Logged', value: sessions.reduce((acc, s) => acc + (s.careerGoalData?.logs?.length || 0), 0), icon: <Trophy className="text-emerald-500" /> },
    { label: 'Active Goals', value: careerSessions.length, icon: <Zap className="text-orange-500" /> },
  ];

  // Calendar logic
  const now = new Date();
  const currentMonth = now.toLocaleString('default', { month: 'long' });
  const currentYear = now.getFullYear();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getDay();

  // Aggregate logs and identify missed days
  const logsMap = new Map<string, DailyLog>();
  let startDate: number | null = null;
  
  sessions.forEach(s => {
    if (s.careerGoalData) {
      if (!startDate || s.careerGoalData.startDate < startDate) startDate = s.careerGoalData.startDate;
      s.careerGoalData.logs.forEach(l => logsMap.set(l.date, l));
    }
  });

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const handleLogWin = () => {
    if (!selectedDay || !activeGoalSession || !updateSession) return;
    
    const dateStr = `${currentYear}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;
    const newLog: DailyLog = {
      date: dateStr,
      win: winInput,
      completed: true
    };

    const currentLogs = activeGoalSession.careerGoalData?.logs || [];
    const updatedLogs = [...currentLogs.filter(l => l.date !== dateStr), newLog];
    
    updateSession(activeGoalSession.id, {
      careerGoalData: {
        ...activeGoalSession.careerGoalData!,
        logs: updatedLogs
      }
    });
    
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
          <h2 className={`text-lg md:text-xl font-bold ${textPrimary}`}>Dashboard Overview</h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl mx-auto w-full">
        <div className="mb-12 text-center md:text-left">
          <h1 className={`text-3xl md:text-4xl font-extrabold mb-4 tracking-tight ${textPrimary}`}>Hello, Achiever.</h1>
          <div className="relative h-12 overflow-hidden flex items-center">
            <p className={`text-lg font-medium italic transition-all duration-500 transform ${textSecondary} ${isQuoteVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              "{MOTIVATIONAL_QUOTES[quoteIndex]}"
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className={`p-6 rounded-3xl border ${cardBg}`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
                  {stat.icon}
                </div>
              </div>
              <p className={`text-sm font-medium ${textSecondary}`}>{stat.label}</p>
              <p className={`text-3xl font-extrabold mt-1 ${textPrimary}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
             <div className={`p-6 rounded-3xl border h-full relative ${cardBg}`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-base font-bold ${textPrimary}`}>{currentMonth} {currentYear}</h3>
                </div>
                
                <div className="grid grid-cols-7 gap-y-4 text-center mb-2">
                  {['S','M','T','W','T','F','S'].map(d => (
                    <div key={d} className={`text-[10px] font-bold uppercase tracking-widest ${textSecondary}`}>{d}</div>
                  ))}
                  {calendarDays.map((day, i) => {
                    if (!day) return <div key={i} className="w-8 h-8" />;
                    
                    const dateStr = `${currentYear}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    const log = logsMap.get(dateStr);
                    const isToday = day === now.getDate() && now.getMonth() === new Date().getMonth();
                    const isPast = day < now.getDate();
                    const isMissed = isPast && startDate && new Date(currentYear, now.getMonth(), day).getTime() >= startDate && !log;
                    const hasWin = !!log;

                    let dayStyle = '';
                    if (isToday) dayStyle = 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30';
                    else if (hasWin) dayStyle = 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20';
                    else if (isMissed) dayStyle = 'bg-rose-500/20 text-rose-500 border border-rose-500/30';
                    else dayStyle = theme === 'dark' ? 'text-slate-400 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100';

                    return (
                      <div key={i} className="flex flex-col items-center">
                        <button 
                          onClick={() => setSelectedDay(day)}
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold transition-all ${dayStyle}`}
                        >
                          {day}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-tighter">
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> <span className={textSecondary}>Logged Win</span></div>
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div> <span className={textSecondary}>Missed Day</span></div>
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-600"></div> <span className={textSecondary}>Today</span></div>
                </div>

                {/* Log Modal */}
                {selectedDay && (
                  <div className={`absolute inset-0 z-20 flex items-center justify-center p-4 rounded-3xl backdrop-blur-md ${theme === 'dark' ? 'bg-black/60' : 'bg-white/80'}`}>
                    <div className={`w-full max-w-sm p-6 rounded-2xl border shadow-2xl ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold flex items-center gap-2"><Target size={18} /> Log Win: {currentMonth} {selectedDay}</h4>
                        <button onClick={() => setSelectedDay(null)} className="p-1 hover:bg-white/10 rounded-lg"><X size={18}/></button>
                      </div>
                      <textarea 
                        autoFocus
                        value={winInput}
                        onChange={(e) => setWinInput(e.target.value)}
                        placeholder="What did you achieve today? (e.g. Sent 5 applications, finished portfolio section...)"
                        className={`w-full p-3 text-sm rounded-xl border mb-4 h-24 outline-none ${theme === 'dark' ? 'bg-[#121212] border-white/10' : 'bg-slate-50 border-slate-200'}`}
                      />
                      <button 
                        onClick={handleLogWin}
                        disabled={!winInput.trim() || !activeGoalSession}
                        className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                      >
                        {activeGoalSession ? 'Save Activity' : 'Set Career Goal First'}
                      </button>
                    </div>
                  </div>
                )}
             </div>
          </div>

          <div className="space-y-4">
             <h2 className={`text-xs font-bold uppercase tracking-widest ${textSecondary}`}>Career Path</h2>
             {[
               { label: 'Map Trajectory', view: AppView.CAREER_COPILOT, icon: <Compass />, color: 'bg-emerald-500' },
               { label: 'Tailor Profile', view: AppView.RESUME_BUILDER, icon: <FileText />, color: 'bg-indigo-500' },
               { label: 'Draft Pitch', view: AppView.COVER_LETTER, icon: <Mail />, color: 'bg-orange-500' },
             ].map((action, i) => (
               <button 
                 key={i}
                 onClick={() => setView(action.view)}
                 className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${cardBg} hover:border-indigo-500`}
               >
                 <div className={`p-2 rounded-lg text-white ${action.color}`}>
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
  );
};

export default Overview;
