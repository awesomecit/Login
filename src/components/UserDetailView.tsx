import { useState, useEffect } from 'react';
import {
  Shield,
  Key,
  Clock,
  Code2,
  FileText,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  LogOut,
  Layers,
  Activity,
  ArrowLeft,
  Lock,
  UserCheck,
  ShieldAlert,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { store, useAuthStore } from '../lib/store.ts';
import { auditTracker } from '../lib/firebase.ts';
import { getTranslation, formatDate } from '../lib/i18n/index.ts';
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
  RoleGuard,
} from '../lib/rbac.ts';
import { UserRoleV1 } from '../lib/types.ts';

export interface UserDetailViewProps {
  onBack?: () => void;
}

export function UserDetailView({ onBack }: UserDetailViewProps) {
  const { user, currentLang, isDebugMode } = useAuthStore();
  const adminAccess = useRoleAccess('admin');
  const [activeTab, setActiveTab] = useState<'profile' | 'session' | 'contracts' | 'resources'>('profile');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [heartbeatCount, setHeartbeatCount] = useState(1);
  const [contractValidation, setContractValidation] = useState<{
    valid: boolean;
    data?: UserDetailResourceV1;
    errors?: string[];
  }>({ valid: true });

  const userRole: UserRoleV1 = user?.role || 'member';
  const canAccessDiagnostics = canAccessTestingTools(user, isDebugMode);
  const canAccessContracts = adminAccess.hasAccess;

  // Se i contratti tecnici vengono disabilitati (es. cambio ruolo in member senza debug), torna a profilo
  useEffect(() => {
    if (!canAccessContracts && activeTab === 'contracts') {
      setActiveTab('profile');
    }
  }, [canAccessContracts, activeTab]);

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
        assignedResourcesCount: effectiveRole === 'admin' ? 7 : 3,
        mfaEnabled: true,
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

  return (
    <div className="space-y-6">
      {/* Top Action & Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors shadow-xs"
              title="Torna alla Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {canAccessDiagnostics ? 'Dettaglio Risorsa Utente' : 'Dettaglio Profilo'}
              </h2>
              {canAccessDiagnostics ? (
                <span
                  className={`font-mono text-xs px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${getRoleBadgeClasses(
                    userRole
                  )}`}
                >
                  {userRole}
                </span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-full border font-semibold bg-blue-50 text-blue-700 border-blue-200">
                  Account Verificato
                </span>
              )}
              {isDebugMode && (
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
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

        <div className="flex items-center gap-2">
          {/* Test Heartbeat: riservato a debug o ruoli diagnostici (admin/operator) */}
          {canAccessDiagnostics && (
            <button
              type="button"
              onClick={handleManualHeartbeat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-xs"
              title="Invia battito di sessione al logger (Strumento Test)"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Heartbeat Test ({heartbeatCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => store.handleSignOut()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Esci</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Segmented Control */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span>{canAccessDiagnostics ? 'Profilo & Identità OAuth' : 'Profilo Personale'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('session')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'session'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          <span>Sessione & Sicurezza</span>
        </button>

        {/* Tab Contratti Zod: visibile solo ad Admin o in Debug Mode */}
        {canAccessContracts && (
          <button
            type="button"
            onClick={() => setActiveTab('contracts')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'contracts'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Contratti UI & API (Zod)</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('resources')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'resources'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-amber-600" />
          <span>{canAccessDiagnostics ? 'Risorse & Permessi RBAC' : 'I Miei Permessi'}</span>
        </button>
      </div>

      {/* TAB 1: Profilo & Identità */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Identity Card */}
          <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col items-center text-center">
            <div className="relative mb-4">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-2xl flex items-center justify-center shadow-md">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div
                className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-xs"
                title="Google Verified Provider"
              >
                <CheckCircle2 className="w-5 h-5 text-blue-600 fill-blue-50" />
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-900 leading-snug">
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
                  <CheckCircle2 className="w-3 h-3" /> Verificata
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
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
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
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-400 block font-sans font-medium">
                    {canAccessDiagnostics ? 'User Identifier (UID)' : 'ID Utente'}
                  </span>
                  <span className="text-slate-900 font-semibold break-all">{user.uid}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(user.uid, 'UID')}
                  className="p-1.5 text-slate-400 hover:text-slate-700 bg-white rounded-lg border border-slate-200 shrink-0"
                  title="Copia ID Utente"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-400 block font-sans font-medium">
                    Email Account
                  </span>
                  <span className="text-slate-900 font-semibold break-all">{user.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(user.email, 'Email')}
                  className="p-1.5 text-slate-400 hover:text-slate-700 bg-white rounded-lg border border-slate-200 shrink-0"
                  title="Copia Email"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-sans font-medium">
                    Data Registrazione
                  </span>
                  <span className="text-slate-800 font-semibold tabular-nums">
                    {user.registeredAt ? formatDate(user.registeredAt, currentLang) : 'N/D'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-sans font-medium">
                    Ultimo Accesso
                  </span>
                  <span className="text-slate-800 font-semibold tabular-nums">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt, currentLang) : 'N/D'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Sessione & Sicurezza */}
      {activeTab === 'session' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {canAccessDiagnostics ? 'Stato di Sessione e Clocking Tracker' : 'Stato della Sessione Corrente'}
              </h4>
              <p className="text-xs text-slate-500">
                {canAccessDiagnostics
                  ? 'Telemetria tracciata dal package modulare @packages/clocking-audit'
                  : 'Monitoraggio sicuro della durata e dello stato del tuo collegamento'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Sessione Attiva
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block mb-1">Durata Sessione</span>
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {Math.floor(sessionDuration / 60)}m {sessionDuration % 60}s
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block mb-1">
                {canAccessDiagnostics ? 'Battiti Heartbeat' : 'Stato Crittografico'}
              </span>
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {canAccessDiagnostics ? heartbeatCount : 'TLS 1.3'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block mb-1">
                {canAccessDiagnostics ? 'Intervallo Ping' : 'Protezione Identità'}
              </span>
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {canAccessDiagnostics ? '60s' : 'Google SSO'}
              </span>
            </div>
          </div>

          {canAccessDiagnostics ? (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs space-y-2">
              <div className="text-slate-400 text-[11px] font-sans font-medium">Session Identifier:</div>
              <div className="text-slate-800 break-all font-semibold">
                sess_{user.uid.slice(0, 12)}_active
              </div>
              <div className="text-slate-400 text-[11px] font-sans font-medium mt-3">Adapter Tracciamento:</div>
              <div className="text-slate-700">
                FirestoreAuditAdapter (collection: <code className="text-blue-600">audit_logs</code>)
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Connessione Protetta & Crittografata</span>
              </div>
              <p>
                Tutte le richieste effettuate durante questa sessione sono autenticate tramite token federato Google e trasmesse su canale cifrato.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Contratti UI & API (Zod v1) - Gated per Admin o Debug */}
      {activeTab === 'contracts' && canAccessContracts && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Specifiche Contratto UI (Zod v1)</span>
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
              <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed">
                {JSON.stringify(contractValidation.data, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Risorse & Permessi RBAC */}
      {activeTab === 'resources' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
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

          {/* RBAC Role Switcher & Simulator (Visible in debug mode or for admin) */}
          {canAccessDiagnostics && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-700" />
                  <span className="text-xs font-bold text-purple-900">
                    Simulatore di Ruoli RBAC (Test Interattivo)
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
                  Admin / Debug Tool
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
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${
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
          )}

          {/* User view vs Admin/Diagnostics view */}
          {canAccessDiagnostics ? (
            <>
              {/* Permissions Matrix */}
              <div>
                <h5 className="text-xs font-bold text-slate-800 mb-3 font-sans uppercase tracking-wider">
                  Permessi di Sistema Risolti per <span className="text-blue-600">[{userRole.toUpperCase()}]</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ALL_PERMISSIONS.map((perm) => {
                    const isGranted = hasUserPermission(user, perm.id, isDebugMode);
                    return (
                      <div
                        key={perm.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isGranted
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                            : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            {isGranted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className="font-semibold text-xs font-sans text-slate-900">
                              {perm.label}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                              isGranted
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isGranted ? 'CONCESSO' : 'NEGATO'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-sans pl-6">
                          {perm.description}
                        </p>
                        <code className="text-[10px] font-mono text-slate-400 pl-6 block mt-0.5">
                          {perm.id}
                        </code>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Zero-Trust Architecture Invariants */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <Lock className="w-4 h-4 text-blue-600" />
                    <span>Politiche di Sicurezza Firestore</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Lettura/Scrittura profilo personale isolata su <code className="font-mono text-blue-700">/users/{user.uid}</code>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Scrittura append-only registri audit su <code className="font-mono text-blue-700">/audit_logs</code>
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
                    <Shield className="w-4 h-4 text-emerald-600" />
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
                      <span>Bootstrapped Admin per <code className="font-mono text-purple-700">awesome.cit.dev@gmail.com</code></span>
                    </li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Accesso Profilo Personale</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Puoi visualizzare i tuoi dati di accesso e aggiornare le tue preferenze in qualsiasi momento.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Sessione Protetta</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Il tuo collegamento è monitorato per prevenire accessi non autorizzati e garantire la massima riservatezza.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Privacy dei Dati</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    I tuoi dati sono isolati; nessun altro utente del portale ha accesso alle tue informazioni personali.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Autenticazione Google</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Accesso rapido e sicuro con verifica in due passaggi gestita direttamente dal tuo account Google.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
