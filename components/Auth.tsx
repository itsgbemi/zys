import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { ZysculptLogo } from './Sidebar';
import { 
  Loader2, 
  Mail, 
  Lock, 
  AlertCircle, 
  ChevronRight, 
  User, 
  Eye, 
  EyeOff
} from 'lucide-react';

type AuthView = 'signin' | 'signup' | 'forgot-password';

const GithubFilledIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="20" height="20">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<AuthView>('signin');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!isSupabaseConfigured) {
      setError("Supabase configuration is missing.");
      setLoading(false);
      return;
    }

    try {
      if (view === 'signup') {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { 
              full_name: fullName,
              avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=6366f1&color=fff`
            }
          }
        });
        if (error) throw error;
        if (data?.user && data?.session === null) {
          setSuccess("Check your email for confirmation.");
        }
      } else if (view === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin }
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-12 animate-in fade-in zoom-in duration-500">
          <div className="flex flex-row items-center gap-4 group cursor-pointer">
            <ZysculptLogo theme="light" size={64} />
            <h1 className="text-5xl font-black text-[#0F172A] tracking-tighter" style={{ fontFamily: "'DM Sans', sans-serif" }}>zysculpt</h1>
          </div>
          <p className="text-slate-500 mt-4 text-sm font-medium">Your AI Career Copilot.</p>
        </div>

        <div className="bg-white border border-slate-200 p-8 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom-8 duration-700">
          <h2 className="text-2xl font-black text-[#0F172A] mb-8 text-center" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {view === 'signup' ? 'Create Account' : 'Welcome Back'}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            {view === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-[#0F172A] outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-[#0F172A] outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm"
                  placeholder="name@email.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-12 text-[#0F172A] outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2"><AlertCircle size={14}/> {error}</div>}
            {success && <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">Check your email for confirmation!</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 mt-4 active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : (view === 'signup' ? 'Create Account' : 'Sign In')}
              <ChevronRight size={18} />
            </button>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black"><span className="bg-white px-4 text-slate-400">OR</span></div>
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={() => handleSocialLogin('google')} className="gsi-material-button">
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlnsXlink="http://www.w3.org/1999/xlink" style={{ display: 'block' }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents">Continue with Google</span>
              </div>
            </button>

            <button 
              onClick={() => handleSocialLogin('github')} 
              className="w-full flex items-center justify-center gap-3 py-0 px-4 bg-white border border-[#747775] rounded-[20px] text-sm font-medium text-[#1f1f1f] transition-all hover:bg-[#F8FAFC] active:bg-[#F1F5F9] h-[44px] shadow-none active:scale-95 font-['Roboto',_arial,_sans-serif]"
            >
              <div className="flex items-center justify-center">
                <div className="mr-3 flex items-center justify-center w-5 h-5 text-[#1F2328]">
                  <GithubFilledIcon />
                </div>
                <span>Continue with GitHub</span>
              </div>
            </button>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-50 text-center">
            <button
              onClick={() => setView(view === 'signin' ? 'signup' : 'signin')}
              className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              {view === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};