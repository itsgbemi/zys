
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Upload, 
  Paperclip, 
  Loader2, 
  CheckCircle2, 
  FileDown, 
  Undo,
  Menu
} from 'lucide-react';
import { Message } from '../types';
import { geminiService } from '../services/gemini';

const MarkdownLite: React.FC<{ text: string; dark?: boolean }> = ({ text, dark = false }) => {
  const lines = text.split('\n');
  
  const formatBoldItalic = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className={`space-y-1 ${dark ? 'text-black' : ''}`}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed === '') return <div key={i} className="h-2" />;

        if (trimmed.startsWith('### ')) {
          return <h3 key={i} className="text-base font-bold mt-3 mb-1">{formatBoldItalic(trimmed.slice(4))}</h3>;
        }
        if (trimmed.startsWith('## ')) {
          return <h2 key={i} className="text-lg font-bold mt-4 mb-2">{formatBoldItalic(trimmed.slice(3))}</h2>;
        }
        if (trimmed.startsWith('# ')) {
          return <h1 key={i} className="text-xl font-bold mt-5 mb-3 border-b border-current pb-1">{formatBoldItalic(trimmed.slice(2))}</h1>;
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 ml-4">
              <span className="opacity-50">•</span>
              <span>{formatBoldItalic(trimmed.slice(2))}</span>
            </div>
          );
        }

        return <p key={i} className="leading-relaxed">{formatBoldItalic(line)}</p>;
      })}
    </div>
  );
};

const AIResumeBuilder: React.FC<{ onToggleMobile?: () => void }> = ({ onToggleMobile }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Welcome to Zysculpt! I'm your AI Resume Architect. Let's build a resume that stands out to both recruiters and ATS algorithms. To start, please paste the job description you're targeting or tell me what kind of role you're looking for.",
      timestamp: Date.now(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [finalResume, setFinalResume] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    if (!jobDescription && inputValue.length > 100) {
      setJobDescription(inputValue);
    }

    try {
      const responseStream = await geminiService.generateChatResponse(
        messages, 
        inputValue, 
        { jobDescription, resumeText }
      );
      
      let assistantResponse = '';
      const assistantMessageId = (Date.now() + 1).toString();
      
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now()
      }]);

      for await (const chunk of responseStream) {
        assistantResponse += chunk.text;
        setMessages(prev => prev.map(m => 
          m.id === assistantMessageId ? { ...m, content: assistantResponse } : m
        ));
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again or check your API key.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setResumeText(text.slice(0, 1000) + "... [Resume Content Uploaded]");
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'user',
          content: `I've uploaded my current resume: ${file.name}`,
          timestamp: Date.now()
        }, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Excellent! I've received your resume "${file.name}". I'll use this as our foundation. What's the target job description?`,
          timestamp: Date.now()
        }]);
      };
      reader.readAsText(file);
    }
  };

  const generateFinalResume = async () => {
    setIsTyping(true);
    try {
      const userDataCombined = `Resume foundational text: ${resumeText}\n\nChat history context: ${messages.filter(m => m.role === 'user').map(m => m.content).join('\n')}`;
      const result = await geminiService.sculptResume(jobDescription, userDataCombined);
      setFinalResume(result);
      setShowPreview(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const exportPDF = () => {
    window.print();
  };

  if (showPreview && finalResume) {
    return (
      <div className="flex flex-col h-full animate-in fade-in duration-500">
        <header className="flex items-center justify-between p-4 md:p-6 border-b border-[#2a2a2a] bg-[#191919] sticky top-0 z-10 no-print">
          <div className="flex items-center gap-3">
            <button onClick={onToggleMobile} className="md:hidden text-[#a0a0a0]">
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white">Resume Preview</h2>
              <p className="text-xs md:text-sm text-[#a0a0a0] hidden sm:block">Optimized for ATS & Human Recruiters</p>
            </div>
          </div>
          <div className="flex gap-2 md:gap-3">
            <button 
              onClick={() => setShowPreview(false)}
              className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg bg-[#2a2a2a] text-white hover:bg-[#333] transition-colors text-sm"
            >
              <Undo size={16} />
              <span className="hidden sm:inline">Back to Chat</span>
            </button>
            <button 
              onClick={exportPDF}
              className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg bg-white text-black font-semibold hover:bg-[#e0e0e0] transition-colors text-sm"
            >
              <FileDown size={16} />
              <span>Export PDF</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#121212]">
          <div className="printable-area max-w-4xl mx-auto bg-white text-black p-8 md:p-12 shadow-2xl rounded-sm font-serif min-h-[1100px]">
            <MarkdownLite text={finalResume} dark={true} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 md:p-6 border-b border-[#2a2a2a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden text-[#a0a0a0]">
            <Menu size={24} />
          </button>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white">AI Resume Builder</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] md:text-xs text-[#a0a0a0]">Sculpting Mode Active</span>
            </div>
          </div>
        </div>
        {jobDescription && (
          <button 
            onClick={generateFinalResume}
            disabled={isTyping}
            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white text-black rounded-full font-bold hover:bg-[#e0e0e0] transition-colors disabled:opacity-50 text-xs md:text-sm"
          >
            {isTyping ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
            <span className="hidden sm:inline">Sculpt Final Resume</span>
            <span className="sm:hidden">Sculpt</span>
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-4 ${
                message.role === 'user' 
                  ? 'bg-[#121212] text-white rounded-tr-none shadow-xl border border-[#333]' 
                  : 'bg-[#2a2a2a] text-white rounded-tl-none border border-[#444]'
              }`}
            >
              <div className="text-sm leading-relaxed">
                <MarkdownLite text={message.content} />
              </div>
              <div className={`text-[10px] mt-2 opacity-40 text-right ${message.role === 'user' ? 'text-white' : 'text-[#a0a0a0]'}`}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#2a2a2a] text-white rounded-2xl rounded-tl-none p-4 border border-[#333]">
              <Loader2 className="animate-spin text-[#a0a0a0]" size={18} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 md:p-6 border-t border-[#2a2a2a]">
        <div className="max-w-4xl mx-auto relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Paste JD or answer..."
            className="w-full bg-[#121212] border border-[#2a2a2a] rounded-2xl p-4 pr-32 min-h-[60px] max-h-[200px] text-white placeholder-[#555] focus:outline-none focus:border-white transition-colors resize-none text-sm md:text-base"
            rows={1}
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-1 md:gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept=".pdf,.doc,.docx,.txt"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-[#a0a0a0] hover:text-white transition-colors"
              title="Upload existing resume"
            >
              <Paperclip size={18} md:size={20} />
            </button>
            <button 
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className="p-2 bg-white text-black rounded-xl hover:bg-[#e0e0e0] transition-colors disabled:opacity-50"
            >
              <Send size={18} md:size={20} />
            </button>
          </div>
        </div>
        <p className="text-center text-[8px] md:text-[10px] text-[#555] mt-3 uppercase tracking-widest">
          Zysculpt uses Gemini 3 Flash for Precision Engineering
        </p>
      </div>
    </div>
  );
};

export default AIResumeBuilder;
