import { motion } from 'framer-motion'
import { useState, useCallback, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { naturalSortRoomNumber } from '../lib/constants'
import DatePickerField from './ui/datepicker'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import EmptyState from './ui/empty-state'
import InvoicePreview from './InvoicePreview'

export default function Invoice() {
  const { rooms, invMonth, setInvMonth, calcInv, downloadPdf, sendPdfToLine, setViewInv, setModal, fetchAll } = useApp()
  const [sendingInv, setSendingInv] = useState(null)

  const handleReload = async () => {
    await fetchAll()
  }

  const invDate = useMemo(() => {
    if (!invMonth) return null
    const [y, m] = invMonth.split('-').map(Number)
    return new Date(y, m - 1, 1)
  }, [invMonth])

  const handleMonthChange = (date) => {
    if (date) {
      setInvMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
    }
  }

  const handleView = (inv) => { setViewInv(inv); setModal('invoice') }

  const handleLine = useCallback((inv) => {
    setSendingInv(inv)
    setTimeout(() => {
      sendPdfToLine(inv)
      setTimeout(() => setSendingInv(null), 100)
    }, 100)
  }, [sendPdfToLine])

  const occRooms = useMemo(() => {
    const filtered = rooms.filter(r => r.residentId || r.tenantName)
    filtered.sort(naturalSortRoomNumber)
    return filtered
  }, [rooms])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader title="ใบแจ้งหนี้" description="ดูและจัดการใบแจ้งหนี้ประจำเดือน"
        onReload={handleReload} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 sm:mb-8 bg-white rounded-2xl shadow-card border border-lime-100/40 px-4 sm:px-6 py-4">
        <label className="text-sm font-medium text-neutral-600 shrink-0">เดือน:</label>
        <div className="w-full sm:w-44">
          <DatePickerField selected={invDate} onChange={handleMonthChange} showMonthPicker placeholder="เลือกเดือน" />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-2 h-2 rounded-full bg-lime-400" />
            <h3 className="text-sm font-semibold text-neutral-800">รายการใบแจ้งหนี้</h3>
          </div>
          {occRooms.length === 0 ? (
            <EmptyState icon="🧾" title="ไม่มีข้อมูล" description="เพิ่มผู้พักในห้องก่อนจึงจะสร้างใบแจ้งหนี้ได้" />
          ) : (
            <div className="border border-neutral-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="hidden md:table-header-group">
                  <tr className="bg-neutral-50/80">
                    {['ห้อง', 'ผู้พัก', 'ค่าเช่า', 'ค่าไฟ', 'ค่าน้ำ', 'รวม', 'จัดการ'].map(h => (
                      <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-neutral-500 tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {occRooms.map(r => {
                    const inv = calcInv(r, invMonth)
                    return (
                      <tr key={r.id} className="block md:table-row p-4 md:p-0 bg-white md:bg-transparent border-b md:border-b-0 border-neutral-100 last:border-b-0 hover:bg-lime-50/30 transition-colors">
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">ห้อง</span>
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-lime-500 text-neutral-900 text-xs font-bold shadow-sm">{inv.room}</span>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">ผู้พัก</span>
                          <span className="text-neutral-700">{inv.tenant}</span>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">ค่าเช่า</span>
                          <span className="text-neutral-700 whitespace-nowrap">{inv.rent.toLocaleString()}</span>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">ค่าไฟ</span>
                          <span className="text-neutral-700 whitespace-nowrap">{inv.elecCost.toLocaleString()}<span className="text-neutral-400 text-xs ml-1">({inv.elecUnits}u)</span></span>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">ค่าน้ำ</span>
                          <span className="text-neutral-700 whitespace-nowrap">{inv.waterCost.toLocaleString()}<span className="text-neutral-400 text-xs ml-1">({inv.waterUnits}u)</span></span>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">รวม</span>
                          <span className="text-base font-bold text-neutral-800 whitespace-nowrap">{inv.total.toLocaleString()} บาท</span>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">จัดการ</span>
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
