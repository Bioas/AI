import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const NAV_ITEMS = [
  { path: '/', icon: 'dashboard', label: 'แดชบอร์ด' },
  { path: '/rooms', icon: 'room', label: 'ห้อง' },
  { path: '/residents', icon: 'resident', label: 'ผู้พัก' },
  { path: '/line-users', icon: 'line', label: 'LINE' },
  { path: '/meters', icon: 'meter', label: 'มิเตอร์' },
  { path: '/invoices', icon: 'invoice', label: 'แจ้งหนี้' },
  { path: '/settings', icon: 'settings', label: 'ตั้งค่า' },
]

const ICONS = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  room: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  resident: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  line: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  meter: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  invoice: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
}

export default function Sidebar({ dormName }) {
  const { rooms, residents } = useApp()
  const occupied = rooms.filter(r => r.residentId || r.tenantName).length

  return (
    <>
      {/* Desktop Sidebar - hidden on mobile */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 bg-gradient-to-b from-amber-700 via-amber-600 to-amber-700 text-white shadow-xl shadow-amber-900/20">
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
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) =>
                `group flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white/20 text-white shadow-md backdrop-blur-sm border border-white/10'
                    : 'text-amber-100/70 hover:text-white hover:bg-white/10'
                }`
              }>
              <span className="text-xl w-7 text-center shrink-0 transition-transform duration-200 group-hover:scale-110">{item.icon}</span>
              <div className="min-w-0">
                <div className="group-[.active]:font-semibold">{item.label}</div>
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

      {/* Mobile Floating Bottom Nav - hidden on desktop */}
      <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-1 px-2 py-2 rounded-full bg-white/80 backdrop-blur-md shadow-lg shadow-neutral-900/10 border border-white/60">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[48px] px-2 py-1.5 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-300/40'
                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100/60'
                }`
              }>
              <span className="mb-0.5">{ICONS[item.icon]}</span>
              <span className="text-[10px] font-medium leading-none truncate max-w-[48px]">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}
