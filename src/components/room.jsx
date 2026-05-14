import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import EmptyState from './ui/empty-state'
import Badge from './ui/badge'
import Button from './ui/button'
import Select from './ui/select'

const STATUS_OPTIONS = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'มีผู้เช่า', label: 'มีผู้เช่า' },
  { value: 'ว่าง', label: 'ว่าง' },
]

export default function Room() {
  const { rooms, residents, setEditRoom, setModal, deleteRoom } = useApp()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    let result = rooms
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(r =>
        (r.roomNumber || r.number)?.toLowerCase().includes(q) ||
        r.tenantName?.toLowerCase().includes(q) ||
        (r.note || '').toLowerCase().includes(q)
      )
    }
    if (statusFilter === 'ว่าง') result = result.filter(r => r.status === 'ว่าง' || (!r.residentId && !r.tenantName))
    if (statusFilter === 'มีผู้เช่า') result = result.filter(r => r.status === 'มีผู้เช่า' || r.residentId || r.tenantName)
    return result
  }, [rooms, search, statusFilter])

  const handleDelete = (room) => {
    const label = room.roomNumber || room.number
    if (room.residentId || room.tenantName) {
      window.alert(`⚠️ ไม่สามารถลบห้อง ${label} ได้ เนื่องจากมีผู้พัก (${room.tenantName}) อยู่ในห้อง กรุณาย้ายผู้พักออกก่อน`)
      return
    }
    if (!window.confirm(`⚠️ ต้องการลบห้อง ${label} ใช่หรือไม่?`)) return
    deleteRoom(room.id)
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

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader title="จัดการห้องพัก" description="เพิ่ม แก้ไข และจัดการห้องพักทั้งหมด"
        action={<Button onClick={() => { setEditRoom(null); setModal('room') }}>＋ เพิ่มห้อง</Button>} />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาห้องหรือผู้เช่า..."
            className="w-full h-10 pl-10 pr-4 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 transition-all" />
        </div>
        <div className="w-40">
          <Select value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} placeholder="ทั้งหมด" />
        </div>
        <div className="text-xs text-neutral-400">{filtered.length} ห้อง</div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {filtered.length === 0 ? (
            <EmptyState icon="🚪" title={search || statusFilter !== 'all' ? 'ไม่พบห้องที่ค้นหา' : 'ยังไม่มีห้อง'}
              description={search ? 'ลองเปลี่ยนคำค้นหาหรือตรวจสอบการสะกด' : 'เพิ่มห้องแรกของคุณเพื่อเริ่มต้น'}
              action={!search && statusFilter === 'all' ? <Button onClick={() => { setEditRoom(null); setModal('room') }}>เพิ่มห้อง</Button> : undefined} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-neutral-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50/80">
                    {['หมายเลขห้องพัก', 'ชื่อผู้เช่า', 'ประเภทห้อง', 'ค่าเช่า', 'สถานะห้อง', 'หมายเหตุ', 'จัดการ'].map(h => (
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
                      <tr key={r.id} className="hover:bg-lime-50/30 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-lime-400 to-lime-500 text-neutral-900 text-sm font-bold shadow-sm">{displayNumber}</span>
                        </td>
                        <td className="px-4 py-3.5">
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
                        <td className="px-4 py-3.5">
                          <Badge variant={r.roomType === 'มีทีวี' ? 'info' : 'default'}>
                            {r.roomType || 'ไม่มีทีวี'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-neutral-800 whitespace-nowrap">
                          {displayRent?.toLocaleString()} บาท
                        </td>
                        <td className="px-4 py-3.5"><Badge variant={status.variant}>{status.label}</Badge></td>
                        <td className="px-4 py-3.5 text-xs text-neutral-400 max-w-[150px] truncate">
                          {r.note || <span className="text-neutral-200">—</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1.5">
                            <button onClick={() => { setEditRoom(r); setModal('room') }}
                              className="h-8 px-3.5 rounded-lg text-xs font-medium bg-lime-50 text-lime-700 hover:bg-lime-100 transition-colors border border-lime-100">แก้ไข</button>
                            <button onClick={() => handleDelete(r)}
                              className="h-8 px-3.5 rounded-lg text-xs font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors border border-rose-100">ลบ</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
