import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { I18nEngine } from './core.ts';
import { I18nContextValue, LanguageCode, TranslationParams } from './types.ts';

const I18nContext = createContext<I18nContextValue | null>(null);

export interface I18nProviderProps {
  engine: I18nEngine;
  children: React.ReactNode;
}

export function I18nProvider({ engine, children }: I18nProviderProps) {
  const [currentLang, setCurrentLang] = useState<LanguageCode>(engine.getLanguage());

  useEffect(() => {
    return engine.subscribe((newLang) => {
      setCurrentLang(newLang);
    });
  }, [engine]);

  const value = useMemo<I18nContextValue>(() => {
    return {
      currentLang,
      setLanguage: (lang: LanguageCode) => engine.setLanguage(lang),
      t: (path: string, params?: TranslationParams) => engine.t(path, params, currentLang),
      formatDate: (date: Date | string) => {
        try {
          const d = typeof date === 'string' ? new Date(date) : date;
          return new Intl.DateTimeFormat(currentLang === 'it' ? 'it-IT' : 'en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }).format(d);
        } catch {
          return String(date);
        }
      },
      availableLanguages: engine.audit().languages,
    };
  }, [currentLang, engine]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return ctx;
}
