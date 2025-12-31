
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Loader2, 
  Undo,
  Sparkles,
  FileText,
  List as ListIcon,
  ChevronUp,
  Type as TypeIcon,
  Plus,
  Palette,
  Mic,
  Square,
  Menu,
  AlertCircle
} from 'lucide-react';
import { Message, ChatSession, Theme, StylePrefs, UserProfile } from '../types';
import { geminiService } from '../services/gemini';
import { Document, Packer } from 'docx';
import { parseMarkdownToDocx } from '../utils/docx-export';

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
  const fontClass = prefs?.font || 'font-sans';
  const listStyle = prefs?.listStyle || 'disc';
  
  const formatText = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        return <a key={i} href={linkMatch[2]} className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">{linkMatch[1]}</a>;
      }
      return part;
    });
  };

  const getListBullet = () => {
    if (listStyle === 'circle') return '○';
    if (listStyle === 'square') return '■';
    if (listStyle === 'star') return '★';
    return '•';
  };

  return (
    <div className={`space-y-1 ${fontClass} ${dark ? 'text-black' : theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed === '') return <div key={i} className="h-2" />;
        
        if (trimmed.startsWith('### ')) return <h3 key={i} className="text-base font-bold mt-4 mb-2">{formatText(trimmed.slice(4))}</h3>;
        if (trimmed.startsWith('## ')) return <h2 key={i} className="text-lg font-bold mt-6 mb-3 border-b pb-1 border-current opacity-20">{formatText(trimmed.slice(3))}</h2>;
        if (trimmed.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mt-2 mb-4 border-b-2 pb-2 uppercase tracking-tight border-current opacity-80 text-center">{formatText(trimmed.slice(2))}</h1>;
        
        if (trimmed.startsWith('#### ')) {
           return <h4 key={i} className="text-sm font-bold mt-3 mb-1">{formatText(trimmed.slice(5))}</h4>;
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 ml-4">
              <span className="opacity-50 flex-shrink-0">{getListBullet()}</span>
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = (reader.result as string).split(',')[1];
          handleSend(base64Audio);
        };
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Please allow microphone access to record voice messages.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSend = async (audioData?: string) => {
    if (!inputValue.trim() && !audioData && !isTyping) return;
    
    setErrorMessage(null);
    const contentText = audioData ? (inputValue.trim() ? `${inputValue} [Voice Message]` : "[Voice Message]") : inputValue;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: contentText, timestamp: Date.now() };
    const newMessages = [...activeSession.messages, userMessage];
    updateSession(activeSessionId, { messages: newMessages });
    setInputValue('');
    setIsTyping(true);

    try {
      const context: any = { 
        jobDescription: activeSession.jobDescription, 
        resumeText: activeSession.resumeText || userProfile?.baseResumeText, 
        type: 'resume',
        userProfile
      };
      if (audioData) context.audioPart = { inlineData: { data: audioData, mimeType: 'audio/webm' } };

      const responseStream = await geminiService.generateChatResponse(newMessages.slice(0, -1), inputValue, context);
      
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
    } catch (e: any) {
      console.error("Gemini Chat Error:", e);
      let errorText = "The AI is currently unavailable. Check the console for more details.";
      if (e.message?.includes('API_KEY')) {
        errorText = "Missing or invalid Gemini API Key. Ensure VITE_API_KEY is correctly set in your Vercel/Environment settings.";
      }
      setErrorMessage(errorText);
      updateSession(activeSessionId, { 
        messages: [...newMessages, { id: 'error', role: 'assistant', content: errorText, timestamp: Date.now() }] 
      });
    } finally { setIsTyping(false); }
  };

  const handleSculpt = async () => {
    setErrorMessage(null);
    setIsSculpting(true);
    try {
      const combinedData = `Background: ${activeSession.resumeText || userProfile?.baseResumeText || ''}\nChat Context: ${activeSession.messages.map(m => m.content).join('\n')}`;
      const result = await geminiService.sculptResume(activeSession.jobDescription || 'Professional Resume', combinedData);
      updateSession(activeSessionId, { finalResume: result });
      setShowPreview(true);
    } catch (err: any) { 
      console.error("Gemini Sculpt Error:", err);
      let errorText = "Failed to sculpt resume. Check your API_KEY and billing status.";
      if (err.message?.includes('401') || err.message?.includes('API_KEY')) {
        errorText = "API Key Error: Your API_KEY is invalid or missing in Vercel. Did you prefix it with VITE_?";
      } else if (err.message?.includes('404')) {
        // @ts-ignore
        if (window.aistudio?.openSelectKey) {
           errorText = "Project/Entity not found. Re-selecting your API key may fix this.";
           // @ts-ignore
           window.aistudio.openSelectKey();
        }
      }
      setErrorMessage(errorText);
    } finally { setIsSculpting(false); }
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

  if (showPreview && activeSession.finalResume) {
    return (
      <div className="flex flex-col h-full animate-in fade-in duration-500 relative">
        <header className={`flex items-center justify-between p-4 md:p-6 border-b sticky top-0 z-10 no-print transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
          <div className="flex items-center gap-2">
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>Resume Preview</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowPreview(false)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${theme === 'dark' ? 'bg-[#2a2a2a] text-white hover:bg-[#333]' : 'bg-slate-100 text-[#0F172A] hover:bg-slate-200'}`}><Undo size={14} /> Back</button>
            <div className="relative">
              <button onClick={() => setShowStyleMenu(!showStyleMenu)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${theme === 'dark' ? 'bg-[#2a2a2a] text-white hover:bg-[#333]' : 'bg-slate-100 text-[#0F172A] hover:bg-slate-200'}`}><Palette size={14} /> Style</button>
              {showStyleMenu && (
                <div className={`absolute right-0 mt-2 w-48 border rounded-xl shadow-2xl p-2 z-50 animate-in zoom-in-95 ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-200'}`}>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 p-2">ATS Fonts</p>
                  {[
                    { id: 'font-sans', label: 'Inter (Modern)' },
                    { id: 'font-serif', label: 'Garamond (Serif)' },
                    { id: 'font-mono', label: 'Roboto (Clean)' },
                    { id: 'font-arial', label: 'Arial (Standard)' },
                    { id: 'font-times', label: 'Tinos (Academic)' }
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
            <button onClick={exportDOCX} disabled={isExporting} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${theme === 'dark' ? 'bg-[#2a2a2a] text-white hover:bg-[#333]' : 'bg-slate-100 text-[#0F172A] hover:bg-slate-200'}`}><FileText size={14} /> Word</button>
            <button onClick={exportPDF} disabled={isExporting} className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-bold text-xs md:text-sm hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20">Save PDF</button>
          </div>
        </header>
        <div className={`flex-1 overflow-y-auto p-4 md:p-8 pb-32 transition-colors ${theme === 'dark' ? 'bg-[#121212]' : 'bg-slate-50'}`}>
          <div className="printable-area max-w-4xl mx-auto bg-white text-black p-8 md:p-12 shadow-2xl rounded-sm min-h-[1050px] border border-slate-200">
            <MarkdownLite text={activeSession.finalResume} dark={true} prefs={stylePrefs} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {isSculpting && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="p-8 rounded-[40px] bg-[#1a1a1a] border border-white/10 flex flex-col items-center shadow-2xl animate-in zoom-in-95">
              <Loader2 size={48} className="text-indigo-500 animate-spin mb-6" />
              <h3 className="text-xl font-bold text-white mb-2">Sculpting Resume</h3>
              <p className="text-slate-400 text-center text-sm max-w-[240px]">Zysculpt Pro is tailoring your profile for high-impact results...</p>
           </div>
        </div>
      )}

      <header className={`p-4 md:p-6 border-b flex items-center justify-between transition-colors sticky top-0 z-10 ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden p-2 -ml-2 text-indigo-500 transition-colors">
            <Menu size={24} />
          </button>
          <div className="flex flex-col">
            <h2 className={`text-lg md:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>Resume Builder</h2>
            <p className={`text-[10px] md:text-xs opacity-50 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>Sculpting a high-impact profile for target roles.</p>
          </div>
        </div>
        {(activeSession.jobDescription || userProfile?.baseResumeText) && (
          <button onClick={handleSculpt} disabled={isSculpting || isTyping} className="flex items-center gap-2 px-3 md:px-4 py-2 bg-indigo-500 text-white rounded-full font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 text-xs md:text-sm disabled:opacity-50">
            {isSculpting || isTyping ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} 
            <span className="hidden sm:inline">Sculpt Resume</span><span className="sm:hidden">Sculpt</span>
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {errorMessage && (
          <div className="mx-auto max-w-lg p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-medium animate-in slide-in-from-top-4">
             <AlertCircle size={18} />
             <p>{errorMessage}</p>
          </div>
        )}
        {activeSession.messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm border relative group ${
              m.role === 'user' 
                ? theme === 'dark' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-[#E0E7FF] text-slate-900 border-[#C7D2FE]' 
                : theme === 'dark' ? 'bg-[#2a2a2a] text-white border-[#444]' : 'bg-white text-slate-900 border-slate-200'
            }`}>
              <div className="text-sm leading-relaxed"><MarkdownLite text={m.content} theme={theme} /></div>
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
        <div className="max-w-4xl mx-auto relative flex items-center gap-3">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={isRecording ? "Recording..." : "Tell the builder about your target role..."}
              disabled={isRecording || isSculpting}
              className={`w-full border rounded-2xl p-4 pr-12 min-h-[60px] max-h-[200px] transition-all resize-none text-sm md:text-base outline-none ${
                theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a] text-white focus:border-white' : 'bg-slate-50 border-[#e2e8f0] text-[#0F172A] focus:border-indigo-400'
              } ${isRecording ? 'opacity-50 animate-pulse' : ''}`}
              rows={1}
            />
            <button 
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-indigo-500 hover:bg-white/5'}`}
              title="Hold to record voice message"
            >
              {isRecording ? <Square size={18} /> : <Mic size={18} />}
            </button>
          </div>
          <button onClick={() => handleSend()} disabled={!inputValue.trim() || isTyping || isRecording || isSculpting} className="p-4 bg-indigo-500 text-white rounded-2xl hover:bg-indigo-600 transition-colors shadow-md disabled:opacity-30 flex-shrink-0">
            <Send size={18} />
          </button>
        </div>
        {isRecording && <p className="text-[10px] text-center mt-2 text-red-500 font-bold uppercase tracking-widest animate-pulse">Recording voice message... release to send.</p>}
      </div>
    </div>
  );
};

export default AIResumeBuilder;
