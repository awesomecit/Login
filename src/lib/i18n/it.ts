export const it = {
  // Brand
  brand: {
    name: 'NexusAuth',
    tagline: 'Accesso enterprise protetto e senza password',
    description: 'Piattaforma moderna per l\'autenticazione tramite Single Sign-On sicura, conformità OAuth 2.0 e audit in tempo reale.',
    feature1Title: 'Google SSO Diretto',
    feature1Desc: 'Autenticazione immediata a un clic senza dover memorizzare password complesse.',
    feature2Title: 'Crittografia e Zero-Trust',
    feature2Desc: 'Protezione end-to-end con token JWT crittografati e permessi granulari.',
    feature3Title: 'Audit e Log Strutturati',
    feature3Desc: 'Tracciamento completo di ogni handshake e chiamata di rete in formato strutturato.',
    complianceNote: 'Protetto da Google Identity & Firebase Auth Enterprise',
  },

  // Auth Card
  auth: {
    welcomeBack: 'Bentornato',
    createAccount: 'Crea il tuo account',
    signInSubtitle: 'Accedi rapidamente utilizzando il tuo account Google verified',
    signUpSubtitle: 'Inizia subito creando un profilo con il tuo account Google',
    tabSignIn: 'Accedi',
    tabSignUp: 'Registrati',
    googleSignInButton: 'Continua con Google',
    googleSignUpButton: 'Registrati con Google',
    signingIn: 'Autenticazione in corso...',
    signingUp: 'Creazione account in corso...',
    privacyDisclaimer: 'Continuando accetti i nostri',
    termsOfService: 'Termini di Servizio',
    and: 'e la',
    privacyPolicy: 'Normativa sulla Privacy',
    or: 'oppure',
    secureBadge: 'Autenticazione crittografata OAuth 2.0',
    ssoOnlyNotice: 'Al momento è abilitato esclusivamente l\'accesso federato Google SSO per garantire la massima sicurezza.',
  },

  // Authenticated Dashboard
  dashboard: {
    welcome: 'Ciao, {name}!',
    welcomeSubtitle: 'Sei autenticato con successo tramite Google Single Sign-On.',
    profileTitle: 'Dettagli Account Google',
    emailLabel: 'Email verificata',
    uidLabel: 'Identificativo Utente (UID)',
    providerLabel: 'Provider di Autenticazione',
    registeredLabel: 'Registrato il',
    lastLoginLabel: 'Ultimo accesso',
    signOutButton: 'Disconnetti',
    testingTitle: 'Test Chiamata HTTP & Intercettori',
    testingDescription: 'Invia una richiesta HTTP protetta tramite il client httpClient.ts per verificare gli intercettori di latenza, gli header Bearer e i log strutturati.',
    sendHttpReq: 'Esegui Richiesta HTTP di Test',
    simulatingRequest: 'Invio chiamata HTTP...',
    httpSuccess: 'Risposta HTTP ricevuta con successo ({latency}ms)!',
    auditTrailTitle: 'Cronologia Sessione',
    viewLogs: 'Apri Console Log Strutturati',
  },

  // Errors
  errors: {
    genericTitle: 'Si è verificato un errore',
    genericDesc: 'Qualcosa è andato storto durante l\'operazione. Riprova più tardi.',
    popupClosed: 'La finestra di accesso Google è stata chiusa prima del completamento.',
    popupBlocked: 'Il browser ha bloccato il popup di autenticazione Google. Consenti i popup per questo sito.',
    networkError: 'Errore di connessione di rete. Verifica il collegamento a internet.',
    userCancelled: 'Accesso annullato dall\'utente.',
    unauthorized: 'Operazione non autorizzata o token di sessione scaduto.',
    httpTimeout: 'La chiamata HTTP ha superato il tempo massimo di attesa ({timeout}ms).',
    retryButton: 'Riprova',
    dismissButton: 'Chiudi',
  },

  // Diagnostic Drawer
  drawer: {
    title: 'Console Diagnostica e Log Strutturati',
    subtitle: 'Ispezione in tempo reale degli eventi di autenticazione e delle chiamate HTTP',
    filterAll: 'Tutti i Log',
    searchPlaceholder: 'Filtra per contesto o messaggio...',
    clearLogs: 'Pulisci',
    exportJson: 'Esporta JSON',
    noLogsFound: 'Nessun log registrato con i filtri attuali',
    payload: 'Metadati / Payload',
    close: 'Chiudi console',
  },

  // Toasts
  toast: {
    signedInSuccess: 'Accesso con Google completato con successo!',
    signedUpSuccess: 'Registrazione e profilo sincronizzati con successo!',
    signedOutSuccess: 'Disconnessione effettuata.',
    logsCleared: 'Cronologia log ripulita.',
  },

  // Session Inactivity Timeout
  sessionTimeout: {
    warningTitle: 'Avviso di Inattività',
    warningSubtitle: 'La tua sessione sta per scadere per inattività.',
    warningDescription: 'Per proteggere il tuo account, la disconnessione automatica avverrà tra:',
    countdownSeconds: '{seconds} secondi',
    stayLoggedIn: 'Rimani Connesso',
    signOutNow: 'Disconnetti Adesso',
    sessionExtended: 'Sessione prolungata con successo.',
    expiredTitle: 'Sessione Scaduta',
    expiredMessage: 'La sessione è scaduta per inattività (30 minuti). Effettua nuovamente l\'accesso.',
  },

  // Language selector
  lang: {
    italian: 'Italiano',
    english: 'English',
    switchLabel: 'Lingua interfaccia',
  },

  // About Component
  about: {
    buttonLabel: 'About Componente',
    modalTitle: 'Specifiche e Architettura del Componente',
    modalSubtitle: 'Dettagli tecnici, funzionalità e requisiti implementati',
    stackTitle: 'Stack Tecnologico & Servizi',
    stackDesc: 'React 19, TypeScript, Tailwind CSS, Firebase Auth (Google Provider), Firestore, Custom HTTP Client, i18n & Structured Logger.',
    close: 'Chiudi',
  },

  // Policies (Terms & Privacy)
  policies: {
    termsTab: 'Termini di Servizio',
    privacyTab: 'Informativa sulla Privacy',
    close: 'Chiudi',
    termsTitle: 'Condizioni Generali di Utilizzo',
    termsLastUpdated: 'Ultimo aggiornamento: 24 Ottobre 2026',
    termsSection1Title: '1. Accesso tramite Google Single Sign-On (SSO)',
    termsSection1Body: 'L\'accesso e la registrazione al servizio avvengono esclusivamente tramite autenticazione federata Google OAuth 2.0. L\'utente è responsabile della custodia e della sicurezza del proprio account Google.',
    termsSection2Title: '2. Disponibilità del Servizio',
    termsSection2Body: 'Il servizio di autenticazione è erogato tramite infrastruttura cloud con livelli di disponibilità enterprise. Ci riserviamo il diritto di sospendere l\'accesso in caso di attività anomale o violazioni di sicurezza.',
    termsSection3Title: '3. Limitazione di Responsabilità',
    termsSection3Body: 'L\'applicazione declina ogni responsabilità per eventuali malfunzionamenti derivanti da interruzioni di servizio indipendenti (es. downtime federato Google o connettività di rete).',
    privacyTitle: 'Trattamento dei Dati Personali',
    privacyLastUpdated: 'Conforme al Regolamento UE 2016/679 (GDPR)',
    privacySection1Title: '1. Dati Raccolti con Google SSO',
    privacySection1Body: 'In fase di accesso o registrazione, richiediamo a Google solo i dati strettamente necessari: indirizzo email verificato, nome pubblico e link alla foto del profilo. Non abbiamo accesso alle password di Google né ai contatti.',
    privacySection2Title: '2. Finalità e Conservazione',
    privacySection2Body: 'I dati sono impiegati esclusivamente per identificare la sessione utente e registrare gli audit log di sicurezza. I dati non vengono ceduti, venduti o profilati per scopi pubblicitari.',
    privacySection3Title: '3. Diritti dell\'Interessato',
    privacySection3Body: 'Puoi richiedere in qualsiasi momento la cancellazione integrale del tuo profilo o revocare i permessi concessi all\'applicazione direttamente dalle impostazioni di sicurezza dell\'account Google.',
  },
};

export type TranslationSchema = typeof it;
