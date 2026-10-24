# Piano di Qualità, Test di Non-Regressione, Tooling e Trasparenza Dati Firebase

Piano operativo per implementare la suite di test di non-regressione con Vitest, la configurazione di qualità del codice (ESLint, SonarJS, Prettier), la documentazione README esaustiva per sviluppatori junior, l'attivazione della modalità debug a triplo clic o query param, e la spiegazione trasparente del ciclo di vita dei dati su Firebase.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Decisioni confermate dall'utente nella Fase di Pianificazione:**
> 1. **Test Runner**: Vitest con React Testing Library e coverage report per verificare tutti gli acceptance criteria e prevenire regressioni.
> 2. **Attivazione Modalità Debug**: Parametro URL `?debug=true` oppure triplo clic rapido sul logo dell'interfaccia (con toast di notifica).
> 3. **Tooling di Qualità**: Configurazione ESLint con regole SonarJS e formattazione Prettier, orchestrate tramite comandi `npm run` descritti nel README.
> 4. **Trasparenza Dati Firebase**: Documentazione esatta di cosa accade all'accesso, dove risiedono i dati (collezioni Firestore `users` e `audit_logs`) e quali protezioni crittografiche sono attive.

---

## 1. Overview & Core Concept

- **Cosa realizza**:
  - Suite di test automatizzati per i moduli estratti (`packages/i18n`, `packages/policies`, `packages/clocking-audit`) e per il flusso di autenticazione Google SSO.
  - Configurazione unificata di linting e formattazione (ESLint + SonarJS + Prettier) per garantire codice pulito ed esente da vulnerabilità o code smell.
  - Documento `README.md` dettagliato e accessibile anche a sviluppatori junior, con comandi rapidi di avvio e architettura.
  - Gestione chiara della modalità debug (con toggle discreto e scorciatoia a triplo clic).
  - Mappatura completa e trasparente del percorso dei dati personali tra Google OAuth, Firebase Auth e Cloud Firestore.

---

## 2. Risposte alle Domande dell'Utente

### A. Come si imposta la modalità debug?
La modalità debug attiva il pulsante **Info** (specifiche e architettura del componente) e il pulsante **Debug Log** (console dei log strutturati e telemetria HTTP). Si imposta in due modi:
1. **Via URL**: Aggiungendo `?debug=true` alla barra degli indirizzi (es. `https://dev-app-url/?debug=true`).
2. **Via Triplo Clic sul Logo**: Cliccando rapidamente 3 volte consecutive sul logo dell'applicazione nella barra superiore. L'app attiva lo stato nel reactive store, lo memorizza in `localStorage` e mostra un toast di conferma.

### B. Husky, ESLint, SonarJS e Prettier
- Verranno configurati:
  - `.prettierrc`: Regole di formattazione coerenti (virgolette singole, trailing comma, indentazione 2 spazi).
  - `eslint.config.js`: Regole TypeScript e integrazione delle best-practice SonarJS per l'individuazione di complessità ciclomatica elevata, rami morti e bug di logica.
  - Script nel `package.json`: `npm run lint`, `npm run format`, `npm test`, `npm run test:coverage`.

### C. README e Onboarding per Junior Developer
- Creazione di un `README.md` strutturato in sezioni:
  - *Quickstart in 2 comandi*: `npm install` e `npm run dev`.
  - *Mappa dell'Architettura*: Descrizione dei package modulari (`i18n`, `policies`, `clocking-audit`).
  - *Come testare e fare debug*: Istruzioni pratiche per la modalità debug e per lanciare i test.
  - *Checklist Acceptance Criteria*.

### D. Trasparenza Dati: Cosa comporta l'accesso Firebase e dove vanno i dati?
1. **Fase di Accesso / Registrazione**:
   - L'utente clicca su "Continua con Google" o "Registrati con Google".
   - Il provider apre il popup ufficiale Google Identity (OAuth 2.0). Google autentica l'account e restituisce un token crittografato a Firebase Auth.
2. **Quali dati vengono raccolti**:
   - **Solo dati minimi pubblici**: UID univoco, indirizzo email verificato, nome e cognome visualizzato e URL della foto profilo Google.
   - **Nessuna password**: L'applicazione e Firebase non vedono, non memorizzano e non hanno mai accesso alle credenziali o password dell'account Google dell'utente.
   - **Nessun accesso alla rubrica o file**: Gli scope OAuth sono strettamente limitati all'identità di base (`openid`, `profile`, `email`).
3. **Dove risiedono i dati**:
   - **Firebase Authentication**: Gestisce la sessione e il refresh del token JWT crittografato.
   - **Collezione Firestore `/users/{userId}`**: Memorizza il profilo utente per il recupero al login successivo. Protetto da `firestore.rules`: ogni utente può leggere e aggiornare *esclusivamente* il proprio documento (`request.auth.uid == userId`).
   - **Collezione Firestore `/audit_logs/{logId}`**: Registra un evento di audit immutabile (timestamp, azione `signin`/`signup`, successo, user-agent) per motivi di sicurezza e conformità. Non modificabile né cancellabile dall'utente.

---

## 3. Suite di Test di Non-Regressione (Acceptance Criteria)

Verranno implementati test per coprire:
1. **`i18n.test.ts`**:
   - Verifica traduzione con fallback in italiano per chiavi assenti.
   - Interpolazione parametri (`{name}`, `{latency}`).
   - Algoritmo `findMissingTranslations` e `audit`: verifica che identifichi chiavi vuote o mancanti e certifichi il 100% di copertura.
2. **`policies.test.tsx`**:
   - Rendering dello schema `PolicyConfig` iniettabile.
   - Switch tra schede Termini e Privacy.
   - Verifica della presenza di clausole GDPR e limitazioni OAuth.
3. **`clocking-audit.test.ts`**:
   - Registrazione eventi tramite `MemoryAuditAdapter` e `FirestoreAuditAdapter`.
   - Calcolo del clocking di durata della sessione (`startSession`, `beat`, `endSession`).
4. **`store.test.ts`**:
   - Reattività dello store, cambio lingua e gestione della modalità debug con persistenza.

---

## 4. Technical Architecture & File Plan

```
├── .prettierrc                     # Regole di formattazione
├── eslint.config.js                # Configurazione ESLint con SonarJS
├── vitest.config.ts                # Configurazione test runner Vitest
├── README.md                       # Guida completa per junior dev e documentazione
├── src/
│   ├── tests/
│   │   ├── i18n.test.ts            # Test regressione modulo i18n
│   │   ├── policies.test.tsx       # Test regressione modal policy
│   │   ├── clocking-audit.test.ts  # Test regressione tracker e adattatori
│   │   └── store.test.ts           # Test reattività store e debug toggle
│   ├── packages/                   # Moduli astratti riusabili
│   └── components/
│       └── GoogleAuthCard.tsx      # Supporto triplo clic logo per debug mode
```
