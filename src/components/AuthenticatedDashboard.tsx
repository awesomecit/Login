import { useState } from 'react';
import {
  Menu,
  X,
  LayoutDashboard,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const handleCopyUid = () => {
    navigator.clipboard.writeText(user.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestHttpCall = async () => {
    setIsHttpLoading(true);
    try {
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

  // Distinct Role Badge configuration via useRoleAccess
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

  const navigateTo = (view: 'overview' | 'detail') => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      {/* ------------------------------------------------------------- */}
      {/* 1. Mobile Top Navigation Bar (< 768px)                       */}
      {/* ------------------------------------------------------------- */}
      <header className="md:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-3 py-2.5 flex items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          {/* Hamburger button to toggle mobile sidebar */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
            aria-label={mobileMenuOpen ? 'Chiudi menu' : 'Apri menu di navigazione'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={handleLogoClick}
            title="Triplo clic per attivare/disattivare la Modalità Debug"
            className="w-7 h-7 rounded-lg bg-slate-900 text-white font-black flex items-center justify-center text-xs shadow-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0"
          >
            G
          </button>

          <span className="text-sm font-bold text-slate-900 truncate">
            Nexus SSO
          </span>

          {/* Role Badge in Mobile Top Bar */}
          <span
            data-testid="header-role-badge"
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-2xs shrink-0 ${roleBadge.badgeClass}`}
            title={`Ruolo utente: ${roleBadge.label} (${currentRole})`}
          >
            <RoleBadgeIcon className="w-3 h-3 shrink-0" />
            <span>{roleBadge.label}</span>
          </span>
        </div>

        {/* Compact Right Controls in Mobile Header */}
        <div className="flex items-center gap-1.5 shrink-0">
          <LanguageSelector compact />

          {/* Mobile Disconnect Button: Compact icon with touch target */}
          <button
            type="button"
            onClick={() => store.handleSignOut()}
            className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200 shrink-0 cursor-pointer"
            title={getTranslation(currentLang, 'dashboard.signOutButton')}
            aria-label={getTranslation(currentLang, 'dashboard.signOutButton')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. Mobile Sidebar Overlay & Drawer (< 768px)                  */}
      {/* ------------------------------------------------------------- */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="w-64 max-w-[80vw] h-full bg-white shadow-2xl flex flex-col justify-between p-4 border-r border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-black flex items-center justify-center text-sm shadow-xs">
                    G
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 leading-tight">Nexus SSO</h2>
                    <span className="text-[10px] text-slate-500">Menu Navigazione</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                  aria-label="Chiudi menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Mini Card in Mobile Sidebar */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {user.displayName}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {user.email}
                  </div>
                </div>
              </div>

              {/* Navigation Items in Mobile Sidebar */}
              <nav className="space-y-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => navigateTo('overview')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    currentView === 'overview'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Panoramica Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('detail')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    currentView === 'detail'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Fingerprint className="w-4 h-4 shrink-0" />
                  <span>{isDebugMode || user.role === 'admin' ? 'Dettaglio Utente (v1)' : 'Profilo Utente'}</span>
                </button>
              </nav>
            </div>

            {/* Bottom Controls in Mobile Sidebar */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              {isDebugMode && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    store.setDrawerOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors border border-amber-200 cursor-pointer"
                >
                  <Terminal className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Debug Log Console</span>
                </button>
              )}

              {isDebugMode && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    store.setAboutOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200 cursor-pointer"
                >
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Informazioni App [Debug]</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => store.handleSignOut()}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border border-rose-200 cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>{getTranslation(currentLang, 'dashboard.signOutButton')}</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. Desktop Persistent Sidebar (>= 768px md:flex)              */}
      {/* ------------------------------------------------------------- */}
      <aside className="hidden md:flex flex-col justify-between w-64 lg:w-72 bg-white border-r border-slate-200 p-5 shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto">
        <div className="space-y-6">
          {/* Brand & Logo */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleLogoClick}
                title="Triplo clic per attivare/disattivare la Modalità Debug"
                className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-sm shadow-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer shrink-0"
              >
                G
              </button>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-slate-900 leading-tight">Nexus SSO</h1>
                <span className="text-[11px] text-slate-500">Auth Portal</span>
              </div>
            </div>

            {/* Role Badge in Desktop Sidebar */}
            <span
              data-testid="header-role-badge"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-2xs shrink-0 ${roleBadge.badgeClass}`}
              title={`Ruolo utente: ${roleBadge.label} (${currentRole})`}
            >
              <RoleBadgeIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{roleBadge.label}</span>
            </span>
          </div>

          {/* User Mini Profile Header */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900 truncate">
                {user.displayName}
              </div>
              <div className="text-[11px] text-slate-500 font-mono truncate">
                {user.email}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setCurrentView('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                currentView === 'overview'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Panoramica</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('detail')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                currentView === 'detail'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Fingerprint className="w-4 h-4 shrink-0" />
                <span className="truncate">{isDebugMode || user.role === 'admin' ? 'Dettaglio Utente' : 'Profilo'}</span>
              </div>
              {(isDebugMode || user.role === 'admin') && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-mono font-bold">
                  v1
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="pt-4 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-slate-500">Lingua:</span>
            <LanguageSelector compact />
          </div>

          {isDebugMode && (
            <button
              type="button"
              onClick={() => store.setDrawerOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors border border-amber-300 cursor-pointer"
            >
              <Terminal className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Console Log [Debug]</span>
            </button>
          )}

          {isDebugMode && (
            <button
              type="button"
              onClick={() => store.setAboutOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200 cursor-pointer"
            >
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Info Componente</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => store.handleSignOut()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border border-rose-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>{getTranslation(currentLang, 'dashboard.signOutButton')}</span>
          </button>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* 4. Main Responsive Content Area                               */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 overflow-y-auto">
        {currentView === 'detail' ? (
          <UserDetailView onBack={() => setCurrentView('overview')} />
        ) : (
          <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
            {/* Welcome Banner (Stacked vertically on mobile, row on tablet/desktop) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 md:p-7 shadow-xs flex flex-col sm:flex-row items-center sm:items-start md:items-center justify-between gap-4 sm:gap-6 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-5 min-w-0">
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
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-slate-900 truncate">
                      {getTranslation(currentLang, 'dashboard.welcome', {
                        name: user.displayName,
                      })}
                    </h2>
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
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => store.setDrawerOpen(true)}
                    className="px-3.5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-xs inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Terminal className="w-4 h-4 shrink-0" />
                    <span>{getTranslation(currentLang, 'dashboard.viewLogs')}</span>
                  </button>
                </div>
              )}
            </div>

            {/* 2-Column Responsive Grid (Single column on mobile, 2 cols on lg) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Card 1: User Profile Details (Optimized Vertical Stacking on Mobile) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 sm:mb-5 pb-3 border-b border-slate-100">
                    <h3 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
                      <Fingerprint className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
                      <span>{getTranslation(currentLang, 'dashboard.profileTitle')}</span>
                    </h3>
                    <span className="text-[11px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200 font-semibold shrink-0">
                      OAuth 2.0
                    </span>
                  </div>

                  {/* Vertical stacked profile fields */}
                  <div className="space-y-3">
                    {/* Email item */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[11px] text-slate-500 font-medium">
                            {getTranslation(currentLang, 'dashboard.emailLabel')}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-slate-800 break-all">
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-emerald-700 font-medium bg-emerald-100/60 px-2 py-0.5 rounded-md self-start sm:self-auto shrink-0">
                        Verificata
                      </span>
                    </div>

                    {/* UID item */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] text-slate-500 font-medium">
                            {getTranslation(currentLang, 'dashboard.uidLabel')}
                          </div>
                          <div className="text-xs font-mono font-medium text-slate-800 break-all">
                            {user.uid}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyUid}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors shrink-0 cursor-pointer"
                        title="Copia UID"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Timestamps stacked vertically on mobile (< sm), 2 columns on sm+ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mb-1">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>{getTranslation(currentLang, 'dashboard.registeredLabel')}</span>
                        </div>
                        <div className="text-xs font-medium text-slate-800 truncate">
                          {formatDate(user.registeredAt, currentLang)}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mb-1">
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

                {/* Exactly ONE clean link to Dettaglio Utente at the bottom of Profile card */}
                <button
                  type="button"
                  onClick={() => setCurrentView('detail')}
                  className="w-full mt-5 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Fingerprint className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Visualizza Dettaglio Utente</span>
                </button>
              </div>

              {/* Card 2: Interactive HTTP Client Simulator (ONLY in Debug) OR Account Security Card */}
              {isDebugMode ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <h3 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Server className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 shrink-0" />
                        <span>{getTranslation(currentLang, 'dashboard.testingTitle')}</span>
                      </h3>
                      <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200 font-semibold shrink-0">
                        httpClient.ts [Debug]
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed">
                      {getTranslation(currentLang, 'dashboard.testingDescription')}
                    </p>

                    <button
                      type="button"
                      disabled={isHttpLoading}
                      onClick={handleTestHttpCall}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
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
                    <div className="mt-5 p-3.5 rounded-xl bg-slate-900 text-slate-100 text-[11px] sm:text-xs font-mono space-y-1.5 border border-slate-800 overflow-x-auto">
                      <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-slate-800 gap-2">
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
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <h3 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
                        <span>Sicurezza & Privacy Account</span>
                      </h3>
                      <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                        Protetto da Google
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
                      Il tuo accesso è autenticato in modo sicuro con Google Single Sign-On. I tuoi dati personali sono protetti e crittografati in conformità con i più elevati standard di privacy.
                    </p>

                    <div className="space-y-2.5 text-xs text-slate-700">
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
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
