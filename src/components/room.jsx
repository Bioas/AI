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

const STATUS_OPTIONS = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'มีผู้เช่า', label: 'มีผู้เช่า' },
  { value: 'ว่าง', label: 'ว่าง' },
]

export default function Room() {
  const navigate = useNavigate()
  const { rooms, residents, setEditRoom, setModal, deleteRoom, fetchRooms } = useApp()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid')

  const handleReload = async () => {
    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search.trim())
    if (statusFilter !== 'all') params.set('status', statusFilter)
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
    if (statusFilter === 'ว่าง') result = result.filter(r => r.status === 'ว่าง' || (!r.residentId && !r.tenantName))
    if (statusFilter === 'มีผู้เช่า') result = result.filter(r => r.status === 'มีผู้เช่า' || r.residentId || r.tenantName)
    result.sort(naturalSortRoomNumber)
    return result
  }, [rooms, search, statusFilter])

  const handleDelete = (room, e) => {
    e.stopPropagation()
    const label = room.roomNumber || room.number
    const hasResident = room.residentId || room.tenantName
    if (hasResident) {
      if (!window.confirm(`⚠️ ห้อง ${label} มีผู้พัก (${room.tenantName || 'ไม่ระบุ'}) อยู่\nการลบห้องนี้จะทำให้ข้อมูลผู้พักถูกยกเลิกการเชื่อมโยงกับห้อง\nต้องการดำเนินการต่อหรือไม่?`)) return
    } else {
      if (!window.confirm(`⚠️ ต้องการลบห้อง ${label} ใช่หรือไม่?`)) return
    }
    deleteRoom(room.id)
  }

  const handleEdit = (room, e) => {
    e.stopPropagation()
    setEditRoom(room)
    setModal('room')
  }

  const getResidentName = (room) => {
    if (room.residentId) {
      const res = residents.find(r => r.id === room.residentId)
      if (res) return res.name
    }
    return room.tenantName || ''
  }

  const getStatus = (room) => {
    if (room.status === 'มีผู้เช่า' || room.residentId || room.tenantName) return { label: 'มีผู้เช่า', variant: 'success' }
    return { label: 'ว่าง', variant: 'default' }
  }

  const handleNavigate = (room) => {
    navigate(`/rooms/${room.id}`)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader title="จัดการห้องพัก" description="เพิ่ม แก้ไข และจัดการห้องพักทั้งหมด"
        action={<Button onClick={() => { setEditRoom(null); setModal('room') }}>＋ เพิ่มห้อง</Button>} />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="relative flex-1 min-w-0">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาห้องหรือผู้เช่า..."
            className="w-full h-10 pl-10 pr-4 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 transition-all" />
        </div>
        <div className="w-full sm:w-40">
          <Select value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} placeholder="ทั้งหมด" />
        </div>
        <ReloadButton onReload={handleReload} />
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-lime-100 text-lime-700' : 'text-neutral-400 hover:bg-neutral-100'}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </button>
          <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-lime-100 text-lime-700' : 'text-neutral-400 hover:bg-neutral-100'}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </button>
          <div className="text-xs text-neutral-400">{filtered.length} ห้อง</div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="pt-6">
          <EmptyState icon="🚪" title={search || statusFilter !== 'all' ? 'ไม่พบห้องที่ค้นหา' : 'ยังไม่มีห้อง'}
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
            return (
              <motion.div key={r.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
                onClick={() => handleNavigate(r)}
                className="bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md hover:border-lime-200 cursor-pointer transition-all overflow-hidden group">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 text-base font-bold shadow-sm">
                        {displayNumber}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-neutral-800">ห้อง {displayNumber}</div>
                        <Badge variant={status.variant}>{status.label}</Badge>
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

                  {residentName ? (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {residentName.charAt(0)}
                      </div>
                      <span className="text-xs text-neutral-600 truncate">{residentName}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-neutral-300 italic mb-2">ไม่มีผู้เช่า</div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                    <span className="text-xs text-neutral-400">{r.roomType || 'ไม่มีทีวี'} • {r.rentalType || 'รายเดือน'}</span>
                    <span className="text-sm font-semibold text-neutral-800">{displayRent?.toLocaleString()} ฿</span>
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
                        className="block md:table-row p-4 md:p-0 bg-white md:bg-transparent border-b md:border-b-0 border-neutral-100 last:border-b-0 hover:bg-lime-50/30 transition-colors cursor-pointer group">
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">ห้อง</span>
                          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-lime-400 to-lime-500 text-neutral-900 text-sm font-bold shadow-sm">{displayNumber}</span>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">ผู้เช่า</span>
                          {residentName ? (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {residentName.charAt(0)}
                              </div>
                              <span className="text-neutral-700">{residentName}</span>
                            </div>
                          ) : (
                            <span className="text-neutral-300 italic">—</span>
                          )}
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">ประเภท</span>
                          <div className="flex gap-1">
                            <Badge variant={r.roomType === 'มีทีวี' ? 'info' : 'default'}>
                              {r.roomType || 'ไม่มีทีวี'}
                            </Badge>
                            <Badge variant={r.rentalType === 'รายวัน' ? 'warning' : 'success'}>
                              {r.rentalType || 'รายเดือน'}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">ค่าเช่า</span>
                          <span className="font-medium text-neutral-800 whitespace-nowrap">{displayRent?.toLocaleString()} บาท</span>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">สถานะ</span>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">หมายเหตุ</span>
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
    </motion.div>
  )
}
