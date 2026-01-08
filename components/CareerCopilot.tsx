import React, { useState, useRef, useEffect } from 'react';
import { 
  Loader2, 
  Sparkles,
  Paperclip,
  Compass
} from 'lucide-react';
import { Message, ChatSession, Theme, ScheduledTask, UserProfile } from '../types';
import { aiService } from '../services/ai';
import { MarkdownLite } from './AIResumeBuilder';
import { CustomHamburger, CustomArrowUp } from './Sidebar';

interface CareerCopilotProps {
  onToggleMobile?: () => void;
  theme: Theme;
  sessions: ChatSession[];
  activeSessionId: string;
  updateSession: (id: string, updates: Partial<ChatSession>) => void;
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  userProfile: UserProfile;
}

const CareerCopilot: React.FC<CareerCopilotProps> = ({ 
  onToggleMobile, theme, sessions, activeSessionId, updateSession, setSessions, userProfile 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession.messages, isTyping]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setInputValue(prev => prev + `\n[Attached File: ${file.name}]\n${content.slice(0, 5000)}`);
      };
      reader.readAsText(file);
    }
  };

  const handleSend = async (msg?: string) => {
    const textToSend = msg || inputValue;
    if (!textToSend.trim() || isTyping) return;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: textToSend, timestamp: Date.now() };
    const newMessages = [...activeSession.messages, userMessage];
    updateSession(activeSessionId, { messages: newMessages });
    setInputValue('');
    setIsTyping(true);

    try {
      const assistantId = (Date.now() + 1).toString();
      updateSession(activeSessionId, { messages: [...newMessages, { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() }] });
      const stream = aiService.generateStream(newMessages, "", { type: 'career-copilot', userProfile });
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setSessions(prev => prev.map(s => s.id === activeSessionId ? {
          ...s,
          messages: s.messages.map(m => m.id === assistantId ? { ...m, content: fullText } : m)
        } : s));
      }
    } catch (e) { console.error(e); } finally { setIsTyping(false); }
  };

  const handleGeneratePlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const prompt = `Create a 30-day career roadmap for: "${activeSession.title}". Return JSON: [{"day": 1, "task": "..."}]`;
      const result = await aiService.sculpt(prompt);
      const plan = JSON.parse(result);
      const scheduledTasks: ScheduledTask[] = plan.map((p: any, i: number) => ({
        id: `task-${i}`, dayNumber: p.day, task: p.task, completed: false
      }));
      updateSession(activeSessionId, {
        careerGoalData: { mainGoal: activeSession.title, scheduledTasks, logs: [], startDate: Date.now() }
      });
    } catch (e) { alert("Failed to generate plan."); } finally { setIsGeneratingPlan(false); }
  };

  return (
    <div className={`flex flex-col h-full transition-colors font-['Inter',_sans-serif] ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-[#F8FAFC]'}`}>
      <header className={`p-4 md:p-6 border-b flex items-center justify-between sticky top-0 z-10 transition-colors ${theme === 'dark' ? 'bg-[#121212] border-white/5' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden p-2 -ml-2 transition-colors">
            <CustomHamburger theme={theme} />
          </button>
          <div className="flex flex-col">
            <h2 className={`text-lg md:text-xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>Career Roadmap</h2>
            <p className="text-[10px] md:text-xs font-medium opacity-50">Mapping your journey to mastery with structured accountability.</p>
          </div>
        </div>
        <button onClick={handleGeneratePlan} disabled={isGeneratingPlan} className="px-5 py-2 bg-[#1918f0] text-white rounded-2xl font-bold hover:bg-[#1413c7] transition-all shadow-lg text-xs">
          {isGeneratingPlan ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} 30-Day Plan
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {activeSession.messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto pb-12 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-[#1918f0]/10 text-[#1918f0] rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-[#1918f0]/10">
              <Compass size={32} />
            </div>
            <h3 className={`text-2xl font-black mb-3 ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>Strategic Growth Hub</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">Set a target role or goal, and I'll build a structured daily roadmap to help you achieve it within your timeline.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {["Plan my next 30 days", "Interview preparation", "Switch to Product Management", "Salary negotiation tips"].map(suggestion => (
                <button key={suggestion} onClick={() => handleSend(suggestion)} className={`px-4 py-2 rounded-full border text-xs font-bold transition-all ${theme === 'dark' ? 'border-white/5 bg-white/5 text-white hover:bg-white/10' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-[#1918f0]'}`}>{suggestion}</button>
              ))}
            </div>
          </div>
        )}

        {activeSession.messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'user' ? (
              <div className={`max-w-[85%] md:max-w-[70%] rounded-xl px-4 py-2 border text-sm font-normal leading-normal transition-colors ${
                theme === 'dark' ? 'bg-[#2c2c2e] text-zinc-100 border-[#64656d]' : 'bg-[#f4f4f4] text-zinc-900 border-[#e0e0e0]'
              }`}>
                {m.content}
              </div>
            ) : (
              <div className="max-w-full text-sm leading-relaxed bg-transparent border-0 shadow-none">
                <MarkdownLite text={m.content} theme={theme} />
              </div>
            )}
          </div>
        ))}
        {isTyping && <div className="flex justify-start items-center gap-2 opacity-40"><Loader2 className="animate-spin text-[#1918f0]" size={14} /><span className="text-[10px] font-bold uppercase">Thinking</span></div>}
        <div ref={messagesEndRef} />
      </div>

      <div className={`p-4 md:p-8 border-t ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto">
          <div className={`flex flex-col border rounded-[32px] p-4 transition-all ${theme === 'dark' ? 'bg-[#121212] border-white/10' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
            <textarea 
              value={inputValue} 
              onChange={e => setInputValue(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} 
              placeholder="Message Zysculpt..." 
              className={`flex-1 bg-transparent border-none p-0 min-h-[48px] max-h-[200px] resize-none text-sm md:text-base outline-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`} 
              rows={1} 
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-zinc-400 hover:text-zinc-200 transition-colors">
                <Paperclip size={20} />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <button 
                onClick={() => handleSend()} 
                disabled={!inputValue.trim() || isTyping} 
                className="p-3 bg-[#1918f0] text-white rounded-full hover:bg-[#1413c7] shadow-md transition-all active:scale-90"
              >
                {isTyping ? <Loader2 size={20} className="animate-spin" /> : <CustomArrowUp />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerCopilot;