import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Loader2, 
  Undo,
  Sparkles,
  FileText,
  Palette,
  Mic,
  Square,
  Menu,
  AlertCircle,
  Paperclip,
  Cpu,
  Zap,
  Globe,
  Plus
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
  const fontClass = "font-['Roboto',_sans-serif]";
  const listStyle = prefs?.listStyle || 'disc';
  
  const formatText = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-black">{part.slice(2, -2)}</strong>;
      }
      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        return <a key={i} href={linkMatch[2]} className="text-[#1918f0] hover:underline" target="_blank" rel="noopener noreferrer">{linkMatch[1]}</a>;
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
        
        if (trimmed.startsWith('### ')) return <h3 key={i} className="text-base font-black mt-4 mb-2">{formatText(trimmed.slice(4))}</h3>;
        if (trimmed.startsWith('## ')) return <h2 key={i} className="text-lg font-black mt-6 mb-3 border-b pb-1 border-current opacity-20">{formatText(trimmed.slice(3))}</h2>;
        if (trimmed.startsWith('# ')) return <h1 key={i} className="text-xl font-black mt-2 mb-4 border-b-2 pb-2 uppercase tracking-tight border-current opacity-80 text-center">{formatText(trimmed.slice(2))}</h1>;
        
        if (trimmed.startsWith('#### ')) return <h4 key={i} className="text-sm font-bold mt-3 mb-1">{formatText(trimmed.slice(5))}</h4>;

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
  const [selectedModel, setSelectedModel] = useState<'flash' | 'pro'>('flash');
  const [showModelSelector, setShowModelSelector] = useState(false);

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
  }, [activeSession.messages, isTyping, isSculpting]);

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
        type: activeSession.type,
        userProfile,
        model: selectedModel === 'pro' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview'
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
      let errorText = "The AI is currently unavailable.";
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
      const result = await geminiService.sculptResume(activeSession.jobDescription || 'Professional Resume', combinedData, userProfile);
      updateSession(activeSessionId, { finalResume: result });
      setShowPreview(true);
    } catch (err: any) { 
      console.error("Gemini Sculpt Error:", err);
      setErrorMessage("Failed to sculpt document.");
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

  const renderWelcome = () => (
    <div className={`p-8 rounded-[40px] border mb-8 animate-in fade-in zoom-in-95 duration-700 ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/5' : 'bg-white border-slate-200'}`}>
       <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#1918f0] flex items-center justify-center text-white shadow-lg shadow-[#1918f0]/20">
             <Sparkles size={24}/>
          </div>
          <div>
            <h1 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>Welcome to Zysculpt AI</h1>
            <p className="text-slate-500 text-sm font-medium">I'm your dedicated career architect. How can I help you today?</p>
          </div>
       </div>
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { l: 'Tailor a Resume', d: 'Match your profile to a job description' },
            { l: 'Draft a Cover Letter', d: 'Persuasive writing for specific roles' },
            { l: 'Interview Prep', d: 'Simulate high-stakes interviews' },
            { l: 'Career Advice', d: 'Navigate complex workplace transitions' }
          ].map((action, i) => (
            <button key={i} onClick={() => setInputValue(action.l)} className={`p-4 rounded-3xl border transition-all text-left hover:border-[#1918f0] hover:bg-[#1918f0]/5 group ${theme === 'dark' ? 'border-white/5 bg-[#121212]' : 'border-slate-100 bg-slate-50'}`}>
               <span className={`text-sm font-black block group-hover:text-[#1918f0] ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>{action.l}</span>
               <span className="text-[11px] text-slate-500">{action.d}</span>
            </button>
          ))}
       </div>
    </div>
  );

  if (showPreview && activeSession.finalResume) {
    return (
      <div className="flex flex-col h-full animate-in fade-in duration-500 relative font-['Roboto',_sans-serif]">
        <header className={`flex items-center justify-between p-4 md:p-6 border-b sticky top-0 z-10 no-print transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
          <div className="flex items-center gap-2">
            <h2 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>Document Preview</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowPreview(false)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-black transition-all ${theme === 'dark' ? 'bg-[#2a2a2a] text-white hover:bg-[#333]' : 'bg-slate-100 text-[#0F172A] hover:bg-slate-200'}`}><Undo size={14} /> Back</button>
            <div className="relative">
              <button onClick={() => setShowStyleMenu(!showStyleMenu)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-black transition-all ${theme === 'dark' ? 'bg-[#2a2a2a] text-white hover:bg-[#333]' : 'bg-slate-100 text-[#0F172A] hover:bg-slate-200'}`}><Palette size={14} /> Style</button>
              {showStyleMenu && (
                <div className={`absolute right-0 mt-2 w-48 border rounded-xl shadow-2xl p-2 z-50 animate-in zoom-in-95 ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-200'}`}>
                  {['font-sans', 'font-serif', 'font-mono'].map(font => (
                    <button key={font} onClick={() => { updatePrefs({ font: font as any }); setShowStyleMenu(false); }}
                      className={`w-full text-left p-2 rounded-lg text-xs font-black transition-colors ${stylePrefs.font === font ? 'bg-[#1918f0] text-white' : 'hover:bg-white/5'}`}
                    >{font.split('-')[1].toUpperCase()}</button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={exportDOCX} disabled={isExporting} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-black transition-all ${theme === 'dark' ? 'bg-[#2a2a2a] text-white hover:bg-[#333]' : 'bg-slate-100 text-[#0F172A] hover:bg-slate-200'}`}><FileText size={14} /> Word</button>
            <button onClick={exportPDF} disabled={isExporting} className="px-4 py-2 bg-[#1918f0] text-white rounded-lg font-black text-xs md:text-sm hover:bg-[#0e0da8] transition-all shadow-lg shadow-[#1918f0]/20">Save PDF</button>
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
    <div className="flex flex-col h-full relative font-['Roboto',_sans-serif]">
      <header className={`p-4 md:p-6 border-b flex items-center justify-between transition-colors sticky top-0 z-10 ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden p-2 -ml-2 text-[#1918f0] transition-colors">
            <Menu size={24} />
          </button>
          <div className="flex flex-col">
            <h2 className={`text-lg md:text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
              {activeSession.type === 'resume' ? 'Resume Builder' : activeSession.type === 'cover-letter' ? 'Cover Letter' : activeSession.type === 'resignation-letter' ? 'Resignation' : 'Career Copilot'}
            </h2>
            <p className={`text-[10px] md:text-xs font-bold opacity-50 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>Chat-based precision sculpting.</p>
          </div>
        </div>
        {(activeSession.jobDescription || userProfile?.baseResumeText) && activeSession.type !== 'career-copilot' && (
          <button onClick={handleSculpt} disabled={isSculpting || isTyping} className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[#1918f0] text-white rounded-full font-black hover:bg-[#0e0da8] transition-all shadow-lg shadow-[#1918f0]/20 text-xs md:text-sm disabled:opacity-50">
            {isSculpting || isTyping ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} 
            <span className="hidden sm:inline">Sculpt Document</span><span className="sm:hidden">Sculpt</span>
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {activeSession.messages.length === 0 && renderWelcome()}
        
        {activeSession.messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[75%] rounded-3xl p-5 shadow-sm border relative group ${
              m.role === 'user' 
                ? theme === 'dark' ? 'bg-[#1918f0] text-white border-[#1918f0]' : 'bg-[#E0E7FF] text-slate-900 border-[#C7D2FE]' 
                : theme === 'dark' ? 'bg-[#1a1a1a] text-white border-white/5' : 'bg-white text-slate-900 border-slate-200'
            }`}>
              <div className="text-sm leading-relaxed"><MarkdownLite text={m.content} theme={theme} /></div>
            </div>
          </div>
        ))}
        {(isTyping || isSculpting) && (
          <div className="flex justify-start">
            <div className={`rounded-3xl p-5 border flex items-center gap-3 ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/5' : 'bg-white border-slate-200'}`}>
              <Loader2 className="animate-spin text-[#1918f0]" size={18} />
              {isSculpting && <span className="text-xs font-black opacity-70">Sculpting...</span>}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Modern Integrated Chat Box */}
      <div className={`p-4 md:p-6 border-t transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="max-w-4xl mx-auto space-y-4">
           {/* Tool Bar */}
           <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setShowModelSelector(!showModelSelector)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-[#1918f0]'}`}>
                   {selectedModel === 'pro' ? <Zap size={14} className="text-amber-500" /> : <Cpu size={14}/>}
                   {selectedModel === 'pro' ? 'Gemini 3 Pro' : 'Gemini 3 Flash'}
                </button>
                {showModelSelector && (
                  <div className={`absolute bottom-full mb-2 left-0 w-48 border rounded-2xl shadow-2xl p-2 z-50 animate-in slide-in-from-bottom-2 ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-200'}`}>
                     <button onClick={() => { setSelectedModel('flash'); setShowModelSelector(false); }} className={`w-full flex items-center gap-2 p-3 rounded-xl text-[11px] font-bold text-left transition-colors ${selectedModel === 'flash' ? 'bg-[#1918f0]/10 text-[#1918f0]' : 'hover:bg-white/5'}`}>
                        <Cpu size={14}/> Gemini 3 Flash (Fast)
                     </button>
                     <button onClick={() => { setSelectedModel('pro'); setShowModelSelector(false); }} className={`w-full flex items-center gap-2 p-3 rounded-xl text-[11px] font-bold text-left transition-colors ${selectedModel === 'pro' ? 'bg-[#1918f0]/10 text-[#1918f0]' : 'hover:bg-white/5'}`}>
                        <Zap size={14} className="text-amber-500"/> Gemini 3 Pro (Complex Reasoning)
                     </button>
                  </div>
                )}
              </div>
              <button className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-[#1918f0]'}`}>
                 <Paperclip size={14}/> Attach File
              </button>
           </div>

           <div className="relative flex items-center gap-3">
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={isRecording ? "Listening..." : "Message Zysculpt..."}
                disabled={isRecording || isSculpting}
                className={`w-full border rounded-[32px] p-5 pr-14 min-h-[60px] max-h-[200px] transition-all resize-none text-sm md:text-base outline-none shadow-sm ${
                  theme === 'dark' ? 'bg-[#121212] border-white/5 text-white focus:border-[#1918f0]' : 'bg-slate-50 border-[#e2e8f0] text-[#0F172A] focus:border-[#1918f0]'
                } ${isRecording ? 'opacity-50 animate-pulse' : ''}`}
                rows={1}
              />
              <button 
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-2xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-[#1918f0] hover:bg-white/5'}`}
              >
                {isRecording ? <Square size={20} /> : <Mic size={20} />}
              </button>
            </div>
            <button onClick={() => handleSend()} disabled={!inputValue.trim() || isTyping || isRecording || isSculpting} className="p-5 bg-[#1918f0] text-white rounded-[32px] hover:bg-[#0e0da8] transition-all shadow-xl shadow-[#1918f0]/20 flex-shrink-0 active:scale-95 disabled:opacity-50">
              <Send size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIResumeBuilder;