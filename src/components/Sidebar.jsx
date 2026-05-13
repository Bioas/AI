import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
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
  const location = useLocation()

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="เปิดเมนู"
        className="fixed top-3 left-3 z-50 md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-lime-400 to-lime-500 text-neutral-900 shadow-lg shadow-lime-200/50">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>

      <AnimatePresence>
        {open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-neutral-900/40 z-40 md:hidden" onClick={() => setOpen(false)} />}
      </AnimatePresence>

      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar text-white transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:w-60`}>
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 text-sm shadow-lg shadow-lime-500/20 shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{dormName || 'ระบบจัดการหอพัก'}</div>
            <div className="text-[10px] text-white/40 font-medium">Lime Management</div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.path} to={item.path} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                location.pathname === item.path
                  ? 'bg-gradient-to-r from-lime-400/15 to-lime-300/5 text-white font-medium border border-lime-400/10'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
              }`}>
              <span className="text-base w-5 text-center shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-5">
          <div className="p-3 rounded-xl bg-gradient-to-br from-lime-400/5 to-lime-300/5 border border-lime-400/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-lime-300/60 font-medium uppercase tracking-wider">ระบบพร้อมใช้งาน</span>
            </div>
            <div className="text-xs text-lime-300/40">v1.0.0</div>
          </div>
        </div>
      </aside>
    </>
  )
}
