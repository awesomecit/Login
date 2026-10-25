import { Globe, ChevronDown } from 'lucide-react';
import { store, useAuthStore } from '../lib/store.ts';
import { Language } from '../lib/types.ts';

interface LanguageOption {
  code: Language;
  label: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'it', label: 'Italiano', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'en', label: 'English', nativeName: 'English (US)', flag: '🇬🇧' },
];

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { currentLang } = useAuthStore();

  const currentOption =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as Language;
    if (newLang !== currentLang) {
      store.setLanguage(newLang);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-xl border border-slate-200 transition-colors cursor-pointer text-slate-800 text-xs font-semibold">
        <span className="text-sm select-none" aria-hidden="true">
          {currentOption.flag}
        </span>
        {!compact ? (
          <span className="font-medium text-slate-700">
            {currentOption.label}
          </span>
        ) : (
          <span className="font-semibold text-slate-700 uppercase text-[11px]">
            {currentOption.code}
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 pointer-events-none" />
      </div>

      {/* Accessible native select overlay for seamless multi-device support */}
      <select
        value={currentLang}
        onChange={handleChange}
        aria-label="Seleziona la lingua dell'interfaccia"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} className="text-slate-900 bg-white">
            {lang.flag} {lang.nativeName} ({lang.code.toUpperCase()})
          </option>
        ))}
      </select>
    </div>
  );
}
