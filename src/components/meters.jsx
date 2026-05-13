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
      <PageHeader title="บันทึกมิเตอร์" description="บันทึกเลขมาตรไฟฟ้าและน้ำประปารายเดือน" />

      <div className="flex items-center gap-3 mb-6 bg-white rounded-2xl shadow-card border border-blue-100/40 px-5 py-3 w-fit">
        <label className="text-sm font-medium text-slate-600">เดือน:</label>
        <input type="month" value={meterMonth} onChange={e => setMeterMonth(e.target.value)}
          className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <h3 className="text-sm font-semibold text-slate-800">ข้อมูลมิเตอร์ — {formatMonth(meterMonth)}</h3>
          </div>
          <p className="text-xs text-slate-400 mb-5 ml-4">กดปุ่ม "แก้ไข" เพื่อบันทึกเลขมาตรแต่ละห้อง</p>

          {occRooms.length === 0 ? (
            <EmptyState icon="📝" title="ไม่มีห้องที่มีผู้พัก" description="เพิ่มผู้พักในห้องก่อนจึงจะบันทึกเลขมิเตอร์ได้" />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80">
                    {['ห้อง', 'ผู้พัก', 'ไฟก่อนหน้า', 'ไฟปัจจุบัน', 'ใช้จริง', 'น้ำก่อนหน้า', 'น้ำปัจจุบัน', 'ใช้จริง', 'จัดการ'].map(h => (
                      <th key={h} className="text-left px-3 py-3.5 text-xs font-semibold text-slate-500 tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {occRooms.map(r => {
                    const ml = meterLocal[r.id] || { cur: { elec: '', water: '' }, prev: { elec: '', water: '' } }
                    const eu = (ml.cur.elec !== '' && ml.prev.elec !== '') ? Math.max(0, Number(ml.cur.elec) - Number(ml.prev.elec)) : '—'
                    const wu = (ml.cur.water !== '' && ml.prev.water !== '') ? Math.max(0, Number(ml.cur.water) - Number(ml.prev.water)) : '—'
                    return (
                      <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-3 py-3.5"><span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-bold shadow-sm">{r.number}</span></td>
                        <td className="px-3 py-3.5 text-slate-700">{r.tenantName}</td>
                        <td className="px-3 py-3.5 text-slate-700 font-mono text-xs">{ml.prev.elec || <span className="text-slate-300">—</span>}</td>
                        <td className="px-3 py-3.5 text-slate-700 font-mono text-xs">{ml.cur.elec || <span className="text-slate-300">—</span>}</td>
                        <td className="px-3 py-3.5 text-sm font-semibold text-teal-600">{eu}</td>
                        <td className="px-3 py-3.5 text-slate-700 font-mono text-xs">{ml.prev.water || <span className="text-slate-300">—</span>}</td>
                        <td className="px-3 py-3.5 text-slate-700 font-mono text-xs">{ml.cur.water || <span className="text-slate-300">—</span>}</td>
                        <td className="px-3 py-3.5 text-sm font-semibold text-teal-600">{wu}</td>
                        <td className="px-3 py-3.5">
                          <button onClick={() => setEditRoom(r)}
                            className="h-8 px-3.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-100">แก้ไข</button>
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

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-base shadow-sm border border-amber-100">⚡</div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">อัตราค่าไฟ</h3>
                <p className="text-2xl font-bold text-slate-800 mt-0.5">{settings?.rateElec || 7} <span className="text-sm font-medium text-slate-400">บาท/หน่วย</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center text-base shadow-sm border border-cyan-100">💧</div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">อัตราค่าน้ำ</h3>
                <p className="text-2xl font-bold text-slate-800 mt-0.5">{settings?.rateWater || 20} <span className="text-sm font-medium text-slate-400">บาท/หน่วย</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {editRoom && <MeterModal room={editRoom} onClose={() => setEditRoom(null)} />}
    </motion.div>
  )
}
