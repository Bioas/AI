import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_ITEMS = [
  { path: '/', icon: '📊', label: 'แดชบอร์ด' },
  { path: '/rooms', icon: '🚪', label: 'จัดการห้อง' },
  { path: '/meters', icon: '⚡', label: 'บันทึกมิเตอร์' },
  { path: '/invoices', icon: '🧾', label: 'ใบแจ้งหนี้' },
  { path: '/settings', icon: '⚙️', label: 'ตั้งค่า' },
]

export default function Sidebar({ dormName }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="เปิดเมนู"
        className="fixed top-3 left-3 z-50 md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-900 text-white shadow-lg shadow-black/10"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar text-white transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:w-60`}
      >
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm shrink-0">🏠</div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{dormName || 'ระบบจัดการหอพัก'}</div>
            <div className="text-[10px] text-white/40 font-medium">ระบบจัดการค่าเช่ารายเดือน</div>
          </div>
        </div>

        <nav className="flex-1 py-3 px-3 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${isActive ? 'bg-white/10 text-white font-medium shadow-inner' : 'text-white/50 hover:text-white hover:bg-white/[0.04]'}`
              }
            >
              <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-4">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="text-[10px] text-white/30 font-medium uppercase tracking-wider mb-1.5">ระบบ</div>
            <div className="text-xs text-white/40">v1.0.0</div>
          </div>
        </div>
      </aside>
    </>
  )
}
