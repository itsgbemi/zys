
import { createClient } from '@supabase/supabase-js';

/**
 * Zysculpt Supabase Configuration
 * 
 * IMPORTANT FOR VITE/VERCEL:
 * Environment variables must be prefixed with VITE_ to be available in the browser.
 * Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Vercel settings.
 */

// @ts-ignore - Accessing Vite's meta env
const env = import.meta.env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

// Fallback for non-Vite environments or specific build-time injection
const getFallbackEnv = (key: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return '';
};

const finalUrl = supabaseUrl || getFallbackEnv('SUPABASE_URL');
const finalKey = supabaseAnonKey || getFallbackEnv('SUPABASE_ANON_KEY');

export const isSupabaseConfigured = !!finalUrl && !finalUrl.includes('placeholder');

if (!isSupabaseConfigured) {
  console.warn("Zysculpt Warning: Supabase credentials not detected. Check VITE_SUPABASE_URL in your environment.");
}

export const supabase = createClient(
  finalUrl || 'https://placeholder.supabase.co', 
  finalKey || 'placeholder'
);
