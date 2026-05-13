import { useApp } from '../context/AppContext';

export default function ToastContainer() {
  const { toasts } = useApp();

  return (
    <div className="fixed top-6 right-6 z-[300] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`
            pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl
            animate-slideInRight max-w-sm border-l-4
            ${t.err
              ? 'bg-white border-l-orange-500 text-slate-900'
              : 'bg-white border-l-emerald-500 text-slate-900'}
          `}
        >
          <span>{t.err ? '❌' : '✅'}</span>
          <span className="text-sm font-medium">{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
