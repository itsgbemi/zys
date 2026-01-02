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
  Menu
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
        fill: theme === 'dark' ? '#6366f1' : '#4f46e5'
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
              className="p-3 hover:text-indigo-500 transition-colors"
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {hasSubmenu && isOpen && (!isCollapsed || isMobileOpen) && (
          <div className="ml-9 mt-1 space-y-1 border-l border-slate-200 dark:border-white/10 pl-3">
            {filteredSessions.map(s => (
              <div key={s.id} className="group/item flex items-center relative pr-2">
                <button 
                  onClick={() => { setActiveSessionId(s.id); setView(id); if(isMobileOpen) setIsMobileOpen(false); }}
                  className={`flex-1 text-left p-2 rounded-md text-[11px] truncate transition-all ${activeSessionId === s.id && currentView === id ? 'text-white bg-white/5 font-semibold' : 'text-[#a0a0a0] hover:text-white'}`}
                >
                  {s.title}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 md:relative md:translate-x-0 flex flex-col no-print ${theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0]'} border-r ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'} ${isCollapsed && !isMobileOpen ? 'md:w-20' : 'md:w-72'}`}>
      <div className={`p-6 flex items-center justify-between ${isCollapsed && !isMobileOpen ? 'md:justify-center' : ''}`}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView(AppView.OVERVIEW)}>
          <ZysculptLogo theme={theme} size={32} />
          {(!isCollapsed || isMobileOpen) && <span className="text-2xl font-black tracking-tighter" style={{ fontFamily: "'DM Sans', sans-serif" }}>zysculpt</span>}
        </div>
      </div>
      
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto mt-2">
        {renderNavButton(AppView.OVERVIEW, 'Overview', <LayoutDashboard size={20} />)}
        {renderNavButton(AppView.CAREER_COPILOT, 'Roadmap', <Compass size={20} />, 'copilot', () => onNewSession('career-copilot'))}
        {renderNavButton(AppView.RESUME_BUILDER, 'Resume Builder', <FileText size={20} />, 'resume', () => onNewSession('resume'))}
        {renderNavButton(AppView.COVER_LETTER, 'Cover Letter', <Mail size={20} />, 'letter', () => onNewSession('cover-letter'))}
        {renderNavButton(AppView.RESIGNATION_LETTER, 'Resignation', <DoorOpen size={20} />, 'resignation', () => onNewSession('resignation-letter'))}
        <div className="h-px my-3 mx-2 bg-slate-100 dark:bg-[#2a2a2a]" />
        {renderNavButton(AppView.KNOWLEDGE_HUB, 'Skill Lab', <Zap size={20} />)}
        {renderNavButton(AppView.DOCUMENTS, 'My Documents', <FolderOpen size={20} />)}
        {renderNavButton(AppView.FIND_JOB, 'Job Search', <Search size={20} />)}
        {renderNavButton(AppView.SETTINGS, 'Settings', <SettingsIcon size={20} />)}
      </nav>

      <div className="p-4 space-y-2 border-t border-slate-100 dark:border-white/5">
        <button onClick={() => setIsCollapsed(!isCollapsed)} className={`hidden md:flex w-full items-center gap-4 p-3 rounded-xl transition-all text-[#a0a0a0] hover:bg-[#1f1f1f] hover:text-white ${isCollapsed ? 'justify-center' : ''}`}>
          {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          {!isCollapsed && <span className="font-medium text-sm">Minimize</span>}
        </button>
        <button onClick={onLogout} className={`w-full flex items-center gap-4 p-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all ${isCollapsed && !isMobileOpen ? 'md:justify-center' : ''}`}>
          <LogOut size={20} />
          {(!isCollapsed || isMobileOpen) && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;