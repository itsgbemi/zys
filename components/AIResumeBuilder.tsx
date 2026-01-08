import React, { useState, useRef, useEffect } from 'react';
import { 
  Loader2, 
  Undo,
  Sparkles,
  Download,
  Paperclip,
  FileText,
  Palette,
  Layout,
  Maximize2,
  Copy,
  Check
} from 'lucide-react';
import { Message, ChatSession, Theme, StylePrefs, UserProfile } from '../types';
import { aiService } from '../services/ai';
import { Document, Packer } from 'docx';
import { parseMarkdownToDocx } from '../utils/docx-export';
import { CustomHamburger, CustomArrowUp } from './Sidebar';

interface AIResumeBuilderProps {
  onToggleMobile?: () => void;
  theme: Theme;
  sessions: ChatSession[];
  activeSessionId: string;
  updateSession: (id: string, updates: Partial<ChatSession>) => void;
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  userProfile?: UserProfile;
}

export const MarkdownLite: React.FC<{ text: string; dark?: boolean; theme?: Theme; prefs?: StylePrefs }> = ({ text, dark = false, theme = 'dark', prefs }) => {
  const lines = text.split('\n');
  const fontClass = prefs?.font || 'font-inter';
  const template = prefs?.template || 'modern';
  
  const formatText = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const containerClasses = `space-y-1 ${fontClass} ${dark ? 'text-black' : theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'} ${
    template === 'classic' ? 'leading-relaxed' : template === 'minimal' ? 'leading-tight' : 'leading-normal'
  }`;

  return (
    <div className={containerClasses}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed === '') return <div key={i} className="h-2" />;
        
        if (trimmed.startsWith('### ')) return <h3 key={i} className="text-base font-bold mt-4 mb-2">{formatText(trimmed.slice(4))}</h3>;
        if (trimmed.startsWith('## ')) return <h2 key={i} className="text-lg font-bold mt-6 mb-3 border-b pb-1 border-current opacity-20">{formatText(trimmed.slice(3))}</h2>;
        if (trimmed.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mt-2 mb-4 border-b-2 pb-2 uppercase tracking-tight border-current opacity-80 text-center">{formatText(trimmed.slice(2))}</h1>;
        
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 ml-4">
              <span className="opacity-50 flex-shrink-0">•</span>
              <span className="flex-1">{formatText(trimmed.slice(2))}</span>
            </div>
          );
        }
        return <p key={i} className="leading-relaxed mb-1">{formatText(line)}</p>;
      })}
    </div>
  );
};

const AIResumeBuilder: React.FC<AIResumeBuilderProps> = ({ 
  onToggleMobile, theme, sessions, activeSessionId, updateSession, setSessions, userProfile 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSculpting, setIsSculpting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const stylePrefs: StylePrefs = activeSession.stylePrefs || {
    font: 'font-inter',
    headingColor: 'text-black',
    listStyle: 'disc',
    template: 'modern'
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession.messages, isTyping, isSculpting]);

  useEffect(() => {
    if (activeSession.finalResume) setShowPreview(true);
    else setShowPreview(false);
  }, [activeSessionId]);

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

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || inputValue;
    if (!textToSend.trim() && !isTyping) return;
    setErrorMessage(null);
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: textToSend, timestamp: Date.now() };
    const newMessages = [...activeSession.messages, userMessage];
    updateSession(activeSessionId, { messages: newMessages });
    setInputValue('');
    setIsTyping(true);

    try {
      const context: any = { 
        jobDescription: activeSession.jobDescription, 
        resumeText: activeSession.resumeText || userProfile?.baseResumeText, 
        type: activeSession.type,
        userProfile
      };
      
      let assistantResponse = '';
      const assistantId = (Date.now() + 1).toString();
      updateSession(activeSessionId, { messages: [...newMessages, { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() }] });

      const stream = aiService.generateStream(newMessages, "", context);

      for await (const chunk of stream) {
        assistantResponse += chunk;
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { 
          ...s, 
          messages: s.messages.map(m => m.id === assistantId ? { ...m, content: assistantResponse } : m) 
        } : s));
      }
    } catch (e: any) {
      setErrorMessage("AI is currently unavailable.");
    } finally { setIsTyping(false); }
  };

  const handleSculpt = async () => {
    setErrorMessage(null);
    setIsSculpting(true);
    try {
      const combinedData = `User Profile Info:
Name: ${userProfile?.fullName}
Title: ${userProfile?.title}
Email: ${userProfile?.email}
Phone: ${userProfile?.phone}
Location: ${userProfile?.location}
LinkedIn: ${userProfile?.linkedIn}
GitHub: ${userProfile?.github || 'N/A'}
Portfolio: ${userProfile?.portfolio || 'N/A'}

Experience/Base Material: ${activeSession.resumeText || userProfile?.baseResumeText || ''}

Chat Context/Instructions: ${activeSession.messages.map(m => m.content).join('\n')}`;

      const typeLabel = activeSession.type.replace('-', ' ').toUpperCase();
      const prompt = `Act as a senior Recruiter. Sculpt a final, world-class ${typeLabel} in Markdown format based on this data: ${combinedData}. 

CRITICAL INSTRUCTIONS:
1. USE the real personal information provided above (Name, Phone, Location, etc.).
2. DO NOT use generic placeholders like "[Your Name]", "[City, State]", or "[Phone Number]".
3. Ensure absolute ATS compatibility with keywords and quantifiable achievements.
4. Return ONLY markdown content.`;
      
      const result = await aiService.sculpt(prompt);
      updateSession(activeSessionId, { finalResume: result });
      setShowPreview(true);
    } catch (err: any) { 
      setErrorMessage("Sculpting failed.");
    } finally { setIsSculpting(false); }
  };

  const handleCopy = () => {
    if (!activeSession.finalResume) return;
    navigator.clipboard.writeText(activeSession.finalResume);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updatePrefs = (newPrefs: Partial<StylePrefs>) => {
    updateSession(activeSessionId, { stylePrefs: { ...stylePrefs, ...newPrefs } as any });
  };

  const exportPDF = () => {
    setIsExporting(true);
    const element = document.querySelector('.printable-area');
    const opt = { 
      margin: 10, 
      filename: `${activeSession.title.replace(/\s+/g, '_')}.pdf`, 
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
      link.download = `${activeSession.title.replace(/\s+/g, '_')}.docx`;
      link.click();
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const getSubTitle = () => {
    switch(activeSession.type) {
      case 'resume': return "Architecting ATS-proof profiles for top-tier roles.";
      case 'cover-letter': return "Crafting persuasive narratives that catch a human eye.";
      case 'resignation-letter': return "Graceful exits for professional career transitions.";
      default: return "Zysculpt AI dedicated mentor.";
    }
  };

  const getGuidePrompts = () => {
    switch(activeSession.type) {
      case 'resume': return ["Add recent role", "Optimize for ATS", "Include skills list", "Improve phrasing"];
      case 'cover-letter': return ["Highlight leadership", "Mention values fit", "Focus on results", "Shorten letter"];
      default: return ["Help me plan", "Draft notice", "Career advice"];
    }
  };

  if (showPreview && activeSession.finalResume) {
    return (
      <div className="flex flex-col h-full animate-in fade-in duration-500 relative">
        <header className={`flex flex-wrap items-center justify-between gap-3 p-4 md:p-6 border-b sticky top-0 z-10 no-print transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowPreview(false)} className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-[#0F172A]'}`}><Undo size={20} /></button>
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>Preview</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowStyleMenu(!showStyleMenu)} title="Style" className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-bold transition-all ${theme === 'dark' ? 'bg-[#2a2a2a] text-white hover:bg-white/10' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}>
                <Palette size={16} /> <span className="hidden sm:inline">Style</span>
              </button>
              {showStyleMenu && (
                <div className={`absolute right-0 mt-2 w-48 border rounded-xl shadow-2xl p-2 z-50 animate-in zoom-in-95 ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-200'}`}>
                  {[{ id: 'font-inter', label: 'Inter' }, { id: 'font-eb-garamond', label: 'Garamond' }, { id: 'font-roboto', label: 'Roboto' }, { id: 'font-arial', label: 'Arial' }].map(font => (
                    <button key={font.id} onClick={() => { updatePrefs({ font: font.id as any }); setShowStyleMenu(false); }} className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${stylePrefs.font === font.id ? 'bg-[#1918f0] text-white' : 'hover:bg-slate-500/10'}`}>{font.label}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button onClick={() => setShowTemplateMenu(!showTemplateMenu)} title="Template" className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-bold transition-all ${theme === 'dark' ? 'bg-[#2a2a2a] text-white hover:bg-white/10' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}>
                <Layout size={16} /> <span className="hidden sm:inline">Template</span>
              </button>
              {showTemplateMenu && (
                <div className={`absolute right-0 mt-2 w-48 border rounded-xl shadow-2xl p-2 z-50 animate-in zoom-in-95 ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-200'}`}>
                  {[{ id: 'modern', label: 'Modern' }, { id: 'classic', label: 'Classic' }, { id: 'minimal', label: 'Minimal' }].map(tmpl => (
                    <button key={tmpl.id} onClick={() => { updatePrefs({ template: tmpl.id as any }); setShowTemplateMenu(false); }} className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${stylePrefs.template === tmpl.id ? 'bg-[#1918f0] text-white' : 'hover:bg-slate-500/10'}`}>{tmpl.label}</button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={exportDOCX} disabled={isExporting} title="Download DOCX" className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-bold transition-all ${theme === 'dark' ? 'bg-[#2a2a2a] text-white hover:bg-white/10' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}>
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />} <span className="hidden sm:inline">Word</span>
            </button>
            <button onClick={exportPDF} disabled={isExporting} className="px-5 py-2.5 bg-[#1918f0] text-white rounded-xl font-bold text-xs shadow-lg shadow-[#1918f0]/20 whitespace-nowrap">
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : 'Export PDF'}
            </button>
          </div>
        </header>
        <div className={`flex-1 overflow-y-auto p-4 md:p-12 transition-colors ${theme === 'dark' ? 'bg-[#121212]' : 'bg-slate-50'}`}>
          <div className="printable-area max-w-4xl mx-auto bg-white text-black p-12 md:p-20 shadow-2xl rounded-sm border border-slate-200 overflow-x-auto">
            <MarkdownLite text={activeSession.finalResume} dark={true} prefs={stylePrefs} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative font-['Inter',_sans-serif]">
      <header className={`p-4 md:p-6 border-b flex items-center justify-between sticky top-0 z-20 transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden p-2 -ml-2 transition-colors">
            <CustomHamburger theme={theme} />
          </button>
          <div className="flex flex-col">
            <h2 className={`text-lg md:text-xl font-extrabold capitalize leading-tight ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>{activeSession.type.replace('-', ' ')} Builder</h2>
            <p className={`text-[10px] md:text-xs font-medium opacity-50 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>{getSubTitle()}</p>
          </div>
        </div>
        <button onClick={handleSculpt} disabled={isSculpting || isTyping} className="flex items-center gap-2 px-5 py-2.5 bg-[#1918f0] text-white rounded-2xl font-black hover:bg-[#0a09d0] transition-all shadow-xl text-xs md:text-sm">
          {isSculpting || isTyping ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Sculpt
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {activeSession.messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto pb-12 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-[#1918f0]/10 text-[#1918f0] rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-[#1918f0]/10">
              <Sparkles size={32} />
            </div>
            <h3 className={`text-2xl font-black mb-3 ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>Let's Architect Your Future</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">Tell me about the role you're targeting or upload your current background to get started with ATS-optimized sculpting.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {getGuidePrompts().map(prompt => (
                <button key={prompt} onClick={() => handleSend(prompt)} className={`px-4 py-2 rounded-full border text-xs font-bold transition-all ${theme === 'dark' ? 'border-white/5 bg-white/5 text-white hover:bg-white/10' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-[#1918f0]'}`}>{prompt}</button>
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
        
        {activeSession.finalResume && (
          <div className="flex justify-start animate-in slide-in-from-left-4 duration-500">
            <div className={`w-full max-w-sm rounded-[32px] border overflow-hidden shadow-2xl group transition-all ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-200'}`}>
              <div className={`p-5 flex items-center justify-between border-b ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#1918f0] text-white rounded-xl"><FileText size={20}/></div>
                  <div>
                    <h4 className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>Sculpted {activeSession.type.replace('-', ' ')}</h4>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Ready for export</p>
                  </div>
                </div>
                <button onClick={() => setShowPreview(true)} className={`p-2 rounded-lg transition-all ${theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-200 text-[#0F172A]'}`}><Maximize2 size={18}/></button>
              </div>
              <div className="p-4 grid grid-cols-3 gap-2">
                <button onClick={handleCopy} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${theme === 'dark' ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'}`}>
                   {copied ? <Check size={16} className="text-emerald-500"/> : <Copy size={16} className="text-slate-400"/>}
                   <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button onClick={exportDOCX} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${theme === 'dark' ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'}`}>
                   <FileText size={16} className="text-[#1918f0]"/>
                   <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">DOCX</span>
                </button>
                <button onClick={exportPDF} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${theme === 'dark' ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'}`}>
                   <Download size={16} className="text-emerald-500"/>
                   <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">PDF</span>
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

      <div className={`p-4 md:p-8 border-t transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
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
                className="p-2.5 bg-[#1918f0] text-white rounded-full hover:bg-[#0e0da8] transition-all flex-shrink-0 disabled:opacity-30 active:scale-90"
              >
                {isTyping ? <Loader2 size={16} className="animate-spin" /> : <CustomArrowUp />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIResumeBuilder;