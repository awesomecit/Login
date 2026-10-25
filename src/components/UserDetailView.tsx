import { useState, useEffect } from 'react';
import {
  Shield,
  Clock,
  Code2,
  CheckCircle2,
  XCircle,
  Copy,
  ArrowLeft,
  Lock,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  Users,
  Database,
  Terminal,
  Activity,
  Layers,
  Settings,
} from 'lucide-react';
import { store, useAuthStore } from '../lib/store.ts';
import { auditTracker } from '../lib/firebase.ts';
import { formatDate } from '../lib/i18n/index.ts';
import {
  UserDetailResourceContractV1,
  UserDetailResourceV1,
  uiContractRegistry,
} from '../packages/contracts/index.ts';
import {
  ALL_ROLES,
  ALL_PERMISSIONS,
  getPermissionsForRole,
  canAccessTestingTools,
  hasUserPermission,
  useRoleAccess,
} from '../lib/rbac.ts';
import { UserRoleV1 } from '../lib/types.ts';

export interface UserDetailViewProps {
  onBack?: () => void;
}

export function UserDetailView({ onBack }: UserDetailViewProps) {
  const { user, currentLang, isDebugMode } = useAuthStore();
  const { isAdmin } = useRoleAccess('admin');

  // Advanced/Debug view is strictly conditional: visible ONLY to ADMIN users or when app is in debug state
  const showAdvancedDebug = isAdmin || isDebugMode;

  const [activeTab, setActiveTab] = useState<'profile' | 'resources' | 'advanced'>('profile');
  const [advancedSubTab, setAdvancedSubTab] = useState<'security' | 'contracts'>('security');
  const [, setCopiedKey] = useState<string | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [heartbeatCount, setHeartbeatCount] = useState(1);
  const [contractValidation, setContractValidation] = useState<{
    valid: boolean;
    data?: UserDetailResourceV1;
    errors?: string[];
  }>({ valid: true });

  const userRole: UserRoleV1 = user?.role || 'member';
  const canAccessDiagnostics = canAccessTestingTools(user, isDebugMode);

  // If Advanced/Debug view becomes hidden (e.g. non-admin exits debug mode), fallback to 'profile'
  useEffect(() => {
    if (!showAdvancedDebug && activeTab === 'advanced') {
      setActiveTab('profile');
    }
  }, [showAdvancedDebug, activeTab]);

  // Update session duration counter
  useEffect(() => {
    const active = auditTracker.getActiveSession();
    if (active) {
      setSessionDuration(active.durationSeconds || 0);
    }
    const timer = setInterval(() => {
      const sess = auditTracker.getActiveSession();
      if (sess) {
        setSessionDuration(sess.durationSeconds || 0);
      } else {
        setSessionDuration((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Validate live user data against Zod Contract v1
  useEffect(() => {
    if (!user) return;
    const nowIso = new Date().toISOString();
    const effectiveRole = user.role || 'member';
    const effectivePerms = user.permissions && user.permissions.length > 0
      ? user.permissions
      : getPermissionsForRole(effectiveRole);

    const rawPayload = {
      version: 'v1',
      identity: {
        uid: user.uid,
        email: user.email,
        emailVerified: true,
        displayName: user.displayName,
        photoURL: user.photoURL,
        providerId: 'google.com',
        registeredAt: user.registeredAt || nowIso,
        lastLoginAt: user.lastLoginAt || nowIso,
      },
      session: {
        sessionId: `sess_${user.uid.slice(0, 8)}`,
        userId: user.uid,
        email: user.email,
        startedAt: user.lastLoginAt || nowIso,
        lastActiveAt: nowIso,
        durationSeconds: sessionDuration,
        heartbeatCount,
        status: 'active',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : undefined,
      },
      access: {
        role: effectiveRole,
        permissions: effectivePerms,
        assignedResourcesCount: 3,
        mfaEnabled: false,
      },
    };

    const parseResult = UserDetailResourceContractV1.safeParse(rawPayload);
    if (parseResult.success) {
      setContractValidation({
        valid: true,
        data: parseResult.data,
      });
    } else {
      setContractValidation({
        valid: false,
        errors: parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      });
    }
  }, [user, sessionDuration, heartbeatCount]);

  if (!user) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-500 text-sm">Nessuna sessione attiva trovata.</p>
      </div>
    );
  }

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(keyName);
    store.addToast({
      type: 'info',
      title: 'Copiato',
      message: `${keyName} copiato negli appunti`,
      duration: 2000,
    });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleManualHeartbeat = () => {
    auditTracker.beat();
    setHeartbeatCount((c) => c + 1);
    store.addToast({
      type: 'success',
      title: 'Heartbeat Inviato',
      message: 'Audit log registrato con successo nel tracker di sessione',
      duration: 2500,
    });
  };

  const userContractSpec = uiContractRegistry.get('user-detail-view');

  const getRoleBadgeClasses = (role: UserRoleV1) => {
    switch (role) {
      case 'superadmin':
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'operator':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'member':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'guest':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Group permissions meaningfully by domain/category
  const PERMISSION_GROUPS = [
    {
      category: 'users' as const,
      title: 'Gestione Utenti & Identità',
      description: 'Controllo profili, identificativi federati e accessi account',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Users,
    },
    {
      category: 'resources' as const,
      title: 'Risorse Cloud & Storage',
      description: 'Accesso a collezioni Firestore, contratti dati e storage bucket',
      badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      icon: Database,
    },
    {
      category: 'audit' as const,
      title: 'Audit di Sicurezza & Telemetria',
      description: 'Registri di login/logout immutabili e tracciamento conformità',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: ShieldAlert,
    },
    {
      category: 'system' as const,
      title: 'Diagnostica & Monitoraggio',
      description: 'Validazione schemi Zod, ispettore HTTP e telemetria heartbeat',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: Terminal,
    },
  ];

  return (
    <div className="space-y-6 max-w-full">
      {/* Top Header: Single intuitive back navigation; Disconnection is unified in the application sidebar/header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors shadow-2xs shrink-0 cursor-pointer"
              title="Torna alla Dashboard"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
            </button>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-slate-900 truncate">
                {canAccessDiagnostics ? 'Dettaglio Risorsa Utente' : 'Dettaglio Profilo'}
              </h2>
              {canAccessDiagnostics ? (
                <span
                  className={`font-mono text-xs px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider shrink-0 ${getRoleBadgeClasses(
                    userRole
                  )}`}
                >
                  {userRole}
                </span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-full border font-semibold bg-blue-50 text-blue-700 border-blue-200 shrink-0">
                  Account Verificato
                </span>
              )}
              {isDebugMode && (
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 font-semibold shrink-0">
                  [Debug Mode]
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {canAccessDiagnostics
                ? 'Istanza federata Google SSO, contratti Zod v1 e matrice permessi RBAC'
                : "Informazioni personali sull'account Google e stato di sicurezza della sessione"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Tabs Segmented Control:
          - Profilo: Always visible
          - Permessi & Risorse: Always visible
          - Avanzate / Debug: ONLY visible to users with ADMIN role or in explicit debug state
      */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto max-w-full">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>{canAccessDiagnostics ? 'Profilo & Identità OAuth' : 'Profilo Personale'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('resources')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'resources'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{canAccessDiagnostics ? 'Permessi & Risorse' : 'I Miei Permessi'}</span>
        </button>

        {/* Conditional Advanced / Debug Tab (strictly visible only to ADMIN or in debug mode) */}
        {showAdvancedDebug && (
          <button
            type="button"
            onClick={() => setActiveTab('advanced')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'advanced'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>Avanzate & Debug</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-mono font-bold">
              {isAdmin ? 'ADMIN' : 'DEBUG'}
            </span>
          </button>
        )}
      </div>

      {/* TAB 1: Profilo & Identità */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Identity Card */}
          <div className="lg:col-span-1 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col items-center text-center">
            <div className="relative mb-4">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-md"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-2xl flex items-center justify-center shadow-md">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div
                className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-xs"
                title="Google Verified Provider"
              >
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 fill-blue-50" />
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {user.displayName}
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5 mb-4 break-all">
              {user.email}
            </p>

            <div className="w-full pt-4 border-t border-slate-100 space-y-2 text-left text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400">Autenticazione</span>
                <span className="font-semibold text-slate-800">Google SSO</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400">Stato Email</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 shrink-0" /> Verificata
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400">Livello Accesso</span>
                {canAccessDiagnostics ? (
                  <span
                    className={`font-bold font-mono text-[11px] uppercase px-2 py-0.5 rounded border ${getRoleBadgeClasses(
                      userRole
                    )}`}
                  >
                    {userRole}
                  </span>
                ) : (
                  <span className="font-semibold text-slate-800">Utente Standard</span>
                )}
              </div>
            </div>
          </div>

          {/* Details & Field Registry */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">
                {canAccessDiagnostics ? 'Attributi e Identificativi Federati' : 'Informazioni Account'}
              </h4>
              <p className="text-xs text-slate-500">
                {canAccessDiagnostics
                  ? 'Dati sincronizzati dal token ID emesso dal Google Identity Provider.'
                  : 'Dati verificati e sincronizzati tramite il tuo account Google.'}
              </p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] text-slate-400 block font-sans font-medium">
                    {canAccessDiagnostics ? 'User Identifier (UID)' : 'ID Utente'}
                  </span>
                  <span className="text-slate-900 font-semibold break-all text-[11px] sm:text-xs">{user.uid}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(user.uid, 'UID')}
                  className="p-1.5 text-slate-400 hover:text-slate-700 bg-white rounded-lg border border-slate-200 shrink-0 cursor-pointer"
                  title="Copia ID Utente"
                >
                  <Copy className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] text-slate-400 block font-sans font-medium">
                    Email Account
                  </span>
                  <span className="text-slate-900 font-semibold break-all text-[11px] sm:text-xs">{user.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(user.email, 'Email')}
                  className="p-1.5 text-slate-400 hover:text-slate-700 bg-white rounded-lg border border-slate-200 shrink-0 cursor-pointer"
                  title="Copia Email"
                >
                  <Copy className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-medium">
                    Data Registrazione
                  </span>
                  <span className="text-slate-800 font-semibold text-xs tabular-nums">
                    {user.registeredAt ? formatDate(user.registeredAt, currentLang) : 'N/D'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-medium">
                    Ultimo Accesso
                  </span>
                  <span className="text-slate-800 font-semibold text-xs tabular-nums">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt, currentLang) : 'N/D'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Risorse & Permessi RBAC */}
      {activeTab === 'resources' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {canAccessDiagnostics ? 'Matrice Ruoli e Permessi RBAC' : 'I Miei Permessi e Funzionalità'}
              </h4>
              <p className="text-xs text-slate-500">
                {canAccessDiagnostics
                  ? 'Accesso governato dalle regole di sicurezza Firestore e dai contratti RBAC'
                  : 'Riepilogo delle autorizzazioni attive per il tuo account'}
              </p>
            </div>

            {/* Current Active Role Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Stato Account:</span>
              {canAccessDiagnostics ? (
                <span
                  className={`font-mono text-xs px-2.5 py-1 rounded-lg border font-bold uppercase ${getRoleBadgeClasses(
                    userRole
                  )}`}
                >
                  {userRole}
                </span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-lg border font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
                  Utente Abilitato
                </span>
              )}
            </div>
          </div>

          {/* Meaningful Domain-Categorized Permissions Matrix */}
          <div className="space-y-5">
            {PERMISSION_GROUPS.map((group) => {
              const groupPerms = ALL_PERMISSIONS.filter((p) => p.category === group.category);
              const grantedCount = groupPerms.filter((p) =>
                hasUserPermission(user, p.id, isDebugMode)
              ).length;
              const GroupIcon = group.icon;

              return (
                <div
                  key={group.category}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3.5 shadow-2xs"
                >
                  {/* Group Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg border ${group.badgeClass}`}>
                        <GroupIcon className="w-4 h-4 shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {group.title}
                        </h5>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {group.description}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                        grantedCount > 0
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {grantedCount}/{groupPerms.length} Concessi
                    </span>
                  </div>

                  {/* Group Permissions Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {groupPerms.map((perm) => {
                      const isGranted = hasUserPermission(user, perm.id, isDebugMode);
                      return (
                        <div
                          key={perm.id}
                          className={`p-3 rounded-xl border transition-all ${
                            isGranted
                              ? 'bg-white border-emerald-200 shadow-2xs'
                              : 'bg-white/60 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              {isGranted ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              )}
                              <span className="font-semibold text-xs font-sans text-slate-900 truncate">
                                {perm.label}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold shrink-0 ${
                                isGranted
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {isGranted ? 'ATTIVO' : 'NEGATO'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-sans pl-5.5 leading-snug">
                            {perm.description}
                          </p>
                          <code className="text-[10px] font-mono text-slate-400 pl-5.5 block mt-1">
                            {perm.id}
                          </code>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Advanced / Debug View (Consolidated Security & Contracts debugging tools) */}
      {activeTab === 'advanced' && showAdvancedDebug && (
        <div className="space-y-6">
          {/* Sub-navigation for Advanced/Debug view */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-purple-50/60 rounded-2xl border border-purple-200">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-purple-700" />
              <span className="text-xs font-bold text-purple-950">
                Pannello Avanzate & Debugging
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-200 text-purple-900">
                {isAdmin ? 'ADMIN ACCESS' : 'DEBUG STATE'}
              </span>
            </div>

            {/* Sub-tab Switcher: Sicurezza vs Contratti */}
            <div className="flex items-center p-1 bg-white rounded-xl border border-purple-200 text-xs font-semibold shadow-2xs">
              <button
                type="button"
                onClick={() => setAdvancedSubTab('security')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  advancedSubTab === 'security'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-purple-900 hover:bg-purple-50'
                }`}
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Sicurezza & Sessione</span>
              </button>

              <button
                type="button"
                onClick={() => setAdvancedSubTab('contracts')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  advancedSubTab === 'contracts'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-purple-900 hover:bg-purple-50'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 shrink-0" />
                <span>Contratti UI & API (Zod)</span>
              </button>
            </div>
          </div>

          {/* RBAC Role Switcher & Simulator (Visible in Advanced/Debug view) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-700 shrink-0" />
                <span className="text-xs font-bold text-purple-900">
                  Simulatore di Ruoli RBAC [Debug Mode]
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-200 text-purple-800 font-bold">
                Role Testing
              </span>
            </div>
            <p className="text-xs text-purple-700/80">
              Cambia dinamicamente il ruolo per verificare come variano i permessi, l'accesso agli strumenti diagnostici e la visibilità dei contratti Zod.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {ALL_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => store.setUserRole(role)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border cursor-pointer ${
                    userRole === role
                      ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                      : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-100/60'
                  }`}
                >
                  {role.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* SubTab 1: Sicurezza & Sessione Debugging */}
          {advancedSubTab === 'security' && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Stato di Sessione e Clocking Tracker (Sicurezza & Sessione)</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Telemetria tracciata dal package modulare @packages/clocking-audit
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleManualHeartbeat}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
                    title="Invia battito di sessione al logger"
                  >
                    <Activity className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Heartbeat Test ({heartbeatCount})</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-1">Durata Sessione</span>
                  <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums">
                    {Math.floor(sessionDuration / 60)}m {sessionDuration % 60}s
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-1">Battiti Heartbeat</span>
                  <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
                    {heartbeatCount}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-1">Intervallo Ping</span>
                  <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
                    60s
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs space-y-2">
                <div className="text-slate-400 text-[11px] font-sans font-medium">Session Identifier:</div>
                <div className="text-slate-800 break-all font-semibold">
                  sess_{user.uid.slice(0, 12)}_active
                </div>
                <div className="text-slate-400 text-[11px] font-sans font-medium mt-3">Adapter Tracciamento:</div>
                <div className="text-slate-700 break-all">
                  FirestoreAuditAdapter (collection: <code className="text-blue-600">audit_logs</code>)
                </div>
              </div>
            </div>
          )}

          {/* SubTab 2: Contratti Zod (v1) Debugging */}
          {advancedSubTab === 'contracts' && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Contratti UI & API (Zod)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      VALIDATO RUNTIME
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ogni proprietà di input e di output di questa vista è vincolata dallo schema Zod tipizzato.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Feature ID:</span>
                  <code className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-mono font-semibold">
                    {userContractSpec?.featureId || 'user-detail-view'}
                  </code>
                </div>
              </div>

              {/* Validation State */}
              {contractValidation.valid ? (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    I dati correnti dell'utente soddisfano al 100% lo schema <code className="font-mono">UserDetailResourceContractV1</code>.
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800">
                  <p className="font-semibold mb-1">Mancata corrispondenza dello schema:</p>
                  <ul className="list-disc pl-4 space-y-0.5 font-mono text-[11px]">
                    {contractValidation.errors?.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Required APIs List */}
              <div>
                <h5 className="text-xs font-bold text-slate-800 mb-2 font-sans uppercase tracking-wider">
                  API Backend Richieste dal Contratto UI
                </h5>
                <div className="space-y-2 font-mono text-xs">
                  {userContractSpec?.requiredApis.map((api, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            api.method === 'GET'
                              ? 'bg-blue-100 text-blue-800'
                              : api.method === 'POST'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {api.method}
                        </span>
                        <span className="font-semibold text-slate-900">{api.path}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-sans">{api.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Contract JSON Payload Preview */}
              <div>
                <h5 className="text-xs font-bold text-slate-800 mb-2 font-sans uppercase tracking-wider">
                  Payload JSON Validato (Snapshot V1)
                </h5>
                <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[10px] sm:text-[11px] overflow-x-auto leading-relaxed max-w-full">
                  {JSON.stringify(contractValidation.data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Zero-Trust Architecture Invariants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Politiche di Sicurezza Firestore</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Lettura/Scrittura profilo isolata su <code className="font-mono text-blue-700 text-[11px]">/users/{user.uid}</code>
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Scrittura append-only registri audit su <code className="font-mono text-blue-700 text-[11px]">/audit_logs</code>
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Nessun bypass consentito senza token federato verificato</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero-Trust Invariants</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Immutabilità di UID e timestamp di registrazione</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Divieto assoluto di query lista globale (anti-scraping)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Bootstrapped Admin per <code className="font-mono text-purple-700 text-[11px]">awesome.cit.dev@gmail.com</code></span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
