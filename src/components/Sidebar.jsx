import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'

const NAV_ITEMS = [
  { path: '/', icon: '📊', label: 'แดชบอร์ด', desc: 'ภาพรวมระบบ' },
  { path: '/rooms', icon: '🚪', label: 'จัดการห้อง', desc: 'ห้องพักและผู้เช่า' },
  { path: '/residents', icon: '👥', label: 'ผู้พักอาศัย', desc: 'จัดการผู้เช่า' },
  { path: '/meters', icon: '⚡', label: 'บันทึกมิเตอร์', desc: 'ไฟฟ้าและน้ำประปา' },
  { path: '/invoices', icon: '🧾', label: 'ใบแจ้งหนี้', desc: 'ค่าเช่ารายเดือน' },
  { path: '/settings', icon: '⚙️', label: 'ตั้งค่า', desc: 'จัดการระบบ' },
]

export default function Sidebar({ dormName }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { rooms } = useApp()
  const occupied = rooms.filter(r => r.tenantName).length

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="เปิดเมนู"
        className="fixed top-4 left-4 z-50 md:hidden w-10 h-10 flex items-center justify-center rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-200/50">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>

      <AnimatePresence>
        {open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-neutral-900/30 z-40 md:hidden" onClick={() => setOpen(false)} />}
      </AnimatePresence>

      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-gradient-to-b from-amber-700 via-amber-600 to-amber-700 text-white transition-transform duration-300 ease-out shadow-xl shadow-amber-900/20 ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:w-64`}>
        {/* Header */}
        <div className="relative px-6 pt-8 pb-6 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-inner shrink-0 border border-white/10">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div className="min-w-0">
              <div className="text-base font-bold truncate tracking-tight">{dormName || 'หอพักสุขใจ'}</div>
              <div className="text-[11px] text-amber-200/80 font-medium">ระบบจัดการหอพัก</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pb-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.path} to={item.path} onClick={() => setOpen(false)}
              className={`group flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                location.pathname === item.path
                  ? 'bg-white/20 text-white shadow-md backdrop-blur-sm border border-white/10'
                  : 'text-amber-100/70 hover:text-white hover:bg-white/10'
              }`}>
              <span className={`text-xl w-7 text-center shrink-0 transition-transform duration-200 ${
                location.pathname === item.path ? 'scale-110' : 'group-hover:scale-110'
              }`}>{item.icon}</span>
              <div className="min-w-0">
                <div className={`${location.pathname === item.path ? 'font-semibold' : ''}`}>{item.label}</div>
                {location.pathname === item.path && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] text-amber-200/70">{item.desc}</motion.div>
                )}
              </div>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 pb-6 space-y-3">
          <div className="h-px bg-white/10" />
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-amber-200/80 font-medium uppercase tracking-wider">สถิติหอพัก</span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <div className="text-lg font-bold text-white">{rooms.length}</div>
                <div className="text-[10px] text-amber-200/60">ห้องทั้งหมด</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <div className="text-lg font-bold text-white">{occupied}</div>
                <div className="text-[10px] text-amber-200/60">มีผู้พัก</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <div className="text-lg font-bold text-white">{rooms.length - occupied}</div>
                <div className="text-[10px] text-amber-200/60">ห้องว่าง</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-300/50" />
            <span className="text-[10px] text-amber-200/50">ระบบทำงานปกติ • v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  )
}
