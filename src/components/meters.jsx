import { motion } from 'framer-motion'
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatMonth } from '../lib/constants'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import EmptyState from './ui/empty-state'
import MeterModal from './MeterModal'

export default function Meters() {
  const { rooms, settings, meterMonth, setMeterMonth, meterLocal } = useApp()
  const [editRoom, setEditRoom] = useState(null)
  const occRooms = rooms.filter(r => r.tenantName)

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader
        title="บันทึกมิเตอร์"
        description="บันทึกเลขมาตรไฟฟ้าและน้ำประปารายเดือน"
      />

      <div className="flex items-center gap-3 mb-6 bg-white rounded-xl border border-zinc-100 px-4 py-3 shadow-sm w-fit">
        <label className="text-sm font-medium text-zinc-700">เดือน:</label>
        <input
          type="month"
          value={meterMonth}
          onChange={e => setMeterMonth(e.target.value)}
          className="h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 transition-all"
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-zinc-900 mb-1">📊 ข้อมูลมิเตอร์ — {formatMonth(meterMonth)}</h3>
          <p className="text-xs text-zinc-400 mb-5">กดปุ่ม "แก้ไข" เพื่อบันทึกเลขมาตรแต่ละห้อง</p>

          {occRooms.length === 0 ? (
            <EmptyState icon="📝" title="ไม่มีห้องที่มีผู้พัก" description="เพิ่มผู้พักในห้องก่อนจึงจะบันทึกเลขมิเตอร์ได้" />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-zinc-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/50">
                    {['ห้อง', 'ผู้พัก', 'ไฟก่อนหน้า', 'ไฟปัจจุบัน', 'ใช้จริง', 'น้ำก่อนหน้า', 'น้ำปัจจุบัน', 'ใช้จริง', 'จัดการ'].map(h => (
                      <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {occRooms.map(r => {
                    const ml = meterLocal[r.id] || { cur: { elec: '', water: '' }, prev: { elec: '', water: '' } }
                    const eu = (ml.cur.elec !== '' && ml.prev.elec !== '') ? Math.max(0, Number(ml.cur.elec) - Number(ml.prev.elec)) : '—'
                    const wu = (ml.cur.water !== '' && ml.prev.water !== '') ? Math.max(0, Number(ml.cur.water) - Number(ml.prev.water)) : '—'
                    return (
                      <tr key={r.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 text-xs font-bold text-zinc-700">{r.number}</span>
                        </td>
                        <td className="px-3 py-3 text-zinc-700">{r.tenantName}</td>
                        <td className="px-3 py-3 text-zinc-700 font-mono text-xs">{ml.prev.elec || <span className="text-zinc-300">—</span>}</td>
                        <td className="px-3 py-3 text-zinc-700 font-mono text-xs">{ml.cur.elec || <span className="text-zinc-300">—</span>}</td>
                        <td className="px-3 py-3 text-sm font-semibold text-emerald-600">{eu}</td>
                        <td className="px-3 py-3 text-zinc-700 font-mono text-xs">{ml.prev.water || <span className="text-zinc-300">—</span>}</td>
                        <td className="px-3 py-3 text-zinc-700 font-mono text-xs">{ml.cur.water || <span className="text-zinc-300">—</span>}</td>
                        <td className="px-3 py-3 text-sm font-semibold text-emerald-600">{wu}</td>
                        <td className="px-3 py-3">
                          <button onClick={() => setEditRoom(r)}
                            className="h-8 px-3 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors">
                            แก้ไข
                          </button>
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

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-zinc-900 mb-1">⚡ อัตราค่าไฟ</h3>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{settings?.rateElec || 7} <span className="text-sm font-medium text-zinc-500">บาท/หน่วย</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-zinc-900 mb-1">💧 อัตราค่าน้ำ</h3>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{settings?.rateWater || 20} <span className="text-sm font-medium text-zinc-500">บาท/หน่วย</span></p>
          </CardContent>
        </Card>
      </div>

      {editRoom && <MeterModal room={editRoom} onClose={() => setEditRoom(null)} />}
    </motion.div>
  )
}
