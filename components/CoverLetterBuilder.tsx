import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Loader2, 
  Undo,
  Sparkles,
  Menu,
  Paperclip,
  ChevronDown
} from 'lucide-react';
import { Message, ChatSession, Theme, StylePrefs, UserProfile } from '../types';
import { aiService, AIModel } from '../services/ai';
import { MarkdownLite } from './AIResumeBuilder';

interface CoverLetterBuilderProps {
  onToggleMobile?: () => void;
  theme: Theme;
  sessions: ChatSession[];
  activeSessionId: string;
  updateSession: (id: string, updates: Partial<ChatSession>) => void;
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  userProfile?: UserProfile;
}

const CoverLetterBuilder: React.FC<CoverLetterBuilderProps> = ({ 
  onToggleMobile, theme, sessions, activeSessionId, updateSession, setSessions, userProfile
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>('gemini');
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
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
      const stream = aiService.generateStream(selectedModel, newMessages, "", { type: 'cover-letter', userProfile, jobDescription: activeSession.jobDescription });
      let assistantResponse = '';
      for await (const chunk of stream) {
        assistantResponse += chunk;
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: s.messages.map(m => m.id === assistantId ? { ...m, content: assistantResponse } : m) } : s));
      }
    } catch (e) { setIsTyping(false); } finally { setIsTyping(false); }
  };

  return (
    <div className="flex flex-col h-full relative">
      <header className={`p-4 md:p-6 border-b flex items-center justify-between sticky top-0 z-10 transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden p-2 -ml-2 text-indigo-500 transition-colors"><Menu size={24} /></button>
          <h2 className={`text-lg md:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>Cover Letter</h2>
        </div>
        <button onClick={async () => {
          setIsTyping(true);
          try {
            const combinedData = `User Data: ${activeSession.resumeText || ''}\nChat context: ${activeSession.messages.map(m => m.content).join('\n')}`;
            const result = await aiService.sculpt(selectedModel, `Sculpt a cover letter based on: ${combinedData}`);
            updateSession(activeSessionId, { finalResume: result });
            setShowPreview(true);
          } catch (err) {} finally { setIsTyping(false); }
        }} disabled={isTyping} className="px-4 py-2 bg-indigo-500 text-white rounded-full font-bold shadow-lg text-xs md:text-sm">
          {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Generate
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="flex justify-start">
           <div className={`max-w-full text-sm leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1918f0]">Zysculpt AI</p>
              <MarkdownLite text="Hello! I'm your Cover Letter Specialist. How can I help you draft your pitch?" theme={theme} />
           </div>
        </div>
        {activeSession.messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'user' ? (
              <div className={`max-w-[80%] rounded-[20px] px-3 py-1.5 shadow-sm text-sm font-normal leading-normal ${theme === 'dark' ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-100 text-zinc-900'}`}>
                {m.content}
              </div>
            ) : (
              <div className={`max-w-full text-sm leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1918f0]">Zysculpt AI</p>
                <MarkdownLite text={m.content} theme={theme} />
              </div>
            )}
          </div>
        ))}
        {isTyping && <div className="flex justify-start opacity-40"><Loader2 className="animate-spin text-indigo-500" size={14} /></div>}
        <div ref={messagesEndRef} />
      </div>

      <div className={`p-4 md:p-6 border-t ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="max-w-4xl mx-auto">
          <div className={`relative flex items-end gap-2 border rounded-[28px] p-2 pr-3 transition-all ${theme === 'dark' ? 'bg-[#121212] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            <button onClick={() => fileInputRef.current?.click()} className="p-3 text-zinc-400 hover:text-zinc-200"><Paperclip size={20} /></button>
            <input type="file" ref={fileInputRef} className="hidden" />
            <textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Message Zysculpt..." className={`flex-1 bg-transparent border-none py-3 px-1 min-h-[48px] max-h-[200px] resize-none text-sm md:text-base outline-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`} rows={1} />
            <div className="relative">
              <button onClick={() => setShowModelDropdown(!showModelDropdown)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase ${theme === 'dark' ? 'text-zinc-400 bg-zinc-800' : 'text-zinc-500 bg-zinc-100'}`}>
                {selectedModel} <ChevronDown size={12} className={showModelDropdown ? 'rotate-180' : ''} />
              </button>
              {showModelDropdown && (
                <div className={`absolute bottom-full right-0 mb-3 w-36 border rounded-2xl shadow-2xl p-2 z-50 ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-200'}`}>
                  {['gemini', 'deepseek'].map(m => (
                    <button key={m} onClick={() => { setSelectedModel(m as any); setShowModelDropdown(false); }} className={`w-full text-left px-3 py-2 rounded-xl text-[10px] font-bold uppercase ${selectedModel === m ? 'bg-indigo-500 text-white' : 'text-zinc-500 hover:bg-white/5'}`}>{m}</button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => handleSend()} className="p-3 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 shadow-md"><Send size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverLetterBuilder;