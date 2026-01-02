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
import { Sparkles } from 'lucide-react';
import { setDatadogUser, clearDatadogUser } from './services/datadog';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>(AppView.OVERVIEW);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('zysculpt-theme') as Theme) || 'light');
  const [keyPickerVisible, setKeyPickerVisible] = useState(false);

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

      if (!profileRes.data) {
        syncProfile(seededProfile, userId);
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
      }
    } catch (e: any) {
      console.error("Data fetch error:", e);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData(session.user.id, session.user);
      else setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchData(session.user.id, session.user);
      else {
        clearDatadogUser();
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (authLoading) return <div className={`h-screen flex items-center justify-center font-bold ${theme === 'dark' ? 'bg-[#121212] text-white' : 'bg-slate-50 text-slate-900'}`}>Zysculpt Loading...</div>;
  if (!session) return <Auth />;

  return (
    <div className={`flex h-screen w-full overflow-hidden transition-colors ${theme === 'dark' ? 'bg-[#121212]' : 'bg-slate-50'}`}>
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
        onNewSession={() => {}} 
        onDeleteSession={() => {}}
        onRenameSession={() => {}}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-hidden relative">
        {currentView === AppView.OVERVIEW && <Overview onToggleMobile={() => setIsMobileOpen(true)} theme={theme} sessions={sessions} setView={setCurrentView} userProfile={userProfile} />}
        {currentView === AppView.SETTINGS && <Settings onToggleMobile={() => setIsMobileOpen(true)} theme={theme} userProfile={userProfile} setUserProfile={setUserProfile} />}
        {/* Additional views would follow the same pattern */}
      </main>
    </div>
  );
};

export default App;