# Roadmap Progetto: Google SSO Auth Portal

Roadmap consolidata che unifica tutti i piani operativi, le decisioni architetturali e i requisiti di sistema, ordinati per dipendenza logica e tracciati nelle relative Issue su GitHub.

---

## 🎯 Panoramica e Stato di Avanzamento

| # | Titolo Issue | Area | Stato | Link GitHub |
|---|---|---|---|---|
| **#1** | Configurazione Dominio e Deploy Regole Firestore | Infrastruttura | ✅ Completato | [#1](https://github.com/awesomecit/Login/issues/1) |
| **#2** | Mascheramento Errori Tecnici & Diagnostica Debug | Sicurezza & UX | ✅ Completato | [#2](https://github.com/awesomecit/Login/issues/2) |
| **#3** | Registro Contratti Versionati con Zod (v1) | Architettura | ✅ Completato | [#3](https://github.com/awesomecit/Login/issues/3) |
| **#4** | Componente Dettaglio Risorsa Utente (`UserDetailView`) | Feature Core | ✅ Completato | [#4](https://github.com/awesomecit/Login/issues/4) |
| **#5** | Selettore Lingua Dinamico & Layout Centrato | UI / i18n | ✅ Completato | [#5](https://github.com/awesomecit/Login/issues/5) |
| **#6** | Matrice Ruoli Dinamica (RBAC) su Firestore | Database | 📋 Backlog | [#6](https://github.com/awesomecit/Login/issues/6) |
| **#7** | Backend REST Standalone per Audit On-Premise | Enterprise | 📋 Backlog | [#7](https://github.com/awesomecit/Login/issues/7) |
| **#8** | Pipeline CI/CD GitHub Actions (Lint, Test, Prettier) | DevOps | 📋 Backlog | [#8](https://github.com/awesomecit/Login/issues/8) |

---

## 🏗️ Fasi della Roadmap & Grafo di Dipendenza

```
[Fase 1: Infrastruttura & Sicurezza Core]
  ├── Issue #1: Progetto Firebase (login-3b11d) & Regole Zero-Trust (COMPLETATO)
  └── Issue #2: Mascheramento errori & diagnostica riservata a Debug Mode (COMPLETATO)
            │
            ▼
[Fase 2: Contratti Versionati & Data Layer]
  ├── Issue #3: Schemi Zod v1 (User, Session, Resource, UI Registry) (COMPLETATO)
  └── Issue #4: Vista Dettaglio Risorsa Utente con Session Clocking (COMPLETATO)
            │
            ▼
[Fase 3: Refactoring UI & Accessibilità]
  └── Issue #5: Selettore lingua scalabile e centratura scheda autenticazione (COMPLETATO)
            │
            ▼
[Fase 4: Estensioni Enterprise & Backlog Prossimi Step]
  ├── Issue #6: Matrice RBAC avanzata con ruoli salvati su Firestore (IN CODA)
  ├── Issue #7: Adapter e endpoint REST Express per deploy On-Premise (IN CODA)
  └── Issue #8: Workflow GitHub Actions CI per test e linting automatico (IN CODA)
```

---

## 📝 Dettaglio Fasi e Task

### Fase 1: Infrastruttura e Sicurezza Core (Completata)
* **[Issue #1](https://github.com/awesomecit/Login/issues/1) - Configurazione Dominio e Deploy Regole Firestore (`login-3b11d`)**:
  * Associazione e provisioning del progetto Firebase `login-3b11d` intestato all'account utente.
  * Generazione e deploy di `firestore.rules` con restrizione di accesso owner (`request.auth.uid == userId`) e audit trail immutabile.
* **[Issue #2](https://github.com/awesomecit/Login/issues/2) - Mascheramento Errori Tecnici**:
  * Gli utenti standard non vedono più errori raw (come `auth/unauthorized-domain` o host Cloud Run interni).
  * La diagnostica estesa è visibile solo attivando la Modalità Debug (3 clic sul logo o query string `?debug=true`).

### Fase 2: Contratti Versionati e Data Layer (Completata)
* **[Issue #3](https://github.com/awesomecit/Login/issues/3) - Registro Contratti Versionati con Zod (v1)**:
  * Creazione della directory `src/packages/contracts/v1/`.
  * Validazione runtime dei payload identità (`UserIdentitySchemaV1`) e sessione (`UserSessionSchemaV1`).
  * `uiContractRegistry`: mapping formale di ogni feature UI con il suo schema di input, output events e API backend previste.
* **[Issue #4](https://github.com/awesomecit/Login/issues/4) - Componente Dettaglio Risorsa Utente**:
  * Nuova vista `UserDetailView.tsx` integrata nella dashboard con navigazione a schede.
  * Monitoraggio telemetrico della durata sessione e heartbeat periodico a 60 secondi via `auditTracker`.
  * Ispezione runtime del contratto Zod v1 e matrice permessi.

### Fase 3: UI, Usabilità e Internazionalizzazione (Completata)
* **[Issue #5](https://github.com/awesomecit/Login/issues/5) - Selettore Lingua Dinamico e Allineamento Visuale**:
  * `LanguageSelector.tsx` con lingua attiva, bandiera e menu a tendina `<select>` accessibile per gestire agilmente più lingue.
  * Centratura visiva armoniosa della scheda di benvenuto e del sottotitolo.
  * Risoluzione dei warning React relativi ai cambi di stato durante il rendering.
  * Suite completa di test Vitest (17 test su 17 passati).

### Fase 4: Prossimi Sviluppi (Backlog Operativo)
* **[Issue #6](https://github.com/awesomecit/Login/issues/6) - Matrice Ruoli Dinamica (RBAC)**:
  * Collezione Firestore per assegnazione ruoli (`admin`, `operator`, `member`).
  * Regole di sicurezza con controllo ruoli server-side per impedire la privilege escalation.
* **[Issue #7](https://github.com/awesomecit/Login/issues/7) - Backend REST Standalone per Deploy On-Premise**:
  * Endpoint Express `POST /api/audit` per consentire l'archiviazione di log e sessioni su server intranet aziendali, svincolandosi da Firebase.
* **[Issue #8](https://github.com/awesomecit/Login/issues/8) - Pipeline CI/CD GitHub Actions**:
  * Creazione del file `.github/workflows/ci.yml` per automatizzare `npm test`, `npm run lint` e `npm run format:check` su ogni push o pull request.
