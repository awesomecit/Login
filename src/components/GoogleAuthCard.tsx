import { useState } from 'react';
import { Terminal, Shield, AlertCircle, RefreshCw, Info } from 'lucide-react';
import { store, useAuthStore } from '../lib/store.ts';
import { getTranslation } from '../lib/i18n/index.ts';
import { LanguageSelector } from './LanguageSelector.tsx';

export function GoogleAuthCard() {
  const { authMode, isLoading, currentLang, lastError, isDebugMode } = useAuthStore();
  const [internalError, setInternalError] = useState<string | null>(null);

  const isSignUp = authMode === 'signup';

  const handleGoogleAuth = async () => {
    setInternalError(null);
    store.clearLastError();
    try {
      await store.loginWithGoogle(isSignUp);
    } catch {
      // L'errore è già formattato e mascherato/dettagliato in store.lastError
    }
  };

  const displayedError = lastError;

  const [logoClicks, setLogoClicks] = useState(0);

  const handleLogoClick = () => {
    const next = logoClicks + 1;
    if (next >= 3) {
      setLogoClicks(0);
      const newDebug = !isDebugMode;
      store.setDebugMode(newDebug);
      store.addToast({
        type: newDebug ? 'info' : 'warning',
        title: 'Modalità Debug',
        message: newDebug
          ? 'Modalità Debug attivata (pulsanti Info e Log visibili)'
          : 'Modalità Debug disattivata',
      });
    } else {
      setLogoClicks(next);
      setTimeout(() => setLogoClicks(0), 1200);
    }
  };

  return (
    <div className="flex flex-col justify-between h-full p-6 sm:p-8 lg:p-10 bg-white text-slate-900">
      {/* Top Header: Brand, Language, About button, and conditional Debug Console button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLogoClick}
            title="Triplo clic per attivare/disattivare la Modalità Debug"
            className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-sm shadow-sm hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            G
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector (defaults to device/browser) */}
          <LanguageSelector compact />

          {/* About Component: ONLY visible if debug mode is active */}
          {isDebugMode && (
            <button
              type="button"
              onClick={() => store.setAboutOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors border border-slate-200"
              title={getTranslation(currentLang, 'about.buttonLabel')}
            >
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">{getTranslation(currentLang, 'about.buttonLabel')}</span>
            </button>
          )}

          {/* Console Log: ONLY visible if debug mode is active */}
          {isDebugMode && (
            <button
              type="button"
              onClick={() => store.setDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-300"
              title="Console Log (Debug Mode Attivo)"
            >
              <Terminal className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">Debug Log</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Form Center Area */}
      <div className="w-full my-auto py-6 sm:py-8">
        {/* Sign In / Sign Up Mode Switcher Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl mb-7 border border-slate-200">
          <button
            type="button"
            onClick={() => store.setAuthMode('signin')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              !isSignUp
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {getTranslation(currentLang, 'auth.tabSignIn')}
          </button>
          <button
            type="button"
            onClick={() => store.setAuthMode('signup')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              isSignUp
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {getTranslation(currentLang, 'auth.tabSignUp')}
          </button>
        </div>

        {/* Title & Subtitle */}
        <div className="mb-7 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
            {isSignUp
              ? getTranslation(currentLang, 'auth.createAccount')
              : getTranslation(currentLang, 'auth.welcomeBack')}
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            {isSignUp
              ? getTranslation(currentLang, 'auth.signUpSubtitle')
              : getTranslation(currentLang, 'auth.signInSubtitle')}
          </p>
        </div>

        {/* Error Alert Box */}
        {displayedError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 transition-all duration-200">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-rose-900 leading-tight mb-1">
                {getTranslation(currentLang, 'errors.genericTitle')}
              </p>
              <p className="text-xs text-rose-700 leading-relaxed mb-3 break-words">
                {displayedError}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-md transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  {getTranslation(currentLang, 'errors.retryButton')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInternalError(null);
                    store.clearLastError();
                  }}
                  className="text-xs text-rose-700 hover:text-rose-900 font-medium underline"
                >
                  {getTranslation(currentLang, 'errors.dismissButton')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Google SSO Button */}
        <div className="space-y-4">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-3.5 px-5 py-3.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 text-sm sm:text-base font-semibold rounded-xl border border-slate-300 hover:border-slate-400 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin shrink-0" />
            ) : (
              /* Google Official Multicolor "G" SVG Icon */
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}

            <span>
              {isLoading
                ? isSignUp
                  ? getTranslation(currentLang, 'auth.signingUp')
                  : getTranslation(currentLang, 'auth.signingIn')
                : isSignUp
                ? getTranslation(currentLang, 'auth.googleSignUpButton')
                : getTranslation(currentLang, 'auth.googleSignInButton')}
            </span>
          </button>

          {/* Federated SSO Single-Provider Notice */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-500 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <span className="leading-relaxed">
              {getTranslation(currentLang, 'auth.ssoOnlyNotice')}
            </span>
          </div>
        </div>

        {/* Disclaimer Footer with Dedicated Policy Modals */}
        <p className="mt-7 text-center text-xs text-slate-400 leading-relaxed">
          {getTranslation(currentLang, 'auth.privacyDisclaimer')}{' '}
          <button
            type="button"
            onClick={() => store.openPolicyModal('terms')}
            className="underline font-medium text-slate-700 hover:text-blue-600 transition-colors"
          >
            {getTranslation(currentLang, 'auth.termsOfService')}
          </button>{' '}
          {getTranslation(currentLang, 'auth.and')}{' '}
          <button
            type="button"
            onClick={() => store.openPolicyModal('privacy')}
            className="underline font-medium text-slate-700 hover:text-blue-600 transition-colors"
          >
            {getTranslation(currentLang, 'auth.privacyPolicy')}
          </button>
          .
        </p>
      </div>

      {/* Card Footer Security Indicator */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-center text-[11px] text-slate-400">
        <span>{getTranslation(currentLang, 'auth.secureBadge')}</span>
      </div>
    </div>
  );
}
