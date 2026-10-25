import { z, ZodTypeAny } from 'zod';
import { UserDetailResourceContractV1, UserIdentitySchemaV1 } from './userContract.ts';
import { ResourceItemSchemaV1 } from './resourceContract.ts';

/**
 * Specifica formale per tracciare il contratto di ogni funzionalità UI e le API associate
 */
export interface ApiEndpointSpec {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  authenticated: boolean;
  requestSchemaDescription?: string;
  responseSchemaDescription?: string;
}

export interface UIContractDefinition {
  featureId: string;
  name: string;
  version: 'v1';
  targetComponent: string;
  description: string;
  inputSchema: ZodTypeAny;
  outputEvents: Array<{
    eventName: string;
    description: string;
  }>;
  requiredApis: ApiEndpointSpec[];
}

/**
 * Registro centrale dei contratti UI e API dell'applicazione (v1)
 */
class UIContractRegistry {
  private contracts: Map<string, UIContractDefinition> = new Map();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults() {
    // 1. Contratto UI: Dettaglio Utente & Risorse
    this.register({
      featureId: 'user-detail-view',
      name: 'Vista Dettaglio Utente & Risorse',
      version: 'v1',
      targetComponent: 'UserDetailView',
      description: 'Renderizza le informazioni anagrafiche, la sessione OAuth Google federata, il clocking audit e i permessi.',
      inputSchema: UserDetailResourceContractV1,
      outputEvents: [
        { eventName: 'onSignOutRequested', description: 'Invocato quando l\'utente richiede la terminazione della sessione' },
        { eventName: 'onRefreshAudit', description: 'Invocato per forzare un battito di heartbeat o refresh audit' },
        { eventName: 'onTabChanged', description: 'Invocato al cambio tab tra identità, sessione e contratto' },
      ],
      requiredApis: [
        {
          method: 'GET',
          path: '/users/{uid}',
          description: 'Recupera il documento profilo utente sincronizzato su Firestore',
          authenticated: true,
          responseSchemaDescription: 'UserIdentitySchemaV1',
        },
        {
          method: 'POST',
          path: '/audit_logs',
          description: 'Registra un evento di audit (signin, signout, heartbeat)',
          authenticated: true,
          requestSchemaDescription: 'AuditEventSchema',
        },
        {
          method: 'GET',
          path: '/resources',
          description: 'Elenco delle risorse accessibili in base al ruolo dell\'utente',
          authenticated: true,
          responseSchemaDescription: 'ResourceItemSchemaV1[]',
        },
      ],
    });

    // 2. Contratto UI: Scheda Autenticazione Google SSO
    this.register({
      featureId: 'auth-card-google',
      name: 'Google SSO Auth Card',
      version: 'v1',
      targetComponent: 'GoogleAuthCard',
      description: 'Gestisce il trigger del popup federato Google OAuth 2.0 e lo switch tra Sign In e Sign Up.',
      inputSchema: z.object({
        authMode: z.enum(['signin', 'signup']),
        currentLang: z.enum(['it', 'en']),
      }),
      outputEvents: [
        { eventName: 'onGoogleLoginSuccess', description: 'Restituisce le credenziali UserProfile da Google Auth' },
        { eventName: 'onGoogleLoginError', description: 'Notifica errori di popup bloccato o rete' },
      ],
      requiredApis: [
        {
          method: 'POST',
          path: 'https://identitytoolkit.googleapis.com/...',
          description: 'Handshake OAuth federato gestito da Firebase Auth SDK',
          authenticated: false,
        },
      ],
    });

    // 3. Contratto UI: Ispezione Risorse
    this.register({
      featureId: 'resource-detail-view',
      name: 'Dettaglio Risorsa Singola',
      version: 'v1',
      targetComponent: 'ResourceDetailCard',
      description: 'Ispezione dei metadata e dei permessi di una risorsa salvata nel cloud.',
      inputSchema: ResourceItemSchemaV1,
      outputEvents: [
        { eventName: 'onPermissionUpdated', description: 'Notifica il cambio di permessi di lettura/scrittura' },
      ],
      requiredApis: [
        {
          method: 'GET',
          path: '/resources/{id}',
          description: 'Recupera il record della singola risorsa',
          authenticated: true,
          responseSchemaDescription: 'ResourceItemSchemaV1',
        },
      ],
    });
  }

  public register(contract: UIContractDefinition): void {
    this.contracts.set(contract.featureId, contract);
  }

  public get(featureId: string): UIContractDefinition | undefined {
    return this.contracts.get(featureId);
  }

  public getAll(): UIContractDefinition[] {
    return Array.from(this.contracts.values());
  }

  public validate<T>(featureId: string, data: unknown): { success: boolean; data?: T; error?: z.ZodError } {
    const contract = this.contracts.get(featureId);
    if (!contract) {
      throw new Error(`Contratto non registrato per la feature: ${featureId}`);
    }
    const result = contract.inputSchema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data as T };
    }
    return { success: false, error: result.error };
  }
}

export const uiContractRegistry = new UIContractRegistry();
