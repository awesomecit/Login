import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '../lib/logger.ts';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    logger.error('ErrorBoundary', 'Uncaught component tree error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-5">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-2">
              Si è verificato un errore inaspettato
            </h2>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Il componente ha riscontrato un problema non gestito. I dettagli diagnostici sono stati registrati
              nella console di sistema.
            </p>

            {this.state.error && (
              <div className="p-3 bg-slate-100 rounded-lg text-xs font-mono text-slate-800 mb-6 overflow-x-auto border border-slate-200">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Ricarica Applicazione
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
