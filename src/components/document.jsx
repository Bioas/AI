import { motion } from 'framer-motion'
import { useState, useCallback, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { naturalSortRoomNumber } from '../lib/constants'
import DatePickerField from './ui/datepicker'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import EmptyState from './ui/empty-state'
import InvoicePreview from './InvoicePreview'
import ReceiptPreview from './ReceiptPreview'
import ReloadButton from './ui/reload-button'

export default function Document() {
  const { rooms, invoices, invMonth, setInvMonth, calcInv, saveInvoice, downloadPdf, sendPdfToLine, setViewInv, setModal, fetchAll } = useApp()
  const [activeTab, setActiveTab] = useState('invoice')
  const [sendingInv, setSendingInv] = useState(null)
  const [savingId, setSavingId] = useState(null)

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

  const handleView = (inv) => { setViewInv(inv); setModal(activeTab === 'invoice' ? 'invoice' : 'receipt') }

  const handleLine = useCallback((inv) => {
    setSendingInv(inv)
    setTimeout(() => {
      sendPdfToLine(inv)
      setTimeout(() => setSendingInv(null), 100)
    }, 100)
  }, [sendPdfToLine])

  const handleSave = async (room, inv) => {
    setSavingId(room.id)
    await saveInvoice(room, inv)
    setSavingId(null)
  }

  const displayRooms = useMemo(() => {
    const savedInvoices = invoices.filter(x => x.month === invMonth)
    const savedRoomIds = new Set(savedInvoices.map(x => x.roomId))

    const allRooms = rooms.filter(r => {
      const hasResident = r.residentId || r.tenantName
      const hasSavedInvoice = savedRoomIds.has(r.id)
      return hasResident || hasSavedInvoice
    })
    allRooms.sort(naturalSortRoomNumber)
    return allRooms
  }, [rooms, invoices, invMonth])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader title="เอกสาร" description="ออกใบแจ้งหนี้และใบเสร็จรับเงิน" />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('invoice')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'invoice'
              ? 'bg-lime-500 text-white shadow-md shadow-lime-200/50'
              : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'
          }`}
        >
          🧾 ใบแจ้งหนี้
        </button>
        <button
          onClick={() => setActiveTab('receipt')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'receipt'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200/50'
              : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'
          }`}
        >
          🧾 ใบเสร็จรับเงิน
        </button>
      </div>

      {/* Month Picker */}
      <div className="flex flex-row items-center gap-3 mb-6 sm:mb-8 bg-white rounded-2xl shadow-card border border-lime-100/40 px-4 sm:px-6 py-4">
        <label className="text-sm font-medium text-neutral-600 shrink-0">เดือน:</label>
        <div className="flex-1 sm:flex-none sm:w-44">
          <DatePickerField selected={invDate} onChange={handleMonthChange} showMonthPicker placeholder="เลือกเดือน" />
        </div>
        <ReloadButton onReload={handleReload} className="ml-auto" />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className={`w-2 h-2 rounded-full ${activeTab === 'invoice' ? 'bg-lime-400' : 'bg-emerald-400'}`} />
            <h3 className="text-sm font-semibold text-neutral-800">
              {activeTab === 'invoice' ? 'รายการใบแจ้งหนี้' : 'รายการใบเสร็จรับเงิน'}
            </h3>
          </div>
          {displayRooms.length === 0 ? (
            <EmptyState icon="🧾" title="ไม่มีข้อมูล" description="เพิ่มผู้พักในห้องก่อนจึงจะออกเอกสารได้" />
          ) : (
            <div className="border border-neutral-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="hidden md:table-header-group">
                  <tr className="bg-neutral-50/80">
                    {['ห้อง', 'ผู้พัก', 'ค่าเช่า', 'ค่าไฟ', 'ค่าน้ำ', 'รวม', 'สถานะ', 'จัดการ'].map(h => (
                      <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-neutral-500 tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {displayRooms.map(r => {
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
                          <span className="text-xs font-medium text-neutral-500 md:hidden">สถานะ</span>
                          {inv._saved ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">บันทึกแล้ว</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-100">ยังไม่บันทึก</span>
                          )}
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">จัดการ</span>
                          <div className="flex gap-1.5">
                            {!inv._saved && (
                              <button onClick={() => handleSave(r, inv)} disabled={savingId === r.id} className="h-8 px-3.5 rounded-lg text-xs font-medium bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors border border-sky-100 disabled:opacity-50">
                                {savingId === r.id ? '...' : 'บันทึก'}
                              </button>
                            )}
                            <button onClick={() => handleView(inv)} className={`h-8 px-3.5 rounded-lg text-xs font-medium transition-colors border ${
                              activeTab === 'invoice'
                                ? 'bg-lime-50 text-lime-700 hover:bg-lime-100 border-lime-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100'
                            }`}>ดู</button>
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
          {activeTab === 'invoice' ? <InvoicePreview inv={sendingInv} /> : <ReceiptPreview inv={sendingInv} />}
        </div>
      )}
    </motion.div>
  )
}
