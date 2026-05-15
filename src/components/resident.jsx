import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { formatThaiDate, getContractStatus } from '../lib/constants'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import EmptyState from './ui/empty-state'
import Badge from './ui/badge'
import Button from './ui/button'
import ContractPreview from './ContractPreview'

export default function Resident() {
  const { residents, lineUsers, setEditResident, setModal, setViewOnly, deleteResident, downloadContractPdf, fetchResidents } = useApp()
  const [search, setSearch] = useState('')
  const [contractResident, setContractResident] = useState(null)

  const handleReload = async () => {
    await fetchResidents(search.trim())
  }

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

  const getLineName = (lineUserId) => {
    if (!lineUserId) return null
    const u = lineUsers.find(x => x.userId === lineUserId)
    return u ? u.displayName : null
  }
  const getLineActive = (lineUserId) => {
    if (!lineUserId) return null
    const u = lineUsers.find(x => x.userId === lineUserId)
    return u ? u.isActive : null
  }

  const handleDelete = (resident) => {
    if (!window.confirm(`⚠️ ต้องการลบข้อมูลผู้พัก "${resident.name}" ใช่หรือไม่?`)) return
    deleteResident(resident.id)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader title="ผู้พักอาศัย" description="จัดการข้อมูลผู้เช่าห้องพักทั้งหมด"
        onReload={handleReload}
        action={<Button onClick={() => { setEditResident(null); setViewOnly(false); setModal('resident') }}>＋ เพิ่มผู้พัก</Button>} />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="relative flex-1 min-w-0">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ ห้อง เบอร์โทร..."
            className="w-full h-10 pl-10 pr-4 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 transition-all" />
        </div>
        <div className="text-xs text-neutral-400 text-center sm:text-left">{filtered.length} รายการ</div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {filtered.length === 0 ? (
            <EmptyState icon="👥" title={search ? 'ไม่พบข้อมูลที่ค้นหา' : 'ยังไม่มีผู้พักอาศัย'}
              description={search ? 'ลองเปลี่ยนคำค้นหาหรือตรวจสอบการสะกด' : 'เพิ่มผู้พักคนแรกเพื่อเริ่มต้นจัดการ'}
              action={!search ? <Button onClick={() => { setEditResident(null); setViewOnly(false); setModal('resident') }}>เพิ่มผู้พัก</Button> : undefined} />
          ) : (
            <div className="border border-neutral-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="hidden md:table-header-group">
                  <tr className="bg-neutral-50/80">
                    {['ชื่อผู้พักอาศัย', 'หมายเลขห้อง', 'เบอร์โทร', 'LINE', 'วันที่เข้าพัก', 'วันหมดสัญญา', 'สถานะสัญญา', 'จัดการ'].map(h => (
                      <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-neutral-500 tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {filtered.map(r => {
                    const status = getContractStatus(r.moveOutDate)
                    return (
                      <tr key={r.id} className="block md:table-row p-4 md:p-0 bg-white md:bg-transparent border-b md:border-b-0 border-neutral-100 last:border-b-0 hover:bg-lime-50/30 transition-colors">
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">ชื่อ</span>
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
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">ห้อง</span>
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">{r.roomNumber}</span>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">เบอร์โทร</span>
                          <span className="text-neutral-700 whitespace-nowrap">{r.phone}</span>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">LINE</span>
                          {r.lineUserId ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-neutral-600 truncate max-w-[100px]">{getLineName(r.lineUserId) || r.lineUserId.slice(0, 12)}</span>
                              {getLineActive(r.lineUserId) === false && <Badge variant="danger">ปิด</Badge>}
                            </div>
                          ) : (
                            <span className="text-neutral-300 italic">—</span>
                          )}
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">วันที่เข้าพัก</span>
                          <span className="text-neutral-600 whitespace-nowrap text-xs">{formatThaiDate(r.moveInDate)}</span>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">วันหมดสัญญา</span>
                          <span className="text-neutral-600 whitespace-nowrap text-xs">{formatThaiDate(r.moveOutDate)}</span>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">สถานะ</span>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">จัดการ</span>
                          <div className="flex gap-1.5">
                            <button onClick={() => { setEditResident(r); setViewOnly(true); setModal('resident') }}
                              className="h-8 px-3.5 rounded-lg text-xs font-medium bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors border border-sky-100">ดู</button>
                            <button onClick={() => { setContractResident(r); setTimeout(() => downloadContractPdf(r), 100); setTimeout(() => setContractResident(null), 200) }}
                              className="h-8 px-3.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-100">สัญญา</button>
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

      {contractResident && (
        <div className="fixed left-0 top-0 -z-50 opacity-0 pointer-events-none" aria-hidden="true">
          <ContractPreview resident={contractResident} />
        </div>
      )}
    </motion.div>
  )
}
