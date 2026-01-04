import { createClient } from '@supabase/supabase-js';

/**
 * Zysculpt Supabase Configuration
 * 
 * We check multiple locations for the credentials:
 * 1. import.meta.env (Vite standard - statically replaced at build time)
 * 2. process.env (Shimmed in index.tsx)
 * 3. window.process.env (Direct global access)
 */

const getSupabaseUrl = (): string => {
  // Vite static replacement requires literals for best results
  // @ts-ignore
  const viteUrl = import.meta.env?.VITE_SUPABASE_URL;
  if (viteUrl) return viteUrl;

  // Fallback to shimmed process.env
  try {
    const env = (process as any).env;
    return env.VITE_SUPABASE_URL || env.SUPABASE_URL || '';
  } catch (e) {
    return '';
  }
};

const getSupabaseAnonKey = (): string => {
  // @ts-ignore
  const viteKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;
  if (viteKey) return viteKey;

  // Fallback to shimmed process.env
  try {
    const env = (process as any).env;
    return env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '';
  } catch (e) {
    return '';
  }
};

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

// Configuration is valid if we have non-placeholder values
export const isSupabaseConfigured = 
  !!supabaseUrl && 
  supabaseUrl !== '' && 
  !supabaseUrl.includes('placeholder') &&
  !!supabaseAnonKey && 
  supabaseAnonKey !== '' && 
  !supabaseAnonKey.includes('placeholder');

if (!isSupabaseConfigured) {
  console.error("Zysculpt CRITICAL: Supabase credentials missing. Expected VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);