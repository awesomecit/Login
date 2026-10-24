import { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Download,
  Search,
  ChevronDown,
  ChevronRight,
  Terminal,
  Filter,
} from 'lucide-react';
import { logger } from '../lib/logger.ts';
import { store, useAuthStore } from '../lib/store.ts';
import { getTranslation } from '../lib/i18n/index.ts';
import { LogLevel, StructuredLog } from '../lib/types.ts';

export function DiagnosticDrawer() {
  const { isDrawerOpen, currentLang } = useAuthStore();
  const [logs, setLogs] = useState<StructuredLog[]>([]);
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = logger.subscribe((newLogs) => {
      setLogs(newLogs);
    });
    return unsubscribe;
  }, []);

  if (!isDrawerOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== 'ALL' && log.level !== filterLevel) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.context.toLowerCase().includes(q) ||
        (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleExportJson = () => {
    const jsonStr = logger.exportJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_auth_logs_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    logger.clear();
    store.addToast({
      type: 'info',
      message: getTranslation(currentLang, 'toast.logsCleared'),
    });
  };

  const getLevelBadgeClass = (level: LogLevel) => {
    switch (level) {
      case 'ERROR':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'WARN':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'INFO':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'DEBUG':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 text-slate-900">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-900 text-white">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {getTranslation(currentLang, 'drawer.title')}
              </h3>
              <p className="text-xs text-slate-500">
                {getTranslation(currentLang, 'drawer.subtitle')} ({filteredLogs.length}/{logs.length})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors shadow-xs"
              title="Esporta file JSON dei log"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{getTranslation(currentLang, 'drawer.exportJson')}</span>
            </button>

            <button
              type="button"
              onClick={handleClearLogs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors shadow-xs"
              title="Ripulisci tutti i log"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{getTranslation(currentLang, 'drawer.clearLogs')}</span>
            </button>

            <button
              type="button"
              onClick={() => store.setDrawerOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors ml-2"
              aria-label="Chiudi console"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 border-b border-slate-200 bg-white space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={getTranslation(currentLang, 'drawer.searchPlaceholder')}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1 mr-1" />
            {(['ALL', 'INFO', 'WARN', 'ERROR', 'DEBUG'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setFilterLevel(lvl)}
                className={`px-2.5 py-1 font-semibold rounded-md transition-colors ${
                  filterLevel === lvl
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {lvl === 'ALL' ? getTranslation(currentLang, 'drawer.filterAll') : lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Logs List View */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 font-mono text-xs bg-slate-50">
          {filteredLogs.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-center font-sans text-xs">
              {getTranslation(currentLang, 'drawer.noLogsFound')}
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

              return (
                <div
                  key={log.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs transition-colors hover:border-slate-300"
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getLevelBadgeClass(
                          log.level
                        )}`}
                      >
                        {log.level}
                      </span>
                      <span className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                        [{log.context}]
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                      {log.timestamp.slice(11, 23)}
                    </span>
                  </div>

                  <p className="text-slate-800 text-xs font-sans leading-relaxed break-words">
                    {log.message}
                  </p>

                  {hasMetadata && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="flex items-center gap-1 text-[11px] font-sans font-medium text-blue-600 hover:text-blue-800"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                        <span>{getTranslation(currentLang, 'drawer.payload')}</span>
                      </button>

                      {isExpanded && (
                        <pre className="mt-2 p-2.5 rounded-lg bg-slate-900 text-emerald-400 text-[11px] overflow-x-auto leading-tight">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
