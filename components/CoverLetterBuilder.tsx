
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
  Type as TypeIcon
} from 'lucide-react';
import { Message, ChatSession, Theme, StylePrefs } from '../types';
import { geminiService } from '../services/gemini';
import { Document, Packer, Paragraph, TextRun } from 'docx';

interface CoverLetterBuilderProps {
  onToggleMobile?: () => void;
  theme: Theme;
  sessions: ChatSession[];
  activeSessionId: string;
  updateSession: (id: string, updates: Partial<ChatSession>) => void;
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
}

const MarkdownLite: React.FC<{ text: string; dark?: boolean; theme?: Theme; prefs?: StylePrefs }> = ({ text, dark = false, theme = 'dark', prefs }) => {
  const lines = text.split('\n');
  const fontClass = prefs?.font || 'font-sans';
  const listStyle = prefs?.listStyle || 'disc';
  
  const formatText = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const getListBullet = () => {
    if (listStyle === 'circle') return '○';
    if (listStyle === 'square') return '■';
    return '•';
  };

  return (
    <div className={`space-y-1 ${fontClass} ${dark ? 'text-black' : theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed === '') return <div key={i} className="h-2" />;
        if (trimmed.startsWith('### ')) return <h3 key={i} className="text-base font-bold mt-4 mb-2">{formatText(trimmed.slice(4))}</h3>;
        if (trimmed.startsWith('## ')) return <h2 key={i} className="text-lg font-bold mt-6 mb-3 border-b pb-1 border-current opacity-20">{formatText(trimmed.slice(3))}</h2>;
        if (trimmed.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mt-8 mb-4 border-b-2 pb-2 uppercase tracking-tight border-current opacity-80">{formatText(trimmed.slice(2))}</h1>;
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 ml-4">
              <span className="opacity-50">{getListBullet()}</span>
              <span className="flex-1">{formatText(trimmed.slice(2))}</span>
            </div>
          );
        }
        return <p key={i} className="leading-relaxed mb-2">{formatText(line)}</p>;
      })}
    </div>
  );
};

const CoverLetterBuilder: React.FC<CoverLetterBuilderProps> = ({ 
  onToggleMobile, theme, sessions, activeSessionId, updateSession, setSessions 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeStylePopover, setActiveStylePopover] = useState<'font' | 'list' | null>(null);

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
        { jobDescription: activeSession.jobDescription, resumeText: activeSession.resumeText, type: 'cover-letter' }
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
      updateSession(activeSessionId, { messages: [...newMessages, { id: 'error', role: 'assistant', content: "An error occurred.", timestamp: Date.now() }] });
    } finally { setIsTyping(false); }
  };

  const updatePrefs = (newPrefs: Partial<StylePrefs>) => {
    updateSession(activeSessionId, { stylePrefs: { ...stylePrefs, ...newPrefs } });
  };

  const exportPDF = () => {
    setIsExporting(true);
    const element = document.querySelector('.printable-area');
    const opt = { 
      margin: 20, 
      filename: `CoverLetter_${activeSession.title}.pdf`, 
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
      const paragraphs = activeSession.finalResume.split('\n').map(line => {
        return new Paragraph({
          children: [new TextRun(line)],
          spacing: { after: 120 }
        });
      });
      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs,
        }],
      });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CoverLetter_${activeSession.title}.docx`;
      link.click();
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  if (showPreview && activeSession.finalResume) {
    return (
      <div className="flex flex-col h-full animate-in fade-in duration-500 relative">
        <header className={`flex items-center justify-between p-4 md:p-6 border-b sticky top-0 z-10 no-print transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
          <div className="flex items-center gap-2">
            <button onClick={onToggleMobile} className="md:hidden">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}>
                <path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>Cover Letter Preview</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowPreview(false)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${theme === 'dark' ? 'bg-[#2a2a2a] text-white hover:bg-[#333]' : 'bg-slate-100 text-[#0F172A] hover:bg-slate-200'}`}><Undo size={14} /> Back</button>
            <button onClick={exportDOCX} disabled={isExporting} className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${theme === 'dark' ? 'bg-[#2a2a2a] text-white hover:bg-[#333]' : 'bg-slate-100 text-[#0F172A] hover:bg-slate-200'}`}><WordIcon size={14} /> Word</button>
            <button onClick={exportPDF} disabled={isExporting} className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-bold text-xs md:text-sm hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20">Save PDF</button>
          </div>
        </header>
        <div className={`flex-1 overflow-y-auto p-4 md:p-8 pb-32 transition-colors ${theme === 'dark' ? 'bg-[#121212]' : 'bg-slate-50'}`}>
          <div className="printable-area max-w-4xl mx-auto bg-white text-black p-12 md:p-16 shadow-2xl rounded-sm min-h-[1050px] border border-slate-200">
            <MarkdownLite text={activeSession.finalResume} dark={true} prefs={stylePrefs} />
          </div>
        </div>

        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 no-print z-20">
          <div className={`flex items-center gap-2 md:gap-4 p-2 rounded-2xl shadow-2xl border backdrop-blur-md ${theme === 'dark' ? 'bg-black/80 border-white/10 text-white' : 'bg-white/90 border-slate-300 text-slate-800'}`}>
             <div className="relative">
                <button onClick={() => setActiveStylePopover(activeStylePopover === 'font' ? null : 'font')} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${activeStylePopover === 'font' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-white/10'}`}>
                   <TypeIcon size={18} /><span className="hidden md:inline text-xs font-bold">Font</span><ChevronUp size={12} className={`transition-transform ${activeStylePopover === 'font' ? 'rotate-180' : ''}`} />
                </button>
                {activeStylePopover === 'font' && (
                  <div className={`absolute bottom-full left-0 mb-3 w-48 p-2 rounded-2xl shadow-2xl border ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-200'}`}>
                     {[{id:'font-sans',label:'Inter'},{id:'font-serif',label:'Garamond'},{id:'font-mono',label:'Roboto'},{id:'font-arial',label:'Arial'}].map(f=>(
                       <button key={f.id} onClick={()=>{updatePrefs({font:f.id});setActiveStylePopover(null)}} className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold ${stylePrefs.font===f.id?'bg-indigo-600 text-white':'hover:bg-slate-100 dark:hover:bg-white/10'}`}>{f.label}</button>
                     ))}
                  </div>
                )}
             </div>
             <div className="h-6 w-px bg-slate-200 dark:bg-white/10 mx-1" />
             <div className="relative">
                <button onClick={() => setActiveStylePopover(activeStylePopover === 'list' ? null : 'list')} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${activeStylePopover === 'list' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-white/10'}`}>
                   <ListIcon size={18} /><span className="hidden md:inline text-xs font-bold">Style</span><ChevronUp size={12} className={`transition-transform ${activeStylePopover === 'list' ? 'rotate-180' : ''}`} />
                </button>
                {activeStylePopover === 'list' && (
                  <div className={`absolute bottom-full left-0 mb-3 w-32 p-2 rounded-2xl shadow-2xl border ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-200'}`}>
                     {['disc','circle','square'].map(l=>(
                       <button key={l} onClick={()=>{updatePrefs({listStyle:l as any});setActiveStylePopover(null)}} className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold capitalize ${stylePrefs.listStyle===l?'bg-indigo-600 text-white':'hover:bg-slate-100 dark:hover:bg-white/10'}`}>{l}</button>
                     ))}
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      <header className={`p-4 md:p-6 border-b flex items-center justify-between transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-2">
          <button onClick={onToggleMobile} className="md:hidden">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}>
              <path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="flex flex-col">
            <h2 className={`text-lg md:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>Cover Letter</h2>
            <p className={`text-[10px] md:text-xs opacity-50 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>Drafting a persuasive pitch for your next big move.</p>
          </div>
        </div>
        {activeSession.jobDescription && (
          <button onClick={async () => {
            setIsTyping(true);
            try {
              const combinedData = `User Background: ${activeSession.resumeText || ''}\nChat context: ${activeSession.messages.map(m => m.content).join('\n')}`;
              const result = await geminiService.sculptCoverLetter(activeSession.jobDescription || 'Professional Opportunity', combinedData);
              updateSession(activeSessionId, { finalResume: result });
              setShowPreview(true);
            } catch (err) { console.error(err); } finally { setIsTyping(false); }
          }} disabled={isTyping} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-full font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 text-xs md:text-sm">
            {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />} Generate Letter
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {activeSession.messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm border ${
              m.role === 'user' 
                ? theme === 'dark' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-[#E0E7FF] text-slate-900 border-[#C7D2FE]' 
                : theme === 'dark' ? 'bg-[#2a2a2a] text-white border-[#444]' : 'bg-white text-slate-900 border-slate-200'
            }`}>
              <div className="text-sm leading-relaxed"><MarkdownLite text={m.content} theme={theme} /></div>
              <div className={`text-[9px] mt-2 opacity-30 text-right ${m.role === 'user' && theme === 'dark' ? 'text-white' : 'text-slate-600'}`}>
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
            placeholder="Tell me more or ask to generate the letter..."
            className={`w-full border rounded-2xl p-4 pr-16 min-h-[60px] max-h-[200px] transition-all resize-none text-sm md:text-base outline-none ${
              theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a] text-white focus:border-white' : 'bg-slate-50 border-[#e2e8f0] text-[#0F172A] focus:border-indigo-400'
            }`}
            rows={1}
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <button onClick={handleSend} disabled={!inputValue.trim() || isTyping} className="p-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors shadow-md disabled:opacity-30"><Send size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverLetterBuilder;
