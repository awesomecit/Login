import { GoogleAuthCard } from './GoogleAuthCard.tsx';

export function AuthSplitLayout() {
  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 bg-slate-100/80">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
        <GoogleAuthCard />
      </div>
    </div>
  );
}
