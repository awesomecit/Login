/**
 * Reusable i18n package type contracts
 */

export type LanguageCode = string;

export interface TranslationParams {
  [param: string]: string | number;
}

export type DictionaryTree = {
  [key: string]: string | DictionaryTree;
};

export interface I18nOptions {
  defaultLanguage: LanguageCode;
  supportedLanguages?: LanguageCode[];
  fallbackLanguage?: LanguageCode;
  storageKey?: string;
}

export interface MissingKeysReport {
  [languageCode: string]: string[];
}

export interface I18nAuditResult {
  isFullyTranslated: boolean;
  baseLanguage: LanguageCode;
  totalKeys: number;
  languages: LanguageCode[];
  missingByLanguage: MissingKeysReport;
}

export interface I18nContextValue {
  currentLang: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (path: string, params?: TranslationParams) => string;
  formatDate: (date: Date | string) => string;
  availableLanguages: LanguageCode[];
}
