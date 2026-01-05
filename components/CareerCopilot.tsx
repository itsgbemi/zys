import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Loader2, 
  Sparkles,
  Mic,
  Square,
  Menu,
  Zap,
  Cpu
} from 'lucide-react';
import { Message, ChatSession, Theme, ScheduledTask, UserProfile } from '../types';
import { aiService, AIModel } from '../services/ai';
import { MarkdownLite } from './AIResumeBuilder';

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
  const [selectedModel, setSelectedModel] = useState<AIModel>('gemini-3-pro');

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
      const assistantId = (Date.now() + 1).toString();
      updateSession(activeSessionId, { messages: [...newMessages, { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() }] });
      
      const stream = aiService.generateStream(selectedModel, newMessages, "", { type: 'career-copilot', userProfile });
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setSessions(prev => prev.map(s => s.id === activeSessionId ? {
          ...s,
          messages: s.messages.map(m => m.id === assistantId ? { ...m, content: fullText } : m)
        } : s));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  const handleGeneratePlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const prompt = `Create a 30-day career roadmap for: "${activeSession.title}". User availability: ${userProfile.dailyAvailability}h/day. Return JSON: [{"day": 1, "task": "..."}]`;
      const result = await aiService.sculpt(selectedModel, prompt);
      const plan = JSON.parse(result);
      const scheduledTasks: ScheduledTask[] = plan.map((p: any, i: number) => ({
        id: `task-${i}`, dayNumber: p.day, task: p.task, completed: false
      }));

      updateSession(activeSessionId, {
        careerGoalData: { mainGoal: activeSession.title, scheduledTasks, logs: [], startDate: Date.now() }
      });
      
      const confirmMsg: Message = { id: Date.now().toString(), role: 'assistant', content: `Success! Check your Dashboard for your plan.`, timestamp: Date.now() };
      updateSession(activeSessionId, { messages: [...activeSession.messages, confirmMsg] });
    } catch (e) {
      alert("Failed to parse AI plan.");
    } finally { setIsGeneratingPlan(false); }
  };

  return (
    <div className={`flex flex-col h-full transition-colors font-['Inter',_sans-serif] ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-[#F8FAFC]'}`}>
      <header className={`p-4 md:p-6 border-b flex items-center justify-between sticky top-0 z-10 transition-colors ${theme === 'dark' ? 'bg-[#121212] border-white/5' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden p-2 -ml-2 text-[#1918f0] transition-colors"><Menu size={24} /></button>
          <div>
            <h2 className={`text-lg md:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>Career Roadmap</h2>
            <p className="text-[10px] md:text-xs opacity-40">Practice and Strategy</p>
          </div>
        </div>
        <button onClick={handleGeneratePlan} disabled={isGeneratingPlan} className="px-5 py-2 bg-[#1918f0] text-white rounded-2xl font-bold hover:bg-[#1413c7] transition-all shadow-lg text-xs">
          {isGeneratingPlan ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} 
          <span className="hidden sm:inline ml-2">Generate 30-Day Plan</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <div className="flex justify-start">
           <div className={`max-w-[85%] rounded-3xl p-6 border ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/5' : 'bg-white border-slate-100'}`}>
              <p className="text-sm">Hello! I'm your dedicated Career Copilot. We can practice mock interviews, refine your personal brand, or strategize your next pivot. What's on your mind?</p>
           </div>
        </div>

        {activeSession.messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-[32px] p-6 shadow-sm border ${m.role === 'user' ? (theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100') : (theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white')}`}>
              <div className="text-sm"><MarkdownLite text={m.content} theme={theme} /></div>
            </div>
          </div>
        ))}
        {isTyping && <Loader2 className="animate-spin text-[#1918f0] ml-4" size={20} />}
        <div ref={messagesEndRef} />
      </div>

      <div className={`p-4 md:p-8 border-t ${theme === 'dark' ? 'bg-[#121212] border-white/5' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto space-y-4">
          <div className={`flex items-center gap-1 w-fit rounded-full p-1 border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
             {[
               { id: 'gemini-3-pro', icon: <Zap size={10}/>, label: 'Gemini' },
               { id: 'deepseek-v3', icon: <Cpu size={10}/>, label: 'DeepSeek' }
             ].map(m => (
               <button key={m.id} onClick={() => setSelectedModel(m.id as any)} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${selectedModel === m.id ? 'bg-[#1918f0] text-white' : 'text-slate-400'}`}>
                 {m.label}
               </button>
             ))}
          </div>
          <div className="flex gap-4">
            <textarea value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} placeholder="Ask Zysculpt..." className={`flex-1 rounded-[32px] p-5 border outline-none ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10 text-white focus:border-[#1918f0]' : 'bg-slate-50 border-slate-200 focus:border-[#1918f0]'}`} rows={1} />
            <button onClick={handleSend} className="p-5 bg-[#1918f0] text-white rounded-[32px] hover:bg-[#1413c7]"><Send size={24}/></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerCopilot;