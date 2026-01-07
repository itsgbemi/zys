import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Loader2, 
  Undo,
  Sparkles,
  Mail,
  FileText as WordIcon,
  List as ListIcon,
  ChevronUp,
  Type as TypeIcon,
  Palette,
  Mic,
  Square,
  Menu,
  Volume2,
  StopCircle,
  ChevronDown,
  Zap,
  Cpu
} from 'lucide-react';
import { Message, ChatSession, Theme, StylePrefs, UserProfile } from '../types';
import { aiService, AIModel } from '../services/ai';
import { Document, Packer } from 'docx';
import { parseMarkdownToDocx } from '../utils/docx-export';
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
  const [isExporting, setIsExporting] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>('gemini-3-pro');
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const stylePrefs: StylePrefs = activeSession.stylePrefs || {
    font: 'font-sans',
    headingColor: 'text-black',
    listStyle: 'disc'
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession.messages, isTyping]);

  useEffect(() => {
    if (activeSession.finalResume) setShowPreview(true);
    else setShowPreview(false);
  }, [activeSessionId]);

  const handleSend = async (audioData?: string) => {
    if (!inputValue.trim() && !audioData && !isTyping) return;
    
    const contentText = audioData ? (inputValue.trim() ? `${inputValue} [Voice Message]` : "[Voice Message]") : inputValue;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: contentText, timestamp: Date.now() };
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
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { 
          ...s, 
          messages: s.messages.map(m => m.id === assistantId ? { ...m, content: assistantResponse } : m) 
        } : s));
      }
    } catch (e) {
      updateSession(activeSessionId, { messages: [...newMessages, { id: 'error', role: 'assistant', content: "An error occurred.", timestamp: Date.now() }] });
    } finally { setIsTyping(false); }
  };

  const updatePrefs = (newPrefs: Partial<StylePrefs>) => {
    updateSession(activeSessionId, { stylePrefs: { ...stylePrefs, ...newPrefs } as any });
  };

  const exportPDF = () => {
    setIsExporting(true);
    const element = document.querySelector('.printable-area');
    const opt = { 
      margin: 20, 
      filename: `Cover_Letter_${activeSession.title.replace(/\s+/g, '_')}.pdf`, 
      html2canvas: { scale: 2 }, 
      jsPDF: { unit: 'mm', format: 'a4' } 
    };
    // @ts-ignore
    html2pdf().set(opt).from(element).save().then(() => setIsExporting(false));
  };

  const exportDOCX = async () => {
    if (!activeSession.finalResume) return;
    setIsExporting(true);
    try {
      const children = parseMarkdownToDocx(activeSession.finalResume);
      const doc = new Document({
        sections: [{ properties: {}, children: children }],
      });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Cover_Letter_${activeSession.title.replace(/\s+/g, '_')}.docx`;
      link.click();
    } catch (e) { console.error(e); } finally { setIsExporting(false); }
  };

  const models = [
    { id: 'gemini-3-pro', label: 'Gemini 3 Pro', icon: <Zap size={14}/> },
    { id: 'gemini-3-flash', label: 'Gemini 3 Flash', icon: <Zap size={14}/> },
    { id: 'deepseek-v3', label: 'DeepSeek V3', icon: <Cpu size={14}/> },
    { id: 'deepseek-r1', label: 'DeepSeek R1', icon: <Cpu size={14}/> }
  ];

  if (showPreview && activeSession.finalResume) {
    return (
      <div className="flex flex-col h-full animate-in fade-in duration-500 relative">
        <header className={`flex items-center justify-between p-4 md:p-6 border-b sticky top-0 z-10 no-print transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
          <div className="flex items-center gap-2">
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>Cover Letter Preview</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowPreview(false)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${theme === 'dark' ? 'bg-[#2a2a2a] text-white hover:bg-[#333]' : 'bg-slate-100 text-[#0F172A] hover:bg-slate-200'}`}><Undo size={14} /> Back</button>
            <button onClick={exportDOCX} disabled={isExporting} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${theme === 'dark' ? 'bg-[#2a2a2a] text-white hover:bg-[#333]' : 'bg-slate-100 text-[#0F172A] hover:bg-slate-200'}`}><WordIcon size={14} /> Word</button>
            <button onClick={exportPDF} disabled={isExporting} className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-bold text-xs md:text-sm hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20">Save PDF</button>
          </div>
        </header>
        <div className={`flex-1 overflow-y-auto p-4 md:p-8 pb-32 transition-colors ${theme === 'dark' ? 'bg-[#121212]' : 'bg-slate-50'}`}>
          <div className="printable-area max-w-4xl mx-auto bg-white text-black p-12 md:p-16 shadow-2xl rounded-sm min-h-[1050px] border border-slate-200">
            <MarkdownLite text={activeSession.finalResume} dark={true} prefs={stylePrefs} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      <header className={`p-4 md:p-6 border-b flex items-center justify-between transition-colors sticky top-0 z-10 ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden p-2 -ml-2 text-indigo-500 transition-colors">
            <Menu size={24} />
          </button>
          <div className="flex flex-col">
            <h2 className={`text-lg md:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>Cover Letter</h2>
          </div>
        </div>
        {activeSession.jobDescription && (
          <button onClick={async () => {
            setIsTyping(true);
            try {
              const combinedData = `User Background: ${activeSession.resumeText || ''}\nChat context: ${activeSession.messages.map(m => m.content).join('\n')}`;
              const result = await aiService.sculpt(selectedModel, `Act as a Hiring Manager. Sculpt a persuasive cover letter for: ${activeSession.jobDescription}. Using this data: ${combinedData}`);
              updateSession(activeSessionId, { finalResume: result });
              setShowPreview(true);
            } catch (err) { console.error(err); } finally { setIsTyping(false); }
          }} disabled={isTyping} className="flex items-center gap-2 px-3 md:px-4 py-2 bg-indigo-500 text-white rounded-full font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 text-xs md:text-sm">
            {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} <span className="hidden sm:inline">Generate Cover Letter</span><span className="sm:hidden">Generate</span>
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
        <div className="flex justify-start">
           <div className={`max-w-full text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
              <p className="opacity-70 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1918f0]">Zysculpt AI</p>
              <MarkdownLite text="Hello! I'm your Cover Letter Specialist. A great cover letter tells a story. What's the one thing you want the hiring manager to know about your passion for this role?" theme={theme} />
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
              <Loader2 className="animate-spin text-indigo-500" size={16} />
              <span className="text-[10px] font-bold opacity-40 tracking-widest uppercase">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={`p-4 md:p-6 border-t transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
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
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Tell me more..."
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

            <button onClick={() => handleSend()} disabled={!inputValue.trim() || isTyping} className="p-3 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 shadow-md">
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverLetterBuilder;