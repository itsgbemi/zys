
import React from 'react';
import { Menu, FileText, Download, Eye, Clock, Grid, List as ListIcon } from 'lucide-react';
import { ChatSession, Theme } from '../types';

interface DocumentsProps {
  onToggleMobile?: () => void;
  theme: Theme;
  sessions: ChatSession[];
  onSelectSession: (id: string) => void;
}

const Documents: React.FC<DocumentsProps> = ({ onToggleMobile, theme, sessions, onSelectSession }) => {
  const docSessions = sessions.filter(s => s.finalResume);

  return (
    <div className={`flex flex-col h-full transition-colors ${theme === 'dark' ? 'bg-[#121212]' : 'bg-slate-50'}`}>
      <header className={`p-4 md:p-6 border-b flex items-center justify-between sticky top-0 z-10 transition-colors ${theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden">
            <Menu size={24} className={theme === 'dark' ? 'text-white' : 'text-[#0F172A]'} />
          </button>
          <div>
            <h2 className={`text-lg md:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>Documents</h2>
            <p className={`text-[10px] md:text-xs ${theme === 'dark' ? 'text-[#a0a0a0]' : 'text-slate-500'}`}>Manage your sculpted resumes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button className={`p-2 transition-colors ${theme === 'dark' ? 'text-[#a0a0a0] hover:text-white' : 'text-slate-400 hover:text-[#0F172A]'}`}><Grid size={18} /></button>
           <button className={`p-2 transition-colors ${theme === 'dark' ? 'text-[#a0a0a0] hover:text-white' : 'text-slate-400 hover:text-[#0F172A]'}`}><ListIcon size={18} /></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {docSessions.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-3xl p-8 text-center transition-colors ${theme === 'dark' ? 'border-[#2a2a2a]' : 'border-slate-200 bg-white shadow-sm'}`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
                <FileText size={32} className={theme === 'dark' ? 'text-[#333]' : 'text-slate-300'} />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>No documents yet</h3>
              <p className="text-slate-500 text-sm max-w-xs">Complete a resume sculpt in the builder to generate your documents here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {docSessions.map(session => (
                <div 
                  key={session.id}
                  className={`border rounded-2xl overflow-hidden group shadow-sm transition-all ${
                    theme === 'dark' ? 'bg-[#191919] border-[#2a2a2a] hover:border-indigo-500/50' : 'bg-white border-[#e2e8f0] hover:border-indigo-400 hover:shadow-md'
                  }`}
                >
                  <div className={`aspect-[3/4] p-4 relative overflow-hidden flex items-center justify-center ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
                    <div className="w-full h-full bg-white text-black p-4 text-[4px] leading-tight select-none opacity-40 overflow-hidden transform group-hover:scale-105 transition-transform">
                       {session.finalResume}
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button onClick={() => onSelectSession(session.id)} className="p-3 bg-white text-black rounded-full hover:bg-slate-100 shadow-xl" title="View"><Eye size={20} /></button>
                      <button className="p-3 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 shadow-xl" title="Download"><Download size={20} /></button>
                    </div>
                  </div>
                  <div className={`p-4 border-t transition-colors ${theme === 'dark' ? 'border-[#2a2a2a]' : 'border-slate-100'}`}>
                    <h4 className={`text-sm font-bold truncate mb-1 ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>{session.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                      <Clock size={12} />
                      <span>{new Date(session.lastUpdated).toLocaleDateString()}</span>
                      <span className="ml-auto uppercase tracking-tighter text-indigo-500 font-bold">PDF Ready</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Documents;
