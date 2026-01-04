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
  Check,
  // Added missing Info import to resolve compilation error
  Info
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        userProfile
      };
      if (audioData) context.audioPart = { inlineData: { data: audioData, mimeType: 'audio/webm' } };

      const responseStream = await geminiService.generateChatResponse(
        newMessages.slice(0, -1), 
        inputValue, 
        context
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
      let result = "";
      
      if (activeSession.type === 'resume') {
        result = await geminiService.sculptResume(activeSession.jobDescription || '', combinedData, userProfile);
      } else if (activeSession.type === 'cover-letter') {
        result = await geminiService.sculptCoverLetter(activeSession.jobDescription || '', combinedData, userProfile);
      } else {
        result = await geminiService.sculptResignationLetter(activeSession.jobDescription || '', combinedData, userProfile);
      }

      updateSession(activeSessionId, { finalResume: result });
      setShowPreview(true);
    } catch (err: any) { 
      setErrorMessage("Failed to sculpt document.");
    } finally { setIsSculpting(false); }
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
        {activeSession.messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-40 text-center px-8">
             <div className="w-16 h-16 rounded-3xl bg-[#1918f0]/10 flex items-center justify-center text-[#1918f0] mb-4">
                <Info size={32}/>
             </div>
             <p className="font-bold text-sm leading-relaxed max-w-xs">
               Welcome to your {activeSession.type.replace('-', ' ')} sculpting workspace. 
               Tell Zysculpt about your goals or upload a target job to begin.
             </p>
          </div>
        )}
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