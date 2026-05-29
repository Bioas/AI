import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
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
import Modal from './ui/modal'

function generateDocNumber(inv, invoices, rooms, docType) {
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
  const prefix = docType === 'receipt' ? 'REC' : 'INV'
  
  if (isDaily) {
    const ym = inv.month.slice(0, 7).replace('-', '')
    return `${prefix}-${roomRef}-${ym}-${running}`
  }
  
  return `${prefix}-${roomRef}-${inv.month.replace('-', '')}-${running}`
}

const DOC_TABS = [
  { key: 'invoice', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, title: 'ใบแจ้งหนี้', desc: 'ออกใบแจ้งหนี้ให้ผู้พัก',
    active: 'border-lime-500 bg-lime-50 shadow-lime-100', iconActive: 'bg-lime-500 text-white', textActive: 'text-lime-700' },
  { key: 'receipt', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, title: 'ใบเสร็จรับเงิน', desc: 'ออกใบเสร็จเมื่อชำระแล้ว',
    active: 'border-emerald-500 bg-emerald-50 shadow-emerald-100', iconActive: 'bg-emerald-500 text-white', textActive: 'text-emerald-700' },
]

const RENTAL_TABS = [
  { key: 'monthly', label: 'รายเดือน' },
  { key: 'daily', label: 'รายวัน' },
]

const StatusBadge = ({ paid, onClick }) => {
  const cls = paid ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'
  const label = paid ? 'ชำระแล้ว' : 'รอชำระ'
  if (onClick) {
    return (
      <button onClick={onClick}
        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-medium border whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity ${cls}`}>
        {label}
      </button>
    )
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-medium border whitespace-nowrap ${cls}`}>{label}</span>
  )
}

const formatTHDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const formatTHDateShort = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${d.getDate()} ${d.toLocaleDateString('th-TH', { month: 'short' })} ${(d.getFullYear() + 543).toString().slice(-2)}`
}

const BulkActions = ({ onLine, onSave, disabledLine, disabledSave, loading, className }) => (
  <div className={'flex gap-2 w-full sm:w-auto ' + className}>
    {onLine && (
      <Button size="sm" onClick={onLine} disabled={disabledLine} className="gap-1.5 bg-lime-500 hover:bg-lime-600 text-white flex-1">
        ส่ง LINE
      </Button>
    )}
    <Button size="sm" onClick={onSave} disabled={disabledSave} className="bg-lime-500 hover:bg-lime-600 text-white gap-1.5 flex-1">
      ชำระทั้งหมด
    </Button>
  </div>
)

const DAILY_HEADERS = ['ห้อง', 'ผู้พัก', 'ประเภทผู้พัก', 'ค่าเช่า', 'วันเช็คอิน', 'วันเช็คเอาท์', 'จำนวนคืน', 'ยอดรวม', 'สถานะ', 'จัดการ']
const MONTHLY_HEADERS = ['ห้อง', 'ผู้พัก', 'ค่าเช่า', 'ค่าไฟ', 'ค่าน้ำ', 'ยอดรวม', 'สถานะ', 'จัดการ']

export default function Billing() {
  const { rooms, invoices, invMonth, setInvMonth, calcInv, saveInvoice, downloadPdf, sendPdfToLine, setViewInv, setModal, fetchAll, toast, residents } = useApp()
  const [activeTab, setActiveTab] = useState('invoice')
  const [rentalTab, setRentalTab] = useState('monthly')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [savingIds, setSavingIds] = useState(new Set())
  const [confirmAction, setConfirmAction] = useState(null)
  const [cancelPaymentTarget, setCancelPaymentTarget] = useState(null)
  const [dailyDate, setDailyDate] = useState(new Date())
  const [sendingInv, setSendingInv] = useState(null)

  const period = rentalTab === 'daily' && dailyDate ? dailyDate.toISOString().split('T')[0] : invMonth

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
    const docNumber = generateDocNumber(inv, invoices, rooms, activeTab)
    setViewInv({ ...inv, docNumber, _isDaily: rentalTab === 'daily' })
    setModal(activeTab === 'invoice' ? 'invoice' : 'receipt')
  }

  const displayRooms = useMemo(() => {
    const p = period
    const savedInvoices = invoices.filter(x => x.month === p)
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

  const roomInvoices = useMemo(() => {
    return displayRooms.map(r => ({ room: r, inv: calcInv(r, period) }))
  }, [displayRooms, period, calcInv])

  const residentById = useMemo(() => {
    const map = {}
    for (const r of residents) map[r.id] = r
    return map
  }, [residents])

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

    setSavingIds(new Set(selectedIds))
    let successCount = 0
    let failCount = 0

    for (const roomId of selectedIds) {
      const room = displayRooms.find(r => r.id === roomId)
      if (!room) continue

      const inv = calcInv(room, period)
      if (inv.paid) {
        successCount++
        continue
      }

      try {
        if (inv._saved) {
          await fetch('/api/invoices', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: inv._id, paid: true }),
          })
        } else {
          await saveInvoice(room, inv, true)
        }
        successCount++
      } catch (e) {
        toast(`ชำระห้อง ${inv.room} ไม่สำเร็จ: ${e.message}`, true)
        failCount++
      }
    }

    setSavingIds(new Set())
    if (failCount === 0) {
      toast(`ชำระสำเร็จ ${successCount} ห้อง`)
    } else {
      toast(`ชำระสำเร็จ ${successCount} ห้อง, ล้มเหลว ${failCount} ห้อง`, true)
    }
  }

  const handleBulkLine = async () => {
    if (selectedIds.size === 0) {
      toast('กรุณาเลือกห้องอย่างน้อย 1 ห้อง', true)
      return
    }

    setBulkProcessing(true)
    let successCount = 0
    let failCount = 0

    for (const roomId of selectedIds) {
      const room = displayRooms.find(r => r.id === roomId)
      if (!room) continue

      const inv = calcInv(room, period)

      if (!inv._saved || activeTab === 'receipt') {
        try {
          await saveInvoice(room, inv, activeTab === 'receipt')
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

      const docNumber = generateDocNumber(inv, invoices, rooms, activeTab)
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
    return roomInvoices.reduce((sum, ri) => {
      if (selectedIds.has(ri.room.id)) return sum + (ri.inv.total || 0)
      return sum
    }, 0)
  }, [roomInvoices, selectedIds])

  const selectedPreview = useMemo(() => {
    return roomInvoices.filter(ri => selectedIds.has(ri.room.id)).map(ri => ({
      room: ri.inv.room, tenant: ri.inv.tenant, total: ri.inv.total, saved: ri.inv._saved
    }))
  }, [roomInvoices, selectedIds])

  const handleTogglePaid = async (room, inv) => {
    if (savingIds.size > 0) return
    if (inv.paid) {
      setCancelPaymentTarget({ room, inv })
      return
    }
    setSavingIds(new Set([room.id]))
    try {
      if (inv._saved) {
        await fetch('/api/invoices', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: inv._id, paid: true }),
        })
      } else {
        await saveInvoice(room, inv, true)
      }
      await fetchAll()
      toast(`ห้อง ${inv.room} เปลี่ยนเป็นชำระแล้ว`)
    } catch (e) {
      toast(`ห้อง ${inv.room} ไม่สำเร็จ: ${e.message}`, true)
    }
    setSavingIds(new Set())
  }

  const handleCancelPaymentConfirm = async () => {
    if (!cancelPaymentTarget) return
    const { room, inv } = cancelPaymentTarget
    setCancelPaymentTarget(null)
    setSavingIds(new Set([room.id]))
    try {
      await fetch('/api/invoices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inv._id }),
      })
      await fetchAll()
      toast(`ยกเลิกชำระห้อง ${inv.room} และลบเอกสารเรียบร้อย`)
    } catch (e) {
      toast(`ยกเลิกชำระห้อง ${inv.room} ไม่สำเร็จ: ${e.message}`, true)
    }
    setSavingIds(new Set())
  }

  const handleConfirm = () => {
    const action = confirmAction
    setConfirmAction(null)
    if (action === 'line') handleBulkLine()
    else if (action === 'save') handleBulkSave()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader title="ออกบิลห้องพัก" description="ออกใบแจ้งหนี้และใบเสร็จรับเงิน" />

      {/* Document Type Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {DOC_TABS.map(t => {
          const isActive = activeTab === t.key
          return (
            <button key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 sm:gap-4 p-3 sm:p-5 rounded-2xl border-2 transition-all text-left ${
                isActive ? t.active : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl shrink-0 ${
                isActive ? t.iconActive : 'bg-neutral-100'
              }`}>
                {t.icon}
              </div>
              <div className="min-w-0">
                <div className={`text-sm sm:text-base font-bold truncate ${isActive ? t.textActive : 'text-neutral-700'}`}>{t.title}</div>
                <div className="text-[10px] sm:text-xs text-neutral-400 mt-0.5 hidden sm:block">{t.desc}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Main Card with Tabs Inside */}
      <Card>
        <CardContent className="pt-0">
          {/* Rental Type Tabs */}
          <div className="flex items-center border-b border-neutral-100">
            {RENTAL_TABS.map(t => (
              <button key={t.key}
                onClick={() => { setRentalTab(t.key); setSelectedIds(new Set()) }}
                className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
                  rentalTab === t.key
                    ? 'border-lime-500 text-lime-600 bg-lime-50/50'
                    : 'border-transparent text-neutral-400 hover:text-neutral-600'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Month Picker + Actions */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 p-5 pb-0">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm font-medium text-neutral-600 whitespace-nowrap">{rentalTab === 'daily' ? 'วัน:' : 'เดือน:'}</span>
              <div className="flex-1 min-w-0">
                <DatePickerField
                  selected={rentalTab === 'daily' ? dailyDate : invDate}
                  onChange={rentalTab === 'daily' ? setDailyDate : handleMonthChange}
                  showMonthPicker={rentalTab !== 'daily'}
                  placeholder={rentalTab === 'daily' ? 'เลือกวัน' : 'เลือกเดือน'}
                />
              </div>
              <ReloadButton onReload={handleReload} />
            </div>
            <div className="flex gap-2 sm:ml-auto w-full sm:w-auto md:hidden">
              <BulkActions
                onLine={rentalTab === 'monthly' ? () => setConfirmAction('line') : null}
                onSave={() => setConfirmAction('save')}
                disabledLine={selectedIds.size === 0 || bulkProcessing}
                disabledSave={selectedIds.size === 0 || savingIds.size > 0}
              />
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
            <EmptyState icon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>} title="ไม่มีข้อมูล" description="เพิ่มผู้พักในห้องก่อนจึงจะออกเอกสารได้" />
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
                        {(rentalTab === 'daily' ? DAILY_HEADERS : MONTHLY_HEADERS).map(h => (
                          <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-neutral-500 tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {roomInvoices.map(({ room: r, inv }) => {
                          const res = residentById[r.residentId]
                          return (
                          <tr key={r.id} onClick={() => toggleSelect(r.id)} className="block md:table-row md:p-0 bg-white md:bg-transparent border-b md:border-b-0 border-neutral-100 last:border-b-0 cursor-pointer hover:bg-lime-50/30 active:bg-lime-100/40 transition-colors">
                            {/* Mobile card */}
                            <td colSpan={99} className="block md:hidden p-3 w-full">
                              <div className="space-y-1.5 w-full">
                                <div className="flex items-center gap-2.5">
                                  <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)}
                                    onClick={e => e.stopPropagation()}
                                    className="w-5 h-5 rounded border-neutral-300 text-lime-500 focus:ring-lime-400 shrink-0" />
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-lime-500 text-neutral-900 text-xs font-bold shadow-sm shrink-0">{inv.room}</span>
                                  <span className="font-medium text-neutral-800 truncate">{inv.tenant}</span>
                                </div>
                                {rentalTab === 'daily' ? (
                                  <div className="grid grid-cols-3 gap-1.5">
                                    <div className="bg-neutral-50 rounded-lg px-2.5 py-2">
                                      <div className="text-[10px] text-neutral-400">ค่าเช่า</div>
                                      <div className="font-semibold text-neutral-800">{inv.rent.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-neutral-50 rounded-lg px-2.5 py-2">
                                      <div className="text-[10px] text-neutral-400">เช็คอิน</div>
                                      <div className="font-semibold text-neutral-800 text-xs truncate">{formatTHDateShort(res?.moveInDate)}</div>
                                    </div>
                                    <div className="bg-neutral-50 rounded-lg px-2.5 py-2">
                                      <div className="text-[10px] text-neutral-400">เช็คเอาท์</div>
                                      <div className="font-semibold text-neutral-800 text-xs truncate">{formatTHDateShort(res?.moveOutDate)}</div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-3 gap-1.5">
                                    <div className="bg-amber-50/60 rounded-lg px-2.5 py-2 border border-amber-100/40">
                                      <div className="text-[10px] text-amber-500 font-medium">ค่าเช่า</div>
                                      <div className="font-semibold text-neutral-800">{inv.rent.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-amber-50/60 rounded-lg px-2.5 py-2 border border-amber-100/40">
                                      <div className="text-[10px] text-amber-500 font-medium">ค่าไฟ</div>
                                      <div className="font-semibold text-neutral-800">{inv.elecCost.toLocaleString()}<span className="text-[11px] text-neutral-400 ml-0.5">({inv.elecUnits}u)</span></div>
                                    </div>
                                    <div className="bg-amber-50/60 rounded-lg px-2.5 py-2 border border-amber-100/40">
                                      <div className="text-[10px] text-amber-500 font-medium">ค่าน้ำ</div>
                                      <div className="font-semibold text-neutral-800">{inv.waterCost.toLocaleString()}<span className="text-[11px] text-neutral-400 ml-0.5">({inv.waterUnits}u)</span></div>
                                    </div>
                                  </div>
                                )}
                                <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-neutral-100">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-neutral-900">{inv.total.toLocaleString()} บาท</span>
                                    {rentalTab === 'daily' && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[11px] font-semibold">{inv.days || 1} คืน</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <StatusBadge paid={inv.paid} onClick={() => handleTogglePaid(r, inv)} />
                                    <button onClick={e => { e.stopPropagation(); handleView(inv) }}
                                      className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors border ${
                                        activeTab === 'invoice'
                                          ? 'bg-lime-50 text-lime-700 hover:bg-lime-100 border-lime-100'
                                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100'
                                      }`}>ดู</button>
                                  </div>
                                </div>
                              </div>
                            </td>
                            {/* Desktop cells */}
                            <td className="hidden md:table-cell px-4 py-3.5 select-none">
                              <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} onClick={e => e.stopPropagation()} className="w-4 h-4 rounded border-neutral-300 text-lime-500 focus:ring-lime-400 pointer-events-none" />
                            </td>
                            <td className="hidden md:table-cell px-4 py-3.5">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-lime-500 text-neutral-900 text-xs font-bold shadow-sm">{inv.room}</span>
                            </td>
                            <td className="hidden md:table-cell px-4 py-3.5">
                              <span className="text-neutral-700 whitespace-nowrap">{inv.tenant}</span>
                            </td>
                            {rentalTab === 'daily' && (
                              <td className="hidden md:table-cell px-4 py-3.5">
                                <Badge variant={inv.tenantType === 'company' ? 'warning' : 'info'} className="whitespace-nowrap">
                                  {inv.tenantType === 'company' ? 'บริษัท' : 'บุคคลทั่วไป'}
                                </Badge>
                              </td>
                            )}
                            <td className="hidden md:table-cell px-4 py-3.5">
                              <span className="text-neutral-700 whitespace-nowrap">{inv.rent.toLocaleString()}</span>
                            </td>
                            {rentalTab === 'daily' ? (
                              <>
                                <td className="hidden md:table-cell px-4 py-3.5">
                                  <span className="text-neutral-700 whitespace-nowrap">{formatTHDate(res?.moveInDate)}</span>
                                </td>
                                <td className="hidden md:table-cell px-4 py-3.5">
                                  <span className="text-neutral-700 whitespace-nowrap">{formatTHDate(res?.moveOutDate)}</span>
                                </td>
                                <td className="hidden md:table-cell px-4 py-3.5">
                                  <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 text-xs font-semibold">{inv.days || 1} คืน</span>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="hidden md:table-cell px-4 py-3.5">
                                  <span className="text-neutral-700 whitespace-nowrap">{inv.elecCost.toLocaleString()}<span className="text-neutral-400 text-xs ml-1">({inv.elecUnits}u)</span></span>
                                </td>
                                <td className="hidden md:table-cell px-4 py-3.5">
                                  <span className="text-neutral-700 whitespace-nowrap">{inv.waterCost.toLocaleString()}<span className="text-neutral-400 text-xs ml-1">({inv.waterUnits}u)</span></span>
                                </td>
                              </>
                            )}
                            <td className="hidden md:table-cell px-4 py-3.5">
                              <span className="text-base font-bold text-neutral-800 whitespace-nowrap">{inv.total.toLocaleString()} บาท</span>
                            </td>
                            <td className="hidden md:table-cell px-4 py-3.5">
                              <StatusBadge paid={inv.paid} onClick={() => handleTogglePaid(r, inv)} />
                            </td>
                            <td className="hidden md:table-cell px-4 py-3.5">
                              <div className="flex gap-1.5">
                                <button onClick={e => { e.stopPropagation(); handleView(inv) }} className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors border ${
                                  activeTab === 'invoice'
                                    ? 'bg-lime-50 text-lime-700 hover:bg-lime-100 border-lime-100'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100'
                                }`}>ดู</button>
                              </div>
                            </td>
                        </tr>
                      )
                    })}
                    </tbody>
                  </table>
                </div>

                {/* Summary Footer */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-neutral-100">
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-neutral-500">รวมทั้งสิ้น <span className="font-semibold text-neutral-800">{selectedIds.size}</span> {activeTab === 'invoice' ? 'ใบแจ้งหนี้' : 'ใบเสร็จ'}</span>
                    <span className="text-lg font-bold text-lime-600">{selectedTotal.toLocaleString()} บาท</span>
                  </div>
                  <div className="flex gap-2">
                    <BulkActions
                      onLine={rentalTab === 'monthly' ? () => setConfirmAction('line') : null}
                      onSave={() => setConfirmAction('save')}
                      disabledLine={selectedIds.size === 0 || bulkProcessing}
                      disabledSave={selectedIds.size === 0 || savingIds.size > 0}
                    />
                  </div>
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

      {confirmAction && (
        <Modal open={true} onClose={() => setConfirmAction(null)} maxWidth="max-w-md">
          <div className="p-5">
            <h3 className="text-base font-bold text-neutral-800 mb-1">
              {confirmAction === 'line' ? 'ส่ง LINE' : 'ชำระทั้งหมด'}
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              ยืนยันการ{confirmAction === 'line' ? 'ส่ง LINE' : 'ชำระ'} {selectedPreview.length} รายการ?
            </p>
            <div className="max-h-52 overflow-y-auto space-y-1.5 mb-5">
              {selectedPreview.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 bg-neutral-50 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-neutral-800 shrink-0">ห้อง {item.room}</span>
                    <span className="text-[11px] text-neutral-500 truncate">{item.tenant || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.saved && <span className="text-[10px] text-green-500 font-medium">ชำระแล้ว</span>}
                    <span className="text-xs font-bold text-lime-600">{item.total.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmAction(null)}
                className="flex-1 h-9 rounded-xl text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors">
                ยกเลิก
              </button>
              <button onClick={handleConfirm}
                className="flex-1 h-9 rounded-xl text-xs font-medium text-white bg-lime-500 hover:bg-lime-600 transition-colors shadow-sm">
                {confirmAction === 'line' ? 'ยืนยันส่ง LINE' : 'ยืนยันชำระ'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {cancelPaymentTarget && (
        <Modal open={true} onClose={() => setCancelPaymentTarget(null)} maxWidth="max-w-md">
          <div className="p-5">
            <h3 className="text-base font-bold text-neutral-800 mb-1">ยกเลิกการชำระ</h3>
            <p className="text-sm text-neutral-600 mb-5">
              ต้องการยกเลิกชำระห้อง <strong>{cancelPaymentTarget.inv.room}</strong> ({cancelPaymentTarget.inv.tenant}) และลบเอกสารนี้ทิ้งใช่หรือไม่?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setCancelPaymentTarget(null)}
                className="flex-1 h-9 rounded-xl text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors">
                ไม่ใช่
              </button>
              <button onClick={handleCancelPaymentConfirm}
                className="flex-1 h-9 rounded-xl text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm">
                ใช่, ยกเลิกชำระ
              </button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  )
}
