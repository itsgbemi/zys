import React, { useState } from 'react';
import { Menu, FileText, Grid, List as ListIcon, Search, ChevronRight, Mail, DoorOpen, File, Clock, Eye } from 'lucide-react';
import { ChatSession, Theme } from '../types';

interface DocumentsProps {
  onToggleMobile?: () => void;
  theme: Theme;
  sessions: ChatSession[];
  onSelectSession: (id: string) => void;
}

const Documents: React.FC<DocumentsProps> = ({ onToggleMobile, theme, sessions, onSelectSession }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'resume' | 'cover-letter' | 'resignation-letter'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions
    .filter(s => s.finalResume)
    .filter(s => filter === 'all' || s.type === filter)
    .filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const textPrimary = theme === 'dark' ? 'text-white' : 'text-[#0F172A]';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const borderClass = theme === 'dark' ? 'border-white/10' : 'border-slate-200';
  const bgClass = theme === 'dark' ? 'bg-[#121212]' : 'bg-white';

  const getIcon = (type: string) => {
    switch (type) {
      case 'resume': return <FileText size={18} className="text-[#1918f0]" />;
      case 'cover-letter': return <Mail size={18} className="text-emerald-500" />;
      case 'resignation-letter': return <DoorOpen size={18} className="text-orange-500" />;
      default: return <File size={18} className="text-slate-500" />;
    }
  };

  return (
    <div className={`flex flex-col h-full transition-colors ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-[#F8FAFC]'}`}>
      <header className={`p-4 md:p-6 border-b flex items-center justify-between sticky top-0 z-10 transition-colors ${bgClass} ${borderClass}`}>
        <div className="flex items-center gap-3">
          <button onClick={onToggleMobile} className="md:hidden p-2 -ml-2 text-[#1918f0] transition-colors">
            <Menu size={24} />
          </button>
          <div>
            <h2 className={`text-lg md:text-xl font-bold ${textPrimary}`}>My Documents</h2>
            <p className={`text-[10px] md:text-xs ${textSecondary}`}>Manage your tailored professional files</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className={`flex items-center rounded-xl p-1 border ${borderClass} ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`}>
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#1918f0] text-white shadow-sm' : 'text-slate-400'}`}>
                <Grid size={16} />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#1918f0] text-white shadow-sm' : 'text-slate-400'}`}>
                <ListIcon size={16} />
              </button>
           </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: 'All Files' },
                { id: 'resume', label: 'Resumes' },
                { id: 'cover-letter', label: 'Letters' },
                { id: 'resignation-letter', label: 'Resignations' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setFilter(item.id as any)}
                  className={`px-4 py-2 rounded-full text-[11px] md:text-xs font-bold transition-all border ${
                    filter === item.id 
                      ? 'bg-[#1918f0] border-[#1918f0] text-white shadow-lg shadow-indigo-500/20' 
                      : `${theme === 'dark' ? 'border-white/5 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-64">
               <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary}`} />
               <input 
                 type="text"
                 placeholder="Search files..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm border outline-none transition-all ${
                   theme === 'dark' ? 'bg-[#191919] border-white/5 text-white focus:border-[#1918f0]' : 'bg-white border-slate-200 focus:border-[#1918f0]'
                 }`}
               />
            </div>
          </div>

          {filteredSessions.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-3xl p-8 text-center transition-colors ${theme === 'dark' ? 'border-white/10' : 'border-slate-200 bg-white shadow-sm'}`}>
              <FileText size={48} className="text-slate-300 mb-4" />
              <h3 className={`text-lg font-bold mb-2 ${textPrimary}`}>No documents yet</h3>
              <p className="text-slate-500 text-sm max-w-xs">Start building a resume or letter to see it here.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSessions.map(session => (
                <div 
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`border rounded-2xl overflow-hidden group shadow-sm transition-all cursor-pointer ${
                    theme === 'dark' ? 'bg-[#191919] border-white/10 hover:border-[#1918f0]' : 'bg-white border-slate-200 hover:border-[#1918f0]'
                  }`}
                >
                  <div className={`aspect-[3/4] p-6 relative overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
                    <div className="w-full h-full bg-white text-black p-3 text-[3px] leading-tight select-none opacity-40 overflow-hidden transform group-hover:scale-105 transition-transform rounded shadow-sm">
                       {session.finalResume}
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="p-3 bg-white text-black rounded-full shadow-2xl"><Eye size={20} /></div>
                    </div>
                  </div>
                  <div className={`p-4 border-t ${borderClass}`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={`text-sm font-bold truncate ${textPrimary}`}>{session.title}</h4>
                      {getIcon(session.type)}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                      <Clock size={12} />
                      <span>{new Date(session.lastUpdated).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`rounded-2xl overflow-hidden border ${borderClass} ${theme === 'dark' ? 'bg-[#191919]' : 'bg-white'}`}>
              {filteredSessions.map((session, i) => (
                <div 
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-all ${
                    i !== 0 ? `border-t ${borderClass}` : ''
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`}>
                      {getIcon(session.type)}
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${textPrimary}`}>{session.title}</h4>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{session.type.replace('-', ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                     <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                        <Clock size={12} />
                        {new Date(session.lastUpdated).toLocaleDateString()}
                     </div>
                     <ChevronRight size={18} className="text-slate-300" />
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