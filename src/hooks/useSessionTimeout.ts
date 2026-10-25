import { useState, useEffect, useCallback, useRef } from 'react';
import { store, useAuthStore } from '../lib/store.ts';
import { auditTracker } from '../lib/firebase.ts';
import { getTranslation } from '../lib/i18n/index.ts';
import { logger } from '../lib/logger.ts';

export interface SessionTimeoutOptions {
  /** Tempo totale di inattività prima del logout automatico (default: 30 minuti = 1.800.000 ms) */
  timeoutMs?: number;
  /** Tempo di preavviso per mostrare il modale di warning (default: 2 minuti = 120.000 ms) */
  warningMs?: number;
}

export interface SessionTimeoutState {
  isWarningOpen: boolean;
  secondsRemaining: number;
  totalWarningSeconds: number;
  extendSession: () => void;
  signOutImmediately: () => Promise<void>;
  simulateWarning: (seconds?: number) => void;
}

const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const DEFAULT_WARNING_MS = 2 * 60 * 1000;  // 2 minutes

export function useSessionTimeout(options?: SessionTimeoutOptions): SessionTimeoutState {
  const { user, currentLang } = useAuthStore();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const warningMs = options?.warningMs ?? DEFAULT_WARNING_MS;
  const totalWarningSeconds = Math.round(warningMs / 1000);

  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(totalWarningSeconds);

  const lastActivityRef = useRef<number>(Date.now());
  const isWarningOpenRef = useRef<boolean>(false);
  const simulatedWarningRef = useRef<boolean>(false);
  const isLoggingOutRef = useRef<boolean>(false);

  // Sync ref with state for event listeners
  isWarningOpenRef.current = isWarningOpen;

  // Resetta l'attività dell'utente
  const handleActivity = useCallback(() => {
    // Se il modale di avviso è aperto, ignoriamo i micro-movimenti per evitare chiusure accidentali:
    // l'utente deve premere esplicitamente "Rimani Connesso"
    if (isWarningOpenRef.current) return;

    const now = Date.now();
    // Throttle degli aggiornamenti di attività a 1 secondo
    if (now - lastActivityRef.current > 1000) {
      lastActivityRef.current = now;
    }
  }, []);

  // Prolunga attivamente la sessione
  const extendSession = useCallback(() => {
    lastActivityRef.current = Date.now();
    simulatedWarningRef.current = false;
    setIsWarningOpen(false);
    auditTracker.beat();
    logger.info('SessionTimeout', 'User extended session from timeout warning modal');

    store.addToast({
      type: 'info',
      title: getTranslation(currentLang, 'sessionTimeout.warningTitle'),
      message: getTranslation(currentLang, 'sessionTimeout.sessionExtended'),
      duration: 3000,
    });
  }, [currentLang]);

  // Logout immediato
  const signOutImmediately = useCallback(async () => {
    setIsWarningOpen(false);
    logger.info('SessionTimeout', 'User chose to sign out immediately from warning modal');
    await store.handleSignOut();
  }, []);

  // Simulazione warning per test / debug
  const simulateWarning = useCallback((seconds = 120) => {
    simulatedWarningRef.current = true;
    lastActivityRef.current = Date.now() - (timeoutMs - seconds * 1000);
    setSecondsRemaining(seconds);
    setIsWarningOpen(true);
    logger.info('SessionTimeout', `Simulating session timeout warning with ${seconds}s remaining`);
  }, [timeoutMs]);

  // Ascolta evento personalizzato per simulare warning da qualsiasi componente di debug
  useEffect(() => {
    const handleSimulate = (e: Event) => {
      const custom = e as CustomEvent<{ seconds?: number }>;
      simulateWarning(custom.detail?.seconds ?? 120);
    };
    window.addEventListener('session-timeout:simulate', handleSimulate);
    return () => window.removeEventListener('session-timeout:simulate', handleSimulate);
  }, [simulateWarning]);

  // Gestione listeners utente per interazioni
  useEffect(() => {
    if (!user) {
      setIsWarningOpen(false);
      isLoggingOutRef.current = false;
      return;
    }

    lastActivityRef.current = Date.now();
    isLoggingOutRef.current = false;

    const events: (keyof WindowEventMap)[] = [
      'mousedown',
      'mousemove',
      'keydown',
      'touchstart',
      'scroll',
      'click',
    ];

    const throttledListener = () => handleActivity();

    events.forEach((event) => {
      window.addEventListener(event, throttledListener, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, throttledListener);
      });
    };
  }, [user, handleActivity]);

  // Timer di verifica periodica ogni secondo
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (isLoggingOutRef.current) return;

      const now = Date.now();
      const elapsedMs = now - lastActivityRef.current;
      const remainingMs = timeoutMs - elapsedMs;

      if (remainingMs <= 0) {
        // Timeout scaduto: scollega l'utente
        isLoggingOutRef.current = true;
        setIsWarningOpen(false);
        logger.warn('SessionTimeout', 'Session expired due to 30 minutes of inactivity. Logging out...');

        store.handleSignOut().then(() => {
          store.addToast({
            type: 'warning',
            title: getTranslation(currentLang, 'sessionTimeout.expiredTitle'),
            message: getTranslation(currentLang, 'sessionTimeout.expiredMessage'),
            duration: 8000,
          });
        });
      } else if (remainingMs <= warningMs) {
        // Finestra di preavviso (ultimi 2 minuti)
        const secondsLeft = Math.ceil(remainingMs / 1000);
        setSecondsRemaining(secondsLeft);
        if (!isWarningOpenRef.current) {
          setIsWarningOpen(true);
          logger.info('SessionTimeout', `Inactivity warning triggered: ${secondsLeft}s left until auto-logout`);
        }
      } else {
        // Utente ancora attivo: assicura che il modale sia chiuso
        if (isWarningOpenRef.current && !simulatedWarningRef.current) {
          setIsWarningOpen(false);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, timeoutMs, warningMs, currentLang]);

  return {
    isWarningOpen,
    secondsRemaining,
    totalWarningSeconds,
    extendSession,
    signOutImmediately,
    simulateWarning,
  };
}
