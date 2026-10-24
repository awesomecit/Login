import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { store, useAuthStore } from '../lib/store.ts';
import { ToastMessage } from '../lib/types.ts';

export function ToastContainer() {
  const { toasts } = useAuthStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: ToastMessage }) {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-sky-600 shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50/95';
      case 'error':
        return 'border-rose-200 bg-rose-50/95';
      case 'warning':
        return 'border-amber-200 bg-amber-50/95';
      case 'info':
      default:
        return 'border-sky-200 bg-sky-50/95';
    }
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-200 ${getBorderColor()}`}
      role="alert"
    >
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className="text-sm font-semibold text-slate-900 leading-tight mb-0.5">
            {toast.title}
          </h4>
        )}
        <p className="text-xs text-slate-700 leading-relaxed break-words">
          {toast.message}
        </p>
      </div>
      <button
        type="button"
        onClick={() => store.removeToast(toast.id)}
        className="text-slate-400 hover:text-slate-600 p-1 -mr-1 -mt-1 rounded-md transition-colors"
        aria-label="Chiudi notifica"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
