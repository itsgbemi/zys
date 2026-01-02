
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
  Terminal, 
  Eye, 
  EyeOff, 
  Github, 
  Chrome, 
  ArrowLeft
} from 'lucide-react';

type AuthView = 'signin' | 'signup' | 'forgot-password';

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<AuthView>('signin');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  // @ts-ignore - Accessing Vite's meta env for debug view
  const env = import.meta.env || {};

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!isSupabaseConfigured) {
      setError("Connection Error: VITE_SUPABASE_URL is missing.");
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
              // Initial avatar can be a generic one or null
              avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=6366f1&color=fff`
            },
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        if (data?.user && data?.session === null) {
          setSuccess("Account created! Please check your email for the confirmation link.");
        }
      } else if (view === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (view === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSuccess("Password reset link sent! Check your inbox.");
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  const renderHeader = () => {
    if (view === 'forgot-password') return 'Reset Password';
    return view === 'signup' ? 'Create your account' : 'Welcome back';
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-10 text-center">
          <ZysculptLogo theme="dark" size={80} />
          <h1 className="text-5xl font-black text-white mt-4 tracking-tighter" style={{ fontFamily: "'DM Sans', sans-serif" }}>zysculpt</h1>
          <p className="text-slate-400 mt-2 text-sm max-w-[280px]">Your AI Career Copilot. Build your future, starting today.</p>
        </div>

        <div className="bg-[#1a1a1a] border border-white/5 p-8 rounded-[40px] shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="flex items-center gap-2 mb-6">
            {view !== 'signin' && (
              <button 
                onClick={() => { setView('signin'); setError(null); setSuccess(null); }}
                className="p-2 -ml-2 text-slate-500 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="text-xl font-bold text-white">
              {renderHeader()}
            </h2>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {view === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#121212] border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:border-indigo-500 outline-none transition-all text-sm"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#121212] border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:border-indigo-500 outline-none transition-all text-sm"
                  placeholder="pilot@zysculpt.com"
                />
              </div>
            </div>

            {view !== 'forgot-password' && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1 pr-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Password</label>
                  {view === 'signin' && (
                    <button 
                      type="button"
                      onClick={() => setView('forgot-password')}
                      className="text-[10px] font-bold text-indigo-500 hover:text-indigo-400 uppercase tracking-widest"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#121212] border border-white/5 rounded-2xl py-3.5 pl-12 pr-12 text-white focus:border-indigo-500 outline-none transition-all text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-2xl text-xs flex flex-col gap-2 border bg-red-500/10 border-red-500/20 text-red-500 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <p>{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-2xl text-xs flex flex-col gap-2 border bg-emerald-500/10 border-emerald-500/20 text-emerald-500 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <p>{success}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 group mt-4 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  {view === 'signup' ? 'Initialize Flight' : view === 'forgot-password' ? 'Send Reset Link' : 'Enter Dashboard'}
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {view !== 'forgot-password' && (
            <>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                  <span className="bg-[#1a1a1a] px-4 text-slate-600">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleSocialLogin('google')}
                  className="flex items-center justify-center gap-3 py-3.5 px-3 bg-[#121212] border border-white/5 rounded-2xl text-xs font-bold text-white hover:bg-white/5 transition-all active:scale-[0.98]"
                >
                  <Chrome size={18} className="text-white" />
                  Google
                </button>
                <button 
                  onClick={() => handleSocialLogin('github')}
                  className="flex items-center justify-center gap-3 py-3.5 px-3 bg-[#121212] border border-white/5 rounded-2xl text-xs font-bold text-white hover:bg-white/5 transition-all active:scale-[0.98]"
                >
                  <Github size={18} className="text-white" />
                  GitHub
                </button>
              </div>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-4">
            <button
              onClick={() => {
                setView(view === 'signin' ? 'signup' : 'signin');
                setError(null);
                setSuccess(null);
              }}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              {view === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
            
            <button 
              onClick={() => setShowDebug(!showDebug)}
              className="text-[9px] text-slate-700 hover:text-slate-500 uppercase tracking-widest flex items-center gap-1.5"
            >
              <Terminal size={10} /> Debug Dashboard Variables
            </button>
          </div>

          {showDebug && (
            <div className="mt-4 p-4 bg-black rounded-xl border border-white/5 font-mono text-[10px] text-emerald-500 overflow-x-auto">
              <p>VITE_SUPABASE_URL: {env.VITE_SUPABASE_URL ? 'FOUND' : 'MISSING'}</p>
              <p>VITE_SUPABASE_ANON_KEY: {env.VITE_SUPABASE_ANON_KEY ? 'FOUND' : 'MISSING'}</p>
              <p className="mt-2 text-slate-500 italic">Ensure Google and GitHub are enabled in Supabase Auth Dashboard.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
