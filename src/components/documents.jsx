import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { formatMonth, naturalSortRoomNumber, THAI_SHORT_MONTHS } from '../lib/constants'
import DatePickerField from './ui/datepicker'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import EmptyState from './ui/empty-state'
import InvoicePreview from './InvoicePreview'
import ReceiptPreview from './ReceiptPreview'
import ReloadButton from './ui/reload-button'
import Select from './ui/select'
import Modal from './ui/modal'

const HEADERS = ['วันที่', 'เลขที่เอกสาร', 'ประเภท', 'ห้อง', 'ชื่อลูกค้า', 'รวม', 'จัดการ']

const DOC_TABS = [
  { key: 'invoice', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, title: 'ใบแจ้งหนี้', desc: 'ดูใบแจ้งหนี้ที่บันทึกไว้', color: 'lime' },
  { key: 'receipt', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, title: 'ใบเสร็จรับเงิน', desc: 'ดูใบเสร็จรับเงินที่บันทึกไว้', color: 'emerald' },
]

const VIEW_MODES = [
  { key: 'month', label: 'เดือน' },
  { key: 'year', label: 'ปี' },
]

const ACTIVE_STYLES = {
  invoice: {
    bg: 'border-lime-500 bg-lime-50 shadow-md shadow-lime-100',
    icon: 'bg-lime-500 text-white',
    text: 'text-lime-700',
    dot: 'bg-lime-400',
    label: 'ใบแจ้งหนี้',
  },
  receipt: {
    bg: 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100',
    icon: 'bg-emerald-500 text-white',
    text: 'text-emerald-700',
    dot: 'bg-emerald-400',
    label: 'ใบเสร็จรับเงิน',
  },
}

const INACTIVE_TAB = 'border-neutral-200 bg-white hover:border-neutral-300'
const INACTIVE_ICON = 'bg-neutral-100'
const INACTIVE_TEXT = 'text-neutral-700'

const BUTTON_VIEW = 'bg-lime-50 text-lime-700 hover:bg-lime-100 border-lime-100'
const BUTTON_RECEIPT = 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100'
const BADGE_DAILY = 'bg-sky-50 text-sky-600 border-sky-100'
const BADGE_MONTHLY = 'bg-lime-50 text-lime-600 border-lime-100'

function formatDateTime(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  const day = d.getDate()
  const month = THAI_SHORT_MONTHS[d.getMonth() + 1]
  const year = d.getFullYear() + 543
  return `${day} ${month} ${year}`
}

function isNearMonthEnd(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  return d.getDate() >= lastDay - 2
}

function getRefYm(inv, rooms) {
  if (!inv?.month) return ''
  const room = rooms.find(r => r.id === inv.roomId)
  const isDaily = room?.rentalType === 'daily' || room?.rentalType === 'รายวัน'
  if (isDaily) {
    const checkOut = inv.moveOutDate || ''
    if (checkOut) return checkOut.slice(0, 7).replace('-', '')
  }
  return inv.month.replace('-', '')
}

function generateDocNumber(inv, invoices, rooms, docType) {
  if (!inv.month) return '—'
  const room = rooms.find(r => r.id === inv.roomId)
  const roomRef = room?.roomCode || inv.roomNumber || '—'
  const prefix = docType === 'receipt' ? 'REC' : 'INV'
  const refYm = getRefYm(inv, rooms)

  const sorted = [...invoices]
    .filter(x => x.month)
    .sort((a, b) => {
      const aRef = getRefYm(a, rooms)
      const bRef = getRefYm(b, rooms)
      if (aRef !== bRef) return aRef.localeCompare(bRef)
      return (a.id || '').localeCompare(b.id || '')
    })

  const idx = sorted.findIndex(x => x.id === inv.id)
  const running = String(Math.max(1, idx + 1)).padStart(3, '0')
  return `${prefix}-${roomRef}-${refYm}-${running}`
}

export default function Documents() {
  const { rooms, invoices, invMonth, setInvMonth, downloadPdf, setViewInv, setModal, fetchAll } = useApp()
  const [activeTab, setActiveTab] = useState('invoice')
  const [actionId, setActionId] = useState(null)
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState(null)
  const [viewMode, setViewMode] = useState('month')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const isInvoice = activeTab === 'invoice'
  const activeStyle = ACTIVE_STYLES[activeTab]
  const emptyLabel = isInvoice ? 'ใบแจ้งหนี้' : 'ใบเสร็จรับเงิน'

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

  const handleView = (inv) => { setViewInv(inv); setModal(isInvoice ? 'invoice' : 'receipt') }

  const handleDelete = (inv) => {
    setConfirmDeleteDoc(inv)
  }

  const handleConfirmDelete = async () => {
    if (!confirmDeleteDoc) return
    const inv = confirmDeleteDoc
    setConfirmDeleteDoc(null)
    setActionId(inv.id)
    try {
      const res = await fetch('/api/invoices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inv.id }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await fetchAll()
    } catch (e) {
      console.error('Delete invoice error:', e)
    }
    setActionId(null)
  }

  const roomById = useMemo(() => {
    const map = {}
    for (const r of rooms) map[r.id] = r
    return map
  }, [rooms])

  const yearOptions = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => {
      const y = new Date().getFullYear() - 2 + i
      return { value: y, label: String(y + 543) }
    }), []
  )

  const savedInvoices = useMemo(() => {
    let filtered
    if (viewMode === 'year') {
      filtered = invoices.filter(x => x.month && x.month.startsWith(String(selectedYear)))
    } else {
      filtered = invoices.filter(x => x.month && x.month.startsWith(invMonth))
    }
    return isInvoice ? filtered.filter(x => !x.receiptOnly) : filtered
  }, [invoices, invMonth, isInvoice, viewMode, selectedYear])

  const displayData = useMemo(() => {
    return savedInvoices.map(inv => {
      const room = roomById[inv.roomId]
      const number = room?.roomCode || inv.roomNumber || room?.roomNumber || room?.number || '—'
      const tenant = inv.tenantName || room?.tenantName || '—'
      const rentalType = room?.rentalType || 'monthly'
      const isDaily = rentalType === 'daily' || rentalType === 'รายวัน'
      const docNumber = generateDocNumber(inv, invoices, rooms, activeTab)
      return { inv, number, tenant, isDaily, docNumber }
    }).sort((a, b) => {
      const na = parseInt(a.docNumber.split('-').pop(), 10)
      const nb = parseInt(b.docNumber.split('-').pop(), 10)
      return na - nb
    })
  }, [savedInvoices, roomById, invoices, rooms, activeTab])

  const toPreviewInv = (inv, dt) => {
    const room = roomById[inv.roomId]
    const number = inv.roomNumber || room?.roomNumber || room?.number || '—'
    const tenant = inv.tenantName || room?.tenantName || '—'
    const docNumber = generateDocNumber(inv, invoices, rooms, dt)
    return {
      ...inv,
      room: number,
      tenant,
      docNumber,
      _saved: true,
      _id: inv.id,
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader title="เอกสาร" description="ดูใบแจ้งหนี้และใบเสร็จรับเงินทั้งหมดที่บันทึกไว้" />

      {/* Document Type Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {DOC_TABS.map(t => {
          const active = activeTab === t.key
          const s = ACTIVE_STYLES[t.key]
          return (
            <button key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 sm:gap-4 p-3 sm:p-5 rounded-2xl border-2 transition-all text-left ${active ? s.bg : INACTIVE_TAB}`}>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl shrink-0 ${active ? s.icon : INACTIVE_ICON}`}>
                {t.icon}
              </div>
              <div className="min-w-0">
                <div className={`text-sm sm:text-base font-bold truncate ${active ? s.text : INACTIVE_TEXT}`}>{t.title}</div>
                <div className="text-[10px] sm:text-xs text-neutral-400 mt-0.5 hidden sm:block">{t.desc}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* View Mode Toggle + Picker */}
      <div className="flex flex-row items-center gap-3 mb-6 sm:mb-8 bg-white rounded-2xl shadow-card border border-lime-100/40 px-4 sm:px-6 py-4">
        <div className="flex items-center bg-neutral-100 rounded-xl p-1 shrink-0">
          {VIEW_MODES.map(m => (
            <button key={m.key}
              onClick={() => setViewMode(m.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                viewMode === m.key
                  ? 'bg-lime-500 text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}>
              {m.label}
            </button>
          ))}
        </div>

        {viewMode === 'month' ? (
          <div className="flex-1 sm:flex-none sm:w-44">
            <DatePickerField selected={invDate} onChange={handleMonthChange} showMonthPicker placeholder="เลือกเดือน" />
          </div>
        ) : (
          <div className="flex-1 sm:flex-none sm:w-44">
            <Select value={selectedYear} onChange={setSelectedYear} options={yearOptions} placeholder="เลือกปี" />
          </div>
        )}
        <ReloadButton onReload={fetchAll} className="ml-auto" />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className={`w-2 h-2 rounded-full ${activeStyle.dot}`} />
            <h3 className="text-sm font-semibold text-neutral-800">
              {activeStyle.label}ทั้งหมด — {viewMode === 'year' ? `ปี ${selectedYear + 543}` : formatMonth(invMonth)}
            </h3>
          </div>
          {displayData.length === 0 ? (
            <EmptyState icon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>} title="ไม่มีเอกสารที่บันทึกไว้" description={`ยังไม่มี${emptyLabel}${viewMode === 'year' ? `ในปี ${selectedYear + 543}` : 'ในเดือนนี้'}`} />
          ) : (
            <div className="border border-neutral-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="hidden md:table-header-group">
                  <tr className="bg-neutral-50/80">
                    {HEADERS.map(h => (
                      <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-neutral-500 tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {displayData.map(({ inv, number, tenant, isDaily, docNumber }) => (
                    <tr key={inv.id} className="block md:table-row md:p-0 bg-white md:bg-transparent border-b md:border-b-0 border-neutral-100 last:border-b-0 hover:bg-lime-50/30 transition-colors">
                      {/* Mobile card */}
                      <td colSpan={99} className="block md:hidden p-3 w-full">
                        <div className="space-y-1.5 w-full">
                          <div className="flex items-center gap-2.5">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-lime-500 text-neutral-900 text-xs font-bold shadow-sm shrink-0">{number}</span>
                            <span className="font-medium text-neutral-800 truncate">{tenant}</span>
                            <span className={`ml-auto inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border shrink-0 ${isDaily ? BADGE_DAILY : BADGE_MONTHLY}`}>
                              {isDaily ? 'รายวัน' : 'รายเดือน'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="bg-violet-50/60 rounded-lg px-2.5 py-2 border border-violet-100/40">
                              <div className="text-[10px] text-violet-600 font-medium">เลขที่เอกสาร</div>
                              <div className="font-mono text-xs text-neutral-800 truncate">{docNumber}</div>
                            </div>
                            <div className="bg-sky-50/60 rounded-lg px-2.5 py-2 border border-sky-100/40">
                              <div className="text-[10px] text-sky-600 font-medium">วันที่</div>
                              <div className="font-semibold text-xs text-neutral-800">{formatDateTime(inv.createdAt)}</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-neutral-100">
                            <span className="text-sm font-bold text-neutral-900">{(inv.total || 0).toLocaleString()} บาท</span>
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleView(toPreviewInv(inv, activeTab))} className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors border ${isInvoice ? BUTTON_VIEW : BUTTON_RECEIPT}`}>ดู</button>
                              <button onClick={() => handleDelete(inv)} disabled={actionId === inv.id} className="h-8 px-3 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border border-rose-100 disabled:opacity-50">
                                {actionId === inv.id ? '...' : 'ลบ'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Desktop cells */}
                      <td className="hidden md:table-cell px-4 py-3.5">
                        <span className="text-neutral-700 whitespace-nowrap">{formatDateTime(inv.createdAt)}</span>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3.5">
                        <span className="font-mono text-xs text-neutral-600 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-100">{docNumber}</span>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${isDaily ? BADGE_DAILY : BADGE_MONTHLY}`}>
                          {isDaily ? 'รายวัน' : 'รายเดือน'}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3.5">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-lime-500 text-neutral-900 text-xs font-bold shadow-sm">{number}</span>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3.5">
                        <span className="text-neutral-700">{tenant}</span>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3.5">
                        <span className="text-base font-bold text-neutral-800 whitespace-nowrap">{(inv.total || 0).toLocaleString()} บาท</span>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3.5">
                        <div className="flex gap-1.5">
                          <button onClick={() => handleView(toPreviewInv(inv, activeTab))} className={`h-8 px-3.5 rounded-lg text-xs font-medium transition-colors border ${isInvoice ? BUTTON_VIEW : BUTTON_RECEIPT}`}>ดู</button>
                          <button onClick={() => handleDelete(inv)} disabled={actionId === inv.id} className="h-8 px-3.5 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border border-rose-100 disabled:opacity-50">
                            {actionId === inv.id ? '...' : 'ลบ'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      {confirmDeleteDoc && (
        <Modal open={true} onClose={() => setConfirmDeleteDoc(null)} maxWidth="max-w-md">
          <div className="p-5">
            <h3 className="text-base font-bold text-neutral-800 mb-1">ลบเอกสาร</h3>
            <p className="text-sm text-neutral-600 mb-5">ต้องการลบเอกสารใบนี้ใช่หรือไม่?</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDeleteDoc(null)}
                className="flex-1 h-9 rounded-xl text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors">
                ยกเลิก
              </button>
              <button onClick={handleConfirmDelete}
                className="flex-1 h-9 rounded-xl text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm">
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  )
}
