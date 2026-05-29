import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'

const ICONS = {
  dashboard: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="4" rx="1"/><rect x="14" y="10" width="7" height="11" rx="1"/><rect x="3" y="13" width="7" height="8" rx="1"/></svg>,
  calendar: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  rooms: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  residents: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  meters: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  billing: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  documents: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  settings: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
}

const NAV_ITEMS = [
  { path: '/', icon: 'dashboard', label: 'แดชบอร์ด', desc: 'ภาพรวมระบบ' },
  { path: '/calendar', icon: 'calendar', label: 'ปฏิทิน', desc: 'ปฏิทินการจองห้องพัก' },
  { path: '/rooms', icon: 'rooms', label: 'จัดการห้องพัก', desc: 'ห้องพักและผู้เช่า' },
  { path: '/residents', icon: 'residents', label: 'ผู้พักอาศัย', desc: 'จัดการผู้เช่า' },
  { path: '/meters', icon: 'meters', label: 'บันทึกมิเตอร์', desc: 'ไฟฟ้าและน้ำประปา' },
  { path: '/billing', icon: 'billing', label: 'ออกบิล', desc: 'ใบแจ้งหนี้/ใบเสร็จ' },
  { path: '/documents', icon: 'documents', label: 'เอกสาร', desc: 'เอกสารที่บันทึกไว้' },
  { path: '/settings', icon: 'settings', label: 'ตั้งค่า', desc: 'จัดการระบบ' },
]

export default function Sidebar({ dormName }) {
  const [open, setOpen] = useState(false)
  const { rooms, residents } = useApp()
  const occupied = rooms.filter(r => r.residentId || r.tenantName).length

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const headerContent = () => (
    <div className="relative px-6 pt-10 pb-6 overflow-hidden shrink-0">
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/5" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />
      <div className="relative flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-inner shrink-0 border border-white/10">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <div className="min-w-0">
          <div className="text-base font-bold truncate tracking-tight">{dormName || 'หอพักสุขใจ'}</div>
          <div className="text-[11px] text-green-200/80 font-medium">ระบบจัดการหอพัก</div>
        </div>
      </div>
    </div>
  )

  const navItems = (isMobile = false) => (
    <nav className="px-3 pb-4 space-y-1">
      {NAV_ITEMS.map(item => (
        <NavLink key={item.path} to={item.path} onClick={() => isMobile && setOpen(false)}
          className={({ isActive }) =>
            `group flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-white/20 text-white shadow-md backdrop-blur-sm border border-white/10'
                : 'text-green-100/70 hover:text-white hover:bg-white/10'
            }`
          }>
          <span className="w-7 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110">{ICONS[item.icon]}</span>
          <div className="min-w-0">
            <div>{item.label}</div>
            {isMobile && <div className="text-[10px] text-green-200/70">{item.desc}</div>}
          </div>
        </NavLink>
      ))}
    </nav>
  )

  const footerContent = () => (
    <div className="px-4 pb-6 space-y-3 shrink-0">
      <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
        <div className="mb-3">
          <span className="text-sm font-semibold text-green-100">สถิติหอพัก</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <div className="text-xl font-bold text-white">{rooms.length}</div>
            <div className="text-[10px] text-green-200/70 mt-0.5">ห้องทั้งหมด</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center flex-1">
            <div className="text-xl font-bold text-white">{occupied}</div>
            <div className="text-[10px] text-green-200/70 mt-0.5">มีผู้พัก</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center flex-1">
            <div className="text-xl font-bold text-white">{rooms.length - occupied}</div>
            <div className="text-[10px] text-green-200/70 mt-0.5">ห้องว่าง</div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-300/50" />
        <span className="text-[10px] text-green-200/50">ระบบทำงานปกติ • v1.0.0</span>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Top Navbar - visible only on mobile */}
      <header className="fixed top-0 left-0 right-0 z-40 md:hidden bg-white/80 backdrop-blur-md border-b border-neutral-200/60">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => setOpen(true)} aria-label="เปิดเมนู"
            className="w-10 h-10 flex items-center justify-center rounded-xl text-neutral-600 hover:bg-neutral-100 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-700 to-green-800 flex items-center justify-center text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <span className="text-sm font-bold text-neutral-800 truncate">{dormName || 'หอพักสุขใจ'}</span>
          </div>
          <div className="w-10" />
        </div>
      </header>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-neutral-900/40 z-40 md:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Full-Height Drawer - Header fixed, Nav scrollable */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-gradient-to-b from-green-900 via-green-800 to-green-900 text-white shadow-xl shadow-green-950/30 md:hidden"
          >
            {/* Fixed Header */}
            {headerContent()}

            {/* Scrollable Nav */}
            <div className="flex-1 overflow-y-auto">
              {navItems(true)}
            </div>

            {/* Fixed Footer */}
            {footerContent()}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar - hidden on mobile */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 bg-gradient-to-b from-green-900 via-green-800 to-green-900 text-white shadow-xl shadow-green-950/30">
        {/* Fixed Header */}
        {headerContent()}

        {/* Scrollable Nav - takes remaining space */}
        <div className="flex-1 overflow-y-auto">
          {navItems(false)}
        </div>

        {/* Fixed Footer */}
        {footerContent()}
      </aside>
    </>
  )
}
