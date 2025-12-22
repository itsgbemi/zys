
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import AIResumeBuilder from './components/AIResumeBuilder';
import JobSearch from './components/JobSearch';
import Settings from './components/Settings';
import { AppView } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.RESUME_BUILDER);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

  const renderView = () => {
    switch (currentView) {
      case AppView.RESUME_BUILDER:
        return <AIResumeBuilder onToggleMobile={toggleMobileSidebar} />;
      case AppView.FIND_JOB:
        return <JobSearch />;
      case AppView.SETTINGS:
        return <Settings />;
      default:
        return <AIResumeBuilder onToggleMobile={toggleMobileSidebar} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#191919] text-white overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      <main className="flex-1 overflow-hidden relative w-full">
        <div className="h-full w-full">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
