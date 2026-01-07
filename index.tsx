// 1. SHIM IMMEDIATELY (Safely handle environment variables before any imports)
if (typeof window !== 'undefined') {
  (window as any).process = (window as any).process || { env: {} };
  const browserProcess = (window as any).process;
  
  try {
    // @ts-ignore
    const viteEnv = import.meta.env || {};
    
    // Sync VITE_ prefix to process.env
    Object.keys(viteEnv).forEach(key => {
      browserProcess.env[key] = viteEnv[key];
    });
    
    // Bridge VITE_API_KEY to API_KEY for Gemini SDK
    if (viteEnv.VITE_API_KEY && !browserProcess.env.API_KEY) {
      browserProcess.env.API_KEY = viteEnv.VITE_API_KEY;
    }

    // Bridge DeepSeek key
    if (viteEnv.VITE_DEEPSEEK_API_KEY) browserProcess.env.VITE_DEEPSEEK_API_KEY = viteEnv.VITE_DEEPSEEK_API_KEY;

    // Bridge Supabase vars specifically
    if (viteEnv.VITE_SUPABASE_URL) browserProcess.env.VITE_SUPABASE_URL = viteEnv.VITE_SUPABASE_URL;
    if (viteEnv.VITE_SUPABASE_ANON_KEY) browserProcess.env.VITE_SUPABASE_ANON_KEY = viteEnv.VITE_SUPABASE_ANON_KEY;

  } catch (e) {
    console.warn("Vite environment sync partially failed, continuing with process.env only.");
  }
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}