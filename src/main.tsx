import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import App from './App.tsx';
import i18n from './i18n';

// Keep document lang attribute in sync with i18n language
document.documentElement.lang = i18n.language || 'en';
i18n.on('languageChanged', (lng: string) => {
  document.documentElement.lang = lng;
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
