import { createClient } from '@supabase/supabase-js';

/**
 * Zysculpt Supabase Configuration
 */

// Helper to safely get environment variables across different build/runtime environments
const getEnvVar = (key: string): string => {
  // Try Vite standard first
  try {
    // Fix: Access import.meta as any to bypass "Property 'env' does not exist on type 'ImportMeta'" error
    const meta = import.meta as any;
    if (meta.env && meta.env[key]) {
      return meta.env[key];
    }
  } catch (e) {}

  // Try shimmed or real process.env
  try {
    if (typeof process !== 'undefined' && process.env && (process.env as any)[key]) {
      return (process.env as any)[key];
    }
  } catch (e) {}
  
  // Try direct global access (some shims do this)
  try {
    if (typeof window !== 'undefined' && (window as any).process?.env?.[key]) {
      return (window as any).process.env[key];
    }
  } catch (e) {}

  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Configuration is valid if we have a URL that isn't the placeholder
export const isSupabaseConfigured = !!supabaseUrl && !supabaseUrl.includes('placeholder') && supabaseUrl !== '';

if (!isSupabaseConfigured) {
  console.warn("Zysculpt Warning: Supabase credentials not detected. Authentication features will be disabled.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);