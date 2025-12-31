
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Zysculpt Environment Bridge
 * 
 * The Gemini SDK strictly requires process.env.API_KEY.
 * Vite strictly requires VITE_ prefix for client-side exposure.
 * This shim bridges that gap.
 */
// @ts-ignore
const env = import.meta.env || {};

if (typeof (window as any).process === 'undefined') {
  (window as any).process = { 
    env: { 
      ...env,
      // Priority mapping: use VITE_API_KEY if available (standard for Vercel/Vite)
      API_KEY: env.VITE_API_KEY || (env.VITE_GEMINI_API_KEY as string)
    } 
  };
} else if (!(window as any).process.env.API_KEY) {
  // If process exists but key is missing, attempt to hydrate from Vite meta
  (window as any).process.env.API_KEY = env.VITE_API_KEY;
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
