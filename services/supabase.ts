import { createClient } from '@supabase/supabase-js';

/**
 * Zysculpt Supabase Configuration
 * Following Vite best practices with static replacement for environment variables.
 */

// Fix: Use process.env as shimmed in index.tsx to avoid ImportMeta errors (line 9-10)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

// Configuration is valid if we have non-placeholder values
export const isSupabaseConfigured = 
  !!supabaseUrl && 
  supabaseUrl !== '' && 
  !supabaseUrl.includes('placeholder') &&
  !!supabaseAnonKey && 
  supabaseAnonKey !== '' && 
  !supabaseAnonKey.includes('placeholder');

// Initializing with placeholders if not configured to prevent crashes on startup
// The app UI handles the !isSupabaseConfigured state gracefully.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);