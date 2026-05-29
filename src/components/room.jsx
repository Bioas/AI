import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { naturalSortRoomNumber } from '../lib/constants'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import EmptyState from './ui/empty-state'
import Badge from './ui/badge'
import Button from './ui/button'
import Select from './ui/select'
import ReloadButton from './ui/reload-button'
import Modal from './ui/modal'

const RENTAL_OPTIONS = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'รายวัน', label: 'รายวัน' },
  { value: 'รายเดือน', label: 'รายเดือน' },
]

export default function Room() {
  const navigate = useNavigate()
  const { rooms, residents, setEditRoom, setModal, deleteRoom, fetchRooms } = useApp()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [confirmDeleteRoom, setConfirmDeleteRoom] = useState(null)

  const handleReload = async () => {
    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search.trim())
    await fetchRooms(params.toString() ? `?${params.toString()}` : '')
  }

  const filtered = useMemo(() => {
    let result = rooms
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(r =>
        (r.roomNumber || r.number)?.toLowerCase().includes(q) ||
        (r.roomCode || '').toLowerCase().includes(q) ||
        r.tenantName?.toLowerCase().includes(q) ||
        (r.note || '').toLowerCase().includes(q)
      )
    }
    if (statusFilter === 'รายวัน') result = result.filter(r => r.rentalType === 'daily' || r.rentalType === 'รายวัน')
    if (statusFilter === 'รายเดือน') result = result.filter(r => !r.rentalType || r.rentalType === 'monthly' || r.rentalType === 'รายเดือน')
    result.sort(naturalSortRoomNumber)
    return result
  }, [rooms, search, statusFilter, residents])

  const handleDelete = (room, e) => {
    e.stopPropagation()
    setConfirmDeleteRoom(room)
  }

  const handleConfirmDelete = () => {
    if (!confirmDeleteRoom) return
    const room = confirmDeleteRoom
    setConfirmDeleteRoom(null)
    deleteRoom(room.id)
  }

  const handleEdit = (room, e) => {
    e.stopPropagation()
    setEditRoom(room)
    setModal('room')
  }

  const getRoomResidents = (room) => {
    return residents.filter(r =>
      r.roomId === room.id &&
      (r.rentalType === 'daily' || r.rentalType === 'รายวัน')
    ).sort((a, b) => new Date(a.moveInDate) - new Date(b.moveInDate))
  }

  const getCurrentResident = (room) => {
    const now = new Date()
    const todayBkk = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    const bkkHour = Number(now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit' }))
    const roomRes = getRoomResidents(room)
    for (const res of roomRes) {
      const inBkk = new Date(res.moveInDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
      const outBkk = new Date(res.moveOutDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
      if (outBkk < todayBkk) continue
      if (outBkk === todayBkk && bkkHour >= 12) continue
      if (inBkk > todayBkk) continue
      if (inBkk === todayBkk && bkkHour < 14) continue
      return res
    }
    return null
  }

  const getUpcomingResidents = (room) => {
    const now = new Date()
    const todayBkk = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    const bkkHour = Number(now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit' }))
    return getRoomResidents(room).filter(r => {
      const inBkk = new Date(r.moveInDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
      if (inBkk > todayBkk) return true
      if (inBkk === todayBkk && bkkHour < 14) return true
      return false
    })
  }

  const getResidentName = (room) => {
    const isDaily = room.rentalType === 'daily' || room.rentalType === 'รายวัน'
    if (isDaily) {
      const current = getCurrentResident(room)
      if (current) return current.name
      const upcoming = getUpcomingResidents(room)
      if (upcoming.length) return upcoming[0].name
      return ''
    }
    if (room.residentId) {
      const res = residents.find(r => r.id === room.residentId)
      if (res) return res.name
    }
    return room.tenantName || ''
  }

  const getStatus = (room) => {
    const isDaily = room.rentalType === 'daily' || room.rentalType === 'รายวัน'
    if (isDaily) {
      if (getCurrentResident(room)) return { label: 'มีผู้เช่า', variant: 'success' }
      if (getUpcomingResidents(room).length) return { label: 'กำลังจะมีผู้เข้าพัก', variant: 'warning' }
      return { label: 'ว่าง', variant: 'default' }
    }
    if (room.residentId || room.tenantName) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const res = residents.find(r => r.id === room.residentId)
      if (res && res.moveInDate) {
        const inDate = new Date(res.moveInDate)
        inDate.setHours(0, 0, 0, 0)
        if (inDate > today) return { label: 'กำลังจะมีผู้เข้าพัก', variant: 'warning' }
      }
      return { label: 'มีผู้เช่า', variant: 'success' }
    }
    return { label: 'ว่าง', variant: 'default' }
  }

  const handleNavigate = (room) => {
    navigate(`/rooms/${room.id}`)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader title="จัดการห้องพัก" description="เพิ่ม แก้ไข และจัดการห้องพักทั้งหมด"
        action={<Button onClick={() => { setEditRoom(null); setModal('room') }}>＋ เพิ่มห้อง</Button>} />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 w-full sm:flex-1">
          <div className="relative flex-1 min-w-0">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาห้องหรือผู้เช่า..."
              className="w-full h-10 pl-10 pr-4 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 transition-all" />
          </div>
          <ReloadButton onReload={handleReload} className="shrink-0" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-full sm:w-40">
            <Select value={statusFilter} onChange={setStatusFilter} options={RENTAL_OPTIONS} placeholder="ทั้งหมด" />
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-lime-100 text-lime-700' : 'text-neutral-400 hover:bg-neutral-100'}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            </button>
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-lime-100 text-lime-700' : 'text-neutral-400 hover:bg-neutral-100'}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </button>
            <div className="text-xs text-neutral-400">{filtered.length} ห้อง</div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="pt-6">
          <EmptyState icon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>} title={search || statusFilter !== 'all' ? 'ไม่พบห้องที่ค้นหา' : 'ยังไม่มีห้อง'}
            description={search ? 'ลองเปลี่ยนคำค้นหาหรือตรวจสอบการสะกด' : 'เพิ่มห้องแรกของคุณเพื่อเริ่มต้น'}
            action={!search && statusFilter === 'all' ? <Button onClick={() => { setEditRoom(null); setModal('room') }}>เพิ่มห้อง</Button> : undefined} />
        </CardContent></Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(r => {
            const status = getStatus(r)
            const residentName = getResidentName(r)
            const displayNumber = r.roomNumber || r.number
            const displayRent = r.rentPrice || r.rent
            const isOccupied = status.label === 'มีผู้เช่า'
            const isUpcoming = status.label === 'กำลังจะมีผู้เข้าพัก'
            const borderHover = isUpcoming ? 'hover:border-amber-200' : 'hover:border-lime-200'
            return (
              <motion.div key={r.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
                onClick={() => handleNavigate(r)}
                className={`relative bg-white rounded-2xl border border-neutral-100 shadow-sm hover:shadow-lg ${borderHover} hover:-translate-y-1 cursor-pointer transition-all duration-300 overflow-hidden group`}>
                <div className={`absolute top-0 left-0 right-0 h-1 ${isOccupied ? 'bg-gradient-to-r from-lime-400 to-lime-500' : isUpcoming ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-neutral-200 to-neutral-300'}`}></div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-base font-bold shadow-sm transition-transform group-hover:scale-105 ${isOccupied ? 'bg-gradient-to-br from-lime-400 to-lime-500 text-neutral-900' : isUpcoming ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white' : 'bg-gradient-to-br from-neutral-100 to-neutral-200 text-neutral-500'}`}>
                        {displayNumber}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-neutral-800">ห้อง {displayNumber}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`inline-block w-2 h-2 rounded-full ${isOccupied ? 'bg-lime-500' : isUpcoming ? 'bg-amber-500' : 'bg-neutral-300'}`}></span>
                          <span className={`text-xs font-medium ${isOccupied ? 'text-lime-600' : isUpcoming ? 'text-amber-600' : 'text-neutral-400'}`}>{status.label}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => handleEdit(r, e)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-lime-50 hover:text-lime-600 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={(e) => handleDelete(r, e)} className="p-1.5 rounded-lg text-neutral-400 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>

                  {(() => {
                    if (status.label === 'กำลังจะมีผู้เข้าพัก') {
                      const isDailyR = r.rentalType === 'daily' || r.rentalType === 'รายวัน'
                      const res = isDailyR ? getUpcomingResidents(r)[0] || residents.find(x => x.id === r.residentId) : residents.find(x => x.id === r.residentId)
                      const checkInDate = res?.moveInDate
                        ? new Date(res.moveInDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
                        : ''
                      return (
                        <div className="flex items-center gap-2.5 mb-4 p-2.5 rounded-xl bg-amber-50/50 border border-amber-100/50">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                            {residentName?.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-neutral-700 truncate">{residentName}</div>
                            <div className="text-[10px] text-amber-600">กำลังจะมีผู้เข้าพัก {checkInDate}</div>
                          </div>
                        </div>
                      )
                    }
                    if (residentName) {
                      const isDailyR = r.rentalType === 'daily' || r.rentalType === 'รายวัน'
                      const currentRes = isDailyR ? getCurrentResident(r) : residents.find(x => x.id === r.residentId)
                      const nextUpcoming = isDailyR ? getUpcomingResidents(r)[0] : null
                      return (
                        <>
                        <div className="flex items-center gap-2.5 mb-2 p-2.5 rounded-xl bg-lime-50/50 border border-lime-100/50">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                            {residentName.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-neutral-700 truncate">{residentName}</div>
                          </div>
                          {(() => {
                            if (!currentRes?.tenantType) return null
                            return (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${currentRes.tenantType === 'company' ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-sky-600'}`}>
                                {currentRes.tenantType === 'company' ? 'บริษัท' : 'ทั่วไป'}
                              </span>
                            )
                          })()}
                        </div>
                        {nextUpcoming ? (
                          <div className="flex items-center gap-2 mb-4 pl-2.5">
                            <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0"></span>
                            <span className="text-[10px] text-amber-700">
                              ผู้จองที่กำลังจะมาถึง <span className="font-medium">{nextUpcoming.name}</span> {new Date(nextUpcoming.moveInDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - {new Date(nextUpcoming.moveOutDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        ) : null}
                        </>
                      )
                    }
                    return (
                      <div className="flex items-center gap-2 mb-4 p-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
                        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-400 text-xs">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                        <span className="text-xs text-neutral-400">ยังไม่มีผู้พัก</span>
                      </div>
                    )
                  })()}

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${(r.rentalType === 'daily' || r.rentalType === 'รายวัน') ? 'bg-sky-50 text-sky-600 border border-sky-100' : 'bg-lime-50 text-lime-600 border border-lime-100'}`}>
                        {r.rentalType === 'daily' ? 'รายวัน' : r.rentalType === 'monthly' ? 'รายเดือน' : r.rentalType || 'รายเดือน'}
                      </span>
                      <span className="text-[10px] text-neutral-400">{r.roomType || 'ไม่มีทีวี'}</span>
                    </div>
                    <span className="text-sm font-bold text-neutral-800">{displayRent?.toLocaleString()} <span className="text-xs font-normal text-neutral-400">฿/{(r.rentalType === 'daily' || r.rentalType === 'รายวัน') ? 'วัน' : 'เดือน'}</span></span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="border border-neutral-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="hidden md:table-header-group">
                  <tr className="bg-neutral-50/80">
                    {['หมายเลขห้องพัก', 'ชื่อผู้เช่า', 'ประเภทห้อง', 'ค่าเช่า', 'สถานะห้อง', 'หมายเหตุ'].map(h => (
                      <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-neutral-500 tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {filtered.map(r => {
                    const status = getStatus(r)
                    const residentName = getResidentName(r)
                    const displayNumber = r.roomNumber || r.number
                    const displayRent = r.rentPrice || r.rent
                    return (
                      <tr key={r.id} onClick={() => handleNavigate(r)}
                        className="block md:table-row md:p-0 bg-white md:bg-transparent border-b md:border-b-0 border-neutral-100 last:border-b-0 hover:bg-lime-50/30 transition-colors cursor-pointer group">
                        {/* Mobile card */}
                        <td colSpan={99} className="block md:hidden p-3 w-full">
                          <div className="space-y-1.5 w-full">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-lime-400 to-lime-500 text-neutral-900 text-[11px] font-bold shadow-sm shrink-0">{displayNumber}</span>
                              <span className="font-medium text-neutral-800 truncate">{residentName || '—'}</span>
                              <Badge variant={status.variant} className="ml-auto shrink-0">{status.label}</Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                              <div className="bg-neutral-50 rounded-lg px-2.5 py-2">
                                <div className="text-[10px] text-neutral-400">รูปแบบ</div>
                                <div className={`font-semibold text-xs ${(r.rentalType === 'daily' || r.rentalType === 'รายวัน') ? 'text-sky-600' : 'text-lime-600'}`}>{(r.rentalType === 'daily' || r.rentalType === 'รายวัน') ? 'รายวัน' : 'รายเดือน'}</div>
                              </div>
                              <div className="bg-neutral-50 rounded-lg px-2.5 py-2">
                                <div className="text-[10px] text-neutral-400">ประเภท</div>
                                <div className="font-semibold text-neutral-800 text-xs">
                                  <span className={r.roomType === 'มีทีวี' ? 'text-sky-600' : ''}>{r.roomType || 'ไม่มีทีวี'}</span>
                                </div>
                              </div>
                              <div className="bg-neutral-50 rounded-lg px-2.5 py-2">
                                <div className="text-[10px] text-neutral-400">ค่าเช่า</div>
                                <div className="font-semibold text-neutral-800 text-xs">{displayRent?.toLocaleString()}</div>
                              </div>
                            </div>
                            {r.note && (
                              <div className="text-[11px] text-neutral-400 truncate pt-0.5">{r.note}</div>
                            )}
                          </div>
                        </td>
                        {/* Desktop cells */}
                        <td className="hidden md:table-cell px-4 py-3.5">
                          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-lime-400 to-lime-500 text-neutral-900 text-sm font-bold shadow-sm">{displayNumber}</span>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3.5">
                          {status.label === 'กำลังจะมีผู้เข้าพัก' ? (
                            (() => {
                              const isDailyR = r.rentalType === 'daily' || r.rentalType === 'รายวัน'
                              const res = isDailyR ? getUpcomingResidents(r)[0] || residents.find(x => x.id === r.residentId) : residents.find(x => x.id === r.residentId)
                              const checkInDate = res?.moveInDate
                                ? new Date(res.moveInDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
                                : ''
                              return (
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {residentName?.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="text-neutral-700">{residentName}</div>
                                    <div className="text-[10px] text-amber-600">กำลังจะมีผู้เข้าพัก {checkInDate}</div>
                                  </div>
                                </div>
                              )
                            })()
                          ) : residentName ? (
                            (() => {
                              const isDailyR = r.rentalType === 'daily' || r.rentalType === 'รายวัน'
                              const nextUpcoming = isDailyR ? getUpcomingResidents(r)[0] : null
                              return (
                                <div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                      {residentName.charAt(0)}
                                    </div>
                                    <span className="text-neutral-700">{residentName}</span>
                                  </div>
                                  {nextUpcoming && (() => {
                                    const inD = new Date(nextUpcoming.moveInDate)
                                    const outD = new Date(nextUpcoming.moveOutDate)
                                    const fOpts = { day: 'numeric', month: 'short', year: 'numeric' }
                                    return (
                                      <div className="text-[10px] text-amber-600 mt-1 ml-9">
                                        ผู้จองที่กำลังจะมาถึงเป็น {nextUpcoming.name} - {inD.toLocaleDateString('th-TH', fOpts)} ถึง {outD.toLocaleDateString('th-TH', fOpts)}
                                      </div>
                                    )
                                  })()}
                                </div>
                              )
                            })()
                          ) : (
                            <span className="text-neutral-300 italic">—</span>
                          )}
                        </td>
                        <td className="hidden md:table-cell px-4 py-3.5">
                          <div className="flex gap-1">
                            <Badge variant={(r.rentalType === 'daily' || r.rentalType === 'รายวัน') ? 'warning' : 'success'} className="text-xs font-semibold px-2.5 py-1">
                              {r.rentalType === 'daily' ? 'รายวัน' : r.rentalType === 'monthly' ? 'รายเดือน' : r.rentalType || 'รายเดือน'}
                            </Badge>
                            <Badge variant={r.roomType === 'มีทีวี' ? 'info' : 'default'}>
                              {r.roomType || 'ไม่มีทีวี'}
                            </Badge>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3.5">
                          <span className="font-medium text-neutral-800 whitespace-nowrap">{displayRent?.toLocaleString()} บาท</span>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3.5">
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3.5">
                          <span className="text-xs text-neutral-400 max-w-[150px] truncate">{r.note || <span className="text-neutral-200">—</span>}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      {confirmDeleteRoom && (
        <Modal open={true} onClose={() => setConfirmDeleteRoom(null)} maxWidth="max-w-md">
          <div className="p-5">
            <h3 className="text-base font-bold text-neutral-800 mb-1">ลบห้อง</h3>
            <p className="text-sm text-neutral-600 mb-5">
              {(() => {
                const room = confirmDeleteRoom
                const label = room.roomNumber || room.number
                const hasResident = room.residentId || room.tenantName
                if (hasResident) {
                  return <>ห้อง <strong>{label}</strong> มีผู้พัก (<strong>{room.tenantName || 'ไม่ระบุ'}</strong>) อยู่<br />การลบห้องนี้จะทำให้ข้อมูลผู้พักถูกยกเลิกการเชื่อมโยงกับห้อง<br />ต้องการดำเนินการต่อหรือไม่?</>
                }
                return <>ต้องการลบห้อง <strong>{label}</strong> ใช่หรือไม่?</>
              })()}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDeleteRoom(null)}
                className="flex-1 h-9 rounded-xl text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors">
                ยกเลิก
              </button>
              <button onClick={handleConfirmDelete}
                className="flex-1 h-9 rounded-xl text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm">
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  )
}
