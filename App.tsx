
import React, { useState, useEffect, useCallback } from 'react';
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
import { Auth } from './components/Auth';
import { AppView, ChatSession, Theme, UserProfile } from './types';
import { supabase } from './services/supabase';
// Fix: Import Sparkles icon from lucide-react
import { Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>(AppView.OVERVIEW);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('zysculpt-theme') as Theme) || 'dark');
  const [keyPickerVisible, setKeyPickerVisible] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    fullName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    linkedIn: '',
    baseResumeText: '',
    dailyAvailability: 2
  });

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState('');

  // 1. Check for API Key Selection (Mandatory for Pro Models)
  useEffect(() => {
    const checkApiKey = async () => {
      // @ts-ignore
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey && !process.env.API_KEY) {
          setKeyPickerVisible(true);
        }
      }
    };
    checkApiKey();
  }, []);

  const handleOpenKeyPicker = async () => {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      // Proceed immediately as per guidelines
      setKeyPickerVisible(false);
    }
  };

  // 1. Sync Profile to Supabase
  const syncProfile = useCallback(async (profile: UserProfile, userId: string) => {
    try {
      await supabase.from('profiles').upsert({
        id: userId,
        full_name: profile.fullName,
        title: profile.title,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        linkedin: profile.linkedIn,
        base_resume_text: profile.baseResumeText,
        daily_availability: profile.dailyAvailability,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.error("Profile sync error:", e);
    }
  }, []);

  // 2. Sync Session to Supabase
  const syncSession = useCallback(async (chatSession: ChatSession, userId: string) => {
    try {
      await supabase.from('sessions').upsert({
        id: chatSession.id,
        user_id: userId,
        title: chatSession.title,
        type: chatSession.type,
        messages: chatSession.messages,
        job_description: chatSession.jobDescription,
        // Fix: Correct camelCase property names from ChatSession interface
        resume_text: chatSession.resumeText,
        final_resume: chatSession.finalResume,
        career_goal_data: chatSession.careerGoalData,
        style_prefs: chatSession.stylePrefs,
        last_updated: chatSession.lastUpdated
      });
    } catch (e) {
      console.error("Session sync error:", e);
    }
  }, []);

  // 3. Fetch Initial Data
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchData(session.user.id);
      } else {
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async (userId: string) => {
    setAuthLoading(true);
    try {
      const [profileRes, sessionsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('sessions').select('*').eq('user_id', userId).order('last_updated', { ascending: false })
      ]);

      if (profileRes.data) {
        setUserProfile({
          fullName: profileRes.data.full_name || '',
          title: profileRes.data.title || '',
          email: profileRes.data.email || '',
          phone: profileRes.data.phone || '',
          location: profileRes.data.location || '',
          linkedIn: profileRes.data.linkedin || '',
          baseResumeText: profileRes.data.base_resume_text || '',
          dailyAvailability: profileRes.data.daily_availability || 2
        });
      }

      if (sessionsRes.data && sessionsRes.data.length > 0) {
        const mapped: ChatSession[] = sessionsRes.data.map(s => ({
          id: s.id,
          title: s.title,
          type: s.type,
          messages: s.messages,
          jobDescription: s.job_description,
          resumeText: s.resume_text,
          finalResume: s.final_resume,
          careerGoalData: s.career_goal_data,
          stylePrefs: s.style_prefs,
          lastUpdated: s.last_updated
        }));
        setSessions(mapped);
        setActiveSessionId(mapped[0].id);
      } else {
        createNewSession('career-copilot', 'Career Roadmap');
      }
    } catch (e) {
      console.error("Data fetch error:", e);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('zysculpt-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

  const updateSession = (sessionId: string, updates: Partial<ChatSession>) => {
    setSessions(prev => {
      const updated = prev.map(s => s.id === sessionId ? { ...s, ...updates, lastUpdated: Date.now() } : s);
      const sessionToSync = updated.find(s => s.id === sessionId);
      if (sessionToSync && session?.user?.id) {
        syncSession(sessionToSync, session.user.id);
      }
      return updated;
    });
  };

  const deleteSession = async (sessionId: string) => {
    const filtered = sessions.filter(s => s.id !== sessionId);
    setSessions(filtered);
    if (session?.user?.id) {
      await supabase.from('sessions').delete().eq('id', sessionId);
    }
    if (activeSessionId === sessionId && filtered.length > 0) setActiveSessionId(filtered[0].id);
    else if (filtered.length === 0) createNewSession('career-copilot');
  };

  const createNewSession = (type: 'resume' | 'cover-letter' | 'resignation-letter' | 'career-copilot' = 'resume', title?: string, jobDesc?: string, jobContext?: string) => {
    const newId = crypto.randomUUID();
    let welcomeMessage = "How can I help you today?";
    
    if (jobContext) {
      welcomeMessage = `I've imported the details for **${jobContext}**. I'm ready to help you tailor a high-impact ${type === 'resume' ? 'resume' : 'cover letter'} for this specific role.`;
    } else {
      if (type === 'resume') welcomeMessage = "Welcome to the **Resume Architect**. Paste a job description to begin.";
      if (type === 'cover-letter') welcomeMessage = "Let's draft a persuasive **Cover Letter**.";
      if (type === 'resignation-letter') welcomeMessage = "I'll help you draft a professional **Resignation Letter**.";
      if (type === 'career-copilot') welcomeMessage = "I'm your **Career Strategist**. What's our next big goal?";
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
    if (session?.user?.id) syncSession(newSession, session.user.id);
    
    if (type === 'resume') setCurrentView(AppView.RESUME_BUILDER);
    else if (type === 'cover-letter') setCurrentView(AppView.COVER_LETTER);
    else if (type === 'resignation-letter') setCurrentView(AppView.RESIGNATION_LETTER);
    else setCurrentView(AppView.CAREER_COPILOT);
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    if (session?.user?.id) syncProfile(newProfile, session.user.id);
  };

  const handleSculptFromJob = (job: { title: string, company: string, description: string }, type: 'resume' | 'cover-letter') => {
    const contextStr = `${job.title} at ${job.company}`;
    createNewSession(type, `${type === 'resume' ? 'Resume' : 'Letter'}: ${contextStr}`, job.description, contextStr);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSessions([]);
    setActiveSessionId('');
  };

  if (authLoading) {
    return (
      <div className="h-screen w-full bg-[#121212] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white font-bold text-xs tracking-widest uppercase opacity-40">Synchronizing Flight Data</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

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
      case AppView.SETTINGS: return <Settings onToggleMobile={toggleMobileSidebar} theme={theme} userProfile={userProfile} setUserProfile={handleUpdateProfile} />;
      default: return <Overview {...commonProps} setView={setCurrentView} />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {keyPickerVisible && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-[40px] p-8 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-indigo-500/20 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Connect Gemini API</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              To use Zysculpt's Pro-tier resume sculpting features, you need to select a paid Gemini API key. 
              <br/><br/>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Learn about Gemini Billing</a>
            </p>
            <button 
              onClick={handleOpenKeyPicker}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/20"
            >
              Select API Key
            </button>
          </div>
        </div>
      )}
      <Sidebar 
        currentView={currentView} setView={setCurrentView} 
        isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen}
        theme={theme} toggleTheme={toggleTheme}
        sessions={sessions} activeSessionId={activeSessionId} setActiveSessionId={setActiveSessionId}
        onNewSession={createNewSession} onDeleteSession={deleteSession}
        onRenameSession={(id, title) => updateSession(id, { title })}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-hidden relative w-full">{renderView()}</main>
    </div>
  );
};

export default App;
