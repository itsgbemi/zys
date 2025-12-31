
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Compass, 
  Loader2, 
  CheckCircle2, 
  Plus, 
  Calendar as CalendarIcon, 
  Target, 
  Clock,
  ChevronRight,
  TrendingUp,
  Award,
  Calendar,
  Sparkles,
  Mic,
  Square,
  Menu,
  Volume2,
  StopCircle
} from 'lucide-react';
import { Message, ChatSession, Theme, ScheduledTask, UserProfile } from '../types';
import { geminiService } from '../services/gemini';
import { elevenLabsService } from '../services/elevenlabs';
import { MarkdownLite } from './AIResumeBuilder';

interface CareerCopilotProps {
  onToggleMobile?: () => void;
  theme: Theme;
  sessions: ChatSession[];
  activeSessionId: string;
  updateSession: (id: string, updates: Partial<ChatSession>) => void;
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  userProfile: UserProfile;
}

const CareerCopilot: React.FC<CareerCopilotProps> = ({ 
  onToggleMobile, theme, sessions, activeSessionId, updateSession, setSessions, userProfile 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  
  // Audio state
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession.messages, isTyping]);

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
    
    // Stop any playing audio when sending new message
    if (playingMessageId) {
      elevenLabsService.stop();
      setPlayingMessageId(null);
    }

    const contentText = audioData ? (inputValue.trim() ? `${inputValue} [Voice Message]` : "[Voice Message]") : inputValue;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: contentText, timestamp: Date.now() };
    const newMessages = [...activeSession.messages, userMessage];
    updateSession(activeSessionId, { messages: newMessages });
    setInputValue('');
    setIsTyping(true);

    try {
      const context: any = { type: 'career-copilot', userProfile };
      if (audioData) {
        context.audioPart = { inlineData: { data: audioData, mimeType: 'audio/webm' } };
      }

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
    } catch (e) {
      updateSession(activeSessionId, { messages: [...newMessages, { id: 'error', role: 'assistant', content: "Error occurred.", timestamp: Date.now() }] });
    } finally { setIsTyping(false); }
  };

  const toggleSpeech = (messageId: string, text: string) => {
    if (playingMessageId === messageId) {
      elevenLabsService.stop();
      setPlayingMessageId(null);
    } else {
      setPlayingMessageId(messageId);
      elevenLabsService.speak(text, () => setPlayingMessageId(null));
    }
  };

  const handleGeneratePlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const plan = await geminiService.generateCareerPlan(activeSession.title, userProfile.dailyAvailability || 2);
      const scheduledTasks: ScheduledTask[] = plan.map((p, i) => ({
        id: `task-${i}`,
        dayNumber: p.day,
        task: p.task,
        completed: false
      }));

      updateSession(activeSessionId, {
        careerGoalData: {
          mainGoal: activeSession.title,
          scheduledTasks,
          logs: [],
          startDate: Date.now()
        }
      });
      
      const confirmMsg: Message = { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: `I've architected a 30-day plan based on your **${userProfile.dailyAvailability}h/day** availability. Check your Home dashboard to track your progress!`, 
        timestamp: Date.now() 
      };
      updateSession(activeSessionId, { messages: [...activeSession.messages, confirmMsg] });
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const textPrimary = theme === 'dark' ? 'text-white' : 'text-slate-900';

  return (
    <div className={`flex flex-col h-full transition-colors ${theme === 'dark' ? 'bg-[#191919]' : 'bg-[#F8FAFC]'}`}>
      <header className={`p-4 md:p-6 border-b flex items-center justify-between sticky top-0 z-10 transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden p-2 -ml-2 text-indigo-500 transition-colors">
            <Menu size={24} />
          </button>
          <div className="flex flex-col">
            <h2 className={`text-lg md:text-xl font-bold ${textPrimary}`}>Career Copilot</h2>
            <p className={`text-[10px] md:text-xs opacity-50 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>Defining your trajectory and daily actions.</p>
          </div>
        </div>
        <button 
          onClick={handleGeneratePlan} 
          disabled={isGeneratingPlan}
          className="flex items-center gap-2 px-3 md:px-4 py-2 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 text-xs md:text-sm disabled:opacity-50"
        >
          {isGeneratingPlan ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} 
          <span className="hidden sm:inline">{activeSession.careerGoalData ? 'Re-generate Plan' : 'Generate 30-Day Plan'}</span>
          <span className="sm:hidden">Plan</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {activeSession.messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm border relative group ${
              m.role === 'user' 
                ? theme === 'dark' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-[#E0E7FF] text-slate-900 border-[#C7D2FE]' 
                : theme === 'dark' ? 'bg-[#2a2a2a] text-white border-[#444]' : 'bg-white text-slate-900 border-slate-200'
            }`}>
              <div className="text-sm leading-relaxed"><MarkdownLite text={m.content} theme={theme} /></div>
              <div className={`flex items-center justify-between mt-2 pt-2 border-t ${m.role === 'user' ? (theme === 'dark' ? 'border-indigo-500/30' : 'border-indigo-200/50') : (theme === 'dark' ? 'border-white/5' : 'border-slate-100')}`}>
                 <div className={`text-[9px] opacity-30 ${m.role === 'user' && theme === 'dark' ? 'text-white' : 'text-slate-600'}`}>
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </div>
                 {m.role === 'assistant' && (
                   <button 
                      onClick={() => toggleSpeech(m.id, m.content)}
                      className={`p-1.5 rounded-full transition-all ${
                        playingMessageId === m.id 
                          ? 'bg-indigo-500 text-white animate-pulse' 
                          : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10'
                      }`}
                      title={playingMessageId === m.id ? "Stop reading" : "Read aloud (Mock Interview)"}
                   >
                      {playingMessageId === m.id ? <StopCircle size={14} /> : <Volume2 size={14} />}
                   </button>
                 )}
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
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={isRecording ? "Recording..." : "Practice interview or ask for advice..."}
              disabled={isRecording}
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
          <button onClick={() => handleSend()} disabled={!inputValue.trim() || isTyping || isRecording} className="p-4 bg-indigo-500 text-white rounded-2xl hover:bg-indigo-600 transition-colors shadow-md disabled:opacity-30">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CareerCopilot;
