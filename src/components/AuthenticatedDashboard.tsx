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
  ShieldCheck,
  UserCheck,
  User as UserIcon,
} from 'lucide-react';
import { store, useAuthStore } from '../lib/store.ts';
import { getTranslation, formatDate } from '../lib/i18n/index.ts';
import { httpClient } from '../lib/httpClient.ts';
import { LanguageSelector } from './LanguageSelector.tsx';
import { HttpResponse } from '../lib/types.ts';
import { UserDetailView } from './UserDetailView.tsx';
import { useRoleAccess } from '../lib/rbac.ts';

export function AuthenticatedDashboard() {
  const { user, currentLang, isDebugMode } = useAuthStore();
  const { currentRole, isAdmin, isGuest } = useRoleAccess();
  const [currentView, setCurrentView] = useState<'overview' | 'detail'>('overview');
  const [copied, setCopied] = useState(false);
  const [isHttpLoading, setIsHttpLoading] = useState(false);
  const [lastHttpResponse, setLastHttpResponse] = useState<HttpResponse | null>(null);
  const [logoClicks, setLogoClicks] = useState(0);

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
          ? 'Modalità Debug attivata (Info & Log visibili)'
          : 'Modalità Debug disattivata',
      });
    } else {
      setLogoClicks(next);
      setTimeout(() => setLogoClicks(0), 1200);
    }
  };

  // Role Badge configuration based on useRoleAccess hook
  const getRoleBadgeConfig = () => {
    if (isAdmin) {
      return {
        label: 'ADMIN',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-300 ring-1 ring-purple-500/20',
        icon: ShieldCheck,
      };
    }
    if (isGuest) {
      return {
        label: 'GUEST',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 ring-1 ring-slate-400/20',
        icon: UserIcon,
      };
    }
    return {
      label: 'USER',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-1 ring-emerald-500/20',
      icon: UserCheck,
    };
  };

  const roleBadge = getRoleBadgeConfig();
  const RoleBadgeIcon = roleBadge.icon;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Application Bar with Full Responsive Protection */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
          {/* Left: Logo & Navigation */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={handleLogoClick}
              title="Triplo clic per attivare/disattivare la Modalità Debug"
              className="w-8 h-8 rounded-lg bg-slate-900 text-white font-black flex items-center justify-center text-sm shadow-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0"
            >
              G
            </button>

            <nav className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setCurrentView('overview')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                  currentView === 'overview'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Panoramica
              </button>
              <button
                type="button"
                onClick={() => setCurrentView('detail')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  currentView === 'detail'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{isDebugMode || user.role === 'admin' ? 'Dettaglio' : 'Profilo'}</span>
                {(isDebugMode || user.role === 'admin') && (
                  <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-mono">
                    v1
                  </span>
                )}
              </button>
            </nav>

            {/* Current User Role Badge */}
            <span
              data-testid="header-role-badge"
              className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider border shadow-2xs shrink-0 ${roleBadge.badgeClass}`}
              title={`Ruolo utente: ${roleBadge.label} (${currentRole})`}
            >
              <RoleBadgeIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{roleBadge.label}</span>
            </span>
          </div>

          {/* Right Header Controls (Language, Debug Controls, Sign Out) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <LanguageSelector compact />

            {/* Info / About: ONLY visible in Debug Mode */}
            {isDebugMode && (
              <button
                type="button"
                onClick={() => store.setAboutOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors border border-slate-200 shrink-0"
                title={getTranslation(currentLang, 'about.buttonLabel')}
              >
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="hidden md:inline">Info</span>
              </button>
            )}

            {/* Console Log: ONLY visible in Debug Mode */}
            {isDebugMode && (
              <button
                type="button"
                onClick={() => store.setDrawerOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-300 shrink-0"
                title="Apri console log strutturati (Debug Mode)"
              >
                <Terminal className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="hidden md:inline">Log</span>
              </button>
            )}

            {/* Disconnect Button: compact icon on mobile to prevent overflow, text on sm+ */}
            <button
              type="button"
              onClick={() => store.handleSignOut()}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200 shrink-0 cursor-pointer"
              title={getTranslation(currentLang, 'dashboard.signOutButton')}
              aria-label={getTranslation(currentLang, 'dashboard.signOutButton')}
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">
                {getTranslation(currentLang, 'dashboard.signOutButton')}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {currentView === 'detail' ? (
          <UserDetailView onBack={() => setCurrentView('overview')} />
        ) : (
          <>
            {/* Welcome Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
              <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-slate-200 shadow-xs object-cover shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-100 text-blue-700 font-bold text-xl sm:text-2xl flex items-center justify-center border-2 border-blue-200 shrink-0">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate">
                      {getTranslation(currentLang, 'dashboard.welcome', {
                        name: user.displayName,
                      })}
                    </h1>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <Sparkles className="w-3 h-3" />
                      Google SSO
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500">
                    {getTranslation(currentLang, 'dashboard.welcomeSubtitle')}
                  </p>
                </div>
              </div>

              {isDebugMode && (
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => store.setDrawerOpen(true)}
                    className="flex-1 md:flex-initial px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Terminal className="w-4 h-4 shrink-0" />
                    <span>{getTranslation(currentLang, 'dashboard.viewLogs')}</span>
                  </button>
                </div>
              )}
            </div>

            {/* 2-Column Responsive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Card 1: User Profile Info */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
                      <Fingerprint className="w-5 h-5 text-blue-600 shrink-0" />
                      <span>{getTranslation(currentLang, 'dashboard.profileTitle')}</span>
                    </h2>
                    <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200 font-semibold">
                      OAuth 2.0
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs text-slate-500 font-medium">
                            {getTranslation(currentLang, 'dashboard.emailLabel')}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] sm:text-xs text-emerald-700 font-medium bg-emerald-100/60 px-2 py-0.5 rounded-md shrink-0">
                        Verificata
                      </span>
                    </div>

                    <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>{getTranslation(currentLang, 'dashboard.registeredLabel')}</span>
                        </div>
                        <div className="text-xs font-medium text-slate-800 truncate">
                          {formatDate(user.registeredAt, currentLang)}
                        </div>
                      </div>

                      <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>{getTranslation(currentLang, 'dashboard.lastLoginLabel')}</span>
                        </div>
                        <div className="text-xs font-medium text-slate-800 truncate">
                          {formatDate(user.lastLoginAt, currentLang)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentView('detail')}
                  className="w-full mt-6 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  <Fingerprint className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    {isDebugMode || user.role === 'admin'
                      ? 'Vedi Dettaglio Completo & Contratti (v1)'
                      : 'Visualizza Profilo Completo'}
                  </span>
                </button>
              </div>

              {/* Card 2: Interactive HTTP Client Simulator (ONLY in Debug Mode) OR Account Security Card */}
              {isDebugMode ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Server className="w-5 h-5 text-indigo-600 shrink-0" />
                        <span>{getTranslation(currentLang, 'dashboard.testingTitle')}</span>
                      </h2>
                      <span className="text-[11px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200 font-semibold">
                        httpClient.ts [Debug]
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
                      {getTranslation(currentLang, 'dashboard.testingDescription')}
                    </p>

                    <button
                      type="button"
                      disabled={isHttpLoading}
                      onClick={handleTestHttpCall}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isHttpLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                          <span>{getTranslation(currentLang, 'dashboard.simulatingRequest')}</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 shrink-0" />
                          <span>{getTranslation(currentLang, 'dashboard.sendHttpReq')}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* HTTP Response Panel */}
                  {lastHttpResponse && (
                    <div className="mt-6 p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono space-y-2 border border-slate-800 overflow-x-auto">
                      <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800 gap-2">
                        <span className="truncate">STATUS: {lastHttpResponse.status} {lastHttpResponse.statusText}</span>
                        <span className="text-emerald-400 font-bold shrink-0">{lastHttpResponse.latencyMs} ms</span>
                      </div>
                      <div className="text-slate-400 break-all">
                        URL: <span className="text-slate-200">{lastHttpResponse.url}</span>
                      </div>
                      <div className="text-slate-400 break-all">
                        CORRELATION ID:{' '}
                        <span className="text-indigo-400">
                          {lastHttpResponse.headers['x-correlation-id'] || 'req_auto_injected'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>Sicurezza & Privacy Account</span>
                      </h2>
                      <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                        Protetto da Google
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
                      Il tuo accesso è autenticato in modo sicuro con Google Single Sign-On. I tuoi dati personali sono protetti e crittografati in conformità con i più elevati standard di privacy.
                    </p>

                    <div className="space-y-3 text-xs text-slate-700">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <span className="text-slate-500">Crittografia in transito</span>
                        <span className="font-semibold text-emerald-600">TLS 1.3 Attiva</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <span className="text-slate-500">Protezione Credenziali</span>
                        <span className="font-semibold text-slate-800">Nessuna password salvata</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <span className="text-slate-500">Stato Sessione</span>
                        <span className="font-semibold text-emerald-600">Verificata</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentView('detail')}
                    className="w-full mt-6 py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl transition-colors border border-blue-200 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Visualizza I Miei Permessi</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
