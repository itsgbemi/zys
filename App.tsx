
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import AIResumeBuilder from './components/AIResumeBuilder';
import CoverLetterBuilder from './components/CoverLetterBuilder';
import ResignationLetterBuilder from './components/ResignationLetterBuilder';
import CareerCopilot from './components/CareerCopilot';
import JobSearch from './components/JobSearch';
import Settings from './components/Settings';
import Documents from './components/Documents';
import { AppView, ChatSession, Theme, UserProfile } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.OVERVIEW);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('zysculpt-theme') as Theme) || 'dark');

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('zysculpt-profile');
    return saved ? JSON.parse(saved) : {
      fullName: '',
      title: '',
      email: '',
      phone: '',
      location: '',
      linkedIn: '',
      baseResumeText: ''
    };
  });

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('zysculpt-sessions');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'default-copilot',
        title: 'Career Growth Strategy',
        lastUpdated: Date.now(),
        type: 'career-copilot',
        messages: [{
          id: '1',
          role: 'assistant',
          content: "Hello! I'm your Career Copilot. What are your big career goals for the next 365 days? Let's break them down into daily wins.",
          timestamp: Date.now(),
        }],
        finalResume: null
      }
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState(sessions[0].id);

  useEffect(() => {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('zysculpt-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('zysculpt-sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('zysculpt-profile', JSON.stringify(userProfile));
  }, [userProfile]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

  const updateSession = (sessionId: string, updates: Partial<ChatSession>) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...updates, lastUpdated: Date.now() } : s));
  };

  const deleteSession = (sessionId: string) => {
    const filtered = sessions.filter(s => s.id !== sessionId);
    setSessions(filtered);
    if (activeSessionId === sessionId && filtered.length > 0) {
      setActiveSessionId(filtered[0].id);
    } else if (filtered.length === 0) {
      createNewSession('career-copilot');
    }
  };

  const renameSession = (sessionId: string, newTitle: string) => {
    updateSession(sessionId, { title: newTitle });
  };

  const createNewSession = (type: 'resume' | 'cover-letter' | 'resignation-letter' | 'career-copilot' = 'resume') => {
    const newId = Date.now().toString();
    let welcomeMsg = '';
    let targetView = AppView.RESUME_BUILDER;
    let defaultTitle = '';

    if (type === 'resume') {
      welcomeMsg = "I'm ready to build your next resume. Paste a job description or upload your current CV to begin.";
      targetView = AppView.RESUME_BUILDER;
      defaultTitle = 'New Resume Build';
    } else if (type === 'cover-letter') {
      welcomeMsg = "Let's write a compelling cover letter. Tell me about the role you're applying for.";
      targetView = AppView.COVER_LETTER;
      defaultTitle = 'New Cover Letter';
    } else if (type === 'resignation-letter') {
      welcomeMsg = "I'll help you write a professional resignation letter. Tell me about your current role and notice period.";
      targetView = AppView.RESIGNATION_LETTER;
      defaultTitle = 'New Resignation Letter';
    } else if (type === 'career-copilot') {
      welcomeMsg = "Ready for the next 365 days? What's the main goal we're crushing this year?";
      targetView = AppView.CAREER_COPILOT;
      defaultTitle = 'Career Growth Strategy';
    }

    const newSession: ChatSession = {
      id: newId,
      title: defaultTitle,
      lastUpdated: Date.now(),
      type: type,
      messages: [{ id: '1', role: 'assistant', content: welcomeMsg, timestamp: Date.now() }],
      finalResume: null,
      resumeText: userProfile.baseResumeText || undefined // Auto-populate from profile
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
    setCurrentView(targetView);
  };

  const handleSculptFromJob = (job: { title: string, company: string, description: string }, type: 'resume' | 'cover-letter') => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: `${type === 'resume' ? 'Resume' : 'Letter'}: ${job.title} @ ${job.company}`,
      lastUpdated: Date.now(),
      type: type,
      jobDescription: job.description,
      messages: [{ id: '1', role: 'assistant', content: `Job details imported for **${job.title}** at **${job.company}**. ${type === 'resume' ? "Let's align your resume." : "Let's draft a cover letter."}`, timestamp: Date.now() }],
      finalResume: null,
      resumeText: userProfile.baseResumeText || undefined
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
    setCurrentView(type === 'resume' ? AppView.RESUME_BUILDER : AppView.COVER_LETTER);
  };

  const renderView = () => {
    const commonProps = { 
      onToggleMobile: toggleMobileSidebar, 
      theme,
      sessions,
      activeSessionId,
      updateSession,
      setSessions,
      userProfile
    };
    
    switch (currentView) {
      case AppView.OVERVIEW:
        return <Overview {...commonProps} setView={setCurrentView} />;
      case AppView.RESUME_BUILDER:
        return <AIResumeBuilder {...commonProps} />;
      case AppView.COVER_LETTER:
        return <CoverLetterBuilder {...commonProps} />;
      case AppView.RESIGNATION_LETTER:
        return <ResignationLetterBuilder {...commonProps} />;
      case AppView.CAREER_COPILOT:
        return <CareerCopilot {...commonProps} />;
      case AppView.DOCUMENTS:
        return (
          <Documents 
            onToggleMobile={toggleMobileSidebar}
            theme={theme}
            sessions={sessions}
            onSelectSession={(id) => {
              const session = sessions.find(s => s.id === id);
              setActiveSessionId(id);
              if (session?.type === 'cover-letter') setCurrentView(AppView.COVER_LETTER);
              else if (session?.type === 'resignation-letter') setCurrentView(AppView.RESIGNATION_LETTER);
              else if (session?.type === 'career-copilot') setCurrentView(AppView.CAREER_COPILOT);
              else setCurrentView(AppView.RESUME_BUILDER);
            }}
          />
        );
      case AppView.FIND_JOB:
        return <JobSearch onToggleMobile={toggleMobileSidebar} theme={theme} onSculptResume={(job) => handleSculptFromJob(job, 'resume')} onSculptLetter={(job) => handleSculptFromJob(job, 'cover-letter')} />;
      case AppView.SETTINGS:
        return <Settings onToggleMobile={toggleMobileSidebar} theme={theme} userProfile={userProfile} setUserProfile={setUserProfile} />;
      default:
        return <Overview {...commonProps} setView={setCurrentView} />;
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
        onDeleteSession={deleteSession}
        onRenameSession={renameSession}
      />
      <main className="flex-1 overflow-hidden relative w-full">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
