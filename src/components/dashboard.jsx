import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { formatMonth } from '../lib/constants'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import EmptyState from './ui/empty-state'
import Badge from './ui/badge'

const statsConfig = [
  { key: 'total', icon: '🚪', label: 'ห้องทั้งหมด', color: 'text-lime-700', bg: 'bg-lime-50' },
  { key: 'occupied', icon: '👤', label: 'มีผู้พักอาศัย', color: 'text-teal-600', bg: 'bg-teal-50' },
  { key: 'pending', icon: '⏳', label: 'รอเรียกเก็บ', color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'revenue', icon: '💰', label: 'รายได้ (บาท)', color: 'text-lime-600', bg: 'bg-lime-50' },
]

export default function Dashboard() {
  const { rooms, meters, calcInv } = useApp()
  const now = new Date()
  const cm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const { stats, recentData } = useMemo(() => {
    const occupied = rooms.filter(r => r.tenantName)
    let pendingCount = 0, revenue = 0
    occupied.forEach(r => {
      const hasMeter = meters.some(x => x.roomId === r.id && x.month === cm)
      if (!hasMeter) pendingCount++
      else { const inv = calcInv(r, cm); revenue += inv.total }
    })
    const recent = occupied.map(r => {
      let last = null
      for (let y = now.getFullYear(); y >= now.getFullYear() - 1; y--)
        for (let m = 11; m >= 0; m--) {
          const ym = `${y}-${String(m + 1).padStart(2, '0')}`
          if (meters.some(x => x.roomId === r.id && x.month === ym)) { last = ym; break }
        }
      return last ? { room: r, month: last, inv: calcInv(r, last) } : null
    }).filter(Boolean).sort((a, b) => b.month.localeCompare(a.month)).slice(0, 10)
    return { stats: [rooms.length, occupied.length, pendingCount, revenue], recentData: recent }
  }, [rooms, meters, calcInv, cm, now])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader title="แดชบอร์ด" description={now.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {statsConfig.map((cfg, i) => (
          <motion.div key={cfg.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.07 }}>
            <Card hover delay={i * 0.07}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center text-lg shadow-sm border border-lime-100/30`}>{cfg.icon}</div>
                  <span className={`text-2xl font-bold ${cfg.color}`}>{cfg.key === 'revenue' ? stats[i].toLocaleString() : stats[i]}</span>
                </div>
                <div className="text-xs font-medium text-neutral-400 uppercase tracking-wider">{cfg.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-2 h-2 rounded-full bg-lime-400" />
            <h3 className="text-sm font-semibold text-neutral-800">ใบแจ้งหนี้ล่าสุด</h3>
          </div>
          {recentData.length === 0 ? (
            <EmptyState icon="🧾" title="ยังไม่มีใบแจ้งหนี้" description="ใบแจ้งหนี้จะแสดงที่นี่เมื่อคุณเริ่มบันทึกข้อมูล" />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-neutral-100">
              <table className="w-full text-sm">
                <thead><tr className="bg-neutral-50/80">
                  {['ห้อง', 'ผู้พัก', 'เดือน', 'ค่าเช่า', 'ค่าไฟ', 'ค่าน้ำ', 'รวม', 'สถานะ'].map(h => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-neutral-500 tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-neutral-50">
                  {recentData.map((d, i) => (
                    <tr key={i} className="hover:bg-lime-50/30 transition-colors">
                      <td className="px-4 py-3.5"><span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-lime-500 text-neutral-900 text-xs font-bold shadow-sm">{d.inv.room}</span></td>
                      <td className="px-4 py-3.5 text-neutral-700">{d.inv.tenant}</td>
                      <td className="px-4 py-3.5 text-neutral-500">{formatMonth(d.month)}</td>
                      <td className="px-4 py-3.5 text-neutral-700 whitespace-nowrap">{d.inv.rent.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-neutral-700 whitespace-nowrap">{d.inv.elecCost.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-neutral-700 whitespace-nowrap">{d.inv.waterCost.toLocaleString()}</td>
                      <td className="px-4 py-3.5 font-semibold text-neutral-800 whitespace-nowrap">{d.inv.total.toLocaleString()}</td>
                      <td className="px-4 py-3.5"><Badge variant="warning">รอชำระ</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
