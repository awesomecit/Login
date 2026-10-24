import { ShieldCheck, KeyRound, Activity, Lock, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../lib/store.ts';
import { getTranslation } from '../lib/i18n/index.ts';

export function BrandShowcase() {
  const { currentLang } = useAuthStore();

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
    <div className="relative flex flex-col justify-between h-full p-8 lg:p-12 bg-slate-950 text-white overflow-hidden">
      {/* Subtle background ambient gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-950/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-950/30 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Top Brand Header */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black tracking-wider text-lg">
            N
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">
              {getTranslation(currentLang, 'brand.name')}
            </span>
            <div className="text-xs text-slate-400 font-medium">Enterprise SSO Gateway</div>
          </div>
        </div>

        {/* Hero Value Statement */}
        <div className="max-w-md">
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight mb-4">
            {getTranslation(currentLang, 'brand.tagline')}
          </h1>
          <p className="text-slate-400 text-sm lg:text-base leading-relaxed mb-10">
            {getTranslation(currentLang, 'brand.description')}
          </p>
        </div>

        {/* Feature Cards List */}
        <div className="space-y-5 max-w-lg">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm transition-colors hover:border-slate-700/80"
              >
                <div className="p-2.5 rounded-lg bg-blue-900/40 text-blue-400 border border-blue-800/40 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-1">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trust & Security Bottom Section */}
      <div className="relative z-10 pt-10 mt-8 border-t border-slate-800/80">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>OAuth 2.0 Federato · Firebase Auth</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span>SOC2 Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
