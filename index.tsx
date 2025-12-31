
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Shim process.env for Vite/Browser compatibility with the Gemini SDK
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { 
    env: { 
      // @ts-ignore
      ...(import.meta.env || {}),
      // Map Vite-prefixed keys to the standard names the SDK expects
      // @ts-ignore
      API_KEY: import.meta.env?.VITE_API_KEY 
    } 
  };
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
