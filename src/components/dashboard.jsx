import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { formatMonth } from '../lib/constants'

export default function Dashboard() {
  const { rooms, meters, calcInv } = useApp()
  const now = new Date()
  const cm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const { occ, pending, revenue, recentData } = useMemo(() => {
    const occ = rooms.filter(r => r.tenantName)
    let pending = 0
    let revenue = 0
    occ.forEach(r => {
      const hasMeter = meters.some(x => x.roomId === r.id && x.month === cm)
      if (!hasMeter) pending++
      else { const inv = calcInv(r, cm); revenue += inv.total }
    })
    const recentData = occ.map(r => {
      let la = null
      for (let y = now.getFullYear(); y >= now.getFullYear() - 1; y--) {
        for (let m = 11; m >= 0; m--) {
          const ym = `${y}-${String(m + 1).padStart(2, '0')}`
          if (meters.some(x => x.roomId === r.id && x.month === ym)) { la = ym; break }
        }
        if (la) break
      }
      return la ? { room: r, month: la, inv: calcInv(r, la) } : null
    }).filter(Boolean).sort((a, b) => b.month.localeCompare(a.month)).slice(0, 10)
    return { occ, pending, revenue, recentData }
  }, [rooms, meters, calcInv, cm, now])

  const stats = [
    ['🚪', rooms.length, 'ห้องทั้งหมด', 'from-blue-500 to-blue-400'],
    ['👥', occ.length, 'ผู้พักอาศัย', 'from-emerald-500 to-emerald-400'],
    ['📋', pending, 'รอเรียกเก็บ', 'from-amber-500 to-amber-400'],
    ['💰', revenue.toLocaleString(), 'รายได้ (บาท)', 'from-orange-500 to-orange-400'],
  ]

  return (
    <div className="animate-fadeInUp">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
          📊 แดชบอร์ด
        </h2>
        <span className="text-sm font-semibold text-slate-500 bg-white px-4 py-2 rounded-full shadow-sm">
          {now.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {stats.map(([icon, val, label, gradient], i) => (
          <div
            key={label}
            className="relative bg-white rounded-2xl p-6 md:p-7 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden animate-fadeInUp cursor-default"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${gradient} rounded-t-2xl`} />
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{label}</div>
            <div className="text-3xl font-extrabold text-slate-900">{val}</div>
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-5xl opacity-[0.07]">{icon}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300">
        <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2.5">📋 รายการล่าสุด</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-emerald-50/50">
                {['ห้อง', 'ผู้พัก', 'เดือน', 'ค่าเช่า', 'ค่าไฟ', 'ค่าน้ำ', 'รวม', 'สถานะ'].map(h => (
                  <th key={h} className="text-left px-4 py-3.5 font-bold text-slate-500 text-[11px] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentData.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="text-center py-14 text-slate-400">
                    <div className="text-4xl mb-4 animate-float">📋</div>
                    <p>ยังไม่มีข้อมูลใบแจ้งหนี้</p>
                  </div>
                </td></tr>
              ) : recentData.map((d, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <span className="inline-block bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm shadow-emerald-200">{d.inv.room}</span>
                  </td>
                  <td className="px-4 py-4 text-slate-900">{d.inv.tenant}</td>
                  <td className="px-4 py-4 text-slate-600">{formatMonth(d.month)}</td>
                  <td className="px-4 py-4 text-slate-900">{d.inv.rent.toLocaleString()}</td>
                  <td className="px-4 py-4 text-slate-900">{d.inv.elecCost.toLocaleString()}</td>
                  <td className="px-4 py-4 text-slate-900">{d.inv.waterCost.toLocaleString()}</td>
                  <td className="px-4 py-4 text-emerald-600 font-bold">{d.inv.total.toLocaleString()} ฿</td>
                  <td className="px-4 py-4">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700">รอชำระ</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
