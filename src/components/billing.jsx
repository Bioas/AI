import { motion } from 'framer-motion'
import { useState, useCallback, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { naturalSortRoomNumber } from '../lib/constants'
import DatePickerField from './ui/datepicker'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import EmptyState from './ui/empty-state'
import Badge from './ui/badge'
import InvoicePreview from './InvoicePreview'
import ReceiptPreview from './ReceiptPreview'
import ReloadButton from './ui/reload-button'
import Button from './ui/button'

function generateDocNumber(inv, invoices, rooms) {
  if (!inv.month) return '—'
  const room = rooms.find(r => r.id === inv._id || r.roomNumber === inv.room || r.number === inv.room)
  const roomRef = room?.roomCode || inv.room || '—'
  const isDaily = room?.rentalType === 'daily' || room?.rentalType === 'รายวัน'
  
  const year = inv.month.split('-')[0]
  const sameYearInvoices = invoices
    .filter(x => x.month && x.month.startsWith(year))
    .sort((a, b) => a.month.localeCompare(b.month))
  const runningIndex = sameYearInvoices.findIndex(x => x.id === inv._id) + 1
  const running = String(Math.max(1, runningIndex)).padStart(3, '0')
  
  if (isDaily) {
    const ym = inv.month.slice(0, 7).replace('-', '')
    return `INV-${roomRef}-${ym}-${running}`
  }
  
  return `INV-${roomRef}-${inv.month.replace('-', '')}-${running}`
}

export default function Billing() {
  const { rooms, invoices, invMonth, setInvMonth, calcInv, saveInvoice, downloadPdf, sendPdfToLine, setViewInv, setModal, fetchAll, toast, residents } = useApp()
  const [activeTab, setActiveTab] = useState('invoice')
  const [rentalTab, setRentalTab] = useState('monthly')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [savingIds, setSavingIds] = useState(new Set())
  const [dailyDate, setDailyDate] = useState(new Date())
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

  const handleView = (inv) => {
    const docNumber = generateDocNumber(inv, invoices, rooms)
    setViewInv({ ...inv, docNumber })
    setModal(activeTab === 'invoice' ? 'invoice' : 'receipt')
  }

  const handleLine = useCallback((invWithDoc) => {
    setSendingInv(invWithDoc)
    setTimeout(() => {
      sendPdfToLine(invWithDoc)
      setTimeout(() => setSendingInv(null), 100)
    }, 100)
  }, [sendPdfToLine])

  const togglePaid = async (room, inv) => {
    const savedInv = invoices.find(x => x.roomId === room.id && x.month === invMonth)
    if (!savedInv) return
    const newPaid = !savedInv.paid
    try {
      const res = await fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: savedInv.id, paid: newPaid }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await fetchAll()
    } catch (e) {
      console.error('Toggle paid error:', e)
    }
  }

  const displayRooms = useMemo(() => {
    const period = rentalTab === 'daily' && dailyDate
      ? dailyDate.toISOString().split('T')[0]
      : invMonth
    const savedInvoices = invoices.filter(x => x.month === period)
    const savedRoomIds = new Set(savedInvoices.map(x => x.roomId))

    const allRooms = rooms.filter(r => {
      const hasResident = r.residentId || r.tenantName
      const hasSavedInvoice = savedRoomIds.has(r.id)
      const isRightType = rentalTab === 'daily'
        ? (r.rentalType === 'daily' || r.rentalType === 'รายวัน')
        : (r.rentalType !== 'daily' && r.rentalType !== 'รายวัน')
      return (hasResident || hasSavedInvoice) && isRightType
    })
    allRooms.sort(naturalSortRoomNumber)
    return allRooms
  }, [rooms, invoices, invMonth, dailyDate, rentalTab])

  const toggleSelectAll = () => {
    if (selectedIds.size === displayRooms.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(displayRooms.map(r => r.id)))
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkSave = async () => {
    if (selectedIds.size === 0) {
      toast('กรุณาเลือกห้องอย่างน้อย 1 ห้อง', true)
      return
    }

    const period = rentalTab === 'daily' && dailyDate
      ? dailyDate.toISOString().split('T')[0]
      : invMonth

    setSavingIds(new Set(selectedIds))
    let successCount = 0
    let failCount = 0

    for (const roomId of selectedIds) {
      const room = displayRooms.find(r => r.id === roomId)
      if (!room) continue

      const inv = calcInv(room, period)
      if (inv._saved) {
        successCount++
        continue
      }

      try {
        await saveInvoice(room, inv)
        successCount++
      } catch (e) {
        toast(`บันทึกห้อง ${inv.room} ไม่สำเร็จ: ${e.message}`, true)
        failCount++
      }
    }

    setSavingIds(new Set())
    if (failCount === 0) {
      toast(`บันทึกสำเร็จ ${successCount} ห้อง`)
    } else {
      toast(`บันทึกสำเร็จ ${successCount} ห้อง, ล้มเหลว ${failCount} ห้อง`, true)
    }
  }

  const handleBulkLine = async () => {
    if (selectedIds.size === 0) {
      toast('กรุณาเลือกห้องอย่างน้อย 1 ห้อง', true)
      return
    }

    const period = rentalTab === 'daily' && dailyDate
      ? dailyDate.toISOString().split('T')[0]
      : invMonth

    setBulkProcessing(true)
    let successCount = 0
    let failCount = 0

    for (const roomId of selectedIds) {
      const room = displayRooms.find(r => r.id === roomId)
      if (!room) continue

      const inv = calcInv(room, period)

      if (!inv._saved) {
        try {
          await saveInvoice(room, inv)
        } catch (e) {
          toast(`บันทึกห้อง ${inv.room} ไม่สำเร็จ: ${e.message}`, true)
          failCount++
          continue
        }
      }

      if (!inv.userId) {
        toast(`ผู้พักห้อง ${inv.room} ยังไม่ได้กรอก LINE User ID`, true)
        failCount++
        continue
      }

      const docNumber = generateDocNumber(inv, invoices, rooms)
      const invToSend = { ...inv, docNumber }
      setSendingInv(invToSend)

      try {
        const sent = await sendPdfToLine(invToSend)
        if (sent) successCount++
        else failCount++
      } catch (e) {
        toast(`ส่งห้อง ${inv.room} ไม่สำเร็จ: ${e.message}`, true)
        failCount++
      }

      await new Promise(res => setTimeout(res, 500))
    }

    setSendingInv(null)
    setBulkProcessing(false)
    setSelectedIds(new Set())

    if (failCount === 0) {
      toast(`ส่ง LINE สำเร็จ ${successCount} ห้อง`)
    } else {
      toast(`ส่งสำเร็จ ${successCount} ห้อง, ล้มเหลว ${failCount} ห้อง`, true)
    }
  }

  const selectedTotal = useMemo(() => {
    const period = rentalTab === 'daily' && dailyDate
      ? dailyDate.toISOString().split('T')[0]
      : invMonth
    return displayRooms.reduce((sum, r) => {
      if (selectedIds.has(r.id)) {
        const inv = calcInv(r, period)
        return sum + (inv.total || 0)
      }
      return sum
    }, 0)
  }, [displayRooms, invMonth, dailyDate, selectedIds, rentalTab, calcInv])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader title="ออกบิลห้องพัก" description="ออกใบแจ้งหนี้และใบเสร็จรับเงิน" />

      {/* Document Type Buttons - Large */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => setActiveTab('invoice')}
          className={`flex items-center gap-2 sm:gap-4 p-3 sm:p-5 rounded-2xl border-2 transition-all text-left ${
            activeTab === 'invoice'
              ? 'border-lime-500 bg-lime-50 shadow-md shadow-lime-100'
              : 'border-neutral-200 bg-white hover:border-neutral-300'
          }`}>
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl shrink-0 ${
            activeTab === 'invoice' ? 'bg-lime-500 text-white' : 'bg-neutral-100'
          }`}>
            🧾
          </div>
          <div className="min-w-0">
            <div className={`text-sm sm:text-base font-bold truncate ${activeTab === 'invoice' ? 'text-lime-700' : 'text-neutral-700'}`}>ใบแจ้งหนี้</div>
            <div className="text-[10px] sm:text-xs text-neutral-400 mt-0.5 hidden sm:block">ออกใบแจ้งหนี้ให้ผู้พัก</div>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('receipt')}
          className={`flex items-center gap-2 sm:gap-4 p-3 sm:p-5 rounded-2xl border-2 transition-all text-left ${
            activeTab === 'receipt'
              ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100'
              : 'border-neutral-200 bg-white hover:border-neutral-300'
          }`}>
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl shrink-0 ${
            activeTab === 'receipt' ? 'bg-emerald-500 text-white' : 'bg-neutral-100'
          }`}>
            📄
          </div>
          <div className="min-w-0">
            <div className={`text-sm sm:text-base font-bold truncate ${activeTab === 'receipt' ? 'text-emerald-700' : 'text-neutral-700'}`}>ใบเสร็จรับเงิน</div>
            <div className="text-[10px] sm:text-xs text-neutral-400 mt-0.5 hidden sm:block">ออกใบเสร็จเมื่อชำระแล้ว</div>
          </div>
        </button>
      </div>

      {/* Main Card with Tabs Inside */}
      <Card>
        <CardContent className="pt-0">
          {/* Rental Type Tabs */}
          <div className="flex items-center border-b border-neutral-100">
            <button
              onClick={() => { setRentalTab('monthly'); setSelectedIds(new Set()) }}
              className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
                rentalTab === 'monthly'
                  ? 'border-lime-500 text-lime-600 bg-lime-50/50'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}>
              รายเดือน
            </button>
            <button
              onClick={() => { setRentalTab('daily'); setSelectedIds(new Set()) }}
              className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
                rentalTab === 'daily'
                  ? 'border-lime-500 text-lime-600 bg-lime-50/50'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}>
              รายวัน
            </button>
          </div>

          {/* Month Picker + Actions */}
          <div className="flex flex-wrap items-center gap-3 p-5 pb-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-600">{rentalTab === 'daily' ? 'วัน:' : 'เดือน:'}</span>
              <div className="w-56">
                <DatePickerField
                  selected={rentalTab === 'daily' ? dailyDate : invDate}
                  onChange={rentalTab === 'daily' ? setDailyDate : handleMonthChange}
                  showMonthPicker={rentalTab !== 'daily'}
                  placeholder={rentalTab === 'daily' ? 'เลือกวัน' : 'เลือกเดือน'}
                />
              </div>
            </div>
            <ReloadButton onReload={handleReload} />
            <div className="flex gap-2 sm:ml-auto w-full sm:w-auto">
              <Button size="sm" onClick={handleBulkSave} disabled={selectedIds.size === 0 || savingIds.size > 0} className="gap-1.5 bg-lime-500 hover:bg-lime-600 text-white">
                + ออกบิลใหม่
              </Button>
              <Button size="sm" onClick={handleBulkLine} disabled={selectedIds.size === 0 || bulkProcessing} className="gap-1.5 bg-lime-500 hover:bg-lime-600 text-white">
                ส่ง LINE
              </Button>
            </div>
          </div>

          {/* Table Header */}
          <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
            <div className={`w-2 h-2 rounded-full ${activeTab === 'invoice' ? 'bg-lime-400' : 'bg-emerald-400'}`} />
            <h3 className="text-sm font-semibold text-neutral-800">
              {activeTab === 'invoice' ? 'รายการใบแจ้งหนี้' : 'รายการใบเสร็จรับเงิน'}
            </h3>
          </div>

          {displayRooms.length === 0 ? (
            <EmptyState icon="🧾" title="ไม่มีข้อมูล" description="เพิ่มผู้พักในห้องก่อนจึงจะออกเอกสารได้" />
          ) : (
            <>
              <div className="px-5 pb-5">
                <div className="border border-neutral-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="hidden md:table-header-group">
                      <tr className="bg-neutral-50/80">
                        <th className="text-left px-4 py-3.5 w-10">
                          <input type="checkbox" checked={selectedIds.size === displayRooms.length && displayRooms.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-neutral-300 text-lime-500 focus:ring-lime-400" />
                        </th>
                        {(rentalTab === 'daily'
                          ? ['ห้อง', 'ผู้พัก', 'ประเภทผู้พัก', 'ค่าเช่า', 'วันเช็คอิน', 'วันเช็คเอาท์', 'จำนวนคืน', 'ยอดรวม', 'สถานะ', 'จัดการ']
                          : ['ห้อง', 'ผู้พัก', 'ค่าเช่า', 'ค่าไฟ', 'ค่าน้ำ', 'ยอดรวม', 'สถานะ', 'จัดการ']
                        ).map(h => (
                          <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-neutral-500 tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {(() => {
                        const period = rentalTab === 'daily' && dailyDate
                          ? dailyDate.toISOString().split('T')[0]
                          : invMonth
                        return displayRooms.map(r => {
                          const inv = calcInv(r, period)
                          return (
                          <tr key={r.id} className="block md:table-row p-4 md:p-0 bg-white md:bg-transparent border-b md:border-b-0 border-neutral-100 last:border-b-0 hover:bg-lime-50/30 transition-colors">
                            <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                              <span className="text-xs font-medium text-neutral-500 md:hidden">เลือก</span>
                              <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} className="w-4 h-4 rounded border-neutral-300 text-lime-500 focus:ring-lime-400" />
                            </td>
                            <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                              <span className="text-xs font-medium text-neutral-500 md:hidden">ห้อง</span>
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-lime-500 text-neutral-900 text-xs font-bold shadow-sm">{inv.room}</span>
                            </td>
                            <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                              <span className="text-xs font-medium text-neutral-500 md:hidden">ผู้พัก</span>
                              <span className="text-neutral-700 whitespace-nowrap">{inv.tenant}</span>
                            </td>
                            {rentalTab === 'daily' && (
                              <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                                <span className="text-xs font-medium text-neutral-500 md:hidden">ประเภทผู้พัก</span>
                                <Badge variant={inv.tenantType === 'company' ? 'warning' : 'info'} className="whitespace-nowrap">
                                  {inv.tenantType === 'company' ? 'บริษัท' : 'บุคคลทั่วไป'}
                                </Badge>
                              </td>
                            )}
                            <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                              <span className="text-xs font-medium text-neutral-500 md:hidden">ค่าเช่า</span>
                              <span className="text-neutral-700 whitespace-nowrap">{inv.rent.toLocaleString()}</span>
                            </td>
                            {rentalTab === 'daily' ? (
                              <>
                                <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                                  <span className="text-xs font-medium text-neutral-500 md:hidden">วันเช็คอิน</span>
                                  <span className="text-neutral-700 whitespace-nowrap">
                                    {(() => {
                                      const res = residents.find(x => x.id === r.residentId)
                                      return res?.moveInDate ? new Date(res.moveInDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
                                    })()}
                                  </span>
                                </td>
                                <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                                  <span className="text-xs font-medium text-neutral-500 md:hidden">วันเช็คเอาท์</span>
                                  <span className="text-neutral-700 whitespace-nowrap">
                                    {(() => {
                                      const res = residents.find(x => x.id === r.residentId)
                                      return res?.moveOutDate ? new Date(res.moveOutDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
                                    })()}
                                  </span>
                                </td>
                                <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                                  <span className="text-xs font-medium text-neutral-500 md:hidden">จำนวนคืน</span>
                                  <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 text-xs font-semibold">{inv.days || 1} คืน</span>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                                  <span className="text-xs font-medium text-neutral-500 md:hidden">ค่าไฟ</span>
                                  <span className="text-neutral-700 whitespace-nowrap">{inv.elecCost.toLocaleString()}<span className="text-neutral-400 text-xs ml-1">({inv.elecUnits}u)</span></span>
                                </td>
                                <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                                  <span className="text-xs font-medium text-neutral-500 md:hidden">ค่าน้ำ</span>
                                  <span className="text-neutral-700 whitespace-nowrap">{inv.waterCost.toLocaleString()}<span className="text-neutral-400 text-xs ml-1">({inv.waterUnits}u)</span></span>
                                </td>
                              </>
                            )}
                            <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                              <span className="text-xs font-medium text-neutral-500 md:hidden">ยอดรวม</span>
                              <span className="text-base font-bold text-neutral-800 whitespace-nowrap">{inv.total.toLocaleString()} บาท</span>
                            </td>
                            <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                              <span className="text-xs font-medium text-neutral-500 md:hidden">สถานะ</span>
                              {inv._saved ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100 whitespace-nowrap">บันทึกแล้ว</span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-100 whitespace-nowrap">ยังไม่บันทึก</span>
                              )}
                            </td>
                            <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                              <span className="text-xs font-medium text-neutral-500 md:hidden">จัดการ</span>
                              <div className="flex gap-1.5">
                                <button onClick={() => handleView(inv)} className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors border ${
                                  activeTab === 'invoice'
                                    ? 'bg-lime-50 text-lime-700 hover:bg-lime-100 border-lime-100'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100'
                                }`}>ดู</button>

                              </div>
                            </td>
                          </tr>
                        )
                      })
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Summary Footer */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-neutral-100">
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-neutral-500">รวมทั้งสิ้น <span className="font-semibold text-neutral-800">{selectedIds.size}</span> {activeTab === 'invoice' ? 'ใบแจ้งหนี้' : 'ใบเสร็จ'}</span>
                    <span className="text-lg font-bold text-lime-600">{selectedTotal.toLocaleString()} บาท</span>
                  </div>
                  <Button size="sm" onClick={handleBulkSave} disabled={selectedIds.size === 0 || savingIds.size > 0} className="bg-lime-500 hover:bg-lime-600 text-white gap-1.5">
                    บันทึกทั้งหมด
                  </Button>
                </div>
              </div>
            </>
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
