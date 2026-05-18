import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { formatMonth, naturalSortRoomNumber } from '../lib/constants'
import DatePickerField from './ui/datepicker'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import EmptyState from './ui/empty-state'
import MeterModal from './MeterModal'
import ReloadButton from './ui/reload-button'

export default function Meters() {
  const { rooms: allRooms, settings, meterMonth, setMeterMonth, meterLocal, fetchAll } = useApp()
  const [editRoom, setEditRoom] = useState(null)

  const handleReload = async () => {
    await fetchAll()
  }

  const meterDate = useMemo(() => {
    if (!meterMonth) return null
    const [y, m] = meterMonth.split('-').map(Number)
    return new Date(y, m - 1, 1)
  }, [meterMonth])

  const handleMeterMonthChange = (date) => {
    if (date) {
      setMeterMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
    }
  }
  const occRooms = useMemo(() => {
    const filtered = allRooms.filter(r => (r.residentId || r.tenantName) && r.rentalType !== 'daily' && r.rentalType !== 'รายวัน')
    filtered.sort(naturalSortRoomNumber)
    return filtered
  }, [allRooms])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader title="บันทึกมิเตอร์" description="บันทึกเลขมาตรไฟฟ้าและน้ำประปารายเดือน" />

      <div className="flex flex-row items-center gap-3 mb-6 sm:mb-8 bg-white rounded-2xl shadow-card border border-lime-100/40 px-4 sm:px-6 py-4">
        <label className="text-sm font-medium text-neutral-600 shrink-0">เดือน:</label>
        <div className="flex-1 sm:flex-none sm:w-44">
          <DatePickerField selected={meterDate} onChange={handleMeterMonthChange} showMonthPicker placeholder="เลือกเดือน" />
        </div>
        <ReloadButton onReload={handleReload} className="ml-auto" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-2 h-2 rounded-full bg-lime-400" />
            <h3 className="text-sm font-semibold text-neutral-800">ข้อมูลมิเตอร์ — {formatMonth(meterMonth)}</h3>
          </div>
          <p className="text-xs text-neutral-400 mb-6 ml-5">กดปุ่ม "แก้ไข" เพื่อบันทึกเลขมาตรแต่ละห้อง</p>

          {occRooms.length === 0 ? (
            <EmptyState icon="📝" title="ไม่มีห้องที่มีผู้พัก" description="เพิ่มผู้พักในห้องก่อนจึงจะบันทึกเลขมิเตอร์ได้" />
          ) : (
            <div className="border border-neutral-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="hidden md:table-header-group">
                  <tr className="bg-neutral-50/80">
                    {['ห้อง', 'ผู้พัก', 'ไฟก่อน', 'ไฟปัจจุบัน', 'ใช้จริง', 'น้ำก่อน', 'น้ำปัจจุบัน', 'ใช้จริง', 'จัดการ'].map(h => (
                      <th key={h} className="text-left px-3 py-3.5 text-xs font-semibold text-neutral-500 tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {occRooms.map(r => {
                    const ml = meterLocal[r.id] || { cur: { elec: '', water: '' }, prev: { elec: '', water: '' } }
                    const eu = (ml.cur.elec !== '' && ml.prev.elec !== '') ? Math.max(0, Number(ml.cur.elec) - Number(ml.prev.elec)) : '—'
                    const wu = (ml.cur.water !== '' && ml.prev.water !== '') ? Math.max(0, Number(ml.cur.water) - Number(ml.prev.water)) : '—'
                    return (
                      <tr key={r.id} className="block md:table-row p-4 md:p-0 bg-white md:bg-transparent border-b md:border-b-0 border-neutral-100 last:border-b-0 hover:bg-lime-50/30 transition-colors">
                        <td className="px-0 md:px-3 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">ห้อง</span>
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-lime-500 text-neutral-900 text-xs font-bold shadow-sm">{r.roomNumber || r.number}</span>
                        </td>
                        <td className="px-0 md:px-3 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">ผู้พัก</span>
                          <span className="text-neutral-700">{r.tenantName || '—'}</span>
                        </td>
                        <td className="px-0 md:px-3 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">ไฟก่อน</span>
                          <span className="text-neutral-700 font-mono text-xs">{ml.prev.elec || <span className="text-neutral-300">—</span>}</span>
                        </td>
                        <td className="px-0 md:px-3 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">ไฟปัจจุบัน</span>
                          <span className="text-neutral-700 font-mono text-xs">{ml.cur.elec || <span className="text-neutral-300">—</span>}</span>
                        </td>
                        <td className="px-0 md:px-3 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">ใช้จริง</span>
                          <span className="text-sm font-semibold text-teal-600">{eu}</span>
                        </td>
                        <td className="px-0 md:px-3 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">น้ำก่อน</span>
                          <span className="text-neutral-700 font-mono text-xs">{ml.prev.water || <span className="text-neutral-300">—</span>}</span>
                        </td>
                        <td className="px-0 md:px-3 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">น้ำปัจจุบัน</span>
                          <span className="text-neutral-700 font-mono text-xs">{ml.cur.water || <span className="text-neutral-300">—</span>}</span>
                        </td>
                        <td className="px-0 md:px-3 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">ใช้จริง</span>
                          <span className="text-sm font-semibold text-teal-600">{wu}</span>
                        </td>
                        <td className="px-0 md:px-3 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">จัดการ</span>
                          <button onClick={() => setEditRoom(r)}
                            className="h-8 px-3.5 rounded-lg text-xs font-medium bg-lime-50 text-lime-700 hover:bg-lime-100 transition-colors border border-lime-100">แก้ไข</button>
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

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-base shadow-sm border border-amber-100">⚡</div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-800">อัตราค่าไฟ</h3>
                <p className="text-2xl font-bold text-neutral-800 mt-0.5">{settings?.rateElec || 7} <span className="text-sm font-medium text-neutral-400">บาท/หน่วย</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center text-base shadow-sm border border-cyan-100">💧</div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-800">อัตราค่าน้ำ</h3>
                <p className="text-2xl font-bold text-neutral-800 mt-0.5">{settings?.rateWater || 20} <span className="text-sm font-medium text-neutral-400">บาท/หน่วย</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {editRoom && <MeterModal room={editRoom} onClose={() => setEditRoom(null)} />}
    </motion.div>
  )
}
