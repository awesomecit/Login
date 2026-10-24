import { Language } from '../types.ts';
import { en } from './en.ts';
import { it, TranslationSchema } from './it.ts';
import { logger } from '../logger.ts';

// Dynamic dictionary registry supporting runtime additions & lazy loading
const dictionaries: Record<string, any> = {
  it,
  en,
};

/**
 * Registra o unisce dizionari di traduzione a runtime (supporta nuove lingue o sovrascritture)
 */
export function registerTranslations(
  lang: string,
  newDict: Partial<TranslationSchema> | Record<string, any>
): void {
  if (!dictionaries[lang]) {
    dictionaries[lang] = {};
  }
  // Deep merge
  deepMerge(dictionaries[lang], newDict);
  logger.info('i18n', `Registrato o aggiornato dizionario per la lingua: ${lang}`, {
    language: lang,
    registeredKeysCount: getAllDictionaryKeys(dictionaries[lang]).length,
  });
}

/**
 * Metodo asincrono per il caricamento dinamico di traduzioni da endpoint remoto o modulo lazy
 */
export async function loadTranslations(
  lang: string,
  loader: () => Promise<Record<string, any>>
): Promise<boolean> {
  logger.debug('i18n', `Avvio caricamento asincrono traduzioni per lingua: ${lang}`);
  try {
    const data = await loader();
    registerTranslations(lang, data);
    logger.info('i18n', `Caricamento traduzioni completato per ${lang}`);
    return true;
  } catch (error: any) {
    logger.error('i18n', `Errore nel caricamento delle traduzioni per ${lang}: ${error.message}`, {
      language: lang,
      error,
    });
    return false;
  }
}

/**
 * Estrae ricorsivamente tutte le chiavi in formato dot-notation ('auth.welcomeBack') da un dizionario
 */
export function getAllDictionaryKeys(obj: Record<string, any>, prefix = ''): string[] {
  let keys: string[] = [];
  if (!obj || typeof obj !== 'object') return keys;

  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys = keys.concat(getAllDictionaryKeys(value, fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys;
}

/**
 * METODO DI AUDIT: Trova e segnala tutte le traduzioni mancanti per ogni lingua registrata.
 * Confronta ogni dizionario con il dizionario di riferimento (default: 'it').
 * 
 * @param baseLang Lingua di riferimento (default 'it')
 * @returns Oggetto con la lista delle chiavi mancanti o vuote per ciascuna lingua
 */
export function findMissingTranslations(baseLang: Language = 'it'): Record<string, string[]> {
  const baseDict = dictionaries[baseLang] || dictionaries.it;
  const baseKeys = getAllDictionaryKeys(baseDict);
  const report: Record<string, string[]> = {};

  for (const [lang, dict] of Object.entries(dictionaries)) {
    if (lang === baseLang) continue;

    const currentKeys = new Set(getAllDictionaryKeys(dict));
    const missing: string[] = [];

    for (const key of baseKeys) {
      if (!currentKeys.has(key)) {
        missing.push(key);
      } else {
        // Verifica anche se la stringa è vuota o solo spazi
        const val = resolvePath(dict, key);
        if (typeof val === 'string' && val.trim() === '') {
          missing.push(`${key} (stringa vuota)`);
        }
      }
    }

    report[lang] = missing;
    if (missing.length > 0) {
      logger.warn('i18nAudit', `Rilevate ${missing.length} traduzioni mancanti per la lingua '${lang}'`, {
        language: lang,
        missingKeys: missing,
      });
    } else {
      logger.debug('i18nAudit', `Tutte le chiavi presenti e complete per la lingua '${lang}'`);
    }
  }

  return report;
}

/**
 * Convalida globale delle traduzioni: restituisce se il sistema è completo al 100%
 */
export function auditTranslations(): {
  isFullyTranslated: boolean;
  totalBaseKeys: number;
  languages: string[];
  missingByLang: Record<string, string[]>;
} {
  const baseKeys = getAllDictionaryKeys(dictionaries.it);
  const missing = findMissingTranslations('it');
  const hasMissing = Object.values(missing).some((arr) => arr.length > 0);

  return {
    isFullyTranslated: !hasMissing,
    totalBaseKeys: baseKeys.length,
    languages: Object.keys(dictionaries),
    missingByLang: missing,
  };
}

/**
 * Traduce una chiave con interpolazione dei parametri e fallback trasparente
 */
export function getTranslation(
  lang: Language | string,
  path: string,
  params?: Record<string, string | number>
): string {
  const dict = dictionaries[lang] || dictionaries.it;
  let value = resolvePath(dict, path);

  // Fallback al dizionario di base 'it' se non trovato
  if (value === undefined && lang !== 'it') {
    value = resolvePath(dictionaries.it, path);
    if (value !== undefined) {
      logger.debug('i18n', `Chiave '${path}' non presente in '${lang}', usato fallback 'it'`);
    }
  }

  if (value === undefined) {
    logger.warn('i18n', `Chiave di traduzione non trovata: '${path}' in lingua '${lang}'`);
    return path;
  }

  if (typeof value !== 'string') {
    return path;
  }

  if (!params) {
    return value;
  }

  return value.replace(/\{(\w+)\}/g, (_: string, match: string) => {
    return params[match] !== undefined ? String(params[match]) : `{${match}}`;
  });
}

function resolvePath(obj: any, path: string): any {
  if (!obj || typeof obj !== 'object') return undefined;
  const keys = path.split('.');
  let current = obj;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return undefined;
    }
  }
  return current;
}

function deepMerge(target: any, source: any) {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  Object.assign(target || {}, source);
  return target;
}

export function formatDate(isoString: string, lang: Language): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat(lang === 'it' ? 'it-IT' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return isoString;
  }
}
