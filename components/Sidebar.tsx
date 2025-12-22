
import React from 'react';
import { 
  FileText, 
  Search, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  X
} from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const LogoIcon = () => (
  <svg 
    viewBox="0 0 512 512" 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    className="w-9 h-9 flex-shrink-0" 
    style={{ transform: 'rotate(90deg)' }}
  >
    <path 
      fill="#ffffff" 
      d="M15.258 23.994C28.83 47.05 58.626 88.46 89.648 116.95l92.844 62.818-119.47-50.465-1.92-.315c24.343 38.854 55.535 70.026 92.005 93.282l127.3 60.376L155.9 253.238c40.5 39.53 100.607 75.72 151.4 98.698l63.925 24.37-82.89-11.066-.208.016c52.34 51.69 149.044 110.424 207.45 130.998-1.585-13.49-4.593-28.014-8.82-42.758-16.24-34.366-48.9-49.708-83.413-61.435 2.364-.095 4.702-.14 7.017-.126 22.757.123 43.142 5.6 60.71 18.603-13.84-30.897-32.514-59.165-54.246-76.754l.39.037c-26.092-21.573-56.34-40.94-89.81-58.67 46.746 9.337 102.14 38.655 136.29 63.16l.122.01c-34.19-46.3-90.762-97.425-140.103-130.974L208.53 148.023l136.18 37.754c-41.767-26.197-80.66-45.64-123.83-61.582L108.19 87.82l122.273 13.176C176.465 68.613 75.36 38.786 15.26 23.994h-.002z"
    />
  </svg>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const menuItems = [
    { id: AppView.RESUME_BUILDER, label: 'AI Resume Builder', icon: <FileText size={20} /> },
    { id: AppView.FIND_JOB, label: 'Find Job', icon: <Search size={20} /> },
    { id: AppView.SETTINGS, label: 'Settings', icon: <Settings size={20} /> },
  ];

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 transition-all duration-300 md:relative md:translate-x-0
    bg-[#121212] border-r border-[#2a2a2a] flex flex-col no-print
    ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
    ${isCollapsed && !isMobileOpen ? 'md:w-20' : 'md:w-64'}
  `;

  const handleNavClick = (view: AppView) => {
    setView(view);
    if (isMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={sidebarClasses}>
        <div className={`p-6 flex items-center justify-between ${isCollapsed && !isMobileOpen ? 'md:justify-center' : 'gap-1.5'}`}>
          <div className="flex items-center gap-1.5">
            <LogoIcon />
            {(!isCollapsed || isMobileOpen) && (
              <span className="text-2xl font-extrabold tracking-tighter text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                zysculpt
              </span>
            )}
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="md:hidden text-[#a0a0a0]">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 mt-4 px-3 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-lg transition-colors group ${
                currentView === item.id 
                  ? 'bg-[#2a2a2a] text-white' 
                  : 'text-[#a0a0a0] hover:bg-[#1f1f1f] hover:text-white'
              } ${isCollapsed && !isMobileOpen ? 'md:justify-center' : ''}`}
              title={isCollapsed ? item.label : ''}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {(!isCollapsed || isMobileOpen) && <span className="font-medium text-sm truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#2a2a2a]">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden md:flex w-full items-center gap-4 p-3 rounded-lg text-[#a0a0a0] hover:bg-[#1f1f1f] hover:text-white transition-colors ${isCollapsed ? 'md:justify-center' : ''}`}
          >
            <span className="flex-shrink-0">
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </span>
            {!isCollapsed && <span className="font-medium text-sm">Collapse Sidebar</span>}
          </button>
          
          <button className={`w-full flex items-center gap-4 p-3 mt-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors ${isCollapsed && !isMobileOpen ? 'md:justify-center' : ''}`}>
            <span className="flex-shrink-0"><LogOut size={20} /></span>
            {(!isCollapsed || isMobileOpen) && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
