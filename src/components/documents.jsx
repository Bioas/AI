import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { formatMonth, formatThaiDate, naturalSortRoomNumber, THAI_SHORT_MONTHS } from '../lib/constants'
import DatePickerField from './ui/datepicker'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import EmptyState from './ui/empty-state'
import InvoicePreview from './InvoicePreview'
import ReceiptPreview from './ReceiptPreview'
import ReloadButton from './ui/reload-button'

function formatDateTime(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  const day = d.getDate()
  const month = THAI_SHORT_MONTHS[d.getMonth() + 1]
  const year = d.getFullYear() + 543
  return `${day} ${month} ${year}`
}

function generateDocNumber(inv, invoices, rooms) {
  if (!inv.month) return '—'
  const room = rooms.find(r => r.id === inv.roomId)
  const roomRef = room?.roomCode || inv.roomNumber || '—'
  const year = inv.month.split('-')[0]
  const sameYearInvoices = invoices
    .filter(x => x.month && x.month.startsWith(year))
    .sort((a, b) => a.month.localeCompare(b.month))
  const runningIndex = sameYearInvoices.findIndex(x => x.id === inv.id) + 1
  const running = String(runningIndex).padStart(3, '0')
  return `INV-${roomRef}-${inv.month.replace('-', '')}-${running}`
}

export default function Documents() {
  const { rooms, invoices, invMonth, setInvMonth, downloadPdf, setViewInv, setModal, fetchAll } = useApp()
  const [activeTab, setActiveTab] = useState('invoice')
  const [actionId, setActionId] = useState(null)
  const [viewMode, setViewMode] = useState('month')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [searchQuery, setSearchQuery] = useState('')

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

  const handleDelete = async (inv) => {
    if (!window.confirm(`ต้องการลบเอกสารใบนี้ใช่หรือไม่?`)) return
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

  const savedInvoices = useMemo(() => {
    let filtered
    if (viewMode === 'year') {
      filtered = invoices.filter(x => x.month && x.month.startsWith(String(selectedYear)))
    } else {
      filtered = invoices.filter(x => x.month === invMonth)
    }
    const byTab = activeTab === 'invoice'
      ? filtered.filter(x => !x.receiptOnly)
      : filtered.filter(x => x.paid || x.receiptOnly)
    byTab.sort((a, b) => {
      const roomA = rooms.find(r => r.id === a.roomId)
      const roomB = rooms.find(r => r.id === b.roomId)
      const numA = roomA ? (roomA.roomNumber || roomA.number || '') : ''
      const numB = roomB ? (roomB.roomNumber || roomB.number || '') : ''
      return naturalSortRoomNumber(numA, numB)
    })
    return byTab
  }, [invoices, invMonth, activeTab, rooms, viewMode, selectedYear])

  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return savedInvoices
    const q = searchQuery.trim().toLowerCase()
    return savedInvoices.filter(inv => {
      const { number, tenant } = getRoomInfo(inv)
      const docNum = generateDocNumber(inv, invoices, rooms).toLowerCase()
      return (
        tenant.toLowerCase().includes(q) ||
        number.toLowerCase().includes(q) ||
        docNum.includes(q)
      )
    })
  }, [savedInvoices, searchQuery, invoices, rooms])

  const getRoomInfo = (inv) => {
    const room = rooms.find(r => r.id === inv.roomId)
    return {
      number: inv.roomNumber || room?.roomNumber || room?.number || '—',
      tenant: inv.tenantName || room?.tenantName || '—',
      rentalType: room?.rentalType || 'monthly',
    }
  }

  const toPreviewInv = (inv) => {
    const { number, tenant } = getRoomInfo(inv)
    const docNumber = generateDocNumber(inv, invoices, rooms)
    return {
      room: number,
      tenant,
      phone: inv.tenantPhone || '',
      userId: inv.tenantUserId || '',
      month: inv.month,
      rent: inv.rent || 0,
      elecUnits: inv.elecUnits || 0,
      elecCost: inv.elecCost || 0,
      waterUnits: inv.waterUnits || 0,
      waterCost: inv.waterCost || 0,
      prevElec: inv.prevElec || 0,
      curElec: inv.curElec || 0,
      prevWater: inv.prevWater || 0,
      curWater: inv.curWater || 0,
      total: inv.total || 0,
      rateElec: inv.rateElec,
      rateWater: inv.rateWater,
      docNumber,
      _saved: true,
      _id: inv.id,
    }
  }

  const periodLabel = viewMode === 'year' ? `ปี ${selectedYear + 543}` : formatMonth(invMonth)
  const displayInvoices = searchQuery.trim() ? filteredInvoices : savedInvoices

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader title="เอกสาร" description="ดูใบแจ้งหนี้และใบเสร็จรับเงินทั้งหมดที่บันทึกไว้" />

      {/* Controls Card */}
      <div className="bg-white rounded-2xl shadow-card border border-lime-100/40 p-4 sm:p-5 mb-6">
        {/* Row 1: Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            onClick={() => setActiveTab('invoice')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'invoice'
                ? 'bg-lime-500 text-white shadow-md shadow-lime-200/50'
                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            ใบแจ้งหนี้
          </button>
          <button
            onClick={() => setActiveTab('receipt')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'receipt'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200/50'
                : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            ใบเสร็จรับเงิน
          </button>

          <div className="w-px h-6 bg-neutral-200 mx-1 hidden sm:block" />

          {/* View Mode Toggle */}
          <div className="flex bg-neutral-50 rounded-xl border border-neutral-200 p-0.5">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-neutral-800 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              รายเดือน
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'year'
                  ? 'bg-white text-neutral-800 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              รายปี
            </button>
          </div>
        </div>

        {/* Row 2: Period Picker + Search + Reload */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Period Picker */}
          {viewMode === 'month' ? (
            <div className="flex items-center gap-2 flex-1 sm:flex-none sm:w-auto">
              <span className="text-sm text-neutral-500 shrink-0 hidden sm:inline">เดือน:</span>
              <DatePickerField selected={invDate} onChange={handleMonthChange} showMonthPicker placeholder="เลือกเดือน" />
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1 sm:flex-none sm:w-auto">
              <span className="text-sm text-neutral-500 shrink-0 hidden sm:inline">ปี:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="h-10 px-3 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 w-full sm:w-32"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                  <option key={y} value={y}>{y + 543}</option>
                ))}
              </select>
            </div>
          )}

          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อลูกค้า, ห้อง, เลขที่เอกสาร..."
              className="w-full h-10 pl-9 pr-3 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-neutral-100 text-neutral-400"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          <ReloadButton onReload={handleReload} />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className={`w-2 h-2 rounded-full ${activeTab === 'invoice' ? 'bg-lime-400' : 'bg-emerald-400'}`} />
            <h3 className="text-sm font-semibold text-neutral-800">
              {activeTab === 'invoice' ? 'ใบแจ้งหนี้ทั้งหมด' : 'ใบเสร็จรับเงินทั้งหมด'} — {periodLabel}
            </h3>
            {searchQuery && (
              <span className="text-xs text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded-full border border-neutral-100">
                พบ {displayInvoices.length} รายการ
              </span>
            )}
          </div>
          {displayInvoices.length === 0 ? (
            <EmptyState
              icon="📄"
              title={searchQuery ? 'ไม่พบผลลัพธ์' : 'ไม่มีเอกสารที่บันทึกไว้'}
              description={searchQuery
                ? `ไม่พบเอกสารที่ตรงกับ "${searchQuery}"`
                : `ยังไม่มี${activeTab === 'invoice' ? 'ใบแจ้งหนี้' : 'ใบเสร็จรับเงิน'}${viewMode === 'year' ? `ในปี ${selectedYear + 543}` : 'ในเดือนนี้'}`
              }
            />
          ) : (
            <div className="border border-neutral-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="hidden md:table-header-group">
                  <tr className="bg-neutral-50/80">
                    {['วันที่', 'เลขที่เอกสาร', 'ประเภท', 'ห้อง', 'ชื่อลูกค้า', 'รวม', 'จัดการ'].map(h => (
                      <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-neutral-500 tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {displayInvoices.map(inv => {
                    const { number, tenant, rentalType } = getRoomInfo(inv)
                    const isDaily = rentalType === 'daily' || rentalType === 'รายวัน'
                    return (
                      <tr key={inv.id} className="block md:table-row p-4 md:p-0 bg-white md:bg-transparent border-b md:border-b-0 border-neutral-100 last:border-b-0 hover:bg-lime-50/30 transition-colors">
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">วันที่</span>
                          <span className="text-neutral-700 whitespace-nowrap">{formatDateTime(inv.createdAt)}</span>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">เลขที่เอกสาร</span>
                          <span className="font-mono text-xs text-neutral-600 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-100">{generateDocNumber(inv, invoices, rooms)}</span>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">ประเภท</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${isDaily ? 'bg-sky-50 text-sky-600 border-sky-100' : 'bg-lime-50 text-lime-600 border-lime-100'}`}>
                            {isDaily ? 'รายวัน' : 'รายเดือน'}
                          </span>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">ห้อง</span>
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-lime-500 text-neutral-900 text-xs font-bold shadow-sm">{number}</span>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">ชื่อลูกค้า</span>
                          <span className="text-neutral-700">{tenant}</span>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">รวม</span>
                          <span className="text-base font-bold text-neutral-800 whitespace-nowrap">{(inv.total || 0).toLocaleString()} บาท</span>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">จัดการ</span>
                          <div className="flex gap-1.5">
                            <button onClick={() => handleView(toPreviewInv(inv))} className={`h-8 px-3.5 rounded-lg text-xs font-medium transition-colors border ${
                              activeTab === 'invoice'
                                ? 'bg-lime-50 text-lime-700 hover:bg-lime-100 border-lime-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100'
                            }`}>ดู</button>
                            <button onClick={() => downloadPdf(toPreviewInv(inv))} className="h-8 px-3.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-100">PDF</button>
                            <button onClick={() => handleDelete(inv)} disabled={actionId === inv.id} className="h-8 px-3.5 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border border-rose-100 disabled:opacity-50">
                              {actionId === inv.id ? '...' : 'ลบ'}
                            </button>
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
