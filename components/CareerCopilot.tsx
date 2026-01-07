import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Loader2, 
  Sparkles,
  Mic,
  Square,
  Menu,
  Zap,
  Cpu,
  Paperclip,
  ChevronDown
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
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const models = [
    { id: 'gemini-3-pro', label: 'Gemini 3 Pro', icon: <Zap size={14}/> },
    { id: 'gemini-3-flash', label: 'Gemini 3 Flash', icon: <Zap size={14}/> },
    { id: 'deepseek-v3', label: 'DeepSeek V3', icon: <Cpu size={14}/> },
    { id: 'deepseek-r1', label: 'DeepSeek R1', icon: <Cpu size={14}/> }
  ];

  return (
    <div className={`flex flex-col h-full transition-colors font-['Inter',_sans-serif] ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-[#F8FAFC]'}`}>
      <header className={`p-4 md:p-6 border-b flex items-center justify-between sticky top-0 z-10 transition-colors ${theme === 'dark' ? 'bg-[#121212] border-white/5' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden p-2 -ml-2 text-[#1918f0] transition-colors"><Menu size={24} /></button>
          <div>
            <h2 className={`text-lg md:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>Career Roadmap</h2>
          </div>
        </div>
        <button onClick={handleGeneratePlan} disabled={isGeneratingPlan} className="px-5 py-2 bg-[#1918f0] text-white rounded-2xl font-bold hover:bg-[#1413c7] transition-all shadow-lg text-xs">
          {isGeneratingPlan ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} 
          <span className="hidden sm:inline ml-2">Generate 30-Day Plan</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
        <div className="flex justify-start">
           <div className={`max-w-full text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
              <p className="opacity-70 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1918f0]">Zysculpt AI</p>
              <MarkdownLite text="Hello! I'm your dedicated Career Copilot. We can practice mock interviews, refine your personal brand, or strategize your next pivot. What's on your mind?" theme={theme} />
           </div>
        </div>

        {activeSession.messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'user' ? (
              <div className={`max-w-[85%] md:max-w-[70%] rounded-[24px] px-5 py-3 shadow-sm ${
                theme === 'dark' ? 'bg-[#1918f0] text-white' : 'bg-[#E0E7FF] text-slate-900'
              }`}>
                <div className="text-sm font-medium leading-relaxed">{m.content}</div>
              </div>
            ) : (
              <div className={`max-w-full text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                <p className="opacity-70 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1918f0]">Zysculpt AI</p>
                <MarkdownLite text={m.content} theme={theme} />
              </div>
            )}
          </div>
        ))}
        {isTyping && (
           <div className="flex justify-start">
            <div className="flex items-center gap-3">
              <Loader2 className="animate-spin text-[#1918f0]" size={16} />
              <span className="text-[10px] font-bold opacity-40 tracking-widest uppercase">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={`p-4 md:p-8 border-t ${theme === 'dark' ? 'bg-[#121212] border-white/5' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto space-y-4">
          <div className={`relative flex items-center gap-3 border rounded-[32px] p-2 pr-3 transition-all ${
             theme === 'dark' ? 'bg-[#121212] border-white/10' : 'bg-slate-50 border-slate-200'
           }`}>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-full hover:bg-white/5 transition-colors text-slate-400"
            >
              <Paperclip size={20} />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" />

            <textarea 
              value={inputValue} 
              onChange={e => setInputValue(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} 
              placeholder="Ask Zysculpt..." 
              className={`flex-1 bg-transparent border-none py-3 px-2 min-h-[48px] max-h-[200px] transition-all resize-none text-sm md:text-base outline-none ${
                theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
              }`}
              rows={1} 
            />

            <div className="relative">
              <button 
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className={`p-3 rounded-xl flex items-center gap-2 text-[11px] font-black uppercase transition-all ${
                  theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {models.find(m => m.id === selectedModel)?.label.split(' ')[1]}
                <ChevronDown size={14} className={showModelDropdown ? 'rotate-180' : ''} />
              </button>

              {showModelDropdown && (
                <div className={`absolute bottom-full right-0 mb-4 w-48 border rounded-2xl shadow-2xl p-2 z-50 animate-in slide-in-from-bottom-2 ${
                  theme === 'dark' ? 'bg-[#1a1a1a] border-white/10 text-white' : 'bg-white border-slate-200'
                }`}>
                  {models.map(m => (
                    <button 
                      key={m.id}
                      onClick={() => { setSelectedModel(m.id as any); setShowModelDropdown(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        selectedModel === m.id ? 'bg-[#1918f0] text-white' : 'hover:bg-white/5'
                      }`}
                    >
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={handleSend} className="p-3 bg-[#1918f0] text-white rounded-full hover:bg-[#1413c7]"><Send size={20}/></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerCopilot;