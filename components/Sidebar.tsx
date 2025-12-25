
import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  X,
  Plus,
  ChevronDown,
  Sun,
  Moon,
  Mail,
  DoorOpen,
  LayoutDashboard,
  Compass,
  MoreHorizontal,
  Edit2,
  Trash2,
  Check,
  FolderOpen,
  AlertTriangle
} from 'lucide-react';
import { AppView, ChatSession, Theme } from '../types';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  theme: Theme;
  toggleTheme: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  setActiveSessionId: (id: string) => void;
  onNewSession: (type?: 'resume' | 'cover-letter' | 'resignation-letter' | 'career-copilot') => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, title: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, setView, isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen, 
  theme, toggleTheme, sessions, activeSessionId, setActiveSessionId, onNewSession, onDeleteSession, onRenameSession
}) => {
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    resume: true,
    letter: false,
    resignation: false,
    copilot: true
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStartRename = (id: string, title: string) => {
    setEditingId(id);
    setEditValue(title);
    setMenuOpenId(null);
  };

  const handleFinishRename = (id: string) => {
    if (editValue.trim()) {
      onRenameSession(id, editValue.trim());
    }
    setEditingId(null);
  };

  const renderNavButton = (id: AppView, label: string, icon: React.ReactNode, typeKey?: string, onPlusClick?: () => void) => {
    const isActive = currentView === id;
    const hasSubmenu = typeKey !== undefined;
    const isOpen = openSubmenus[typeKey || ''];
    
    const filteredSessions = sessions.filter(s => {
      if (typeKey === 'resume') return s.type === 'resume';
      if (typeKey === 'letter') return s.type === 'cover-letter';
      if (typeKey === 'resignation') return s.type === 'resignation-letter';
      if (typeKey === 'copilot') return s.type === 'career-copilot';
      return false;
    });

    return (
      <div className="space-y-1">
        <div 
          className={`flex items-center group rounded-xl transition-all ${
            isActive && !hasSubmenu
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
              : theme === 'dark' ? 'text-[#a0a0a0] hover:bg-[#1f1f1f] hover:text-white' : 'text-[#64748b] hover:bg-slate-50 hover:text-[#0F172A]'
          } ${isCollapsed && !isMobileOpen ? 'md:justify-center' : ''}`}
        >
          <button
            onClick={() => {
              if (hasSubmenu) {
                if (isCollapsed && !isMobileOpen) setIsCollapsed(false);
                toggleSubmenu(typeKey!);
              }
              setView(id);
              if (isMobileOpen && !hasSubmenu) setIsMobileOpen(false);
            }}
            className="flex-1 flex items-center gap-4 p-3 overflow-hidden"
          >
            <span className="flex-shrink-0">{icon}</span>
            {(!isCollapsed || isMobileOpen) && <span className="font-semibold text-sm truncate">{label}</span>}
            {hasSubmenu && (!isCollapsed || isMobileOpen) && (
              <ChevronDown size={14} className={`ml-auto transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            )}
          </button>
          
          {hasSubmenu && onPlusClick && (!isCollapsed || isMobileOpen) && (
            <button 
              onClick={(e) => { e.stopPropagation(); onPlusClick(); }}
              className="p-3 hover:text-indigo-500 transition-colors"
              title={`New ${label}`}
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {hasSubmenu && isOpen && (!isCollapsed || isMobileOpen) && (
          <div className="ml-9 mt-1 space-y-1 border-l border-slate-200 dark:border-white/10 pl-3">
            {filteredSessions.length === 0 ? (
              <div className="p-2 text-[10px] text-slate-400 italic leading-relaxed">
                No {label.toLowerCase()}s found. Click the <span className="inline-flex items-center justify-center w-3 h-3 border border-current rounded text-[8px] font-bold mx-0.5"><Plus size={8} /></span> icon or <button onClick={onPlusClick} className="text-indigo-500 font-bold hover:underline">Start Here</button> to begin.
              </div>
            ) : (
              filteredSessions.map(s => (
                <div key={s.id} className="relative flex items-center">
                  {editingId === s.id ? (
                    <div className="flex-1 flex items-center gap-1 p-1">
                      <input 
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleFinishRename(s.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleFinishRename(s.id)}
                        className={`w-full text-[11px] p-1 rounded border outline-none ${theme === 'dark' ? 'bg-[#191919] border-white/10 text-white' : 'bg-white border-slate-200 text-[#0F172A]'}`}
                      />
                      <button onClick={() => handleFinishRename(s.id)} className="text-emerald-500 hover:text-emerald-400 p-1"><Check size={14}/></button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => { setActiveSessionId(s.id); setView(id); if(isMobileOpen) setIsMobileOpen(false); }}
                        className={`flex-1 text-left p-2 pr-8 rounded-md text-[11px] truncate transition-all ${
                          activeSessionId === s.id && currentView === id
                            ? theme === 'dark' ? 'text-white bg-white/5 font-semibold' : 'text-[#0F172A] bg-slate-100 font-bold'
                            : theme === 'dark' ? 'text-[#a0a0a0] hover:text-white' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {s.title}
                      </button>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center pr-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === s.id ? null : s.id); }}
                          className={`p-1.5 transition-colors rounded-md ${menuOpenId === s.id ? 'bg-indigo-500/10 text-indigo-500' : theme === 'dark' ? 'text-slate-200 hover:text-indigo-400' : 'text-slate-600 hover:text-indigo-600'}`}
                        >
                          <MoreHorizontal size={14}/>
                        </button>
                        
                        {menuOpenId === s.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setMenuOpenId(null)} />
                            <div className={`absolute right-0 top-full mt-1 z-50 min-w-[120px] py-1.5 rounded-xl border shadow-2xl ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10 shadow-black/50' : 'bg-white border-slate-200 shadow-slate-200/50'}`}>
                              <button 
                                onClick={() => handleStartRename(s.id, s.title)}
                                className={`w-full text-left px-3 py-2 text-[10px] font-bold flex items-center gap-2 transition-colors ${theme === 'dark' ? 'text-slate-300 hover:bg-white/5 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
                              >
                                <Edit2 size={12}/> Rename
                              </button>
                              <button 
                                onClick={() => { setConfirmDeleteId(s.id); setMenuOpenId(null); }}
                                className={`w-full text-left px-3 py-2 text-[10px] font-bold flex items-center gap-2 transition-colors ${theme === 'dark' ? 'text-red-400 hover:bg-red-400/10' : 'text-red-500 hover:bg-red-50'}`}
                              >
                                <Trash2 size={12}/> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 transition-all duration-300 md:relative md:translate-x-0 flex flex-col no-print
    ${theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0] shadow-xl md:shadow-none'} border-r
    ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
    ${isCollapsed && !isMobileOpen ? 'md:w-20' : 'md:w-72'}
  `;

  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
              <div className="flex items-center gap-3 mb-4 text-red-500">
                <AlertTriangle size={24} />
                <h3 className="font-bold text-lg">Permanently Delete?</h3>
              </div>
              <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>This chat and any generated documents within it will be lost forever. Are you sure?</p>
              <div className="flex gap-3">
                 <button 
                   onClick={() => setConfirmDeleteId(null)}
                   className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={() => { onDeleteSession(confirmDeleteId); setConfirmDeleteId(null); }}
                   className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-600/20"
                 >
                   Delete
                 </button>
              </div>
           </div>
        </div>
      )}

      <aside className={sidebarClasses}>
        <div className={`p-6 flex items-center justify-between ${isCollapsed && !isMobileOpen ? 'md:justify-center' : ''}`}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView(AppView.OVERVIEW)}>
            <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="none" className="w-8 h-8 flex-shrink-0" style={{ transform: 'rotate(90deg)' }}>
              <path fill={theme === 'dark' ? "#ffffff" : "#0F172A"} d="M15.258 23.994C28.83 47.05 58.626 88.46 89.648 116.95l92.844 62.818-119.47-50.465-1.92-.315c24.343 38.854 55.535 70.026 92.005 93.282l127.3 60.376L155.9 253.238c40.5 39.53 100.607 75.72 151.4 98.698l63.925 24.37-82.89-11.066-.208.016c52.34 51.69 149.044 110.424 207.45 130.998-1.585-13.49-4.593-28.014-8.82-42.758-16.24-34.366-48.9-49.708-83.413-61.435 2.364-.095 4.702-.14 7.017-.126 22.757.123 43.142 5.6 60.71 18.603-13.84-30.897-32.514-59.165-54.246-76.754l.39.037c-26.092-21.573-56.34-40.94-89.81-58.67 46.746 9.337 102.14 38.655 136.29 63.16l.122.01c-34.19-46.3-90.762-97.425-140.103-130.974L208.53 148.023l136.18 37.754c-41.767-26.197-80.66-45.64-123.83-61.582L108.19 87.82l122.273 13.176C176.465 68.613 75.36 38.786 15.26 23.994h-.002z" />
            </svg>
            {(!isCollapsed || isMobileOpen) && (
              <span className={`text-2xl font-extrabold tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
                zysculpt
              </span>
            )}
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="md:hidden">
            <X size={24} className={theme === 'dark' ? 'text-white' : 'text-[#0F172A]'} />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto mt-2 custom-scrollbar">
          {renderNavButton(AppView.OVERVIEW, 'Overview', <LayoutDashboard size={20} />)}
          {renderNavButton(AppView.CAREER_COPILOT, 'Career Copilot', <Compass size={20} />, 'copilot', () => onNewSession('career-copilot'))}
          {renderNavButton(AppView.RESUME_BUILDER, 'Resume Builder', <FileText size={20} />, 'resume', () => onNewSession('resume'))}
          {renderNavButton(AppView.COVER_LETTER, 'Cover Letter', <Mail size={20} />, 'letter', () => onNewSession('cover-letter'))}
          {renderNavButton(AppView.RESIGNATION_LETTER, 'Resignation Letter', <DoorOpen size={20} />, 'resignation', () => onNewSession('resignation-letter'))}
          
          <div className={`h-px my-3 mx-2 ${theme === 'dark' ? 'bg-[#2a2a2a]' : 'bg-slate-100'}`} />

          {renderNavButton(AppView.DOCUMENTS, 'Documents', <FolderOpen size={20} />)}
          {renderNavButton(AppView.FIND_JOB, 'Job Search', <Search size={20} />)}
          {renderNavButton(AppView.SETTINGS, 'Account', <Settings size={20} />)}
        </nav>

        <div className="p-4 space-y-2 border-t border-slate-200 dark:border-white/5">
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
              theme === 'dark' ? 'text-[#a0a0a0] hover:bg-[#1f1f1f] hover:text-white' : 'text-[#64748b] hover:bg-slate-50 hover:text-[#0F172A]'
            } ${isCollapsed && !isMobileOpen ? 'md:justify-center' : ''}`}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            {(!isCollapsed || isMobileOpen) && <span className="font-medium text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden md:flex w-full items-center gap-4 p-3 rounded-xl transition-all ${
              theme === 'dark' ? 'text-[#a0a0a0] hover:bg-[#1f1f1f] hover:text-white' : 'text-[#64748b] hover:bg-slate-50 hover:text-[#0F172A]'
            } ${isCollapsed ? 'md:justify-center' : ''}`}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!isCollapsed && <span className="font-medium text-sm">Collapse Menu</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
