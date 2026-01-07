import React, { useState } from 'react';
import { BookOpen, Zap, BrainCircuit, RefreshCw, CheckCircle2, XCircle, Loader2, Menu } from 'lucide-react';
import { Theme } from '../types';
import { aiService } from '../services/ai';

interface KnowledgeHubProps {
  onToggleMobile?: () => void;
  theme: Theme;
}

const KnowledgeHub: React.FC<KnowledgeHubProps> = ({ onToggleMobile, theme }) => {
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<'selection' | 'quiz' | 'flashcards'>('selection');
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState<number | null>(null);

  const startLearning = async (m: 'quiz' | 'flashcards') => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const data = await aiService.generateQuiz(topic);
      setContent(data);
      setMode(m);
      setCurrentIndex(0);
      setScore(0);
      setUserAnswer(null);
    } catch (e) {
      console.error(e);
      alert("Failed to generate content.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (idx: number) => {
    if (userAnswer !== null) return;
    setUserAnswer(idx);
    if (idx === content[currentIndex].correctIndex) setScore(s => s + 1);
  };

  const nextQuestion = () => {
    if (currentIndex < content.length - 1) {
      setCurrentIndex(p => p + 1);
      setUserAnswer(null);
      setShowAnswer(false);
    } else {
      setMode('selection');
    }
  };

  const textPrimary = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const cardBg = theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a]' : 'bg-white border-slate-200 shadow-sm';

  return (
    <div className={`flex flex-col h-full transition-colors ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-[#F8FAFC]'}`}>
      <header className={`p-4 md:p-6 border-b flex items-center justify-between sticky top-0 z-10 transition-colors ${theme === 'dark' ? 'bg-[#121212] border-white/5' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden p-2 -ml-2 text-[#1918f0] transition-colors">
            <Menu size={24} />
          </button>
          <div className="flex flex-col">
            <h2 className={`text-lg md:text-xl font-bold ${textPrimary}`}>Knowledge Hub</h2>
            <p className="text-[10px] md:text-xs opacity-50">Master new industry concepts with interactive AI</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-xl w-full">
          {mode === 'selection' ? (
            <div className={`p-8 rounded-[40px] border shadow-2xl ${cardBg} text-center animate-in zoom-in-95`}>
              <div className="w-16 h-16 rounded-3xl bg-orange-500 text-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/20">
                <BrainCircuit size={32} />
              </div>
              <h1 className={`text-2xl font-extrabold mb-2 ${textPrimary}`}>Knowledge Lab</h1>
              <p className="text-slate-500 mb-8 text-sm">Enter a topic to generate a custom quiz or flashcards.</p>
              
              <div className="space-y-4">
                <input 
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. System Design, Product Management..."
                  className={`w-full p-4 rounded-2xl border outline-none transition-all focus:border-[#1918f0] ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/5 text-white' : 'bg-slate-50 border-slate-200'}`}
                />
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => startLearning('quiz')} disabled={loading} className="p-4 bg-[#1918f0] text-white rounded-2xl font-bold text-sm hover:bg-[#1413c7] transition-all flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />} Quiz
                  </button>
                  <button onClick={() => startLearning('flashcards')} disabled={loading} className="p-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <BookOpen size={16} />} Flashcards
                  </button>
                </div>
              </div>
            </div>
          ) : mode === 'quiz' ? (
            <div className={`p-8 rounded-[40px] border ${cardBg} animate-in fade-in slide-in-from-bottom-4`}>
               <div className="flex justify-between items-center mb-8">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Question {currentIndex + 1} of {content.length}</span>
                 <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Score: {score}</span>
               </div>
               <h2 className={`text-xl font-bold mb-8 leading-tight ${textPrimary}`}>{content[currentIndex].question}</h2>
               <div className="space-y-3">
                 {content[currentIndex].options.map((opt, i) => (
                   <button 
                     key={i} 
                     onClick={() => handleAnswer(i)}
                     className={`w-full p-4 text-left rounded-2xl border text-sm font-medium transition-all flex items-center justify-between
                       ${userAnswer === null ? 'hover:border-[#1918f0] hover:bg-indigo-500/5' : ''}
                       ${userAnswer === i && i === content[currentIndex].correctIndex ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : ''}
                       ${userAnswer === i && i !== content[currentIndex].correctIndex ? 'border-red-500 bg-red-500/10 text-red-500' : ''}
                       ${userAnswer !== null && i === content[currentIndex].correctIndex ? 'border-emerald-500 text-emerald-500' : ''}
                     `}
                   >
                     {opt}
                     {userAnswer !== null && i === content[currentIndex].correctIndex && <CheckCircle2 size={16}/>}
                     {userAnswer === i && i !== content[currentIndex].correctIndex && <XCircle size={16}/>}
                   </button>
                 ))}
               </div>
               {userAnswer !== null && (
                 <button onClick={nextQuestion} className="w-full mt-8 py-4 bg-[#1918f0] text-white rounded-2xl font-bold transition-all hover:bg-[#1413c7]">
                    {currentIndex === content.length - 1 ? 'Finish' : 'Next'}
                 </button>
               )}
            </div>
          ) : (
            <div className={`p-8 rounded-[40px] border ${cardBg} text-center cursor-pointer min-h-[300px] flex flex-col items-center justify-center animate-in flip-in-y`} onClick={() => setShowAnswer(!showAnswer)}>
               <RefreshCw size={24} className="text-emerald-500 mb-6" />
               <h3 className={`text-xl font-bold mb-4 ${textPrimary}`}>{showAnswer ? content[currentIndex].options[content[currentIndex].correctIndex] : content[currentIndex].question}</h3>
               <p className="text-[10px] font-bold uppercase tracking-widest opacity-30 mt-8">{showAnswer ? 'Click to flip' : 'Reveal answer'}</p>
               {showAnswer && (
                 <button onClick={(e) => { e.stopPropagation(); nextQuestion(); }} className="mt-12 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs">Next Card</button>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeHub;