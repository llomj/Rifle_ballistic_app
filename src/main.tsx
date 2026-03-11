import './index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';
import { BallisticSettingsProvider } from './contexts/BallisticSettingsContext';
import { BallisticProfileProvider } from './contexts/BallisticProfileContext';

// Service Worker: register only in production; in dev, unregister so preview always gets latest (stars, etc.)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (import.meta.env.PROD) {
      const basePath = import.meta.env.BASE_URL || '/';
      navigator.serviceWorker.register(`${basePath}sw.js?v=1`, { updateViaCache: 'none' })
        .then(registration => {
          console.log('Rifle Ballistic SW registered (offline): ', registration);
        })
        .catch(registrationError => {
          console.warn('Rifle Ballistic SW registration failed: ', registrationError);
        });
    } else {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => reg.unregister());
      });
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <BallisticSettingsProvider>
        <BallisticProfileProvider>
          <App />
        </BallisticProfileProvider>
      </BallisticSettingsProvider>
    </LanguageProvider>
  </React.StrictMode>
);
