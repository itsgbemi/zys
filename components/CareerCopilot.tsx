
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Compass, 
  Loader2, 
  CheckCircle2, 
  Plus, 
  Calendar as CalendarIcon, 
  Target, 
  BarChart3,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { Message, ChatSession, Theme, CareerGoal, DailyLog } from '../types';
import { geminiService } from '../services/gemini';

interface CareerCopilotProps {
  onToggleMobile?: () => void;
  theme: Theme;
  sessions: ChatSession[];
  activeSessionId: string;
  updateSession: (id: string, updates: Partial<ChatSession>) => void;
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
}

const MarkdownLite: React.FC<{ text: string; dark?: boolean; theme?: Theme }> = ({ text, dark = false, theme = 'dark' }) => {
  const lines = text.split('\n');
  
  const formatText = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className={`space-y-1 ${dark ? 'text-black font-serif' : theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed === '') return <div key={i} className="h-2" />;
        
        if (trimmed.startsWith('### ')) {
          return <h3 key={i} className="text-base font-bold mt-4 mb-2 text-indigo-500">{formatText(trimmed.slice(4))}</h3>;
        }
        if (trimmed.startsWith('## ')) {
          return <h2 key={i} className="text-lg font-bold mt-6 mb-3 border-b border-indigo-500/20 pb-1">{formatText(trimmed.slice(3))}</h2>;
        }
        if (trimmed.startsWith('# ')) {
          return <h1 key={i} className="text-xl font-bold mt-8 mb-4 border-b-2 border-indigo-500 pb-2 uppercase tracking-tight">{formatText(trimmed.slice(2))}</h1>;
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 ml-4">
              <span className="opacity-50">•</span>
              <span className="flex-1">{formatText(trimmed.slice(2))}</span>
            </div>
          );
        }
        return <p key={i} className="leading-relaxed mb-2">{formatText(line)}</p>;
      })}
    </div>
  );
};

const CustomMenuIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4 8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M4 16H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CareerCopilot: React.FC<CareerCopilotProps> = ({ 
  onToggleMobile, theme, sessions, activeSessionId, updateSession, setSessions 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession.messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: inputValue, timestamp: Date.now() };
    const newMessages = [...activeSession.messages, userMessage];
    updateSession(activeSessionId, { messages: newMessages });
    setInputValue('');
    setIsTyping(true);

    try {
      const responseStream = await geminiService.generateChatResponse(
        newMessages, 
        inputValue, 
        { type: 'career-copilot' }
      );
      
      let assistantResponse = '';
      const assistantId = (Date.now() + 1).toString();
      updateSession(activeSessionId, { messages: [...newMessages, { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() }] });

      for await (const chunk of responseStream) {
        assistantResponse += chunk.text;
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { 
          ...s, 
          messages: s.messages.map(m => m.id === assistantId ? { ...m, content: assistantResponse } : m) 
        } : s));
      }
    } catch (e) {
      updateSession(activeSessionId, { 
        messages: [...newMessages, { id: 'error', role: 'assistant', content: "An error occurred. Please try again.", timestamp: Date.now() }] 
      });
    } finally { setIsTyping(false); }
  };

  const textPrimary = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const cardBg = theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a]' : 'bg-white border-slate-200 shadow-sm';

  const days = Array.from({ length: 14 }, (_, i) => ({
    date: new Date(Date.now() - (13 - i) * 86400000).toISOString().split('T')[0],
    win: i % 3 === 0 ? "Completed daily task" : "",
    completed: i % 2 === 0
  }));

  return (
    <div className={`flex flex-col h-full transition-colors ${theme === 'dark' ? 'bg-[#191919]' : 'bg-[#F8FAFC]'}`}>
      <header className={`p-4 md:p-6 border-b flex items-center justify-between sticky top-0 z-10 transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden">
            <CustomMenuIcon className={textPrimary} />
          </button>
          <div>
            <h2 className={`text-lg md:text-xl font-bold ${textPrimary}`}>Career Copilot</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className={`text-[10px] md:text-xs ${textSecondary}`}>Tracking Goal: Next 365 Days</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        <div className={`w-full lg:w-96 border-r overflow-y-auto p-6 hidden lg:block ${theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a]' : 'bg-slate-50 border-slate-200'}`}>
          <div className="space-y-8">
            <section>
              <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${textSecondary}`}>Daily Momentum</h3>
              <div className="grid grid-cols-7 gap-2">
                {days.map((d, i) => (
                  <div 
                    key={i} 
                    className={`aspect-square rounded-md border flex items-center justify-center text-[10px] font-bold ${
                      d.completed 
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500' 
                        : theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-700' : 'bg-white border-slate-200 text-slate-300'
                    }`}
                    title={d.date}
                  >
                    {new Date(d.date).getDate()}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${textSecondary}`}>Current Objectives</h3>
              <div className="space-y-3">
                {[
                  "Refine portfolio UX case studies",
                  "Reach out to 2 hiring managers",
                  "Prepare for technical interviews"
                ].map((obj, i) => (
                  <div key={i} className={`p-3 rounded-xl border flex gap-3 ${cardBg}`}>
                    <div className="mt-0.5"><CheckCircle2 size={14} className="text-slate-400" /></div>
                    <span className={`text-xs font-medium leading-relaxed ${textPrimary}`}>{obj}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className={`p-5 rounded-3xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20`}>
              <Award className="mb-3" />
              <h4 className="font-bold text-sm mb-1">Weekly Win Log</h4>
              <p className="text-[10px] opacity-80 leading-relaxed mb-4">You've hit 80% of your targets this week. Keep the momentum going!</p>
              <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-all">Log Daily Win</button>
            </section>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {activeSession.messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm border ${
                  m.role === 'user' 
                    ? `bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20` 
                    : theme === 'dark' ? 'bg-[#2a2a2a] text-white border-[#444]' : 'bg-white text-[#0F172A] border-[#e2e8f0]'
                }`}>
                  <div className="text-sm leading-relaxed"><MarkdownLite text={m.content} theme={theme} /></div>
                  <div className={`text-[9px] mt-2 opacity-30 text-right ${m.role === 'user' ? 'text-white' : ''}`}>
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className={`rounded-2xl p-4 border ${theme === 'dark' ? 'bg-[#2a2a2a] border-[#333]' : 'bg-white border-[#e2e8f0]'}`}>
                  <Loader2 className="animate-spin text-indigo-500" size={18} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={`p-4 md:p-6 border-t transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
            <div className="max-w-4xl mx-auto relative group">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Talk to your Copilot about your career goals..."
                className={`w-full border rounded-2xl p-4 pr-16 min-h-[60px] max-h-[200px] transition-all resize-none text-sm md:text-base outline-none ${
                  theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a] text-white focus:border-white' : 'bg-slate-50 border-[#e2e8f0] text-[#0F172A] focus:border-indigo-400'
                }`}
                rows={1}
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <button onClick={handleSend} disabled={!inputValue.trim() || isTyping} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-30"><Send size={18} /></button>
              </div>
            </div>
            <p className="text-[9px] text-center mt-3 text-slate-500 uppercase tracking-tighter">Powered by Gemini 3 Flash</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerCopilot;
