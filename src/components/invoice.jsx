import { motion } from 'framer-motion'
import { useState, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import EmptyState from './ui/empty-state'
import InvoicePreview from './InvoicePreview'

export default function Invoice() {
  const { rooms, invMonth, setInvMonth, calcInv, downloadPdf, sendPdfToLine, setViewInv, setModal } = useApp()
  const [sendingInv, setSendingInv] = useState(null)

  const handleView = (inv) => { setViewInv(inv); setModal('invoice') }

  const handleLine = useCallback((inv) => {
    setSendingInv(inv)
    setTimeout(() => {
      sendPdfToLine(inv)
      setTimeout(() => setSendingInv(null), 100)
    }, 100)
  }, [sendPdfToLine])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader title="ใบแจ้งหนี้" description="ดูและจัดการใบแจ้งหนี้ประจำเดือน" />

      <div className="flex items-center gap-3 mb-8 bg-white rounded-2xl shadow-card border border-lime-100/40 px-6 py-4 w-fit">
        <label className="text-sm font-medium text-neutral-600">เดือน:</label>
        <input type="month" value={invMonth} onChange={e => setInvMonth(e.target.value)}
          className="h-9 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-800 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 transition-all" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-2 h-2 rounded-full bg-lime-400" />
            <h3 className="text-sm font-semibold text-neutral-800">รายการใบแจ้งหนี้</h3>
          </div>
          {rooms.filter(r => r.tenantName).length === 0 ? (
            <EmptyState icon="🧾" title="ไม่มีข้อมูล" description="เพิ่มผู้พักในห้องก่อนจึงจะสร้างใบแจ้งหนี้ได้" />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-neutral-100">
              <table className="w-full text-sm">
                <thead><tr className="bg-neutral-50/80">
                  {['ห้อง', 'ผู้พัก', 'ค่าเช่า', 'ค่าไฟ', 'ค่าน้ำ', 'รวม', 'จัดการ'].map(h => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-neutral-500 tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-neutral-50">
                  {rooms.filter(r => r.tenantName).map(r => {
                    const inv = calcInv(r, invMonth)
                    return (
                      <tr key={r.id} className="hover:bg-lime-50/30 transition-colors">
                        <td className="px-4 py-3.5"><span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-lime-500 text-neutral-900 text-xs font-bold shadow-sm">{inv.room}</span></td>
                        <td className="px-4 py-3.5 text-neutral-700">{inv.tenant}</td>
                        <td className="px-4 py-3.5 text-neutral-700 whitespace-nowrap">{inv.rent.toLocaleString()}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap"><span className="text-neutral-700">{inv.elecCost.toLocaleString()}</span><span className="text-neutral-400 text-xs ml-1">({inv.elecUnits}u)</span></td>
                        <td className="px-4 py-3.5 whitespace-nowrap"><span className="text-neutral-700">{inv.waterCost.toLocaleString()}</span><span className="text-neutral-400 text-xs ml-1">({inv.waterUnits}u)</span></td>
                        <td className="px-4 py-3.5 text-base font-bold text-neutral-800 whitespace-nowrap">{inv.total.toLocaleString()} บาท</td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1.5">
                            <button onClick={() => handleView(inv)} className="h-8 px-3.5 rounded-lg text-xs font-medium bg-lime-50 text-lime-700 hover:bg-lime-100 transition-colors border border-lime-100">ดู</button>
                            <button onClick={() => downloadPdf(inv)} className="h-8 px-3.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-100">PDF</button>
                            <button onClick={() => handleLine(inv)} className="h-8 px-3.5 rounded-lg text-xs font-medium bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors border border-teal-100">LINE</button>
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

      {sendingInv && (
        <div className="fixed left-0 top-0 -z-50 opacity-0 pointer-events-none" aria-hidden="true">
          <InvoicePreview inv={sendingInv} />
        </div>
      )}
    </motion.div>
  )
}
