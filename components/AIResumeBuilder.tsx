import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Loader2, 
  Undo,
  Sparkles,
  Download,
  ChevronDown,
  Layout,
  Check,
  Zap,
  Cpu,
  Menu,
  AlertCircle,
  Mic,
  Square,
  Type as TypeIcon
} from 'lucide-react';
import { Message, ChatSession, Theme, StylePrefs, UserProfile } from '../types';
import { aiService, AIModel } from '../services/ai';
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

  const containerClasses = `space-y-1 ${fontClass} ${dark ? 'text-black' : theme === 'dark' ? 'text-slate-200' : 'text-slate-900'} ${
    template === 'classic' ? 'leading-relaxed' : template === 'minimal' ? 'leading-tight' : 'leading-normal'
  }`;

  return (
    <div className={containerClasses}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed === '') return <div key={i} className="h-2" />;
        
        if (trimmed.startsWith('### ')) return <h3 key={i} className={`text-base font-bold mt-4 mb-2 ${template === 'classic' ? 'uppercase border-b border-slate-200 pb-1' : ''}`}>{formatText(trimmed.slice(4))}</h3>;
        if (trimmed.startsWith('## ')) return <h2 key={i} className={`text-lg font-bold mt-6 mb-3 border-b pb-1 border-current opacity-20`}>{formatText(trimmed.slice(3))}</h2>;
        if (trimmed.startsWith('# ')) return <h1 key={i} className={`text-xl font-bold mt-2 mb-4 border-b-2 pb-2 uppercase tracking-tight border-current opacity-80 text-center ${template === 'modern' ? 'text-[#1918f0]' : ''}`}>{formatText(trimmed.slice(2))}</h1>;
        
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel>('gemini-3-pro');

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
      alert("Microphone access is required.");
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
        userProfile
      };
      
      let assistantResponse = '';
      const assistantId = (Date.now() + 1).toString();
      updateSession(activeSessionId, { messages: [...newMessages, { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() }] });

      const stream = aiService.generateStream(selectedModel, newMessages, inputValue, context);

      for await (const chunk of stream) {
        assistantResponse += chunk;
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { 
          ...s, 
          messages: s.messages.map(m => m.id === assistantId ? { ...m, content: assistantResponse } : m) 
        } : s));
      }
    } catch (e: any) {
      setErrorMessage("AI is currently unavailable. Check your internet or API key.");
      setIsTyping(false);
    } finally { setIsTyping(false); }
  };

  const handleSculpt = async () => {
    setErrorMessage(null);
    setIsSculpting(true);
    try {
      const combinedData = `User Profile: ${activeSession.resumeText || userProfile?.baseResumeText || ''}\nChat context: ${activeSession.messages.map(m => m.content).join('\n')}`;
      const typeLabel = activeSession.type.replace('-', ' ').toUpperCase();
      const prompt = `Act as a senior Recruiter. Sculpt a final, world-class ${typeLabel} in Markdown format based on this data: ${combinedData}. Target role: ${activeSession.jobDescription || 'Professional Application'}. Return ONLY markdown.`;
      
      const result = await aiService.sculpt(selectedModel, prompt);
      updateSession(activeSessionId, { finalResume: result });
      setShowPreview(true);
    } catch (err: any) { 
      setErrorMessage("Sculpting failed. Please try again.");
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
      filename: `Zysculpt_${activeSession.type}_${activeSession.title.replace(/\s+/g, '_')}.pdf`, 
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
      link.download = `Zysculpt_${activeSession.title.replace(/\s+/g, '_')}.docx`;
      link.click();
    } catch (e) { console.error(e); } finally { setIsExporting(false); }
  };

  const getWelcomeMessage = () => {
    switch(activeSession.type) {
      case 'resume': return "Welcome! I'm your Zysculpt Resume Architect. I'll help you craft an ATS-proof resume. Tell me about your most recent role or paste a job link you're targeting.";
      case 'cover-letter': return "Hello! I'm your Cover Letter Specialist. A great cover letter tells a story. What's the one thing you want the hiring manager to know about your passion for this role?";
      case 'resignation-letter': return "Hi there. I'll help you write a professional and graceful resignation. When is your intended last day and who are we addressing?";
      default: return "How can I help you today?";
    }
  };

  if (showPreview && activeSession.finalResume) {
    return (
      <div className="flex flex-col h-full animate-in fade-in duration-500 relative">
        <header className={`flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 border-b sticky top-0 z-10 no-print gap-4 transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowPreview(false)} className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-[#0F172A]'}`}><Undo size={20} /></button>
            <h2 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>Document Preview</h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <select 
              value={stylePrefs.template}
              onChange={(e) => updatePrefs({ template: e.target.value as any })}
              className={`px-3 py-2 rounded-lg text-xs font-bold border outline-none transition-all ${theme === 'dark' ? 'bg-[#2a2a2a] text-white border-white/10' : 'bg-slate-50 text-slate-800 border-slate-200'}`}
            >
              <option value="modern">Modern Template</option>
              <option value="classic">Classic Template</option>
              <option value="minimal">Minimal Template</option>
            </select>
            
            <select 
              value={stylePrefs.font}
              onChange={(e) => updatePrefs({ font: e.target.value as any })}
              className={`px-3 py-2 rounded-lg text-xs font-bold border outline-none transition-all ${theme === 'dark' ? 'bg-[#2a2a2a] text-white border-white/10' : 'bg-slate-50 text-slate-800 border-slate-200'}`}
            >
              <option value="font-inter">Inter</option>
              <option value="font-roboto">Roboto</option>
              <option value="font-eb-garamond">EB Garamond</option>
              <option value="font-arial">Arial</option>
              <option value="font-times">Times New Roman</option>
            </select>

            <div className="h-6 w-px bg-slate-200 dark:bg-white/10 mx-1"></div>

            <button onClick={exportDOCX} disabled={isExporting} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${theme === 'dark' ? 'bg-[#2a2a2a] text-white hover:bg-[#333]' : 'bg-slate-100 text-[#0F172A] hover:bg-slate-200'}`}>
              <Download size={14} /> DOCX
            </button>
            <button onClick={exportPDF} disabled={isExporting} className="px-6 py-2 bg-[#1918f0] text-white rounded-xl font-bold text-xs hover:bg-[#0a09d0] transition-all shadow-lg shadow-[#1918f0]/20">
              Export PDF
            </button>
          </div>
        </header>

        <div className={`flex-1 overflow-y-auto p-4 md:p-12 transition-colors ${theme === 'dark' ? 'bg-[#121212]' : 'bg-slate-50'}`}>
          <div className="printable-area max-w-4xl mx-auto bg-white text-black p-12 md:p-20 shadow-2xl rounded-sm min-h-[1050px] border border-slate-200">
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
          <button onClick={onToggleMobile} className="md:hidden p-2 -ml-2 text-[#1918f0] transition-colors">
            <Menu size={24} />
          </button>
          <div className="flex flex-col">
            <h2 className={`text-lg md:text-xl font-bold capitalize ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
              {activeSession.type.replace('-', ' ')} Builder
            </h2>
            <p className={`text-[10px] md:text-xs opacity-40 font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>
              Powered by {selectedModel.includes('gemini') ? 'Google Gemini 3' : 'DeepSeek AI'}
            </p>
          </div>
        </div>
        {(activeSession.jobDescription || userProfile?.baseResumeText) && (
          <button onClick={handleSculpt} disabled={isSculpting || isTyping} className="flex items-center gap-2 px-5 py-2.5 bg-[#1918f0] text-white rounded-2xl font-black hover:bg-[#0a09d0] transition-all shadow-xl shadow-[#1918f0]/20 text-xs md:text-sm disabled:opacity-50">
            {isSculpting || isTyping ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} 
            <span className="hidden sm:inline">Sculpt Document</span><span className="sm:hidden">Sculpt</span>
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
        <div className="flex justify-start">
           <div className={`max-w-[85%] md:max-w-[70%] rounded-3xl p-6 border shadow-sm ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/5 text-slate-200' : 'bg-white border-slate-100 text-slate-800'}`}>
              <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-widest text-[#1918f0]">
                 <Zap size={14} /> AI Assistant
              </div>
              <p className="text-sm leading-relaxed">{getWelcomeMessage()}</p>
           </div>
        </div>

        {activeSession.messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`max-w-[85%] md:max-w-[75%] rounded-[32px] p-6 shadow-sm border ${
              m.role === 'user' 
                ? theme === 'dark' ? 'bg-slate-800 text-white border-white/10' : 'bg-slate-100 text-slate-900 border-slate-200' 
                : theme === 'dark' ? 'bg-[#1a1a1a] text-white border-white/5' : 'bg-white text-slate-900 border-slate-200'
            }`}>
              <div className="text-sm leading-relaxed"><MarkdownLite text={m.content} theme={theme} /></div>
            </div>
          </div>
        ))}

        {(isTyping || isSculpting) && (
          <div className="flex justify-start">
            <div className={`rounded-3xl px-6 py-4 border flex items-center gap-3 ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/5' : 'bg-white border-slate-200'}`}>
              <Loader2 className="animate-spin text-[#1918f0]" size={18} />
              <span className="text-xs font-bold opacity-50 tracking-wide uppercase">{isSculpting ? 'Sculpting...' : 'Thinking...'}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={`p-4 md:p-8 border-t transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="max-w-4xl mx-auto space-y-4">
           
           <div className="flex items-center gap-2 px-2">
              <div className={`flex items-center gap-1 rounded-full p-1 border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                 {[
                   { id: 'gemini-3-pro', icon: <Zap size={10}/>, label: 'Gemini' },
                   { id: 'deepseek-v3', icon: <Cpu size={10}/>, label: 'DeepSeek' },
                   { id: 'deepseek-r1', icon: <Cpu size={10}/>, label: 'DeepSeek R1' }
                 ].map(m => (
                   <button 
                     key={m.id}
                     onClick={() => setSelectedModel(m.id as any)}
                     className={`flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${
                       selectedModel === m.id 
                         ? 'bg-[#1918f0] text-white shadow-md' 
                         : 'text-slate-400 hover:text-slate-200'
                     }`}
                   >
                     {m.icon} {m.label}
                   </button>
                 ))}
              </div>
           </div>

           <div className="relative flex items-center gap-3">
            <div className="flex-1 relative group">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={isRecording ? "Listening..." : "Message Zysculpt..."}
                disabled={isRecording || isSculpting}
                className={`w-full border rounded-[32px] p-5 pr-14 min-h-[60px] max-h-[200px] transition-all resize-none text-sm md:text-base outline-none shadow-sm ${
                  theme === 'dark' ? 'bg-[#121212] border-white/10 text-white focus:border-[#1918f0]' : 'bg-slate-50 border-slate-200 text-[#0F172A] focus:border-[#1918f0]'
                }`}
                rows={1}
              />
              <button 
                onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording}
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-2xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-[#1918f0] hover:bg-white/5'}`}
              >
                {isRecording ? <Square size={20} /> : <Mic size={20} />}
              </button>
            </div>
            <button onClick={() => handleSend()} disabled={!inputValue.trim() || isTyping || isSculpting} className="p-5 bg-[#1918f0] text-white rounded-[32px] hover:bg-[#0e0da8] transition-all shadow-xl shadow-[#1918f0]/20 flex-shrink-0 active:scale-95 disabled:opacity-50">
              <Send size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIResumeBuilder;
