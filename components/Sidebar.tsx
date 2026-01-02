
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

const LOGO_URL = "https://res.cloudinary.com/dqhawdcol/image/upload/v1767362945/fotwdvuacn4du6yeldq9.svg";

export const ZysculptLogo = ({ theme, size = 24 }: { theme: Theme, size?: number }) => (
  <div 
    className="flex-shrink-0 transition-transform duration-500 hover:scale-110"
    style={{ width: size, height: size }}
  >
    <img 
      src={LOGO_URL} 
      alt="Zysculpt" 
      className="w-full h-full object-contain"
      style={{ filter: theme === 'dark' ? 'none' : 'invert(1)' }}
    />
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
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

  const startRename = (id: string, currentTitle: string) => {
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

  const confirmDelete = () => {
    if (deletingId) {
      onDeleteSession(deletingId);
      setDeletingId(null);
    }
  };

  const getDocTypeName = (typeKey: string) => {
    switch(typeKey) {
      case 'resume': return 'resume';
      case 'letter': return 'cover letter';
      case 'resignation': return 'resignation letter';
      case 'copilot': return 'career roadmap';
      default: return 'chat';
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

    const docType = getDocTypeName(typeKey || '');

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
                toggleSubmenu(typeKey!);
              }
              setView(id);
              if (isMobileOpen && !hasSubmenu) setIsMobileOpen(false);
            }}
            className="flex-1 flex items-center gap-4 p-3 overflow-hidden"
            title={isCollapsed ? label : ""}
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
            {filteredSessions.length > 0 ? (
              filteredSessions.map(s => (
                <div key={s.id} className="group/item flex items-center relative pr-2">
                  {renamingId === s.id ? (
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={submitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitRename();
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      className={`flex-1 bg-transparent border-b border-indigo-500 outline-none text-[11px] py-1 transition-all ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}
                    />
                  ) : (
                    <>
                      <button 
                        onClick={() => { setActiveSessionId(s.id); setView(id); if(isMobileOpen) setIsMobileOpen(false); }}
                        className={`flex-1 text-left p-2 rounded-md text-[11px] truncate transition-all ${activeSessionId === s.id && currentView === id ? (theme === 'dark' ? 'text-white bg-white/5 font-semibold' : 'text-[#0F172A] bg-slate-100 font-bold') : (theme === 'dark' ? 'text-[#a0a0a0] hover:text-white' : 'text-slate-500 hover:text-slate-900')}`}
                      >
                        {s.title}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === s.id ? null : s.id); }}
                        className={`p-1 text-slate-400 hover:text-indigo-500 transition-all ${activeMenuId === s.id ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'}`}
                      >
                        <MoreHorizontal size={12} />
                      </button>
                    </>
                  )}

                  {activeMenuId === s.id && (
                    <div 
                      ref={menuRef}
                      className={`absolute right-0 top-full mt-1 z-[110] w-36 border rounded-2xl shadow-2xl p-1.5 animate-in zoom-in-95 backdrop-blur-md ${theme === 'dark' ? 'bg-[#1a1a1a]/95 border-white/10' : 'bg-white/95 border-slate-200'}`}
                    >
                      <button onClick={() => startRename(s.id, s.title)} className="w-full flex items-center gap-2.5 p-2 rounded-xl text-[11px] font-bold hover:bg-indigo-600 hover:text-white transition-colors">
                        <Edit2 size={13} /> Rename
                      </button>
                      <button onClick={() => { setDeletingId(s.id); setActiveMenuId(null); }} className="w-full flex items-center gap-2.5 p-2 rounded-xl text-[11px] font-bold text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <button 
                onClick={(e) => { e.stopPropagation(); onPlusClick?.(); if(isMobileOpen) setIsMobileOpen(false); }}
                className={`w-[calc(100%-0.5rem)] text-left p-3 rounded-xl text-[10px] leading-relaxed transition-all mb-1 ${theme === 'dark' ? 'bg-white/5 text-slate-400 hover:text-slate-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
              >
                You haven’t created a {docType} yet. <span className="underline font-bold">Click + icon or here to begin.</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      if (confirm("Sign out and refresh session?")) {
        window.location.reload();
      }
    }
  };

  return (
    <>
      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-sm bg-black/40 animate-in fade-in duration-200">
          <div className={`w-full max-w-sm rounded-[32px] border p-8 shadow-2xl animate-in zoom-in-95 duration-200 ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-200'}`}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Delete Chat?</h3>
              <p className={`text-sm mb-8 leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                This action is permanent and cannot be undone. Are you sure you want to delete this session?
              </p>
              <div className="flex w-full gap-3">
                <button 
                  onClick={() => setDeletingId(null)}
                  className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all ${theme === 'dark' ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isMobileOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 md:relative md:translate-x-0 flex flex-col no-print ${theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a]' : 'bg-white border-[#e2e8f0] shadow-xl md:shadow-none'} border-r ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'} ${isCollapsed && !isMobileOpen ? 'md:w-20' : 'md:w-72'}`}>
        <div className={`p-6 flex items-center justify-between ${isCollapsed && !isMobileOpen ? 'md:justify-center' : ''}`}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setView(AppView.OVERVIEW); if(isMobileOpen) setIsMobileOpen(false); }}>
            <ZysculptLogo theme={theme} size={32} />
            {(!isCollapsed || isMobileOpen) && <span className={`text-2xl font-extrabold tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>zysculpt</span>}
          </div>
          {isMobileOpen && (
            <button onClick={() => setIsMobileOpen(false)} className={`md:hidden p-2 rounded-full ${theme === 'dark' ? 'text-white hover:bg-white/10' : 'text-slate-900 hover:bg-slate-100'}`}>
              <X size={20} />
            </button>
          )}
        </div>
        
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto mt-2 custom-scrollbar">
          {renderNavButton(AppView.OVERVIEW, 'Overview', <LayoutDashboard size={20} />)}
          {renderNavButton(AppView.CAREER_COPILOT, 'Roadmap', <Compass size={20} />, 'copilot', () => onNewSession('career-copilot'))}
          {renderNavButton(AppView.RESUME_BUILDER, 'Resume Builder', <FileText size={20} />, 'resume', () => onNewSession('resume'))}
          {renderNavButton(AppView.COVER_LETTER, 'Cover Letter', <Mail size={20} />, 'letter', () => onNewSession('cover-letter'))}
          {renderNavButton(AppView.RESIGNATION_LETTER, 'Resignation', <DoorOpen size={20} />, 'resignation', () => onNewSession('resignation-letter'))}
          <div className={`h-px my-3 mx-2 ${theme === 'dark' ? 'bg-[#2a2a2a]' : 'bg-slate-100'}`} />
          {renderNavButton(AppView.KNOWLEDGE_HUB, 'Skill Lab', <Zap size={20} />)}
          {renderNavButton(AppView.DOCUMENTS, 'My Documents', <FolderOpen size={20} />)}
          {renderNavButton(AppView.FIND_JOB, 'Job Search', <Search size={20} />)}
          {renderNavButton(AppView.SETTINGS, 'Settings', <SettingsIcon size={20} />)}
        </nav>

        <div className="p-4 space-y-2 border-t border-slate-200 dark:border-white/5">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className={`hidden md:flex w-full items-center gap-4 p-3 rounded-xl transition-all ${theme === 'dark' ? 'text-[#a0a0a0] hover:bg-[#1f1f1f] hover:text-white' : 'text-[#64748b] hover:bg-slate-50 hover:text-[#0F172A]'} ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? "Expand menu" : "Collapse menu"}
          >
            {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            {!isCollapsed && <span className="font-medium text-sm">Minimize Menu</span>}
          </button>
          
          <button onClick={toggleTheme} className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${theme === 'dark' ? 'text-[#a0a0a0] hover:bg-[#1f1f1f] hover:text-white' : 'text-[#64748b] hover:bg-slate-50 hover:text-[#0F172A]'} ${isCollapsed && !isMobileOpen ? 'md:justify-center' : ''}`}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            {(!isCollapsed || isMobileOpen) && <span className="font-medium text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          <button onClick={handleLogout} className={`w-full flex items-center gap-4 p-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all ${isCollapsed && !isMobileOpen ? 'md:justify-center' : ''}`}>
            <LogOut size={20} />
            {(!isCollapsed || isMobileOpen) && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
