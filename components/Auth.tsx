
import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { ZysculptLogo } from './Sidebar';
import { Loader2, Mail, Lock, AlertCircle, ChevronRight, User, Terminal } from 'lucide-react';

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // @ts-ignore - Accessing Vite's meta env for debug view
  const env = import.meta.env || {};

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      setError("Connection Error: VITE_SUPABASE_URL is missing. Ensure you have renamed your variables in Vercel to use the VITE_ prefix.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        if (data?.user && data?.session === null) {
          setError("Account created! Please check your email for the confirmation link.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (err.message === 'Failed to fetch') {
        setError("Network Error: The browser could not reach Supabase. Check if the project URL is correct in your Vercel Dashboard (VITE_SUPABASE_URL).");
      } else {
        setError(err.message || "An unexpected error occurred. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center mb-10">
          <ZysculptLogo theme="dark" size={64} />
          <h1 className="text-4xl font-black text-white mt-4 tracking-tighter" style={{ fontFamily: "'DM Sans', sans-serif" }}>zysculpt</h1>
          <p className="text-slate-400 mt-2 text-center text-sm">Your AI Career Copilot. Build your future.</p>
        </div>

        <div className="bg-[#1a1a1a] border border-white/5 p-8 rounded-[40px] shadow-2xl backdrop-blur-xl">
          <h2 className="text-xl font-bold text-white mb-6">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
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

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#121212] border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:border-indigo-500 outline-none transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className={`p-4 rounded-2xl text-xs flex flex-col gap-2 border ${error.includes("created") ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-red-500/10 border-red-500/20 text-red-500"}`}>
                <div className="flex items-center gap-3">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <p>{error}</p>
                </div>
                {!isSupabaseConfigured && (
                  <p className="text-[10px] opacity-60 mt-1 italic leading-relaxed">
                    Check your Vercel Dashboard. You likely have "SUPABASE_URL" but Vite requires "VITE_SUPABASE_URL" to let the frontend see it.
                  </p>
                )}
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
                  {isSignUp ? 'Initialize Flight' : 'Enter Dashboard'}
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-4">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
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
              <p className="mt-2 text-slate-500 italic">If MISSING, go to Vercel Settings and prefix your keys with VITE_</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
