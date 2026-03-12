import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tRaw: (key: string) => string | string[] | undefined;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'cli_exercises_learn_language_v2';
const PREV_LANGUAGE_STORAGE_KEY = 'cli_exercises_learn_language_v1';
const LEGACY_LANGUAGE_KEY = 'python_exercises_learn_language';

// Translation data
import { translations } from '../translations';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    let saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (!saved) {
      const legacy = localStorage.getItem(LEGACY_LANGUAGE_KEY);
      if (legacy === 'fr' || legacy === 'en') {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, legacy);
        try { localStorage.removeItem(LEGACY_LANGUAGE_KEY); } catch (_) {}
        saved = legacy;
      }
    }
    if (!saved) {
      const prev = localStorage.getItem(PREV_LANGUAGE_STORAGE_KEY);
      if (prev === 'fr') {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, 'fr');
        try { localStorage.removeItem(PREV_LANGUAGE_STORAGE_KEY); } catch (_) {}
        saved = 'fr';
      } else {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, 'fr');
        try { localStorage.removeItem(PREV_LANGUAGE_STORAGE_KEY); } catch (_) {}
        saved = 'fr';
      }
    }
    return (saved === 'en' ? 'en' : 'fr') as Language;
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if key not found
        value = translations.en;
        for (const k2 of keys) {
          if (value && typeof value === 'object' && k2 in value) {
            value = value[k2];
          } else {
            return key; // Return key if not found in fallback
          }
        }
        break;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  // Get translation value (string or array) - for arrays use tRaw and handle in component
  const tRaw = (key: string): string | string[] | undefined => {
    const keys = key.split('.');
    let value: any = translations[language];
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        value = translations.en;
        for (const k2 of keys) {
          if (value && typeof value === 'object' && k2 in value) {
            value = value[k2];
          } else {
            return undefined;
          }
        }
        break;
      }
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tRaw }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
