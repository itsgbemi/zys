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
import { supabase, isSupabaseConfigured } from './services/supabase';
import { Sparkles, Plus } from 'lucide-react';
import { setDatadogUser, clearDatadogUser } from './services/datadog';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>(AppView.OVERVIEW);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('zysculpt-theme') as Theme) || 'light');

  const [userProfile, setUserProfile] = useState<UserProfile>({
    fullName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    linkedIn: '',
    github: '',
    portfolio: '',
    baseResumeText: '',
    dailyAvailability: 2,
    voiceId: 'IKne3meq5aSn9XLyUdCD',
    avatarUrl: ''
  });

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState('');

  const syncProfile = useCallback(async (profile: UserProfile, userId: string) => {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('profiles').upsert({
        id: userId,
        full_name: profile.fullName,
        title: profile.title,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        linkedin: profile.linkedIn,
        github: profile.github,
        portfolio: profile.portfolio,
        base_resume_text: profile.baseResumeText,
        daily_availability: profile.dailyAvailability,
        voice_id: profile.voiceId,
        avatar_url: profile.avatarUrl,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.error("Profile sync error:", e);
    }
  }, []);

  const fetchData = async (userId: string, authUser: any) => {
    if (!isSupabaseConfigured) return;
    try {
      const profilePromise = supabase.from('profiles').select('*').eq('id', userId).single();
      const sessionsPromise = supabase.from('sessions').select('*').eq('user_id', userId).order('last_updated', { ascending: false });

      const [profileRes, sessionsRes] = await Promise.all([profilePromise, sessionsPromise]);
      const metadata = authUser.user_metadata || {};
      
      const seededProfile: UserProfile = {
        fullName: profileRes.data?.full_name || metadata.full_name || metadata.name || '',
        title: profileRes.data?.title || '',
        email: profileRes.data?.email || authUser.email || '',
        phone: profileRes.data?.phone || '',
        location: profileRes.data?.location || '',
        linkedIn: profileRes.data?.linkedin || '',
        github: profileRes.data?.github || '',
        portfolio: profileRes.data?.portfolio || '',
        baseResumeText: profileRes.data?.base_resume_text || '',
        dailyAvailability: profileRes.data?.daily_availability || 2,
        voiceId: profileRes.data?.voice_id || 'IKne3meq5aSn9XLyUdCD',
        avatarUrl: profileRes.data?.avatar_url || metadata.avatar_url || metadata.picture || ''
      };

      setUserProfile(seededProfile);
      setDatadogUser({ id: userId, email: seededProfile.email, name: seededProfile.fullName });

      if (!profileRes.data) syncProfile(seededProfile, userId);

      if (sessionsRes.data && sessionsRes.data.length > 0) {
        const mapped: ChatSession[] = sessionsRes.data.map(s => ({
          id: s.id, title: s.title, type: s.type, messages: s.messages, jobDescription: s.job_description,
          resumeText: s.resume_text, finalResume: s.final_resume, careerGoalData: s.career_goal_data,
          stylePrefs: s.style_prefs, lastUpdated: s.last_updated
        }));
        setSessions(mapped);
        setActiveSessionId(mapped[0].id);
      }
    } catch (e: any) {
      console.error("Data fetch error:", e);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) { setAuthLoading(false); return; }
    (supabase.auth as any).getSession().then(({ data: { session } }: any) => {
      setSession(session);
      if (session) fetchData(session.user.id, session.user);
      else setAuthLoading(false);
    });
    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange((_event: any, session: any) => {
      setSession(session);
      if (session) fetchData(session.user.id, session.user);
      else { clearDatadogUser(); setAuthLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await (supabase.auth as any).signOut();
    setSession(null);
  };

  const updateSession = async (id: string, updates: Partial<ChatSession>) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    if (!isSupabaseConfigured) return;
    try {
      const dbUpdates: any = {};
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.messages) dbUpdates.messages = updates.messages;
      if (updates.finalResume !== undefined) dbUpdates.final_resume = updates.finalResume;
      if (updates.careerGoalData) dbUpdates.career_goal_data = updates.careerGoalData;
      
      await supabase.from('sessions').update(dbUpdates).eq('id', id);
    } catch (e) { console.error(e); }
  };

  const handleNewSession = async (type: any = 'resume', initialPrompt?: string) => {
    const newId = Date.now().toString();
    const messages = initialPrompt ? [{ id: 'init', role: 'user', content: initialPrompt, timestamp: Date.now() }] : [];
    const newSess: ChatSession = {
      id: newId, title: `New ${type.replace('-', ' ')}`, type, messages: messages as any, lastUpdated: Date.now()
    };
    setSessions(prev => [newSess, ...prev]);
    setActiveSessionId(newId);
    if (type === 'resume') setCurrentView(AppView.RESUME_BUILDER);
    else if (type === 'cover-letter') setCurrentView(AppView.COVER_LETTER);
    else if (type === 'resignation-letter') setCurrentView(AppView.RESIGNATION_LETTER);
    else setCurrentView(AppView.CAREER_COPILOT);
  };

  const handleDeleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) setActiveSessionId('');
  };

  const handleRenameSession = (id: string, title: string) => {
    updateSession(id, { title });
  };

  if (authLoading) return <div className={`h-screen flex flex-col items-center justify-center font-black ${theme === 'dark' ? 'bg-[#121212] text-white' : 'bg-slate-50 text-slate-900'}`}><Sparkles className="animate-pulse mb-4 text-[#1918f0]"/><span className="tracking-tighter">Zysculpt Loading...</span></div>;
  if (!session) return <Auth />;

  const activeSess = sessions.find(s => s.id === activeSessionId);

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-colors font-['Roboto',_sans-serif] ${theme === 'dark' ? 'bg-[#121212]' : 'bg-slate-50'}`}>
      <Sidebar 
        currentView={currentView} setView={setCurrentView} 
        isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen}
        theme={theme} toggleTheme={() => {
          const newTheme = theme === 'dark' ? 'light' : 'dark';
          setTheme(newTheme);
          localStorage.setItem('zysculpt-theme', newTheme);
          document.body.className = `theme-${newTheme}`;
        }}
        sessions={sessions} activeSessionId={activeSessionId} setActiveSessionId={setActiveSessionId}
        onNewSession={handleNewSession} 
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-hidden relative">
        {currentView === AppView.OVERVIEW && <Overview onToggleMobile={() => setIsMobileOpen(true)} theme={theme} sessions={sessions} setView={setCurrentView} updateSession={updateSession} onNewSession={handleNewSession} userProfile={userProfile} />}
        {currentView === AppView.SETTINGS && <Settings onToggleMobile={() => setIsMobileOpen(true)} theme={theme} userProfile={userProfile} setUserProfile={setUserProfile} />}
        {(currentView === AppView.RESUME_BUILDER || currentView === AppView.COVER_LETTER || currentView === AppView.RESIGNATION_LETTER || currentView === AppView.CAREER_COPILOT) && (
           activeSess ? (
              <AIResumeBuilder 
                onToggleMobile={() => setIsMobileOpen(true)} 
                theme={theme} 
                sessions={sessions} 
                activeSessionId={activeSessionId} 
                updateSession={updateSession} 
                setSessions={setSessions}
                userProfile={userProfile}
              />
           ) : (
             <div className="h-full flex items-center justify-center p-8 text-center">
                <div className="max-w-md">
                   <Plus className="mx-auto mb-4 text-[#1918f0] opacity-20" size={48}/>
                   <h2 className="text-xl font-black mb-2">No Active Session</h2>
                   <p className="text-sm text-slate-500 mb-6">Select a session from the sidebar or create a new one to start sculpting.</p>
                   <button onClick={() => handleNewSession('resume')} className="px-6 py-3 bg-[#1918f0] text-white rounded-2xl font-black shadow-xl shadow-[#1918f0]/20">New Resume Builder</button>
                </div>
             </div>
           )
        )}
        {currentView === AppView.FIND_JOB && <JobSearch onToggleMobile={() => setIsMobileOpen(true)} theme={theme} onSculptResume={(j) => handleNewSession('resume', `I want to tailor my resume for this job: ${j.title} at ${j.company}.\nDescription: ${j.description}`)} onSculptLetter={(j) => handleNewSession('cover-letter', `I want to write a cover letter for this job: ${j.title} at ${j.company}.\nDescription: ${j.description}`)} />}
        {currentView === AppView.KNOWLEDGE_HUB && <KnowledgeHub onToggleMobile={() => setIsMobileOpen(true)} theme={theme} />}
        {currentView === AppView.DOCUMENTS && <Documents onToggleMobile={() => setIsMobileOpen(true)} theme={theme} sessions={sessions} onSelectSession={id => { setActiveSessionId(id); setCurrentView(AppView.RESUME_BUILDER); }} />}
      </main>
    </div>
  );
};

export default App;
