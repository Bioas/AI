import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { formatMonth } from '../lib/constants'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import EmptyState from './ui/empty-state'
import Badge from './ui/badge'

const statsConfig = [
  { key: 'total', icon: '🚪', label: 'Total Rooms', gradient: 'from-zinc-900 to-zinc-700' },
  { key: 'occupied', icon: '👤', label: 'Occupied', gradient: 'from-emerald-600 to-emerald-500' },
  { key: 'pending', icon: '⏳', label: 'Pending Billing', gradient: 'from-amber-500 to-amber-400' },
  { key: 'revenue', icon: '💰', label: 'Revenue (THB)', gradient: 'from-blue-600 to-blue-500' },
]

export default function Dashboard() {
  const { rooms, meters, calcInv, loading } = useApp()
  const now = new Date()
  const cm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const { stats, recentData } = useMemo(() => {
    const occupied = rooms.filter(r => r.tenantName)
    let pendingCount = 0
    let revenue = 0
    occupied.forEach(r => {
      const hasMeter = meters.some(x => x.roomId === r.id && x.month === cm)
      if (!hasMeter) pendingCount++
      else { const inv = calcInv(r, cm); revenue += inv.total }
    })

    const recent = occupied.map(r => {
      let last = null
      for (let y = now.getFullYear(); y >= now.getFullYear() - 1; y--) {
        for (let m = 11; m >= 0; m--) {
          const ym = `${y}-${String(m + 1).padStart(2, '0')}`
          if (meters.some(x => x.roomId === r.id && x.month === ym)) { last = ym; break }
        }
        if (last) break
      }
      return last ? { room: r, month: last, inv: calcInv(r, last) } : null
    }).filter(Boolean).sort((a, b) => b.month.localeCompare(a.month)).slice(0, 10)

    return {
      stats: [
        rooms.length,
        occupied.length,
        pendingCount,
        revenue,
      ],
      recentData: recent,
    }
  }, [rooms, meters, calcInv, cm, now])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader
        title="Dashboard"
        description={now.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {statsConfig.map((cfg, i) => (
          <motion.div
            key={cfg.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
          >
            <Card hover>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{cfg.label}</span>
                  <span className="text-lg">{cfg.icon}</span>
                </div>
                <div className="text-2xl font-bold text-zinc-900">
                  {cfg.key === 'revenue' ? `${stats[i].toLocaleString()}` : stats[i]}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-zinc-900 mb-4">Recent Invoices</h3>
          {recentData.length === 0 ? (
            <EmptyState icon="🧾" title="No invoices yet" description="Invoices will appear here once you start billing tenants" />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-zinc-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/50">
                    {['Room', 'Tenant', 'Month', 'Rent', 'Electric', 'Water', 'Total', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentData.map((d, i) => (
                    <tr key={i} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 text-xs font-bold text-zinc-700">{d.inv.room}</span>
                      </td>
                      <td className="px-4 py-3 text-zinc-700">{d.inv.tenant}</td>
                      <td className="px-4 py-3 text-zinc-500">{formatMonth(d.month)}</td>
                      <td className="px-4 py-3 text-zinc-700">{d.inv.rent.toLocaleString()}</td>
                      <td className="px-4 py-3 text-zinc-700">{d.inv.elecCost.toLocaleString()}</td>
                      <td className="px-4 py-3 text-zinc-700">{d.inv.waterCost.toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold text-zinc-900">{d.inv.total.toLocaleString()}</td>
                      <td className="px-4 py-3"><Badge variant="warning">Pending</Badge></td>
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
