import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, FileText } from 'lucide-react';
import { PolicyConfig, PolicyTab } from './types.ts';

export interface StandalonePolicyModalProps {
  isOpen: boolean;
  activeTab?: PolicyTab;
  config: PolicyConfig;
  onClose: () => void;
  onTabChange?: (tab: PolicyTab) => void;
}

export function StandalonePolicyModal({
  isOpen,
  activeTab = 'terms',
  config,
  onClose,
  onTabChange,
}: StandalonePolicyModalProps) {
  const [currentTab, setCurrentTab] = useState<PolicyTab>(activeTab);

  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  if (!isOpen) return null;

  const handleTabClick = (tab: PolicyTab) => {
    setCurrentTab(tab);
    onTabChange?.(tab);
  };

  const isTerms = currentTab === 'terms';
  const doc = isTerms ? config.terms : config.privacy;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-900">
        {/* Header with Segmented Tabs */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl">
            <button
              type="button"
              onClick={() => handleTabClick('terms')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                isTerms
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>{config.labels.termsTab}</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabClick('privacy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                !isTerms
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>{config.labels.privacyTab}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors hover:bg-slate-200/60"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-1">
                {doc.title}
              </h3>
              {doc.lastUpdatedText && (
                <p className="text-xs text-slate-400">{doc.lastUpdatedText}</p>
              )}
            </div>

            {doc.complianceBadge && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {doc.complianceBadge}
              </span>
            )}
          </div>

          <div className="space-y-4 text-slate-600 leading-relaxed">
            {doc.sections.map((section, idx) => (
              <div key={section.id || idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <h4 className="font-semibold text-slate-900 text-sm mb-1.5">
                  {section.title}
                </h4>
                <p className="text-xs leading-relaxed">{section.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            {config.labels.closeButton}
          </button>
        </div>
      </div>
    </div>
  );
}
