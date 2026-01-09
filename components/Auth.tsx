import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { 
  Loader2, 
  Mail, 
  Lock, 
  AlertCircle, 
  ChevronRight, 
  User, 
  Eye, 
  EyeOff,
  Compass,
  Sparkles,
  Zap,
  CheckCircle2,
  Moon,
  Sun,
  ArrowLeft,
  X
} from 'lucide-react';

type AuthView = 'signin' | 'signup' | 'forgot-password';

const GithubFilledIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="20" height="20">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

const INTRO_SLIDES = [
  {
    icon: <Compass size={40} className="text-white" />,
    title: "Strategic Roadmaps",
    description: "Generate personalized 30-day action plans tailored to your specific career targets."
  },
  {
    icon: <Sparkles size={40} className="text-white" />,
    title: "Precision Sculpting",
    description: "Build high-impact, ATS-optimized resumes and cover letters with expert AI guidance."
  },
  {
    icon: <Zap size={40} className="text-white" />,
    title: "AI Career Copilot",
    description: "Refine your pitch and practice interviews with a world-class dedicated professional mentor."
  }
];

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<AuthView>('signin');
  const [activeSlide, setActiveSlide] = useState(0);
  const [theme, setTheme] = useState(() => (localStorage.getItem('zysculpt-theme') as 'light' | 'dark') || 'dark');
  
  const [toast, setToast] = useState<{ m: string, type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('zysculpt-theme', theme);
  }, [theme]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(p => (p + 1) % INTRO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (m: string, type: 'error' | 'success') => {
    setToast({ m, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!isSupabaseConfigured) {
      showToast("Configuration Error: Credentials missing.", "error");
      setLoading(false);
      return;
    }

    try {
      if (view === 'signup') {
        const { data, error: signupError } = await (supabase.auth as any).signUp({ 
          email, 
          password,
          options: {
            data: { full_name: fullName, avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=1918f0&color=fff` },
            emailRedirectTo: window.location.origin
          }
        });
        if (signupError) throw signupError;
        if (data?.user && !data?.session) showToast("Success! Check your inbox to verify.", "success");
      } else if (view === 'signin') {
        const { error: signinError } = await (supabase.auth as any).signInWithPassword({ email, password });
        if (signinError) throw signinError;
      } else if (view === 'forgot-password') {
        const { error: resetError } = await (supabase.auth as any).resetPasswordForEmail(email, {
           redirectTo: window.location.origin,
        });
        if (resetError) throw resetError;
        showToast("Reset link sent! Please check your email inbox.", "success");
      }
    } catch (err: any) {
      showToast(err.message || "An authentication error occurred.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    if (!isSupabaseConfigured) {
      showToast("Social login is unavailable.", "error");
      return;
    }
    try {
      const { error: oauthError } = await (supabase.auth as any).signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      showToast(err.message || `Failed to sign in with ${provider}`, "error");
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 flex items-center justify-center p-0 md:p-6 font-['Inter',_sans-serif] ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-[#F8FAFC]'}`}>
      
      {toast && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] min-w-[300px] animate-in slide-in-from-top-4 fade-in duration-300`}>
          <div className={`flex items-center gap-3 p-4 rounded-2xl shadow-2xl border ${
            toast.type === 'success' 
              ? 'bg-emerald-500 border-emerald-400 text-white' 
              : 'bg-red-500 border-red-400 text-white'
          }`}>
             {toast.type === 'success' ? <CheckCircle2 size={20}/> : <AlertCircle size={20}/>}
             <p className="flex-1 text-sm font-bold leading-tight">{toast.m}</p>
             <button onClick={() => setToast(null)}><X size={16}/></button>
          </div>
        </div>
      )}

      <div className={`w-full max-w-6xl min-h-[700px] flex flex-col md:flex-row md:rounded-[40px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.3)] md:border transition-all ${theme === 'dark' ? 'bg-[#121214] border-white/5' : 'bg-white border-slate-200'}`}>
        
        <div className="hidden md:flex w-full md:w-1/2 bg-[#1918f0] p-8 md:p-16 flex flex-col relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-white/10 rounded-full opacity-20 blur-[100px]"></div>
          
          <div className="relative z-10 flex items-center justify-between mb-16">
            <div className="flex items-center gap-3">
              <img src="https://res.cloudinary.com/dqhawdcol/image/upload/v1767973402/s1fcii84opcg2v1fdmmk.svg" className="h-10 w-auto" alt="Zysculpt" />
            </div>
          </div>

          <div className="flex-1 relative z-10 flex flex-col justify-center">
            {INTRO_SLIDES.map((slide, i) => (
              <div key={i} className={`transition-all duration-700 absolute inset-0 flex flex-col justify-center ${activeSlide === i ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
                <div className="mb-6 bg-white/10 w-fit p-5 rounded-[24px] backdrop-blur-lg border border-white/10 shadow-2xl">
                  {slide.icon}
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight font-outfit">{slide.title}</h2>
                <p className="text-lg md:text-xl text-indigo-100/80 leading-relaxed max-w-md">{slide.description}</p>
              </div>
            ))}
          </div>

          <div className="relative z-10 mt-auto flex items-center justify-between">
            <div className="flex gap-2">
              {INTRO_SLIDES.map((_, i) => (
                <div key={i} className={`h-1.5 transition-all duration-300 rounded-full ${activeSlide === i ? 'w-8 bg-white' : 'w-2 bg-white/30'}`} />
              ))}
            </div>
          </div>
        </div>

        <div className={`w-full md:w-1/2 p-8 md:p-16 flex flex-col items-center justify-center relative transition-colors ${theme === 'dark' ? 'bg-[#09090b]' : 'bg-white'}`}>
          <div className="absolute top-8 right-8 flex items-center gap-4 z-20">
             <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-2.5 rounded-xl border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
             >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
             </button>
          </div>

          <div className="w-full max-w-sm">
            <div className="md:hidden flex items-center gap-3 mb-8">
              <img src="https://res.cloudinary.com/dqhawdcol/image/upload/v1767973402/s1fcii84opcg2v1fdmmk.svg" className="h-8 w-auto" alt="Zysculpt" />
            </div>

            {view === 'forgot-password' && (
              <button 
                onClick={() => setView('signin')}
                className={`flex items-center gap-2 text-sm font-bold mb-6 ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-[#1918f0]'} transition-all`}
              >
                <ArrowLeft size={16} /> Back to Sign In
              </button>
            )}

            <h2 className={`text-3xl font-black mb-2 font-outfit ${theme === 'dark' ? 'text-white' : 'text-[#0F172A]'}`}>
              {view === 'signup' ? 'Get Started' : view === 'forgot-password' ? 'Reset Password' : 'Welcome Back'}
            </h2>
            <p className="text-slate-500 mb-8 font-medium">
              {view === 'signup' ? 'Create your account today.' : view === 'forgot-password' ? 'Enter your email for reset link.' : 'Sign in to access your roadmaps.'}
            </p>

            <form onSubmit={handleAuth} className="space-y-4">
              {view === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                      className={`w-full border rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#1918f0] transition-all text-sm ${theme === 'dark' ? 'bg-[#18181b] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-[#0F172A]'}`}
                      placeholder="Jane Doe"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className={`w-full border rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#1918f0] transition-all text-sm ${theme === 'dark' ? 'bg-[#18181b] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-[#0F172A]'}`}
                    placeholder="name@email.com"
                  />
                </div>
              </div>

              {view !== 'forgot-password' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                    {view === 'signin' && (
                      <button type="button" onClick={() => setView('forgot-password')} className="text-[10px] font-bold text-[#1918f0] uppercase tracking-widest hover:underline">Forgot?</button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                      className={`w-full border rounded-2xl py-4 pl-12 pr-12 outline-none focus:border-[#1918f0] transition-all text-sm ${theme === 'dark' ? 'bg-[#18181b] border-white/5 text-white' : 'bg-slate-50 border-slate-200 text-[#0F172A]'}`}
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1918f0]`}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full bg-[#1918f0] hover:bg-[#1413c7] text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-[#1918f0]/20 flex items-center justify-center gap-2 mt-4 active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : (view === 'signup' ? 'Sign up' : view === 'forgot-password' ? 'Send Link' : 'Sign In')}
                <ChevronRight size={18} />
              </button>
            </form>

            {view !== 'forgot-password' && (
              <>
                <div className="relative my-8">
                  <div className={`absolute inset-0 flex items-center`}><div className={`w-full border-t ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}></div></div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black"><span className={`px-4 text-slate-400 ${theme === 'dark' ? 'bg-[#09090b]' : 'bg-white'}`}>OR</span></div>
                </div>

                <div className="flex flex-col gap-3">
                  <button onClick={() => handleSocialLogin('google')} className="gsi-material-button">
                    <div className="gsi-material-button-state"></div>
                    <div className="gsi-material-button-content-wrapper">
                      <div className="gsi-material-button-icon">
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                          <path fill="none" d="M0 0h48v48H0z"></path>
                        </svg>
                      </div>
                      <span className="gsi-material-button-contents">{view === 'signup' ? 'Sign up' : 'Sign in'} with Google</span>
                    </div>
                  </button>

                  <button onClick={() => handleSocialLogin('github')} className="gsi-material-button">
                    <div className="gsi-material-button-state"></div>
                    <div className="gsi-material-button-content-wrapper">
                      <div className="gsi-material-button-icon">
                        <GithubFilledIcon />
                      </div>
                      <span className="gsi-material-button-contents">{view === 'signup' ? 'Sign up' : 'Sign in'} with GitHub</span>
                    </div>
                  </button>
                </div>
              </>
            )}

            <div className="mt-8 text-center">
              <button
                onClick={() => { setView(view === 'signin' ? 'signup' : 'signin'); }}
                className="text-sm font-bold text-slate-500 hover:text-[#1918f0] transition-colors"
              >
                {view === 'signup' ? 'Already have an account? Sign in' : view === 'forgot-password' ? '' : "New to Zysculpt? Join now"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};