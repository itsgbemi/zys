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
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  Menu,
  Check,
  ChevronRight,
  Info
} from 'lucide-react';
import { AppView, ChatSession, Theme } from '../types';

export const ZysculptLogo = ({ theme, size = 24 }: { theme: Theme, size?: number }) => (
  <div 
    className="flex-shrink-0 transition-transform duration-500 hover:scale-110"
    style={{ width: size, height: size }}
  >
    <svg 
      viewBox="0 0 512 512" 
      xmlns="http://www.w3.org/2000/svg" 
      className="w-full h-full"
      style={{ 
        transform: 'matrix(-1, 0, 0, 1, 0, 0)',
        fill: 'currentColor'
      }}
    >
      <path d="M15.258 23.994C28.83 47.05 58.626 88.46 89.648 116.95l92.844 62.818-119.47-50.465-1.92-.315c24.343 38.854 55.535 70.026 92.005 93.282l127.3 60.376L155.9 253.238c40.5 39.53 100.607 75.72 151.4 98.698l63.925 24.37-82.89-11.066-.208.016c52.34 51.69 149.044 110.424 207.45 130.998-1.585-13.49-4.593-28.014-8.82-42.758-16.24-34.366-48.9-49.708-83.413-61.435 2.364-.095 4.702-.14 7.017-.126 22.757.123 43.142 5.6 60.71 18.603-13.84-30.897-32.514-59.165-54.246-76.754l.39.037c-26.092-21.573-56.34-40.94-89.81-58.67 46.746 9.337 102.14 38.655 136.29 63.16l.122.01c-34.19-46.3-90.762-97.425-140.103-130.974L208.53 148.023l136.18 37.754c-41.767-26.197-80.66-45.64-123.83-61.582L108.19 87.82l122.273 13.176C176.465 68.613 75.36 38.786 15.26 23.994h-.002z" />
    </svg>
  </div>
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
              : theme === 'dark' ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
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
            <span className="flex-shrink-0">{icon}</span>
            {(!isCollapsed || isMobileOpen) && <span className="font-semibold text-sm truncate">{label}</span>}
            {hasSubmenu && (!isCollapsed || isMobileOpen) && (
              <ChevronDown size={14} className={`ml-auto transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            )}
          </button>
          
          {hasSubmenu && onPlusClick && (!isCollapsed || isMobileOpen) && (
            <button 
              onClick={(e) => { e.stopPropagation(); onPlusClick(); }}
              className="p-3 hover:text-[#1918f0] transition-colors"
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {hasSubmenu && isOpen && (!isCollapsed || isMobileOpen) && (
          <div className={`ml-9 mt-1 space-y-1 border-l pl-3 ${theme === 'dark' ? 'border-white/5' : 'border-slate-200'}`}>
            {filteredSessions.length === 0 ? (
              <div className="py-2 px-1 pr-4">
                 <p className="text-[10px] leading-relaxed opacity-30 font-medium italic">
                   No {label.toLowerCase()}s. Click <span className="text-[#1918f0] font-black">+</span> to start.
                 </p>
              </div>
            ) : (
              filteredSessions.map(s => (
                <div key={s.id} className="group/item flex items-center relative pr-2">
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
                          activeSessionId === s.id && currentView === id 
                            ? 'text-white bg-[#1918f0] font-bold' 
                            : theme === 'dark' ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {s.title}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === s.id ? null : s.id); }}
                        className="opacity-0 group-hover/item:opacity-100 p-1.5 hover:bg-[#1918f0]/10 rounded-lg transition-all text-slate-400 hover:text-[#1918f0]"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                      
                      {activeMenuId === s.id && (
                        <div ref={menuRef} className={`absolute right-[-10px] top-8 z-[60] min-w-[120px] rounded-xl border shadow-2xl p-1 animate-in zoom-in-95 ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                          <button onClick={() => handleStartRename(s.id, s.title)} className="w-full flex items-center gap-2 p-2 rounded-lg text-[11px] font-bold hover:bg-[#1918f0] hover:text-white transition-colors text-left">
                             <Edit2 size={12}/> Rename
                          </button>
                          <button onClick={() => { onDeleteSession(s.id); setActiveMenuId(null); }} className="w-full flex items-center gap-2 p-2 rounded-lg text-[11px] font-bold hover:bg-red-500 hover:text-white transition-colors text-left">
                             <Trash2 size={12}/> Delete
                          </button>
                        </div>
                      )}
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

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 md:relative md:translate-x-0 flex flex-col no-print font-['Roboto',_sans-serif] ${theme === 'dark' ? 'bg-[#121212] border-white/5 text-white' : 'bg-white border-slate-200 text-slate-900'} border-r ${isMobileOpen ? 'translate-x-0 w-72 shadow-2xl shadow-black/50' : '-translate-x-full md:translate-x-0'} ${isCollapsed && !isMobileOpen ? 'md:w-20' : 'md:w-72'}`}>
      
      <div className={`p-6 flex items-center justify-between ${isCollapsed && !isMobileOpen ? 'md:justify-center' : ''}`}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView(AppView.OVERVIEW)}>
          <ZysculptLogo theme={theme} size={32} />
          {(!isCollapsed || isMobileOpen) && <span className="text-2xl font-black tracking-tighter">zysculpt</span>}
        </div>
        <div className="flex items-center gap-2">
           <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className={`hidden md:flex p-2 hover:bg-white/5 rounded-xl transition-all ${isCollapsed ? 'rotate-180' : ''}`}
           >
              {isCollapsed ? <PanelLeftOpen size={20} className="opacity-20" /> : <PanelLeftClose size={20} className="opacity-20" />}
           </button>
           {isMobileOpen && (
              <button onClick={() => setIsMobileOpen(false)} className="md:hidden p-2 hover:bg-white/5 rounded-xl">
                <X size={20} />
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
  );
};

export default Sidebar;