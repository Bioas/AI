import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { formatMonth } from '../lib/constants'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import EmptyState from './ui/empty-state'
import Button from './ui/button'
import Input from './ui/input'

export default function Meters() {
  const { rooms, settings, meterMonth, setMeterMonth, meterLocal, setMeterField, saveAllMeters, saveSettingsDelayed } = useApp()
  const occRooms = rooms.filter(r => r.tenantName)

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader
        title="Meter Readings"
        description="Record electricity and water meter readings"
        action={<Button onClick={saveAllMeters} icon="💾">Save All</Button>}
      />

      <div className="flex items-center gap-3 mb-6 bg-white rounded-xl border border-zinc-100 px-4 py-3 shadow-sm w-fit">
        <label className="text-sm font-medium text-zinc-700">Month:</label>
        <input
          type="month"
          value={meterMonth}
          onChange={e => setMeterMonth(e.target.value)}
          className="h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 transition-all"
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-zinc-900 mb-1">Readings — {formatMonth(meterMonth)}</h3>
          <p className="text-xs text-zinc-400 mb-5">Update previous readings (yellow) and current readings, then tap "Save All"</p>

          {occRooms.length === 0 ? (
            <EmptyState icon="📝" title="No occupied rooms" description="Add tenants to rooms before recording meter readings" />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-zinc-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/50">
                    {['Room', 'Tenant', 'Prev Elec', 'Curr Elec', 'Used', 'Prev Water', 'Curr Water', 'Used'].map(h => (
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
                        <td className="px-3 py-3">
                          <input type="number" value={ml.prev.elec} onChange={e => setMeterField(r.id, 'prev', 'elec', e.target.value)}
                            className="w-20 h-8 px-2 bg-amber-50 border border-amber-200 rounded-lg text-center text-xs text-zinc-900 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all" />
                        </td>
                        <td className="px-3 py-3">
                          <input type="number" value={ml.cur.elec} onChange={e => setMeterField(r.id, 'cur', 'elec', e.target.value)}
                            className="w-20 h-8 px-2 bg-white border border-zinc-200 rounded-lg text-center text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 transition-all" />
                        </td>
                        <td className="px-3 py-3 text-sm font-semibold text-emerald-600">{eu}</td>
                        <td className="px-3 py-3">
                          <input type="number" value={ml.prev.water} onChange={e => setMeterField(r.id, 'prev', 'water', e.target.value)}
                            className="w-20 h-8 px-2 bg-amber-50 border border-amber-200 rounded-lg text-center text-xs text-zinc-900 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all" />
                        </td>
                        <td className="px-3 py-3">
                          <input type="number" value={ml.cur.water} onChange={e => setMeterField(r.id, 'cur', 'water', e.target.value)}
                            className="w-20 h-8 px-2 bg-white border border-zinc-200 rounded-lg text-center text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 transition-all" />
                        </td>
                        <td className="px-3 py-3 text-sm font-semibold text-emerald-600">{wu}</td>
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
            <h3 className="text-sm font-semibold text-zinc-900 mb-4">⚡ Electricity Rate</h3>
            <div className="flex items-center gap-3">
              <input type="number" value={settings.rateElec} onChange={e => saveSettingsDelayed('rateElec', parseFloat(e.target.value) || 7)}
                className="w-24 h-10 px-3 bg-white border border-zinc-200 rounded-xl text-center text-sm font-bold text-zinc-900 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 transition-all" />
              <span className="text-sm text-zinc-500">THB/unit</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4">💧 Water Rate</h3>
            <div className="flex items-center gap-3">
              <input type="number" value={settings.rateWater} onChange={e => saveSettingsDelayed('rateWater', parseFloat(e.target.value) || 20)}
                className="w-24 h-10 px-3 bg-white border border-zinc-200 rounded-xl text-center text-sm font-bold text-zinc-900 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 transition-all" />
              <span className="text-sm text-zinc-500">THB/unit</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
