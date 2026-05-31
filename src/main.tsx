import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safely trap and suppress benign Vite / WebSocket connection errors 
// which are expected since HMR is disabled in this environment.
if (typeof window !== 'undefined') {
  const isViteWebsocketError = (err: any): boolean => {
    if (!err) return false;
    const msg = typeof err === 'string' ? err : (err.message || '');
    return (
      msg.includes('WebSocket') || 
      msg.includes('websocket') || 
      msg.includes('vite') || 
      msg.includes('Vite')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isViteWebsocketError(event.reason)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    if (isViteWebsocketError(event.message) || isViteWebsocketError(event.error)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

