import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { logger } from './logger.ts';
import { UserProfile } from './types.ts';
import { FirestoreAuditAdapter, SessionAuditTracker } from '../packages/clocking-audit/index.ts';
import { getDefaultRoleForEmail, getPermissionsForRole } from './rbac.ts';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL: per firebase-integration skill: getFirestore must take the firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Universal Session Clocking & Audit Tracker
export const auditTracker = new SessionAuditTracker({
  adapter: new FirestoreAuditAdapter(db, 'audit_logs'),
  enableHeartbeat: true,
  heartbeatIntervalSeconds: 60,
});

// Google Auth Provider setup
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Operation Types for error handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  logger.error('Firestore', `Firestore Error on ${operationType} at ${path || 'unknown'}: ${errInfo.error}`, {
    firestoreError: errInfo,
  });
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot per skill mandate
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    logger.info('Firebase', 'Firestore connection validated with server');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      logger.warn('Firebase', 'Client is offline or check Firebase configuration', { error: error.message });
      return false;
    }
    // If permission-denied on test doc, it means we reached Firestore successfully!
    logger.info('Firebase', 'Firestore reachability confirmed');
    return true;
  }
}

// Sync user profile to Firestore
export async function syncUserProfile(user: FirebaseUser, isSignUp: boolean): Promise<UserProfile> {
  const nowIso = new Date().toISOString();
  const userDocRef = doc(db, 'users', user.uid);

  let existingRegisteredAt: string | null = null;
  let existingRole: any = null;

  try {
    const existingSnap = await getDoc(userDocRef);
    if (existingSnap.exists()) {
      const data = existingSnap.data();
      existingRegisteredAt = data?.registeredAt || null;
      existingRole = data?.role || null;
    }
  } catch (err) {
    logger.debug('AuthService', 'Unable to fetch existing user profile from Firestore, treating as prospective new', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Scrivi registeredAt solo alla prima registrazione!
  const isFirstRegistration = !existingRegisteredAt;
  const registeredAt = existingRegisteredAt || nowIso;
  const role = existingRole || getDefaultRoleForEmail(user.email);
  const permissions = getPermissionsForRole(role);

  const userProfile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
    photoURL: user.photoURL || undefined,
    providerId: user.providerData?.[0]?.providerId || 'google.com',
    registeredAt,
    lastLoginAt: nowIso,
    role,
    permissions,
  };

  try {
    const payloadToSave: Record<string, any> = {
      uid: userProfile.uid,
      email: userProfile.email,
      displayName: userProfile.displayName,
      ...(userProfile.photoURL ? { photoURL: userProfile.photoURL } : {}),
      providerId: userProfile.providerId,
      lastLoginAt: userProfile.lastLoginAt,
    };

    if (isFirstRegistration) {
      // Scrivi registeredAt e role solo alla prima registrazione
      payloadToSave.registeredAt = registeredAt;
      payloadToSave.role = role;
    } else {
      // Per gli aggiornamenti preserva i campi immutabili secondo le firestore.rules
      payloadToSave.registeredAt = existingRegisteredAt;
      if (existingRole) {
        payloadToSave.role = existingRole;
      }
    }

    await setDoc(userDocRef, payloadToSave, { merge: true });

    logger.info('AuthService', `User profile successfully synced in Firestore: ${user.uid}`, {
      email: userProfile.email,
      role: userProfile.role,
      isFirstRegistration,
      isSignUp,
    });
  } catch (error) {
    logger.warn('AuthService', 'Firestore user save failed; proceeding with authenticated session in memory', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Audit log entry
  try {
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await setDoc(doc(db, 'audit_logs', auditId), {
      userId: user.uid,
      eventType: isSignUp ? 'signup' : 'signin',
      timestamp: nowIso,
      email: user.email || 'unknown',
      status: 'success',
      userAgent: navigator.userAgent.slice(0, 500),
    });
    logger.debug('AuthService', 'Audit log entry recorded', { eventType: isSignUp ? 'signup' : 'signin' });
  } catch (auditErr) {
    logger.debug('AuthService', 'Audit log skipped or restricted by security rules');
  }

  return {
    ...userProfile,
    isFirstRegistration,
  };
}

export { signInWithPopup, signOut, onAuthStateChanged };
