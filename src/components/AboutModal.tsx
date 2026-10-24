import {
  X,
  ShieldCheck,
  KeyRound,
  Activity,
  Layers,
  Lock,
  Cpu,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { store, useAuthStore } from '../lib/store.ts';
import { getTranslation } from '../lib/i18n/index.ts';

export function AboutModal() {
  const { isAboutOpen, currentLang, isDebugMode } = useAuthStore();

  if (!isAboutOpen) return null;

  const features = [
    {
      icon: KeyRound,
      title: getTranslation(currentLang, 'brand.feature1Title'),
      desc: getTranslation(currentLang, 'brand.feature1Desc'),
    },
    {
      icon: ShieldCheck,
      title: getTranslation(currentLang, 'brand.feature2Title'),
      desc: getTranslation(currentLang, 'brand.feature2Desc'),
    },
    {
      icon: Activity,
      title: getTranslation(currentLang, 'brand.feature3Title'),
      desc: getTranslation(currentLang, 'brand.feature3Desc'),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black tracking-wider text-base">
              N
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white leading-tight">
                {getTranslation(currentLang, 'about.modalTitle')}
              </h2>
              <p className="text-xs text-slate-400">
                {getTranslation(currentLang, 'about.modalSubtitle')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => store.setAboutOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Chiudi finestra"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Overview summary */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <h3 className="text-sm font-semibold text-slate-200 mb-1 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>{getTranslation(currentLang, 'brand.name')} — {getTranslation(currentLang, 'brand.tagline')}</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {getTranslation(currentLang, 'brand.description')}
            </p>
          </div>

          {/* 3 Core Features */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pilastri di Sicurezza & Architettura
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {features.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-7 h-7 rounded-lg bg-blue-950 text-blue-400 flex items-center justify-center mb-2.5 border border-blue-900/60">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <h5 className="text-xs font-semibold text-slate-200 mb-1">
                        {feat.title}
                      </h5>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stack & Modules Specification */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>{getTranslation(currentLang, 'about.stackTitle')}</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {getTranslation(currentLang, 'about.stackDesc')}
            </p>
            <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-mono">
              <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">React 19</span>
              <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">TypeScript 7</span>
              <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">Tailwind CSS 4</span>
              <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">Firebase Auth & Firestore</span>
              <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">i18n (IT / EN)</span>
              <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">Structured Logger</span>
            </div>
          </div>

          {/* Developer Debug Toggle Option */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  Modalità Debug & Console Log
                </div>
                <div className="text-[11px] text-slate-400">
                  Abilita la visualizzazione del pulsante diagnostico nella barra superiore
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => store.setDebugMode(!isDebugMode)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                isDebugMode
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {isDebugMode ? 'Attivo' : 'Disattivo'}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>OAuth 2.0 Federato · Firebase Auth Enterprise</span>
          </div>

          <button
            type="button"
            onClick={() => store.setAboutOpen(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors border border-slate-700"
          >
            {getTranslation(currentLang, 'about.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
