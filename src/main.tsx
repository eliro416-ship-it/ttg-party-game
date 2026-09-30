import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA with Auto-Update
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('PWA ServiceWorker registered with scope:', registration.scope);

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // נמצאה גרסה חדשה – רענן את העמוד אוטומטית
                window.location.reload();
              }
            };
          }
        };

        // Proactively check for Service Worker updates on launch
        registration.update().catch(() => {});
      })
      .catch((err) => {
        console.warn('PWA ServiceWorker registration failed:', err);
      });
  });
}

// Purge any Netlify badge, injected widget, or platform tags
if (typeof window !== 'undefined') {
  const purgeNetlify = () => {
    try {
      document
        .querySelectorAll('a[href*="netlify"], img[src*="netlify"], [class*="netlify"], [id*="netlify"], [data-netlify]')
        .forEach((el) => el.remove());

      document.querySelectorAll('a, div, span, p, footer, button').forEach((el) => {
        const text = el.textContent || '';
        if (/powered[\s_-]*by[\s_-]*netlify/i.test(text) || (/netlify/i.test(text) && text.trim().length < 40)) {
          el.remove();
        }
      });
    } catch (e) {
      // Ignore
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', purgeNetlify);
  } else {
    purgeNetlify();
  }

  try {
    const observer = new MutationObserver(purgeNetlify);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  } catch (e) {}
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
