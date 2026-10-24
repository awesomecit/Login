import {
  DictionaryTree,
  I18nAuditResult,
  I18nOptions,
  LanguageCode,
  MissingKeysReport,
  TranslationParams,
} from './types.ts';

export class I18nEngine {
  private dictionaries: Map<LanguageCode, DictionaryTree> = new Map();
  private currentLanguage: LanguageCode;
  private fallbackLanguage: LanguageCode;
  private supportedLanguages: Set<LanguageCode>;
  private storageKey: string;
  private listeners: Set<(lang: LanguageCode) => void> = new Set();

  constructor(options: I18nOptions) {
    this.fallbackLanguage = options.fallbackLanguage || options.defaultLanguage;
    this.supportedLanguages = new Set(options.supportedLanguages || [options.defaultLanguage]);
    this.storageKey = options.storageKey || 'app_i18n_lang';

    // Auto-detect from storage or browser/device
    this.currentLanguage = this.resolveInitialLanguage(options.defaultLanguage);
  }

  private resolveInitialLanguage(defaultLang: LanguageCode): LanguageCode {
    // 1. Saved manual preference
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(this.storageKey);
        if (saved && (this.supportedLanguages.size === 0 || this.supportedLanguages.has(saved))) {
          return saved;
        }
      }
    } catch {
      // Storage unavailable in sandbox/iframe
    }

    // 2. Browser/Device locale detection
    try {
      if (typeof navigator !== 'undefined') {
        const candidates = navigator.languages && navigator.languages.length
          ? navigator.languages
          : [navigator.language || ''];

        for (const candidate of candidates) {
          if (!candidate) continue;
          const code = candidate.toLowerCase().slice(0, 2);
          if (this.supportedLanguages.has(code)) {
            return code;
          }
        }
      }
    } catch {
      // ignore
    }

    return defaultLang;
  }

  public getLanguage(): LanguageCode {
    return this.currentLanguage;
  }

  public setLanguage(lang: LanguageCode): void {
    this.currentLanguage = lang;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, lang);
      }
    } catch {
      // ignore
    }
    this.notify();
  }

  public register(lang: LanguageCode, dict: DictionaryTree): void {
    const existing = this.dictionaries.get(lang) || {};
    this.dictionaries.set(lang, this.deepMerge(existing, dict));
    this.supportedLanguages.add(lang);
  }

  public async loadAsync(lang: LanguageCode, loader: () => Promise<DictionaryTree>): Promise<boolean> {
    try {
      const data = await loader();
      this.register(lang, data);
      return true;
    } catch (err) {
      console.error(`[i18n] Failed to load async dictionary for ${lang}:`, err);
      return false;
    }
  }

  public t(path: string, params?: TranslationParams, targetLang?: LanguageCode): string {
    const lang = targetLang || this.currentLanguage;
    const dict = this.dictionaries.get(lang) || this.dictionaries.get(this.fallbackLanguage);

    let val = this.resolvePath(dict, path);

    // Fallback to fallback language if missing in target
    if (val === undefined && lang !== this.fallbackLanguage) {
      const fallbackDict = this.dictionaries.get(this.fallbackLanguage);
      val = this.resolvePath(fallbackDict, path);
    }

    if (val === undefined) {
      return path;
    }

    if (typeof val !== 'string') {
      return path;
    }

    if (!params) {
      return val;
    }

    return val.replace(/\{(\w+)\}/g, (_: string, match: string) => {
      return params[match] !== undefined ? String(params[match]) : `{${match}}`;
    });
  }

  public getAllKeys(dict?: DictionaryTree, prefix = ''): string[] {
    const target = dict || this.dictionaries.get(this.fallbackLanguage);
    if (!target) return [];

    let keys: string[] = [];
    for (const [key, value] of Object.entries(target)) {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        keys = keys.concat(this.getAllKeys(value as DictionaryTree, fullPath));
      } else {
        keys.push(fullPath);
      }
    }
    return keys;
  }

  public findMissing(baseLang: LanguageCode = this.fallbackLanguage): MissingKeysReport {
    const baseDict = this.dictionaries.get(baseLang);
    if (!baseDict) return {};

    const baseKeys = this.getAllKeys(baseDict);
    const report: MissingKeysReport = {};

    for (const [lang, dict] of this.dictionaries.entries()) {
      if (lang === baseLang) continue;

      const currentKeys = new Set(this.getAllKeys(dict));
      const missing: string[] = [];

      for (const key of baseKeys) {
        if (!currentKeys.has(key)) {
          missing.push(key);
        } else {
          const val = this.resolvePath(dict, key);
          if (typeof val === 'string' && val.trim() === '') {
            missing.push(`${key} (empty string)`);
          }
        }
      }

      report[lang] = missing;
    }

    return report;
  }

  public audit(baseLang: LanguageCode = this.fallbackLanguage): I18nAuditResult {
    const baseDict = this.dictionaries.get(baseLang);
    const baseKeys = baseDict ? this.getAllKeys(baseDict) : [];
    const missing = this.findMissing(baseLang);
    const hasMissing = Object.values(missing).some((arr) => arr.length > 0);

    return {
      isFullyTranslated: !hasMissing,
      baseLanguage: baseLang,
      totalKeys: baseKeys.length,
      languages: Array.from(this.dictionaries.keys()),
      missingByLanguage: missing,
    };
  }

  public subscribe(listener: (lang: LanguageCode) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentLanguage);
      } catch (e) {
        console.error('[i18n] Error in language subscriber:', e);
      }
    });
  }

  private resolvePath(obj: any, path: string): any {
    if (!obj || typeof obj !== 'object') return undefined;
    const parts = path.split('.');
    let current = obj;
    for (const p of parts) {
      if (current && typeof current === 'object' && p in current) {
        current = current[p];
      } else {
        return undefined;
      }
    }
    return current;
  }

  private deepMerge(target: any, source: any): any {
    for (const key of Object.keys(source)) {
      if (source[key] instanceof Object && key in target) {
        Object.assign(source[key], this.deepMerge(target[key], source[key]));
      }
    }
    Object.assign(target || {}, source);
    return target;
  }
}
