import { useSyncExternalStore } from 'react';
import { AuthMode, Language, ToastMessage, UserProfile, UserRoleV1, UserPermissionV1 } from './types.ts';
import { auth, googleProvider, signInWithPopup, signOut, syncUserProfile } from './firebase.ts';
import { logger } from './logger.ts';
import { parseAuthError } from './errorHandler.ts';
import { getTranslation } from './i18n/index.ts';
import { getDefaultRoleForEmail, getPermissionsForRole, hasUserPermission, canAccessTestingTools } from './rbac.ts';

export interface AppState {
  user: UserProfile | null;
  authMode: AuthMode;
  isLoading: boolean;
  currentLang: Language;
  toasts: ToastMessage[];
  isDrawerOpen: boolean;
  isAboutOpen: boolean;
  isDebugMode: boolean;
  policyModal: { isOpen: boolean; tab: 'terms' | 'privacy' };
  lastError: string | null;
  initialized: boolean;
}

type Listener = () => void;

const STORAGE_LANG_KEY = 'nexus_auth_lang';
const STORAGE_USER_KEY = 'nexus_auth_cached_user';
const STORAGE_DEBUG_KEY = 'nexus_auth_debug';

function getInitialLang(): Language {
  // 1. Check if user previously explicitly selected a language
  try {
    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    if (saved === 'it' || saved === 'en') return saved;
  } catch {
    // ignore
  }

  // 2. Default to device / browser locale if set
  try {
    const browserLangs =
      typeof navigator !== 'undefined' && navigator.languages && navigator.languages.length
        ? navigator.languages
        : [typeof navigator !== 'undefined' ? navigator.language || '' : ''];

    for (const lang of browserLangs) {
      if (!lang) continue;
      const code = lang.toLowerCase().slice(0, 2);
      if (code === 'it') return 'it';
      if (code === 'en') return 'en';
    }
  } catch {
    // ignore
  }

  return 'it';
}

function getInitialDebug(): boolean {
  try {
    if (typeof window !== 'undefined' && window.location.search.includes('debug=true')) {
      return true;
    }
    return localStorage.getItem(STORAGE_DEBUG_KEY) === 'true';
  } catch {
    return false;
  }
}

function getInitialUser(): UserProfile | null {
  try {
    const cached = localStorage.getItem(STORAGE_USER_KEY);
    if (!cached) return null;
    const parsed: UserProfile = JSON.parse(cached);
    if (parsed) {
      const role = parsed.role || getDefaultRoleForEmail(parsed.email);
      parsed.role = role;
      parsed.permissions = parsed.permissions || getPermissionsForRole(role);
    }
    return parsed;
  } catch {
    return null;
  }
}

class Store {
  private state: AppState = {
    user: getInitialUser(),
    authMode: 'signin',
    isLoading: false,
    currentLang: getInitialLang(),
    toasts: [],
    isDrawerOpen: false,
    isAboutOpen: false,
    isDebugMode: getInitialDebug(),
    policyModal: { isOpen: false, tab: 'terms' },
    lastError: null,
    initialized: false,
  };

  private listeners: Set<Listener> = new Set();

  constructor() {
    logger.info('Store', 'Auth Store initialized', {
      initialLang: this.state.currentLang,
      hasCachedUser: !!this.state.user,
    });
  }

  public getState = (): AppState => {
    return this.state;
  };

  public subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private setState(partial: Partial<AppState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((listener) => listener());
  }

  public setLanguage = (currentLang: Language) => {
    try {
      localStorage.setItem(STORAGE_LANG_KEY, currentLang);
    } catch {
      // ignore
    }
    this.setState({ currentLang });
    logger.info('Store', `Interface language switched to: ${currentLang}`);
  };

  public setAuthMode = (authMode: AuthMode) => {
    this.setState({ authMode, lastError: null });
    logger.debug('Store', `Auth mode toggled to: ${authMode}`);
  };

  public setDrawerOpen = (isDrawerOpen: boolean) => {
    this.setState({ isDrawerOpen });
  };

  public setAboutOpen = (isAboutOpen: boolean) => {
    this.setState({ isAboutOpen });
  };

  public setDebugMode = (isDebugMode: boolean) => {
    try {
      localStorage.setItem(STORAGE_DEBUG_KEY, String(isDebugMode));
    } catch {
      // ignore
    }
    this.setState({ isDebugMode });
    logger.info('Store', `Debug mode set to: ${isDebugMode}`);
  };

  public openPolicyModal = (tab: 'terms' | 'privacy') => {
    this.setState({ policyModal: { isOpen: true, tab } });
  };

  public closePolicyModal = () => {
    this.setState({ policyModal: { isOpen: false, tab: this.state.policyModal.tab } });
  };

  public clearLastError = () => {
    this.setState({ lastError: null });
  };

  public addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newToast: ToastMessage = {
      ...toast,
      id,
      duration: toast.duration ?? 4500,
    };
    this.setState({ toasts: [...this.state.toasts, newToast] });

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, newToast.duration);
    }
  };

  public removeToast = (id: string) => {
    this.setState({
      toasts: this.state.toasts.filter((t) => t.id !== id),
    });
  };

  public setUser = (user: UserProfile | null) => {
    let hydratedUser = user;
    if (hydratedUser) {
      const role = hydratedUser.role || getDefaultRoleForEmail(hydratedUser.email);
      hydratedUser = {
        ...hydratedUser,
        role,
        permissions: hydratedUser.permissions || getPermissionsForRole(role),
      };
    }

    try {
      if (hydratedUser) {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(hydratedUser));
      } else {
        localStorage.removeItem(STORAGE_USER_KEY);
      }
    } catch {
      // ignore storage errors
    }
    this.setState({ user: hydratedUser });
  };

  public setUserRole = (newRole: UserRoleV1) => {
    if (!this.state.user) return;
    const updatedUser: UserProfile = {
      ...this.state.user,
      role: newRole,
      permissions: getPermissionsForRole(newRole),
    };
    try {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updatedUser));
    } catch {
      // ignore
    }
    this.setState({ user: updatedUser });
    logger.info('Store', `User role simulated to: ${newRole}`, {
      email: updatedUser.email,
      permissions: updatedUser.permissions,
    });
    this.addToast({
      type: 'info',
      title: 'Ruolo Simulato Aggiornato',
      message: `Ruolo impostato a: ${newRole.toUpperCase()} (Permessi ricalcolati)`,
      duration: 3000,
    });
  };

  public hasPermission = (permission: UserPermissionV1): boolean => {
    return hasUserPermission(this.state.user, permission, this.state.isDebugMode);
  };

  public canAccessDiagnostics = (): boolean => {
    return canAccessTestingTools(this.state.user, this.state.isDebugMode);
  };

  public setInitialized = (initialized: boolean) => {
    this.setState({ initialized });
  };

  public loginWithGoogle = async (isSignUp: boolean) => {
    this.setState({ isLoading: true, lastError: null });
    const actionName = isSignUp ? 'Google_SignUp' : 'Google_SignIn';
    logger.info('AuthFlow', `Initiating ${actionName} popup flow`, {
      provider: 'google.com',
      authMode: isSignUp ? 'signup' : 'signin',
    });

    try {
      const result = await signInWithPopup(auth, googleProvider);
      logger.info('AuthFlow', `Google popup completed successfully for UID: ${result.user.uid}`, {
        email: result.user.email,
        isNewUser: (result as any)._tokenResponse?.isNewUser,
      });

      const profile = await syncUserProfile(result.user, isSignUp);
      this.setUser(profile);

      if (isSignUp) {
        if (profile.isFirstRegistration) {
          this.addToast({
            type: 'success',
            title: 'Account Creato',
            message: getTranslation(this.state.currentLang, 'toast.signedUpSuccess'),
          });
        } else {
          this.addToast({
            type: 'info',
            title: 'Account già registrato',
            message: 'Questa email Google è già registrata. Hai effettuato l\'accesso al tuo profilo esistente.',
          });
        }
      } else {
        if (profile.isFirstRegistration) {
          this.addToast({
            type: 'success',
            title: 'Nuovo Account Creato',
            message: 'Nessun account trovato per questa email: è stato creato un nuovo profilo per te.',
          });
        } else {
          this.addToast({
            type: 'success',
            title: 'Autenticato',
            message: getTranslation(this.state.currentLang, 'toast.signedInSuccess'),
          });
        }
      }

      this.setState({ isLoading: false });
      return profile;
    } catch (err: any) {
      const parsed = parseAuthError(err, this.state.currentLang, this.state.isDebugMode);
      this.setState({
        isLoading: false,
        lastError: parsed.message,
      });

      this.addToast({
        type: 'error',
        title: parsed.title,
        message: parsed.message,
      });

      throw err;
    }
  };

  public handleSignOut = async () => {
    this.setState({ isLoading: true });
    logger.info('AuthFlow', 'Initiating sign out');

    try {
      await signOut(auth);
      this.setUser(null);
      this.setState({ isLoading: false, lastError: null });

      this.addToast({
        type: 'info',
        message: getTranslation(this.state.currentLang, 'toast.signedOutSuccess'),
      });

      logger.info('AuthFlow', 'User successfully signed out');
    } catch (err: any) {
      logger.error('AuthFlow', 'Sign out error', { error: err.message });
      this.setState({ isLoading: false });
    }
  };
}

export const store = new Store();

export function useAuthStore(): AppState {
  return useSyncExternalStore(store.subscribe, store.getState);
}
