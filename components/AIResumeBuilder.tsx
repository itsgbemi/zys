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
  Check
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
  const [selectedModel, setSelectedModel] = useState<AIModel>('gemini-3-flash');
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
      const type = activeSession.type;
      let roleDescription = 'professional career assistant';
      if (type === 'resume') roleDescription = 'ATS resume architect';
      if (type === 'cover-letter') roleDescription = 'persuasive cover letter writer';
      if (type === 'career-copilot') roleDescription = 'strategic career coach';
      
      const systemInstruction = `You are Zysculpt AI, a world-class ${roleDescription}.
      Profile: ${userProfile?.fullName}, Background: ${activeSession.resumeText || userProfile?.baseResumeText || 'Not provided'}.
      Context - Target: ${activeSession.jobDescription || 'Not provided'}.
      Help the user build a professional ${type.replace('-', ' ')}.`;

      const audioPart = audioData ? { inlineData: { data: audioData, mimeType: 'audio/webm' } } : undefined;
      const responseStream = aiService.generateStream(selectedModel, newMessages.slice(0, -1), inputValue, systemInstruction, audioPart);
      
      let assistantResponse = '';
      const assistantId = (Date.now() + 1).toString();
      updateSession(activeSessionId, { messages: [...newMessages, { id: assistantId, role: 'assistant', content: '', timestamp: Date.now() }] });

      for await (const chunk of responseStream) {
        assistantResponse += chunk;
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { 
          ...s, 
          messages: s.messages.map(m => m.id === assistantId ? { ...m, content: assistantResponse } : m) 
        } : s));
      }
    } catch (e: any) {
      setErrorMessage("AI is currently unavailable.");
      setIsTyping(false);
    } finally { setIsTyping(false); }
  };

  const handleSculpt = async () => {
    setErrorMessage(null);
    setIsSculpting(true);
    try {
      const combinedData = `Job: ${activeSession.jobDescription}\nBackground: ${activeSession.resumeText || userProfile?.baseResumeText || ''}\nChat Context: ${activeSession.messages.map(m => m.content).join('\n')}`;
      const prompt = `As an expert ATS Resume/Letter Writer, generate a high-impact document in Markdown based on:\n${combinedData}`;
      const result = await aiService.sculpt(selectedModel, prompt);
      updateSession(activeSessionId, { finalResume: result });
      setShowPreview(true);
    } catch (err: any) { 
      setErrorMessage("Failed to sculpt document.");
    } finally { setIsSculpting(false); }
  };

  const updatePrefs = (newPrefs: Partial<StylePrefs>) => {
    updateSession(activeSessionId, { stylePrefs: { ...stylePrefs, ...newPrefs } as any });
  };

  return (
    <div className="flex flex-col h-full relative font-['Roboto',_sans-serif]">
      <header className={`p-4 md:p-6 border-b flex items-center justify-between transition-colors sticky top-0 z-10 ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden p-2 -ml-2 text-[#1918f0] transition-colors">
            <Menu size={24} />
          </button>
          <div className="flex flex-col">
            <h2 className={`text-lg md:text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
              {activeSession.type.replace('-', ' ').toUpperCase()}
            </h2>
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

      <div className={`p-4 md:p-6 border-t transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="max-w-4xl mx-auto space-y-4">
           <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setShowModelSelector(!showModelSelector)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-[#1918f0]'}`}>
                   <Cpu size={14}/>
                   {selectedModel.replace('-', ' ').toUpperCase()}
                </button>
                {showModelSelector && (
                  <div className={`absolute bottom-full mb-2 left-0 w-48 border rounded-2xl shadow-2xl p-2 z-50 animate-in slide-in-from-bottom-2 ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-200'}`}>
                     {[
                       { id: 'gemini-3-flash', l: 'Gemini 3 Flash' },
                       { id: 'gemini-3-pro', l: 'Gemini 3 Pro' },
                       { id: 'deepseek-v3', l: 'DeepSeek V3' },
                       { id: 'deepseek-r1', l: 'DeepSeek R1' }
                     ].map(m => (
                       <button key={m.id} onClick={() => { setSelectedModel(m.id as any); setShowModelSelector(false); }} className={`w-full flex items-center justify-between p-3 rounded-xl text-[11px] font-bold text-left transition-colors ${selectedModel === m.id ? 'bg-[#1918f0]/10 text-[#1918f0]' : 'hover:bg-white/5'}`}>
                          {m.l} {selectedModel === m.id && <Check size={12}/>}
                       </button>
                     ))}
                  </div>
                )}
              </div>
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
                onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording}
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
