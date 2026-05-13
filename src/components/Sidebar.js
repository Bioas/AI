import { useState } from 'react';
import { useApp } from '../context/AppContext';

const NAV_ITEMS = [
  ['dashboard', '📊', 'แดชบอร์ด'],
  ['room', '🚪', 'จัดการห้อง'],
  ['meters', '⚡', 'บันทึกหน่วย'],
  ['invoice', '🧾', 'ใบแจ้งหนี้'],
  ['setting', '⚙️', 'ตั้งค่า'],
];

export default function Sidebar() {
  const { page, setPage, settings, saveSettingsDelayed } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-700 text-white shadow-lg"
      >
        <span className="text-xl">☰</span>
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex flex-col
          bg-gradient-to-b from-emerald-800 to-emerald-700 text-white
          transition-all duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:w-[72px] lg:w-64
        `}
      >
        <div className="flex flex-col items-center lg:items-stretch px-4 lg:px-6 pt-6 pb-4 border-b border-white/10">
          <div className="w-11 h-11 lg:w-13 lg:h-13 rounded-xl bg-white/20 flex items-center justify-center text-xl mx-auto lg:mx-0 mb-2 animate-float">
            🏠
          </div>
          <h1 className="hidden lg:block text-base font-bold text-center bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            {settings.dormName || 'หอพัก Billing'}
          </h1>
          <p className="hidden lg:block text-[10px] text-white/60 text-center mt-0.5">
            ระบบจัดการค่าเช่ารายเดือน
          </p>
        </div>

        <nav className="flex-1 py-2">
          {NAV_ITEMS.map(([key, icon, label]) => (
            <button
              key={key}
              onClick={() => { setPage(key); setMobileOpen(false); }}
              className={`
                w-full flex items-center gap-3 px-4 lg:px-6 py-3.5 text-sm transition-all duration-300
                border-l-[3px] border-transparent relative overflow-hidden
                hover:bg-white/10 hover:translate-x-1
                ${page === key
                  ? 'bg-white/15 border-l-white font-semibold shadow-inner'
                  : 'bg-white/[0.06]'}
              `}
            >
              <span className="text-xl lg:text-lg w-7 text-center shrink-0 transition-transform duration-200 group-hover:scale-110">
                {icon}
              </span>
              <span className="hidden lg:inline">{label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto px-4 lg:px-5 py-4 border-t border-white/10">
          <label className="hidden lg:block text-[10px] text-white/70 uppercase tracking-wider mb-1.5">
            LINE Token
          </label>
          <input
            type="text"
            placeholder="Token..."
            value={settings.channelToken || ''}
            onChange={e => saveSettingsDelayed('channelToken', e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/15 text-white text-xs placeholder-white/40 focus:outline-none focus:bg-white/25 focus:ring-2 focus:ring-white/20 transition-all"
          />
        </div>
      </aside>
    </>
  );
}
