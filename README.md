# Google SSO Auth Portal — Guida & Architettura

Portale di autenticazione enterprise con **Google Single Sign-On (SSO)**, architettura modulare riusabile per **i18n**, **Termini & Privacy Policy**, e **Session Clocking / Audit Trail**.

---

## 🚀 Guida Rapida per Sviluppatori Junior (2 Comandi)

L'applicazione è progettata per essere avviata in locale senza configurazioni complesse:

```bash
# 1. Installa tutte le dipendenze
npm install

# 2. Avvia il server di sviluppo locale
npm run dev
```

L'applicazione sarà attiva all'indirizzo `http://localhost:3000`.

---

## 🛠️ Comandi NPM Utili

| Comando | Descrizione |
|---|---|
| `npm run dev` | Avvia il server di sviluppo con porta 3000 |
| `npm run build` | Compila l'applicazione per la produzione in `/dist` |
| `npm test` | Esegue la suite di test di non-regressione con Vitest |
| `npm run test:watch` | Esegue i test in modalità interattiva watch |
| `npm run lint` | Esegue il controllo dei tipi TypeScript senza emettere file |
| `npm run format` | Riformatta tutto il codice sorgente con Prettier |
| `npm run format:check` | Verifica che il codice rispetti le regole di stile Prettier |

---

## 🔍 Modalità Debug: Come Attivarla

Per mantenere l'interfaccia pulita per gli utenti finali, i pulsanti **Info** (specifiche tecniche) e **Debug Log** (console dei log strutturati in tempo reale) sono nascosti per impostazione predefinita.

Puoi attivare la Modalità Debug in due modi:
1. **Scorciatoia UI**: Fai **3 clic consecutivi sul logo "G"** in alto a sinistra. Un toast di notifica confermerà l'attivazione/disattivazione.
2. **Parametro URL**: Aggiungi `?debug=true` all'URL del browser (es. `http://localhost:3000/?debug=true`).

---

## 📦 Architettura dei Package Modulari Riusabili

Tutti i moduli trasversali sono isolati in `src/packages/`, indipendenti da Firebase e riutilizzabili in qualsiasi altro progetto React o TypeScript:

```
src/packages/
├── i18n/                   # Motore di internazionalizzazione agnostico
│   ├── core.ts             # Classe I18nEngine: t(), fallback, rilevamento lingua browser
│   ├── react.tsx           # I18nProvider e hook useTranslation()
│   └── types.ts            # Audit report e definizioni tipizzate
│
├── policies/               # Gestione Termini di Servizio & Privacy GDPR
│   ├── PolicyModal.tsx     # Modale headless / styled con navigazione a schede
│   ├── schema.ts           # Schema PolicyConfig tipizzato e iniettabile
│   └── types.ts            # Contratti per sezioni e clausole legali
│
└── clocking-audit/         # Tracciamento sessione e audit log universale
    ├── tracker.ts          # SessionAuditTracker (calcolo durata, beat, sessione)
    ├── adapters/           # Pattern Strategy: salva dove preferisci
    │   ├── FirestoreAdapter.ts  # Salva su Google Cloud Firestore
    │   ├── RestAdapter.ts       # Invia a qualsiasi backend REST aziendale
    │   └── MemoryAdapter.ts     # Buffer in RAM per test e sviluppo
    └── types.ts
```

---

## 🔒 Domande Frequenti su Firestore, Dati e On-Premise

### 1. Che controllo ho sui dati in Firestore?
- **Pieno controllo proprietario**: I dati risiedono nel tuo progetto Google Cloud. Puoi visualizzarli, modificarli, esportarli in formato JSON o importarli in BigQuery / storage bucket in qualsiasi momento.
- **Sicurezza granitica (`firestore.rules`)**: Le regole di sicurezza impediscono a chiunque di accedere ai dati altrui:
  - Solo l'utente autenticato può leggere e aggiornare il proprio profilo (`request.auth.uid == userId`).
  - Gli audit log sono immutabili (append-only) e non possono essere alterati.
- **Diritto all'oblio (GDPR)**: Puoi eliminare istantaneamente qualsiasi profilo o collezione dalla console o via API.

### 2. Si paga Firestore?
- **No, per volumi ordinari è completamente gratuito**. Firestore include un **Free Tier permanente (Spark Plan)**:
  - **50.000 letture / giorno** gratuite
  - **20.000 scritture / giorno** gratuite
  - **1 GB di storage** gratuito
- Per autenticazione, sessioni e audit log, questo tier supporta migliaia di accessi quotidiani a costo zero.

### 3. Devo per forza usare Firestore o posso metterlo On-Premise? C'è Vendor Lock-in?
- **Nessun Vendor Lock-In**:
  - Grazie al package astratto `src/packages/clocking-audit/`, non sei legato a Firestore!
  - Se la tua azienda richiede un'installazione **On-Premise**, ti basta sostituire `FirestoreAuditAdapter` con `RestAuditAdapter`:
    ```typescript
    // Invece di Firestore, punta al tuo server aziendale interno On-Premise:
    export const auditTracker = new SessionAuditTracker({
      adapter: new RestAuditAdapter({
        endpointUrl: 'https://api.intranet.tua-azienda.it/v1/audit',
      }),
    });
    ```
  - **Firebase Local Emulator Suite**: Per ambienti air-gapped o di sviluppo on-premise senza connessione cloud, Firebase fornisce un emulatore locale containerizzato in Docker che gira al 100% sui tuoi server.

### 4. Cosa succede quando accedo con Google?
1. L'utente clicca su "Continua con Google" o "Registrati con Google".
2. Si apre il popup ufficiale Google OAuth 2.0. Google verifica l'identità dell'utente.
3. L'applicazione riceve esclusivamente **email verificata**, **nome pubblico** e **link avatar**.
4. **Nessun accesso a password o contatti**: Google non condivide mai la password dell'utente. L'applicazione non ha modo di conoscerla.
5. Il profilo viene salvato nella collezione Firestore `/users/{uid}` e viene registrato un evento di audit con timestamp.
