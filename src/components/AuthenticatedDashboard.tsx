import { useState } from 'react';
import {
  LogOut,
  Mail,
  Fingerprint,
  Calendar,
  Send,
  Terminal,
  Copy,
  Check,
  Globe,
  Clock,
  Sparkles,
  Server,
  Info,
} from 'lucide-react';
import { store, useAuthStore } from '../lib/store.ts';
import { getTranslation, formatDate } from '../lib/i18n/index.ts';
import { httpClient } from '../lib/httpClient.ts';
import { LanguageSelector } from './LanguageSelector.tsx';
import { HttpResponse } from '../lib/types.ts';

export function AuthenticatedDashboard() {
  const { user, currentLang, isDebugMode } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [isHttpLoading, setIsHttpLoading] = useState(false);
  const [lastHttpResponse, setLastHttpResponse] = useState<HttpResponse | null>(null);

  if (!user) return null;

  const handleCopyUid = () => {
    navigator.clipboard.writeText(user.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestHttpCall = async () => {
    setIsHttpLoading(true);
    try {
      // Test request through httpClient with interceptors, latency calculation, correlation ID
      const res = await httpClient.get<any>('/index.html', {
        headers: {
          Authorization: `Bearer mock_token_for_${user.uid.slice(0, 8)}`,
        },
        logContext: 'DashboardHttpTest',
      });
      setLastHttpResponse(res);
      store.addToast({
        type: 'success',
        title: 'HTTP Client Interceptor',
        message: getTranslation(currentLang, 'dashboard.httpSuccess', {
          latency: res.latencyMs,
        }),
      });
    } catch (err: any) {
      store.addToast({
        type: 'error',
        title: 'HTTP Error',
        message: err.message,
      });
    } finally {
      setIsHttpLoading(false);
    }
  };

  const [logoClicks, setLogoClicks] = useState(0);

  const handleLogoClick = () => {
    setLogoClicks((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        const newDebug = !isDebugMode;
        store.setDebugMode(newDebug);
        store.addToast({
          type: newDebug ? 'info' : 'warning',
          title: 'Modalità Debug',
          message: newDebug
            ? 'Modalità Debug attivata (Info & Log visibili)'
            : 'Modalità Debug disattivata',
        });
        return 0;
      }
      setTimeout(() => setLogoClicks(0), 1000);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLogoClick}
              title="Triplo clic per attivare/disattivare la Modalità Debug"
              className="w-8 h-8 rounded-lg bg-slate-900 text-white font-black flex items-center justify-center text-sm shadow-sm hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              G
            </button>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Account Utente
            </span>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5">
            <LanguageSelector compact />

            {/* Info / About: ONLY visible in Debug Mode */}
            {isDebugMode && (
              <button
                type="button"
                onClick={() => store.setAboutOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors border border-slate-200"
                title={getTranslation(currentLang, 'about.buttonLabel')}
              >
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Info</span>
              </button>
            )}

            {/* Console Log: ONLY visible in Debug Mode */}
            {isDebugMode && (
              <button
                type="button"
                onClick={() => store.setDrawerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-300"
                title="Apri console log strutturati (Debug Mode)"
              >
                <Terminal className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">Debug Log</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => store.handleSignOut()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{getTranslation(currentLang, 'dashboard.signOutButton')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-16 h-16 rounded-full border-2 border-slate-200 shadow-sm object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 font-bold text-2xl flex items-center justify-center border-2 border-blue-200">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {getTranslation(currentLang, 'dashboard.welcome', {
                    name: user.displayName,
                  })}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="w-3 h-3" />
                  Google SSO
                </span>
              </div>
              <p className="text-sm text-slate-500">
                {getTranslation(currentLang, 'dashboard.welcomeSubtitle')}
              </p>
            </div>
          </div>

          {isDebugMode && (
            <button
              type="button"
              onClick={() => store.setDrawerOpen(true)}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <Terminal className="w-4 h-4" />
              {getTranslation(currentLang, 'dashboard.viewLogs')}
            </button>
          )}
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: User Profile Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 mb-6 flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-blue-600" />
              {getTranslation(currentLang, 'dashboard.profileTitle')}
            </h2>

            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-xs text-slate-500 font-medium">
                      {getTranslation(currentLang, 'dashboard.emailLabel')}
                    </div>
                    <div className="text-sm font-semibold text-slate-800">
                      {user.email}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-emerald-700 font-medium bg-emerald-100/60 px-2 py-0.5 rounded-md">
                  Verificata
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500 font-medium">
                      {getTranslation(currentLang, 'dashboard.uidLabel')}
                    </div>
                    <div className="text-xs font-mono font-medium text-slate-800 truncate">
                      {user.uid}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUid}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
                  title="Copia UID"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{getTranslation(currentLang, 'dashboard.registeredLabel')}</span>
                  </div>
                  <div className="text-xs font-medium text-slate-800">
                    {formatDate(user.registeredAt, currentLang)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{getTranslation(currentLang, 'dashboard.lastLoginLabel')}</span>
                  </div>
                  <div className="text-xs font-medium text-slate-800">
                    {formatDate(user.lastLoginAt, currentLang)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Interactive HTTP Client & Interceptors Tester */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  <Server className="w-5 h-5 text-indigo-600" />
                  {getTranslation(currentLang, 'dashboard.testingTitle')}
                </h2>
                <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">
                  httpClient.ts
                </span>
              </div>

              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                {getTranslation(currentLang, 'dashboard.testingDescription')}
              </p>

              <button
                type="button"
                disabled={isHttpLoading}
                onClick={handleTestHttpCall}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isHttpLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{getTranslation(currentLang, 'dashboard.simulatingRequest')}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{getTranslation(currentLang, 'dashboard.sendHttpReq')}</span>
                  </>
                )}
              </button>
            </div>

            {/* HTTP Response Panel */}
            {lastHttpResponse && (
              <div className="mt-6 p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono space-y-2 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                  <span>STATUS: {lastHttpResponse.status} {lastHttpResponse.statusText}</span>
                  <span className="text-emerald-400 font-bold">{lastHttpResponse.latencyMs} ms</span>
                </div>
                <div className="text-slate-400">
                  URL: <span className="text-slate-200">{lastHttpResponse.url}</span>
                </div>
                <div className="text-slate-400">
                  CORRELATION ID:{' '}
                  <span className="text-indigo-400">
                    {lastHttpResponse.headers['x-correlation-id'] || 'req_auto_injected'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
