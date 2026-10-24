import { useEffect } from 'react';
import { onAuthStateChanged, auth, testConnection, syncUserProfile } from './lib/firebase.ts';
import { store, useAuthStore } from './lib/store.ts';
import { logger } from './lib/logger.ts';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { AuthSplitLayout } from './components/AuthSplitLayout.tsx';
import { AuthenticatedDashboard } from './components/AuthenticatedDashboard.tsx';
import { ToastContainer } from './components/ToastContainer.tsx';
import { DiagnosticDrawer } from './components/DiagnosticDrawer.tsx';
import { AboutModal } from './components/AboutModal.tsx';
import { PolicyModal } from './components/PolicyModal.tsx';
import { auditTranslations } from './lib/i18n/index.ts';

export default function App() {
  const { user, initialized } = useAuthStore();

  useEffect(() => {
    // 1. Boot connection test per skill mandate
    testConnection().then((connected) => {
      logger.info('AppBoot', `Firebase connection test completed: ${connected ? 'ONLINE' : 'OFFLINE'}`);
    });

    // 2. Audit integrità traduzioni
    const i18nAudit = auditTranslations();
    logger.info('i18nBoot', `Audit traduzioni completato: ${i18nAudit.isFullyTranslated ? '100% COMPLETO' : 'CHIAVI MANCANTI'}`, {
      totalKeys: i18nAudit.totalBaseKeys,
      languages: i18nAudit.languages,
      missingByLang: i18nAudit.missingByLang,
    });

    // 2. Synchronize Firebase Auth session with reactive store
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        logger.info('AppBoot', `Active Firebase session detected for UID: ${firebaseUser.uid}`, {
          email: firebaseUser.email,
        });
        try {
          const profile = await syncUserProfile(firebaseUser, false);
          store.setUser(profile);
        } catch {
          // fallback to client-side profile if firestore write restricted
          store.setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Google User',
            photoURL: firebaseUser.photoURL || undefined,
            providerId: 'google.com',
            registeredAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          });
        }
      } else {
        logger.debug('AppBoot', 'No active Firebase session detected');
        let hasCache = false;
        try {
          hasCache = !!localStorage.getItem('nexus_auth_cached_user');
        } catch {
          // localStorage non accessibile in alcuni iframe
        }
        if (store.getState().user && !hasCache) {
          store.setUser(null);
        }
      }
      store.setInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-600 selection:text-white">
        {user ? <AuthenticatedDashboard /> : <AuthSplitLayout />}

        {/* Global Toasts */}
        <ToastContainer />

        {/* Real-time Structured Logs & Telemetry Drawer */}
        <DiagnosticDrawer />

        {/* Informational About Component Modal */}
        <AboutModal />

        {/* Dedicated Terms of Service & Privacy Policy Modal */}
        <PolicyModal />
      </div>
    </ErrorBoundary>
  );
}
