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
        className="fixed top-3 left-3 z-50 md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-lime-300 text-neutral-800 shadow-lg shadow-lime-200/50">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>

      <AnimatePresence>
        {open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-neutral-900/30 z-40 md:hidden" onClick={() => setOpen(false)} />}
      </AnimatePresence>

      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-lime-300 text-neutral-800 transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:w-64`}>
        <div className="flex items-center gap-3 px-6 h-18 border-b border-neutral-800/10">
          <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-lime-300 text-base shadow-md shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold truncate text-neutral-800">{dormName || 'ระบบจัดการหอพัก'}</div>
            <div className="text-[11px] text-neutral-600 font-medium">Lime Management</div>
          </div>
        </div>

        <nav className="flex-1 py-5 px-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.path} to={item.path} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                location.pathname === item.path
                  ? 'bg-neutral-800 text-lime-300 shadow-md'
                  : 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-800/10'
              }`}>
              <span className="text-lg w-6 text-center shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-4 pb-6">
          <div className="p-4 rounded-xl bg-neutral-800/10 border border-neutral-800/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
              <span className="text-[11px] text-neutral-600 font-medium uppercase tracking-wider">ระบบพร้อมใช้งาน</span>
            </div>
            <div className="text-xs text-neutral-500">v1.0.0</div>
          </div>
        </div>
      </aside>
    </>
  )
}
