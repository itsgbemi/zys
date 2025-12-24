
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import AIResumeBuilder from './components/AIResumeBuilder';
import JobSearch from './components/JobSearch';
import Settings from './components/Settings';
import Documents from './components/Documents';
import { AppView, ChatSession, Theme } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.RESUME_BUILDER);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('zysculpt-theme') as Theme) || 'dark');

  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: 'default',
      title: 'Initial Sculpt',
      lastUpdated: Date.now(),
      messages: [{
        id: '1',
        role: 'assistant',
        content: "Welcome to Zysculpt! I'm your AI Resume Architect. Let's build a resume that stands out to both recruiters and ATS algorithms. To start, please paste the job description you're targeting or tell me what kind of role you're looking for.",
        timestamp: Date.now(),
      }],
      jobDescription: '',
      resumeText: '',
      finalResume: null
    }
  ]);
  const [activeSessionId, setActiveSessionId] = useState('default');

  useEffect(() => {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('zysculpt-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

  const updateSession = (sessionId: string, updates: Partial<ChatSession>) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...updates, lastUpdated: Date.now() } : s));
  };

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Resume Sculpt',
      lastUpdated: Date.now(),
      messages: [{
        id: '1',
        role: 'assistant',
        content: "Welcome to Zysculpt! I'm your AI Resume Architect. To start, please paste the job description you're targeting or tell me what kind of role you're looking for.",
        timestamp: Date.now(),
      }],
      jobDescription: '',
      resumeText: '',
      finalResume: null
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
    setCurrentView(AppView.RESUME_BUILDER);
  };

  const renderView = () => {
    const commonProps = { onToggleMobile: toggleMobileSidebar, theme };
    
    switch (currentView) {
      case AppView.RESUME_BUILDER:
        return (
          <AIResumeBuilder 
            {...commonProps}
            sessions={sessions}
            activeSessionId={activeSessionId}
            updateSession={updateSession}
            setSessions={setSessions}
          />
        );
      case AppView.DOCUMENTS:
        return (
          <Documents 
            {...commonProps}
            sessions={sessions}
            onSelectSession={(id) => {
              setActiveSessionId(id);
              setCurrentView(AppView.RESUME_BUILDER);
            }}
          />
        );
      case AppView.FIND_JOB:
        return <JobSearch {...commonProps} />;
      case AppView.SETTINGS:
        return <Settings {...commonProps} />;
      default:
        return <AIResumeBuilder 
          {...commonProps}
          sessions={sessions}
          activeSessionId={activeSessionId}
          updateSession={updateSession}
          setSessions={setSessions}
        />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        theme={theme}
        toggleTheme={toggleTheme}
        sessions={sessions}
        activeSessionId={activeSessionId}
        setActiveSessionId={setActiveSessionId}
        onNewSession={createNewSession}
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
