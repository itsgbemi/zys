import React, { useState, useRef, useEffect } from 'react';
import { 
  Loader2, 
  Undo,
  Sparkles,
  Paperclip,
  Maximize2,
  Copy,
  Download,
  Check,
  DoorOpen
} from 'lucide-react';
import { Message, ChatSession, Theme, UserProfile } from '../types';
import { aiService } from '../services/ai';
import { MarkdownLite } from './AIResumeBuilder';
import { CustomHamburger, CustomArrowUp } from './Sidebar';

interface ResignationLetterBuilderProps {
  onToggleMobile?: () => void;
  theme: Theme;
  sessions: ChatSession[];
  activeSessionId: string;
  updateSession: (id: string, updates: Partial<ChatSession>) => void;
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  userProfile?: UserProfile;
}

const ResignationLetterBuilder: React.FC<ResignationLetterBuilderProps> = ({ 
  onToggleMobile, theme, sessions, activeSessionId, updateSession, setSessions, userProfile
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

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
      const stream = aiService.generateStream(newMessages, "", { type: 'resignation-letter', userProfile });
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: s.messages.map(m => m.id === assistantId ? { ...m, content: fullText } : m) } : s));
      }
    } catch (e) { setIsTyping(false); } finally { setIsTyping(false); }
  };

  const handleSculpt = async () => {
    setIsTyping(true);
    try {
      const combinedData = `User: ${userProfile?.fullName}\nPhone: ${userProfile?.phone}\nEmail: ${userProfile?.email}\nContext: ${activeSession.messages.map(m => m.content).join('\n')}`;
      const result = await aiService.sculpt(`Draft resignation letter: ${combinedData}. CRITICAL: Use the real personal information provided to fill headers. DO NOT use generic placeholders like [Your Name].`);
      updateSession(activeSessionId, { finalResume: result });
      setShowPreview(true);
    } catch (err) {} finally { setIsTyping(false); }
  };

  return (
    <div className="flex flex-col h-full relative font-['Inter',_sans-serif]">
      <header className={`p-4 md:p-6 border-b flex items-center justify-between sticky top-0 z-10 transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden p-2 -ml-2 transition-colors">
            <CustomHamburger theme={theme} />
          </button>
          <div className="flex flex-col">
            <h2 className={`text-lg md:text-xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>Resignation</h2>
            <p className="text-[10px] md:text-xs font-medium opacity-50">Graceful exits for professional career transitions.</p>
          </div>
        </div>
        {activeSession.messages.length > 0 && (
          <button onClick={handleSculpt} disabled={isTyping} className="px-4 py-2 bg-[#1918f0] text-white rounded-full font-bold shadow-lg text-xs">
            {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Generate
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="flex justify-start">
           <div className="max-w-full text-sm leading-relaxed bg-transparent border-0 shadow-none">
              <MarkdownLite text="Hi there. I'll help you write a graceful resignation. When is your last day?" theme={theme} />
           </div>
        </div>
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
        
        {activeSession.finalResume && (
          <div className="flex justify-start">
            <div className={`w-full max-w-sm rounded-[32px] border overflow-hidden shadow-2xl group transition-all ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-200'}`}>
              <div className={`p-5 flex items-center justify-between border-b ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#1918f0] text-white rounded-xl"><DoorOpen size={20}/></div>
                  <div>
                    <h4 className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>Resignation Notice</h4>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Ready to Send</p>
                  </div>
                </div>
                <button onClick={() => setShowPreview(true)} className={`p-2 rounded-lg transition-all ${theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-200 text-[#0F172A]'}`}><Maximize2 size={18}/></button>
              </div>
              <div className="p-4 grid grid-cols-2 gap-2">
                <button onClick={() => { navigator.clipboard.writeText(activeSession.finalResume!); setCopied(true); setTimeout(()=>setCopied(false),2000); }} className={`flex items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${theme === 'dark' ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'}`}>
                   {copied ? <Check size={14} className="text-emerald-500"/> : <Copy size={14}/>}
                   <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button onClick={() => setShowPreview(true)} className={`flex items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${theme === 'dark' ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'}`}>
                   <Download size={14} className="text-emerald-500"/>
                   <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Export</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {isTyping && (
          <div className="flex justify-start items-center gap-2 opacity-40">
            <Loader2 className="animate-spin text-[#1918f0]" size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Processing</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={`p-4 md:p-6 border-t ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="max-w-4xl mx-auto">
          <div className={`flex flex-col border rounded-[32px] p-4 transition-all ${
             theme === 'dark' ? 'bg-[#121212] border-white/10' : 'bg-slate-50 border-slate-200 shadow-sm'
           }`}>
            <textarea 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)} 
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} 
              placeholder="Message Zysculpt..." 
              className={`w-full bg-transparent border-none p-0 min-h-[48px] max-h-[200px] resize-none text-sm md:text-base outline-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`} 
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

export default ResignationLetterBuilder;