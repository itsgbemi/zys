import { createClient } from '@supabase/supabase-js';

/**
 * Zysculpt Supabase Configuration
 */

// Helper to safely get environment variables across different build/runtime environments
const getEnvVar = (key: string): string => {
  // Common variants to check for each key
  const variants = [key];
  if (key.startsWith('VITE_')) {
    variants.push(key.replace('VITE_', ''));
  } else {
    variants.push(`VITE_${key}`);
  }

  for (const variant of variants) {
    // 1. Try Vite standard first
    try {
      const meta = import.meta as any;
      if (meta.env && meta.env[variant]) {
        return meta.env[variant];
      }
    } catch (e) {}

    // 2. Try shimmed or real process.env (populated in index.tsx)
    try {
      if (typeof process !== 'undefined' && process.env && (process.env as any)[variant]) {
        return (process.env as any)[variant];
      }
    } catch (e) {}
    
    // 3. Try direct global access
    try {
      if (typeof window !== 'undefined' && (window as any).process?.env?.[variant]) {
        return (window as any).process.env[variant];
      }
    } catch (e) {}
  }

  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Configuration is valid if we have a URL that isn't the placeholder
export const isSupabaseConfigured = !!supabaseUrl && 
  !supabaseUrl.includes('placeholder') && 
  supabaseUrl !== '' && 
  supabaseAnonKey !== '' && 
  !supabaseAnonKey.includes('placeholder');

if (!isSupabaseConfigured) {
  console.warn("Zysculpt Warning: Supabase credentials not detected. Authentication features will be disabled.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
