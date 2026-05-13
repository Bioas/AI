import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { formatMonth } from '../lib/constants'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import EmptyState from './ui/empty-state'

export default function Invoice() {
  const { rooms, invMonth, setInvMonth, calcInv, downloadPdf, sendInvLine, setViewInv, setModal } = useApp()

  const handleView = (inv) => {
    setViewInv(inv)
    setModal('invoice')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader title="ใบแจ้งหนี้" description="ดูและจัดการใบแจ้งหนี้ประจำเดือน" />

      <div className="flex items-center gap-3 mb-6 bg-white rounded-xl border border-zinc-100 px-4 py-3 shadow-sm w-fit">
        <label className="text-sm font-medium text-zinc-700">เดือน:</label>
        <input
          type="month"
          value={invMonth}
          onChange={e => setInvMonth(e.target.value)}
          className="h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-900 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 transition-all"
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          {rooms.filter(r => r.tenantName).length === 0 ? (
            <EmptyState icon="🧾" title="ไม่มีข้อมูลใบแจ้งหนี้" description="เพิ่มผู้พักในห้องก่อนจึงจะสร้างใบแจ้งหนี้ได้" />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-zinc-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/50">
                    {['ห้อง', 'ผู้พัก', 'ค่าเช่า', 'ค่าไฟ', 'ค่าน้ำ', 'รวม', 'จัดการ'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rooms.filter(r => r.tenantName).map(r => {
                    const inv = calcInv(r, invMonth)
                    return (
                      <tr key={r.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 text-xs font-bold text-zinc-700">{inv.room}</span>
                        </td>
                        <td className="px-4 py-3 text-zinc-700">{inv.tenant}</td>
                        <td className="px-4 py-3 text-zinc-700 whitespace-nowrap">{inv.rent.toLocaleString()}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-zinc-700">{inv.elecCost.toLocaleString()}</span>
                          <span className="text-zinc-400 text-xs ml-1">({inv.elecUnits} หน่วย)</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-zinc-700">{inv.waterCost.toLocaleString()}</span>
                          <span className="text-zinc-400 text-xs ml-1">({inv.waterUnits} หน่วย)</span>
                        </td>
                        <td className="px-4 py-3 text-base font-bold text-zinc-900 whitespace-nowrap">{inv.total.toLocaleString()} บาท</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <button onClick={() => handleView(inv)}
                              className="h-8 px-3 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors">ดู</button>
                            <button onClick={() => downloadPdf(inv)}
                              className="h-8 px-3 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">PDF</button>
                            <button onClick={() => sendInvLine(inv)}
                              className="h-8 px-3 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors">LINE</button>
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
