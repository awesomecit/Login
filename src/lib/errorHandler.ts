import { Language } from './types.ts';
import { getTranslation } from './i18n/index.ts';
import { logger } from './logger.ts';

export interface AppError {
  title: string;
  message: string;
  code?: string;
  technicalDetails?: string;
}

export function parseAuthError(
  error: unknown,
  lang: Language,
  isDebugMode: boolean = false
): AppError {
  const errCode = (error as { code?: string })?.code || '';
  const rawMessage = (error as Error)?.message || String(error);

  logger.error('ErrorHandler', `Auth error captured: ${errCode || 'UNKNOWN'}`, {
    code: errCode,
    rawMessage,
    isDebugMode,
  });

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'questo dominio';

  switch (errCode) {
    case 'auth/popup-closed-by-user':
      return {
        title: getTranslation(lang, 'errors.genericTitle'),
        message: getTranslation(lang, 'errors.popupClosed'),
        code: errCode,
      };

    case 'auth/popup-blocked':
      return {
        title: getTranslation(lang, 'errors.genericTitle'),
        message: getTranslation(lang, 'errors.popupBlocked'),
        code: errCode,
      };

    case 'auth/network-request-failed':
      return {
        title: getTranslation(lang, 'errors.genericTitle'),
        message: getTranslation(lang, 'errors.networkError'),
        code: errCode,
      };

    case 'auth/cancelled-popup-request':
      return {
        title: getTranslation(lang, 'errors.genericTitle'),
        message: getTranslation(lang, 'errors.userCancelled'),
        code: errCode,
      };

    case 'auth/user-disabled':
      return {
        title: getTranslation(lang, 'errors.genericTitle'),
        message: getTranslation(lang, 'errors.unauthorized'),
        code: errCode,
      };

    case 'auth/unauthorized-domain': {
      if (isDebugMode) {
        return {
          title: 'Dominio Non Autorizzato su Firebase [Debug]',
          message: `Il dominio corrente (${currentHost}) non è configurato tra i domini autorizzati. Aggiungilo in Firebase Console > Authentication > Settings > Authorized domains.`,
          code: errCode,
          technicalDetails: rawMessage,
        };
      }
      return {
        title: getTranslation(lang, 'errors.genericTitle'),
        message: getTranslation(lang, 'errors.genericDesc'),
        code: errCode,
        technicalDetails: `auth/unauthorized-domain on ${currentHost}`,
      };
    }

    default: {
      if (isDebugMode) {
        return {
          title: `Errore Autenticazione [Debug: ${errCode || 'ERR_UNKNOWN'}]`,
          message: rawMessage || getTranslation(lang, 'errors.genericDesc'),
          code: errCode || 'ERR_UNKNOWN',
          technicalDetails: rawMessage,
        };
      }
      return {
        title: getTranslation(lang, 'errors.genericTitle'),
        message: getTranslation(lang, 'errors.genericDesc'),
        code: errCode || 'ERR_UNKNOWN',
        technicalDetails: rawMessage,
      };
    }
  }
}
