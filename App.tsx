
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
import KnowledgeHub from './components/KnowledgeHub';
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
      baseResumeText: '',
      dailyAvailability: 2
    };
  });

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('zysculpt-sessions');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'default-copilot',
        title: 'Career Progression Plan',
        lastUpdated: Date.now(),
        type: 'career-copilot',
        messages: [{
          id: '1',
          role: 'assistant',
          content: "Welcome to your **Career Roadmap**. Let's design your professional future. What is your primary career objective for the next 3 to 12 months?",
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
    if (activeSessionId === sessionId && filtered.length > 0) setActiveSessionId(filtered[0].id);
    else if (filtered.length === 0) createNewSession('career-copilot');
  };

  const createNewSession = (type: 'resume' | 'cover-letter' | 'resignation-letter' | 'career-copilot' = 'resume', title?: string, jobDesc?: string, jobContext?: string) => {
    const newId = Date.now().toString();
    
    let welcomeMessage = "How can I help you today?";
    
    if (jobContext) {
      welcomeMessage = `I've imported the details for **${jobContext}**. I'm ready to help you tailor a high-impact ${type === 'resume' ? 'resume' : 'cover letter'} for this specific role. Shall we start by reviewing how your current experience aligns with their requirements?`;
    } else {
      if (type === 'resume') welcomeMessage = "Welcome to the **Resume Architect**. I'm ready to build a professional, ATS-optimized resume. To start, you can paste a job description or share a few recent career highlights.";
      if (type === 'cover-letter') welcomeMessage = "Let's draft a persuasive **Cover Letter**. Tell me about the role you're targeting and what makes you a great fit, and I'll help you strike the perfect tone.";
      if (type === 'resignation-letter') welcomeMessage = "I'll help you draft a professional and graceful **Resignation Letter**. Please share your current role and your planned notice period.";
      if (type === 'career-copilot') welcomeMessage = "I'm your **Career Strategist**. What major professional milestone are we working toward? I'll help you break it down into a clear, daily action plan.";
    }

    const newSession: ChatSession = {
      id: newId,
      title: title || (type === 'resume' ? 'New Resume' : type === 'cover-letter' ? 'New Letter' : type === 'resignation-letter' ? 'Resignation' : 'New Roadmap'),
      lastUpdated: Date.now(),
      type: type,
      jobDescription: jobDesc,
      messages: [{ id: '1', role: 'assistant', content: welcomeMessage, timestamp: Date.now() }],
      finalResume: null,
      resumeText: userProfile.baseResumeText || undefined
    };

    setSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
    
    if (type === 'resume') setCurrentView(AppView.RESUME_BUILDER);
    else if (type === 'cover-letter') setCurrentView(AppView.COVER_LETTER);
    else if (type === 'resignation-letter') setCurrentView(AppView.RESIGNATION_LETTER);
    else setCurrentView(AppView.CAREER_COPILOT);
  };

  const handleSculptFromJob = (job: { title: string, company: string, description: string }, type: 'resume' | 'cover-letter') => {
    const contextStr = `${job.title} at ${job.company}`;
    createNewSession(type, `${type === 'resume' ? 'Resume' : 'Letter'}: ${contextStr}`, job.description, contextStr);
  };

  const renderView = () => {
    const commonProps = { onToggleMobile: toggleMobileSidebar, theme, sessions, activeSessionId, updateSession, setSessions, userProfile };
    switch (currentView) {
      case AppView.OVERVIEW: return <Overview {...commonProps} setView={setCurrentView} />;
      case AppView.RESUME_BUILDER: return <AIResumeBuilder {...commonProps} />;
      case AppView.COVER_LETTER: return <CoverLetterBuilder {...commonProps} />;
      case AppView.RESIGNATION_LETTER: return <ResignationLetterBuilder {...commonProps} />;
      case AppView.CAREER_COPILOT: return <CareerCopilot {...commonProps} />;
      case AppView.KNOWLEDGE_HUB: return <KnowledgeHub onToggleMobile={toggleMobileSidebar} theme={theme} />;
      case AppView.DOCUMENTS: return <Documents onToggleMobile={toggleMobileSidebar} theme={theme} sessions={sessions} onSelectSession={(id) => { setActiveSessionId(id); setCurrentView(AppView.DOCUMENTS); }} />;
      case AppView.FIND_JOB: return <JobSearch onToggleMobile={toggleMobileSidebar} theme={theme} onSculptResume={(job) => handleSculptFromJob(job, 'resume')} onSculptLetter={(job) => handleSculptFromJob(job, 'cover-letter')} />;
      case AppView.SETTINGS: return <Settings onToggleMobile={toggleMobileSidebar} theme={theme} userProfile={userProfile} setUserProfile={setUserProfile} />;
      default: return <Overview {...commonProps} setView={setCurrentView} />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar 
        currentView={currentView} setView={setCurrentView} 
        isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen}
        theme={theme} toggleTheme={toggleTheme}
        sessions={sessions} activeSessionId={activeSessionId} setActiveSessionId={setActiveSessionId}
        onNewSession={createNewSession} onDeleteSession={deleteSession}
        onRenameSession={(id, title) => updateSession(id, { title })}
      />
      <main className="flex-1 overflow-hidden relative w-full">{renderView()}</main>
    </div>
  );
};

export default App;
