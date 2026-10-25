import { useEffect } from 'react';
import { Clock, ShieldAlert, LogOut, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../lib/store.ts';
import { getTranslation } from '../lib/i18n/index.ts';

export interface SessionTimeoutModalProps {
  isOpen: boolean;
  secondsRemaining: number;
  totalWarningSeconds: number;
  onExtend: () => void;
  onSignOut: () => void;
}

export function SessionTimeoutModal({
  isOpen,
  secondsRemaining,
  totalWarningSeconds,
  onExtend,
  onSignOut,
}: SessionTimeoutModalProps) {
  const { currentLang } = useAuthStore();

  // Allow pressing Enter or Space to extend session
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExtend();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onExtend]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const percentRemaining = Math.max(0, Math.min(100, (secondsRemaining / (totalWarningSeconds || 120)) * 100));
  const isUrgent = secondsRemaining <= 30;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-timeout-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 overflow-hidden text-center transform transition-all animate-in zoom-in-95 duration-200">
        {/* Top Progress bar indicator */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              isUrgent ? 'bg-rose-500' : 'bg-amber-500'
            }`}
            style={{ width: `${percentRemaining}%` }}
          />
        </div>

        {/* Pulsing Warning Icon */}
        <div className="mx-auto mb-5 relative flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 shadow-sm">
          <Clock className={`w-8 h-8 ${isUrgent ? 'text-rose-600 animate-pulse' : 'text-amber-600'}`} />
          <span
            className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${
              isUrgent ? 'bg-rose-500' : 'bg-amber-500'
            } animate-ping opacity-75`}
          />
        </div>

        {/* Modal Titles */}
        <h3
          id="session-timeout-title"
          className="text-xl font-bold text-slate-900 tracking-tight"
        >
          {getTranslation(currentLang, 'sessionTimeout.warningTitle')}
        </h3>

        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          {getTranslation(currentLang, 'sessionTimeout.warningSubtitle')}
        </p>

        {/* Big Countdown Timer Display */}
        <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
            {getTranslation(currentLang, 'sessionTimeout.warningDescription')}
          </span>
          <div
            className={`text-4xl font-extrabold font-mono tracking-wider tabular-nums ${
              isUrgent ? 'text-rose-600 animate-pulse' : 'text-slate-900'
            }`}
          >
            {formattedTime}
          </div>
          <span className="text-[11px] text-slate-400 mt-1">
            30 minuti di inattività limite
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={onExtend}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{getTranslation(currentLang, 'sessionTimeout.stayLoggedIn')}</span>
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors border border-slate-200 whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{getTranslation(currentLang, 'sessionTimeout.signOutNow')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
