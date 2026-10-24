import { store, useAuthStore } from '../lib/store.ts';
import { Language } from '../lib/types.ts';

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { currentLang } = useAuthStore();

  const handleSelect = (lang: Language) => {
    if (lang !== currentLang) {
      store.setLanguage(lang);
    }
  };

  return (
    <div
      role="group"
      aria-label="Language selector"
      className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200"
    >
      <button
        type="button"
        onClick={() => handleSelect('it')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
          currentLang === 'it'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        aria-pressed={currentLang === 'it'}
      >
        <span className="flex items-center gap-1.5">
          <span className="text-xs">🇮🇹</span>
          {!compact && <span>IT</span>}
        </span>
      </button>

      <button
        type="button"
        onClick={() => handleSelect('en')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
          currentLang === 'en'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        aria-pressed={currentLang === 'en'}
      >
        <span className="flex items-center gap-1.5">
          <span className="text-xs">🇬🇧</span>
          {!compact && <span>EN</span>}
        </span>
      </button>
    </div>
  );
}
