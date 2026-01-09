import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Search, 
  Settings as SettingsIcon, 
  ChevronDown,
  Plus,
  Sun,
  Moon,
  Mail,
  DoorOpen,
  LayoutDashboard,
  Compass,
  MoreHorizontal,
  FolderOpen,
  Zap,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  Edit2,
  AlertCircle,
  Check
} from 'lucide-react';
import { AppView, ChatSession, Theme } from '../types';

export const CustomHamburger = ({ theme }: { theme: Theme }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={theme === 'dark' ? 'text-white' : 'text-black'}>
    <path d="M17.2027 4.90036V6.43657H2.79727V4.90036H17.2027Z" fill="currentColor"></path>
    <path d="M10.9604 13.0635V14.5997H2.79727V13.0635H10.9604Z" fill="currentColor"></path>
  </svg>
);

export const CustomArrowUp = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.3125 0.981587C8.66767 1.0545 8.97902 1.20558 9.2627 1.43374C9.48724 1.61438 9.73029 1.85933 9.97949 2.10854L14.707 6.83608L13.293 8.25014L9 3.95717V15.0431H7V3.95717L2.70703 8.25014L1.29297 6.83608L6.02051 2.10854C6.26971 1.85933 6.51277 1.61438 6.7373 1.43374C6.97662 1.24126 7.28445 1.04542 7.6875 0.981587C7.8973 0.94841 8.1031 0.956564 8.3125 0.981587Z" fill="currentColor"></path>
  </svg>
);

export const CustomClose = ({ theme }: { theme: Theme }) => (
  <svg width="20" height="20" viewBox="240 240 20 20" aria-hidden="true" className={theme === 'dark' ? 'text-white' : 'text-black'}>
    <g stroke="currentColor" strokeWidth="2">
      <path d="M255.6 255.6l-11.2-11.2" vectorEffect="non-scaling-stroke"></path>
      <path d="M255.6 244.4l-11.2 11.2" vectorEffect="non-scaling-stroke"></path>
    </g>
  </svg>
);

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
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, setView, isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen, 
  theme, toggleTheme, sessions, activeSessionId, setActiveSessionId, onNewSession, onDeleteSession, onRenameSession,
  onLogout
}) => {
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    resume: true,
    letter: true,
    resignation: false,
    copilot: false
  });
  
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const toggleSubmenu = (key: string) => {
    if (isCollapsed && !isMobileOpen) {
      setIsCollapsed(false);
      setOpenSubmenus(prev => ({ ...prev, [key]: true }));
    } else {
      setOpenSubmenus(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const handleStartRename = (id: string, currentTitle: string) => {
    setRenamingId(id);
    setRenameValue(currentTitle);
    setActiveMenuId(null);
  };

  const submitRename = () => {
    if (renamingId && renameValue.trim()) {
      onRenameSession(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const renderNavButton = (id: AppView, label: string, icon: React.ReactNode, typeKey?: string, onPlusClick?: () => void) => {
    const isActive = currentView === id;
    const hasSubmenu = typeKey !== undefined;
    const isOpen = openSubmenus[typeKey || ''];
    
    const filteredSessions = sessions.filter(s => {
      if (typeKey === 'resume') return s.type === 'resume';
      if (typeKey === 'copilot') return s.type === 'career-copilot';
      if (typeKey === 'letter') return s.type === 'cover-letter';
      if (typeKey === 'resignation') return s.type === 'resignation-letter';
      return false;
    });

    return (
      <div className="space-y-1 font-['Roboto',_sans-serif]">
        <div 
          className={`flex items-center group rounded-xl transition-all ${
            isActive && !hasSubmenu
              ? 'bg-[#1918f0] text-white shadow-lg shadow-[#1918f0]/20' 
              : theme === 'dark' ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          } ${isCollapsed && !isMobileOpen ? 'md:justify-center' : ''}`}
        >
          <button
            onClick={() => {
              if (hasSubmenu) toggleSubmenu(typeKey!);
              setView(id);
              if (isMobileOpen && !hasSubmenu) setIsMobileOpen(false);
            }}
            className="flex-1 flex items-center gap-4 p-3 overflow-hidden"
          >
            <span className="flex-shrink-0 opacity-80">{icon}</span>
            {(!isCollapsed || isMobileOpen) && <span className="font-semibold text-sm truncate">{label}</span>}
            {hasSubmenu && (!isCollapsed || isMobileOpen) && (
              <ChevronDown size={14} className={`ml-auto transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            )}
          </button>
          
          {hasSubmenu && onPlusClick && (!isCollapsed || isMobileOpen) && (
            <button 
              onClick={(e) => { e.stopPropagation(); onPlusClick(); }}
              className={`p-3 transition-colors ${theme === 'dark' ? 'hover:text-white' : 'hover:text-[#1918f0]'}`}
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {hasSubmenu && isOpen && (!isCollapsed || isMobileOpen) && (
          <div className={`ml-9 mt-1 space-y-1 border-l pl-3 ${theme === 'dark' ? 'border-white/5' : 'border-slate-200'}`}>
            {filteredSessions.length === 0 ? (
              <div className="py-2 px-1 pr-4">
                 <p className="text-[10px] leading-relaxed opacity-40 font-medium italic">
                   No {label.toLowerCase()}s. Click <span className="text-[#1918f0] font-black">+</span> to start.
                 </p>
              </div>
            ) : (
              filteredSessions.map(s => {
                const isSessionActive = activeSessionId === s.id && currentView === id;
                return (
                  <div 
                    key={s.id} 
                    className={`group/item flex items-center relative pr-2 rounded-lg transition-all ${
                      isSessionActive 
                        ? theme === 'dark' ? 'bg-[#2c2c2e]' : 'bg-[#e2eefc]'
                        : theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-100'
                    }`}
                  >
                    {renamingId === s.id ? (
                      <div className="flex-1 flex items-center gap-1 p-1">
                          <input 
                            ref={renameInputRef}
                            className={`w-full bg-transparent border-b border-[#1918f0] text-[11px] outline-none ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onBlur={submitRename}
                            onKeyDown={e => e.key === 'Enter' && submitRename()}
                          />
                          <button onClick={submitRename} className="text-[#1918f0]"><Check size={14}/></button>
                      </div>
                    ) : (
                      <>
                        <button 
                          onClick={() => { setActiveSessionId(s.id); setView(id); if(isMobileOpen) setIsMobileOpen(false); }}
                          className={`flex-1 text-left p-2 rounded-md text-[11px] truncate transition-all ${
                            isSessionActive 
                              ? theme === 'dark' ? 'text-white font-bold' : 'text-[#1c1cf9] font-bold'
                              : theme === 'dark' ? 'text-slate-400 group-hover/item:text-white' : 'text-slate-500 group-hover/item:text-slate-900'
                          }`}
                        >
                          {s.title}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === s.id ? null : s.id); }}
                          className={`opacity-0 group-hover/item:opacity-100 p-1.5 rounded-lg transition-all ${
                            isSessionActive 
                              ? theme === 'dark' ? 'text-white hover:bg-white/10' : 'text-[#1c1cf9] hover:bg-indigo-200/50'
                              : theme === 'dark' ? 'text-slate-500 hover:bg-white/10 hover:text-white' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700'
                          }`}
                        >
                          <MoreHorizontal size={14} />
                        </button>
                        
                        {activeMenuId === s.id && (
                          <div ref={menuRef} className={`absolute right-[-10px] top-8 z-[60] min-w-[120px] rounded-xl border shadow-2xl p-1 animate-in zoom-in-95 ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                            <button onClick={() => handleStartRename(s.id, s.title)} className="w-full flex items-center gap-2 p-2 rounded-lg text-[11px] font-bold hover:bg-[#1918f0] hover:text-white transition-colors text-left">
                              <Edit2 size={12}/> Rename
                            </button>
                            <button onClick={() => { setDeletingId(s.id); setActiveMenuId(null); }} className="group/delete w-full flex items-center gap-2 p-2 rounded-lg text-[11px] font-bold hover:bg-red-500 hover:text-white transition-colors text-left text-[#ff2529]">
                              <Trash2 size={12} className="text-[#ff2529] group-hover/delete:text-white transition-colors"/> Delete
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {deletingId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`w-full max-w-sm p-6 rounded-[32px] border shadow-2xl animate-in zoom-in-95 duration-300 ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-200'}`}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 text-[#ff2529] flex items-center justify-center mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className={`text-xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Delete session?</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                This conversation and all its sculpted data will be permanently removed. Are you ready to let it go?
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setDeletingId(null)}
                  className={`flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all ${theme === 'dark' ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Keep it
                </button>
                <button 
                  onClick={() => { onDeleteSession(deletingId); setDeletingId(null); }}
                  className="flex-1 py-3.5 bg-[#ff2529] text-white rounded-2xl text-sm font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 md:relative md:translate-x-0 flex flex-col no-print font-['Roboto',_sans-serif] ${theme === 'dark' ? 'bg-[#121212] border-white/5 text-white' : 'bg-white border-slate-200 text-slate-900'} border-r ${isMobileOpen ? 'translate-x-0 w-72 shadow-2xl shadow-black/50' : '-translate-x-full md:translate-x-0'} ${isCollapsed && !isMobileOpen ? 'md:w-20' : 'md:w-72'}`}>
        
        <div className={`p-6 flex items-center justify-between ${isCollapsed && !isMobileOpen ? 'md:justify-center' : ''}`}>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView(AppView.OVERVIEW)}>
            {isCollapsed && !isMobileOpen ? (
              <img src="https://res.cloudinary.com/dqhawdcol/image/upload/v1767978528/tbkus5ht2z4okdfqwnv1.svg" className="h-8 w-auto transition-transform hover:scale-110" alt="Logo" />
            ) : (
              <img src="https://res.cloudinary.com/dqhawdcol/image/upload/v1767973402/ntoxmdha6gfchddmr8ye.svg" className="h-8 w-auto transition-transform hover:scale-110" alt="Zysculpt" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)} 
              className={`hidden md:flex p-2 hover:bg-white/5 rounded-xl transition-all ${isCollapsed ? 'rotate-180' : ''}`}
            >
                {isCollapsed ? <PanelLeftOpen size={20} className="opacity-40" /> : <PanelLeftClose size={20} className="opacity-40" />}
            </button>
            {isMobileOpen && (
                <button onClick={() => setIsMobileOpen(false)} className="md:hidden p-2 hover:bg-white/5 rounded-xl transition-all active:scale-90">
                  <CustomClose theme={theme} />
                </button>
            )}
          </div>
        </div>
        
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto mt-2">
          {renderNavButton(AppView.OVERVIEW, 'Overview', <LayoutDashboard size={20} />)}
          {renderNavButton(AppView.CAREER_COPILOT, 'Roadmap', <Compass size={20} />, 'copilot', () => onNewSession('career-copilot'))}
          {renderNavButton(AppView.RESUME_BUILDER, 'Resume Builder', <FileText size={20} />, 'resume', () => onNewSession('resume'))}
          {renderNavButton(AppView.COVER_LETTER, 'Cover Letter', <Mail size={20} />, 'letter', () => onNewSession('cover-letter'))}
          {renderNavButton(AppView.RESIGNATION_LETTER, 'Resignation', <DoorOpen size={20} />, 'resignation', () => onNewSession('resignation-letter'))}
          <div className={`h-px my-3 mx-2 ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`} />
          {renderNavButton(AppView.KNOWLEDGE_HUB, 'Skill Lab', <Zap size={20} />)}
          {renderNavButton(AppView.DOCUMENTS, 'My Documents', <FolderOpen size={20} />)}
          {renderNavButton(AppView.FIND_JOB, 'Job Search', <Search size={20} />)}
          {renderNavButton(AppView.SETTINGS, 'Settings', <SettingsIcon size={20} />)}
        </nav>

        <div className={`p-4 space-y-2 border-t ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
          <button onClick={toggleTheme} className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${theme === 'dark' ? 'text-white hover:bg-white/5' : 'text-slate-600 hover:bg-slate-50'} ${isCollapsed && !isMobileOpen ? 'md:justify-center' : ''}`}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            {(!isCollapsed || isMobileOpen) && <span className="font-bold text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          <button onClick={onLogout} className={`w-full flex items-center gap-4 p-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all active:scale-95 ${isCollapsed && !isMobileOpen ? 'md:justify-center' : ''}`}>
            <LogOut size={20} />
            {(!isCollapsed || isMobileOpen) && <span className="font-black text-sm">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;