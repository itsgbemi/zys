
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Upload, 
  Paperclip, 
  Loader2, 
  CheckCircle2, 
  FileDown, 
  Undo,
  Menu,
  FileText,
  Sparkles
} from 'lucide-react';
import { Message, ChatSession, Theme } from '../types';
import { geminiService } from '../services/gemini';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

interface AIResumeBuilderProps {
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
    // Regex to capture Bold (**text**), Italic (*text*), and Links ([text](url))
    const parts = content.split(/(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/g);
    return parts.map((part, i) => {
      if (!part) return null;
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('[') && part.includes('](')) {
        const match = part.match(/\[(.*?)\]\((.*?)\)/);
        if (match) {
          return (
            <a 
              key={i} 
              href={match[2]} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`${dark ? 'text-indigo-600 underline' : 'text-indigo-400 hover:text-indigo-300 underline'}`}
            >
              {match[1]}
            </a>
          );
        }
      }
      return part;
    });
  };

  return (
    <div className={`space-y-1 ${dark ? 'text-black font-serif' : theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed === '') return <div key={i} className="h-2" />;
        if (trimmed.startsWith('### ')) return <h3 key={i} className="text-base font-bold mt-3 mb-1">{formatText(trimmed.slice(4))}</h3>;
        if (trimmed.startsWith('## ')) return <h2 key={i} className="text-lg font-bold mt-4 mb-2">{formatText(trimmed.slice(3))}</h2>;
        if (trimmed.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mt-5 mb-3 border-b border-current pb-1">{formatText(trimmed.slice(2))}</h1>;
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 ml-4">
              <span className="opacity-50">•</span>
              <span>{formatText(trimmed.slice(2))}</span>
            </div>
          );
        }
        return <p key={i} className="leading-relaxed">{formatText(line)}</p>;
      })}
    </div>
  );
};

const AIResumeBuilder: React.FC<AIResumeBuilderProps> = ({ 
  onToggleMobile, theme, sessions, activeSessionId, updateSession, setSessions 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    if (!activeSession.jobDescription && inputValue.length > 50) {
      updateSession(activeSessionId, { 
        jobDescription: inputValue, 
        title: inputValue.slice(0, 30) + (inputValue.length > 30 ? '...' : '') 
      });
    }

    try {
      const responseStream = await geminiService.generateChatResponse(
        newMessages, 
        inputValue, 
        { jobDescription: activeSession.jobDescription, resumeText: activeSession.resumeText }
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
        messages: [...newMessages, { id: 'error', role: 'assistant', content: "An error occurred with the AI architect.", timestamp: Date.now() }] 
      });
    } finally { setIsTyping(false); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        updateSession(activeSessionId, { 
          resumeText: text.slice(0, 2000),
          messages: [...activeSession.messages, { 
            id: Date.now().toString(), 
            role: 'user', 
            content: `I've uploaded my current resume: ${file.name}`, 
            timestamp: Date.now() 
          }, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Received "${file.name}". I'll use this foundation to tailor your sculpt for the job description.`,
            timestamp: Date.now()
          }]
        });
      };
      reader.readAsText(file);
    }
  };

  const generateFinalResume = async () => {
    setIsTyping(true);
    try {
      const combinedData = `Previous resume: ${activeSession.resumeText || ''}\nChat Context: ${activeSession.messages.map(m => m.content).join('\n')}`;
      const result = await geminiService.sculptResume(activeSession.jobDescription || 'Professional Resume', combinedData);
      updateSession(activeSessionId, { finalResume: result });
      setShowPreview(true);
    } catch (err) { console.error(err); } finally { setIsTyping(false); }
  };

  const exportPDF = () => {
    setIsExporting(true);
    const element = document.querySelector('.printable-area');
    const opt = { 
      margin: 10, 
      filename: `Zysculpt_${activeSession.title}.pdf`, 
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
      const children: any[] = [];
      activeSession.finalResume.split('\n').forEach(l => {
        children.push(new Paragraph({ children: [new TextRun(l)] }));
      });
      const doc = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `${activeSession.title}.docx`; link.click();
    } catch (e) { console.error(e); } finally { setIsExporting(false); }
  };

  if (showPreview && activeSession.finalResume) {
    return (
      <div className="flex flex-col h-full animate-in fade-in duration-500">
        <header className={`flex items-center justify-between p-4 md:p-6 border-b sticky top-0 z-10 no-print transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
          <div className="flex items-center gap-3">
            <button onClick={onToggleMobile} className="md:hidden"><Menu size={24} className={theme === 'dark' ? 'text-white' : 'text-[#0F172A]'} /></button>
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>Resume Preview</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowPreview(false)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${theme === 'dark' ? 'bg-[#2a2a2a] text-white hover:bg-[#333]' : 'bg-slate-100 text-[#0F172A] hover:bg-slate-200'}`}><Undo size={14} /> Back</button>
            <button onClick={exportDOCX} disabled={isExporting} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${theme === 'dark' ? 'bg-[#2a2a2a] text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-800'}`}>DOCX</button>
            <button onClick={exportPDF} disabled={isExporting} className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-bold text-xs md:text-sm hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20">DOWNLOAD PDF</button>
          </div>
        </header>
        <div className={`flex-1 overflow-y-auto p-4 md:p-8 transition-colors ${theme === 'dark' ? 'bg-[#121212]' : 'bg-slate-50'}`}>
          <div className="printable-area max-w-4xl mx-auto bg-white text-black p-8 md:p-12 shadow-2xl rounded-sm min-h-[1100px] border border-slate-200">
            <MarkdownLite text={activeSession.finalResume} dark={true} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      <header className={`p-4 md:p-6 border-b flex items-center justify-between transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden">
            <Menu size={24} className={theme === 'dark' ? 'text-white' : 'text-[#0F172A]'} />
          </button>
          <div>
            <h2 className={`text-lg md:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>AI Resume Builder</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className={`text-[10px] md:text-xs ${theme === 'dark' ? 'text-[#a0a0a0]' : 'text-slate-500'}`}>Sculpting Mode Active</span>
            </div>
          </div>
        </div>
        
        {activeSession.jobDescription && (
          <button onClick={generateFinalResume} disabled={isTyping} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-full font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 text-xs md:text-sm">
            {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Sculpt Resume
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {activeSession.messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm border ${
              m.role === 'user' 
                ? theme === 'dark' ? 'bg-[#121212] text-white border-[#333]' : 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20' 
                : theme === 'dark' ? 'bg-[#2a2a2a] text-white border-[#444]' : 'bg-white text-[#0F172A] border-[#e2e8f0]'
            }`}>
              <div className="text-sm leading-relaxed"><MarkdownLite text={m.content} theme={theme} /></div>
              <div className={`text-[9px] mt-2 opacity-30 text-right ${m.role === 'user' && theme === 'light' ? 'text-white' : ''}`}>
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
            placeholder="Paste JD or answer..."
            className={`w-full border rounded-2xl p-4 pr-32 min-h-[60px] max-h-[200px] transition-all resize-none text-sm md:text-base outline-none ${
              theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a] text-white focus:border-white' : 'bg-slate-50 border-[#e2e8f0] text-[#0F172A] focus:border-indigo-400'
            }`}
            rows={1}
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.txt" />
            <button onClick={() => fileInputRef.current?.click()} className={`p-2 transition-colors ${theme === 'dark' ? 'text-[#555] hover:text-white' : 'text-slate-400 hover:text-slate-600'}`} title="Upload Resume"><Paperclip size={18} /></button>
            <button onClick={handleSend} disabled={!inputValue.trim() || isTyping} className="p-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors shadow-md disabled:opacity-30"><Send size={18} /></button>
          </div>
        </div>
        <p className={`text-center text-[8px] md:text-[10px] mt-3 uppercase tracking-widest ${theme === 'dark' ? 'text-[#555]' : 'text-slate-400'}`}>
          Zysculpt Architect • Powered by Gemini 3 Flash
        </p>
      </div>
    </div>
  );
};

export default AIResumeBuilder;
