
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
  Palette
} from 'lucide-react';
import { Message, ChatSession, Theme, StylePrefs } from '../types';
import { geminiService } from '../services/gemini';
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
}

const CoverLetterBuilder: React.FC<CoverLetterBuilderProps> = ({ 
  onToggleMobile, theme, sessions, activeSessionId, updateSession, setSessions 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);

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
        sections: [{
          properties: {},
          children: children,
        }],
      });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Cover_Letter_${activeSession.title.replace(/\s+/g, '_')}.docx`;
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
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>Cover Letter Preview</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowPreview(false)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${theme === 'dark' ? 'bg-[#2a2a2a] text-white hover:bg-[#333]' : 'bg-slate-100 text-[#0F172A] hover:bg-slate-200'}`}><Undo size={14} /> Back</button>
            <div className="relative">
              <button onClick={() => setShowStyleMenu(!showStyleMenu)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${theme === 'dark' ? 'bg-[#2a2a2a] text-white hover:bg-[#333]' : 'bg-slate-100 text-[#0F172A] hover:bg-slate-200'}`}><Palette size={14} /> Style</button>
              {showStyleMenu && (
                <div className={`absolute right-0 mt-2 w-48 border rounded-xl shadow-2xl p-2 z-50 animate-in zoom-in-95 ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-200'}`}>
                   {[
                    { id: 'font-sans', label: 'Inter (Modern)' },
                    { id: 'font-serif', label: 'Garamond (Serif)' },
                    { id: 'font-mono', label: 'Roboto (Clean)' },
                    { id: 'font-arial', label: 'Arial (Standard)' },
                    { id: 'font-times', label: 'Times (Academic)' }
                  ].map(font => (
                    <button 
                      key={font.id}
                      onClick={() => { updatePrefs({ font: font.id as any }); setShowStyleMenu(false); }}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${stylePrefs.font === font.id ? 'bg-indigo-500 text-white' : 'hover:bg-slate-500/10'}`}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
      <header className={`p-4 md:p-6 border-b flex items-center justify-between transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <h2 className={`text-lg md:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>Cover Letter</h2>
            <p className={`text-[10px] md:text-xs opacity-50 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>Creating a persuasive pitch for your application.</p>
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
            {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />} Generate Cover Letter
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
