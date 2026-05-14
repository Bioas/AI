import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { formatThaiDate, getContractStatus } from '../lib/constants'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import EmptyState from './ui/empty-state'
import Badge from './ui/badge'
import Button from './ui/button'

export default function Resident() {
  const { residents, rooms, setEditResident, setModal, deleteResident } = useApp()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return residents
    const q = search.trim().toLowerCase()
    return residents.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.phone.includes(q) ||
      r.roomNumber?.includes(q) ||
      r.idCard?.includes(q)
    )
  }, [residents, search])

  const handleDelete = (resident) => {
    if (!window.confirm(`⚠️ ต้องการลบข้อมูลผู้พัก "${resident.name}" ใช่หรือไม่?`)) return
    deleteResident(resident.id)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader title="ผู้พักอาศัย" description="จัดการข้อมูลผู้เช่าห้องพักทั้งหมด"
        action={<Button onClick={() => { setEditResident(null); setModal('resident') }}>＋ เพิ่มผู้พัก</Button>} />

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ ห้อง เบอร์โทร หรือเลขบัตรประชาชน..."
            className="w-full h-10 pl-10 pr-4 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 transition-all" />
        </div>
        <div className="text-xs text-neutral-400">{filtered.length} รายการ</div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {filtered.length === 0 ? (
            <EmptyState icon="👥" title={search ? 'ไม่พบข้อมูลที่ค้นหา' : 'ยังไม่มีผู้พักอาศัย'}
              description={search ? 'ลองเปลี่ยนคำค้นหาหรือตรวจสอบการสะกด' : 'เพิ่มผู้พักคนแรกเพื่อเริ่มต้นจัดการ'}
              action={!search ? <Button onClick={() => { setEditResident(null); setModal('resident') }}>เพิ่มผู้พัก</Button> : undefined} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-neutral-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50/80">
                    {['ชื่อผู้พักอาศัย', 'หมายเลขห้อง', 'เบอร์โทร', 'วันที่เข้าพัก', 'วันหมดสัญญา', 'สถานะสัญญา', 'จัดการ'].map(h => (
                      <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-neutral-500 tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {filtered.map(r => {
                    const status = getContractStatus(r.moveOutDate)
                    return (
                      <tr key={r.id} className="hover:bg-lime-50/30 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 text-xs font-bold shadow-sm shrink-0">
                              {r.name?.charAt(0) || '?'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-neutral-800 truncate max-w-[200px]">{r.name}</div>
                              {r.email && <div className="text-[11px] text-neutral-400 truncate max-w-[200px]">{r.email}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">{r.roomNumber}</span>
                        </td>
                        <td className="px-4 py-3.5 text-neutral-700 whitespace-nowrap">{r.phone}</td>
                        <td className="px-4 py-3.5 text-neutral-600 whitespace-nowrap text-xs">{formatThaiDate(r.moveInDate)}</td>
                        <td className="px-4 py-3.5 text-neutral-600 whitespace-nowrap text-xs">{formatThaiDate(r.moveOutDate)}</td>
                        <td className="px-4 py-3.5"><Badge variant={status.variant}>{status.label}</Badge></td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1.5">
                            <button onClick={() => { setEditResident(r); setModal('resident') }}
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
