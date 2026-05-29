import { useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatMonth } from '../lib/constants'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import Badge from './ui/badge'
import Button from './ui/button'
import ReloadButton from './ui/reload-button'

function useBangkokNow() {
  return useMemo(() => {
    const now = new Date()
    const todayBkk = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    const bkkHour = Number(now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit' }))
    return { now, todayBkk, bkkHour }
  }, [])
}

function isCurrentDailyResident(res, todayBkk, bkkHour) {
  const inBkk = new Date(res.moveInDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
  const outBkk = new Date(res.moveOutDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
  if (outBkk < todayBkk) return false
  if (outBkk === todayBkk && bkkHour >= 12) return false
  if (inBkk > todayBkk) return false
  if (inBkk === todayBkk && bkkHour < 14) return false
  return true
}

function isTodayCheckin(res, todayBkk, bkkHour) {
  const inBkk = new Date(res.moveInDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
  return inBkk === todayBkk && bkkHour >= 14
}

function isTodayCheckout(res, todayBkk, bkkHour) {
  const outBkk = new Date(res.moveOutDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
  return outBkk === todayBkk && bkkHour >= 12
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemAnim = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { rooms, residents, meters, invoices, settings, calcInv, fetchAll } = useApp()
  const { now, todayBkk, bkkHour } = useBangkokNow()

  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastMonth = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`

  const stats = useMemo(() => {
    let occupied = 0
    let vacant = 0
    let checkingIn = 0
    let checkingOut = 0
    let dailyActive = 0
    let pendingMeter = 0
    let pendingBill = 0
    let thisMonthRevenue = 0
    let lastMonthRevenue = 0

    for (const r of rooms) {
      const isDaily = r.rentalType === 'daily' || r.rentalType === 'รายวัน'
      const isMonthly = r.rentalType === 'monthly' || (!r.rentalType)

      if (isDaily) {
        const roomNum = r.roomNumber || r.number
        const dailyResidents = residents.filter(x =>
          (x.roomId === r.id || (!x.roomId && x.roomNumber === roomNum)) &&
          (x.rentalType === 'daily' || x.rentalType === 'รายวัน')
        )
        let hasCurrent = false
        for (const res of dailyResidents) {
          const inBkk = new Date(res.moveInDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
          const outBkk = new Date(res.moveOutDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
          if (outBkk === todayBkk && bkkHour >= 12) checkingOut++
          if (inBkk === todayBkk && bkkHour < 14) { checkingIn++; continue }
          if (isCurrentDailyResident(res, todayBkk, bkkHour)) {
            hasCurrent = true
            dailyActive++
            if (inBkk === todayBkk && bkkHour >= 14) checkingIn++
          }
        }
        if (hasCurrent) { occupied++ } else { vacant++ }
      } else if (isMonthly) {
        if (r.residentId || r.tenantName) {
          occupied++
        } else {
          vacant++
        }
      }
    }

    for (const r of rooms) {
      if (!r.residentId && !r.tenantName) continue
      const hasMeter = meters.some(x => x.roomId === r.id && x.month === thisMonth)
      if (!hasMeter) pendingMeter++
      const inv = calcInv(r, thisMonth)
      thisMonthRevenue += inv.total
      const lastInv = calcInv(r, lastMonth)
      lastMonthRevenue += lastInv.total
    }

    pendingBill = invoices.filter(x =>
      x.month === thisMonth && !x.paid
    ).length

    return {
      total: rooms.length,
      occupied,
      vacant,
      dailyActive,
      checkingIn,
      checkingOut,
      pendingMeter,
      pendingBill,
      thisMonthRevenue,
      lastMonthRevenue,
    }
  }, [rooms, residents, meters, invoices, calcInv, thisMonth, lastMonth, todayBkk, bkkHour])

  const recentInvoices = useMemo(() => {
    const sorted = [...invoices].sort((a, b) => b.month.localeCompare(a.month))
    return sorted.slice(0, 8).map(inv => {
      const room = rooms.find(r => r.id === inv.roomId)
      return { ...inv, room, roomDisplay: inv.roomNumber || room?.roomNumber || '-' }
    })
  }, [invoices, rooms])

  const todayEvents = useMemo(() => {
    const checkins = []
    const checkouts = []
    for (const res of residents) {
      if (res.rentalType !== 'daily' && res.rentalType !== 'รายวัน') continue
      const inBkk = new Date(res.moveInDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
      const outBkk = new Date(res.moveOutDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
      const room = rooms.find(r => r.id === res.roomId) || rooms.find(r => r.roomNumber === res.roomNumber)
      if (inBkk === todayBkk) checkins.push({ ...res, roomNum: room?.roomNumber || res.roomNumber || '' })
      if (outBkk === todayBkk) checkouts.push({ ...res, roomNum: room?.roomNumber || res.roomNumber || '' })
    }
    return { checkins, checkouts }
  }, [residents, rooms, todayBkk])

  const occupancyRate = stats.total ? Math.round((stats.occupied / stats.total) * 100) : 0

  const getMonday = useCallback((d) => {
    const date = new Date(d)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    date.setDate(diff)
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  const wkStart = useMemo(() => getMonday(now), [getMonday, now])
  const wkEnd = new Date(wkStart.getTime() + 6 * 86400000)

  const wkDays = useMemo(() => {
    const arr = []
    for (let d = new Date(wkStart); d <= wkEnd; d.setDate(d.getDate() + 1)) {
      const dateObj = new Date(d)
      arr.push({
        day: dateObj.getDate(),
        dayOfWeek: dateObj.getDay(),
        dateStr: `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`,
        isToday: dateObj.toDateString() === now.toDateString(),
      })
    }
    return arr
  }, [wkStart, wkEnd, now])

  const dailyRooms = useMemo(() =>
    rooms.filter(r => r.rentalType === 'daily' || r.rentalType === 'รายวัน')
      .sort((a, b) => (a.roomNumber || '').localeCompare(b.roomNumber || '', undefined, { numeric: true })),
    [rooms]
  )

  const dailyResidents = useMemo(() =>
    residents.filter(r => r.rentalType === 'daily' || r.rentalType === 'รายวัน'),
    [residents]
  )

  const dashBookings = useMemo(() => {
    const map = {}
    const rangeStart = wkStart
    const rangeEnd = wkEnd
    for (const room of dailyRooms) {
      const roomNum = room.roomNumber || ''
      let bookings = dailyResidents.filter(r => {
        if (r.roomId === room.id) return true
        if (!r.roomId && r.roomNumber === roomNum) return true
        return false
      }).map(r => {
        const inD = new Date(r.moveInDate); inD.setHours(0, 0, 0, 0)
        const outD = new Date(r.moveOutDate); outD.setHours(0, 0, 0, 0)
        if (outD < rangeStart || inD > rangeEnd) return null
        const bStart = Math.max(0, Math.round((inD - rangeStart) / 86400000))
        const bEnd = Math.min(6, Math.round((outD - rangeStart) / 86400000))
        const inBkk = new Date(r.moveInDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
        const outBkk = new Date(r.moveOutDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
        const stat = inBkk > todayBkk ? 'จอง' : (outBkk > todayBkk || (outBkk === todayBkk && bkkHour < 12)) ? 'เช็คอิน' : 'เช็คเอาท์'
        return { ...r, barStart: bStart, barEnd: bEnd, status: stat, track: 0, totalTracks: 1 }
      }).filter(Boolean)
      if (bookings.length > 1) {
        const sorted = [...bookings].sort((a, b) => a.barStart - b.barStart)
        const tracks = []
        for (const b of sorted) {
          let placed = false
          for (let t = 0; t < tracks.length; t++) {
            if (tracks[t] < b.barStart) {
              tracks[t] = b.barEnd; b.track = t; placed = true; break
            }
          }
          if (!placed) { tracks.push(b.barEnd); b.track = tracks.length - 1 }
        }
        for (const b of bookings) b.totalTracks = tracks.length
      }
      if (bookings.length > 0) map[room.id] = bookings
    }
    return map
  }, [dailyRooms, dailyResidents, wkStart, wkEnd, todayBkk, bkkHour])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <PageHeader
        title="แดชบอร์ด"
        description={
          <span>
            <span className="block">{now.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-100 border border-neutral-200/50 text-neutral-500 font-mono text-[11px] font-semibold tracking-wide shadow-sm">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-neutral-400"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' })} น.
              </span>
              <span className="w-1 h-1 rounded-full bg-neutral-300" />
              <span className="text-amber-600 font-medium text-[11px]">อัตราการเข้าพัก {occupancyRate}%</span>
            </span>
          </span>
        }
        action={<ReloadButton onReload={fetchAll} />}
      />

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-5 sm:space-y-8">

        {/* === Stats Grid === */}
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[
            { label: 'ห้องทั้งหมด', value: stats.total, icon: 'building', color: 'from-neutral-500 to-neutral-600' },
            { label: 'มีผู้พัก', value: stats.occupied, icon: 'check', color: 'from-lime-500 to-lime-600' },
            { label: 'ห้องว่าง', value: stats.vacant, icon: 'square', color: 'from-sky-500 to-sky-600' },
            { label: 'เช็คอินวันนี้', value: stats.checkingIn, icon: 'login', color: 'from-amber-500 to-orange-600', highlight: stats.checkingIn > 0 },
            { label: 'เช็คเอาท์วันนี้', value: stats.checkingOut, icon: 'logout', color: 'from-rose-500 to-rose-600', highlight: stats.checkingOut > 0 },
            { label: 'รอมิเตอร์', value: stats.pendingMeter, icon: 'chart', color: 'from-violet-500 to-violet-600' },
          ].map((s, i) => (
            <motion.div key={s.label} variants={itemAnim}>
              <div className={`relative bg-white rounded-xl sm:rounded-2xl border ${s.highlight ? 'border-amber-200 shadow-md shadow-amber-100/50' : 'border-neutral-100 shadow-sm'} p-3 sm:p-4 overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}>
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${s.color} opacity-60`} />
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <span className={s.color.split(' ')[0].replace('from-', 'text-')}>{{
                    building: <svg className="w-5 sm:w-6 h-5 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><line x1="8" y1="6" x2="10" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="6" x2="16" y2="6"/><line x1="14" y1="10" x2="16" y2="10"/></svg>,
                    check: <svg className="w-5 sm:w-6 h-5 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
                    square: <svg className="w-5 sm:w-6 h-5 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>,
                    login: <svg className="w-5 sm:w-6 h-5 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>,
                    logout: <svg className="w-5 sm:w-6 h-5 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
                    chart: <svg className="w-5 sm:w-6 h-5 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
                  }[s.icon]}</span>
                  <span className={`text-xl sm:text-2xl font-bold tracking-tight text-neutral-800 ${s.highlight ? 'text-amber-600' : ''}`}>
                    {s.value}
                  </span>
                </div>
                <div className="text-[10px] sm:text-xs text-neutral-400 font-medium tracking-wide">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* === Weekly Booking Calendar + Today Events Row === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* Left: Weekly Booking Calendar */}
          <motion.div variants={itemAnim} className="lg:col-span-2">
            <Card className="h-full">
              <CardContent className="pt-5 sm:pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-lime-400" />
                    <h3 className="text-sm font-semibold text-neutral-800">การจองรายวัน (สัปดาห์นี้)</h3>
                  </div>
                  <button onClick={() => navigate('/calendar')}
                    className="text-[11px] font-medium text-lime-600 hover:text-lime-700 transition-colors">
                    ดูทั้งหมด →
                  </button>
                </div>

                {dailyRooms.length === 0 ? (
                  <div className="text-center py-10">
                    <svg className="w-10 h-10 mx-auto mb-3 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <div className="text-sm font-medium text-neutral-500">ไม่มีห้องรายวัน</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-1">
                    <div className="min-w-0">
                      {/* Header row */}
                      <div className="grid border-b border-neutral-100" style={{ gridTemplateColumns: `64px repeat(7, 1fr)` }}>
                        <div className="sticky left-0 z-10 bg-white px-1.5 py-1.5 border-r border-neutral-50 text-[11px] font-semibold text-neutral-400">ห้อง</div>
                        {wkDays.map(d => (
                          <div key={d.dateStr}
                            className={`px-0.5 py-1 border-r border-neutral-50 text-center ${
                              d.isToday ? 'bg-lime-50' : ''
                            }`}>
                            <div className={`text-[12px] font-semibold leading-tight ${
                              d.isToday ? 'text-lime-700' : d.dayOfWeek === 0 ? 'text-rose-400' : 'text-neutral-500'
                            }`}>
                              {d.day}
                            </div>
                            <div className="text-[9px] text-neutral-300 leading-tight">
                              {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'][d.dayOfWeek]}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Room rows */}
                      {dailyRooms.map(room => {
                        const roomNum = room.roomNumber || ''
                        const bookings = dashBookings[room.id] || []
                        const maxTracks = Math.max(1, ...bookings.map(b => b.totalTracks || 1))
                        const globalMaxTracks = Math.max(1, ...dailyRooms.flatMap(r => (dashBookings[r.id] || []).map(b => b.totalTracks || 1)))
                        const rowHeight = Math.max(36, globalMaxTracks * 20)
                        return (
                          <div key={room.id} className="grid border-b border-neutral-50" style={{ gridTemplateColumns: `64px repeat(7, 1fr)` }}>
                            <div className="sticky left-0 z-10 bg-white px-1.5 py-1 border-r border-neutral-50 text-[12px] font-medium text-neutral-600 truncate flex items-center"
                              style={{ minHeight: rowHeight + 'px' }}>
                              {roomNum}
                            </div>
                            <div className="relative col-span-full" style={{ gridColumn: '2 / 9', minHeight: rowHeight + 'px' }}>
                              <div className="grid h-full" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                                {wkDays.map(d => (
                                  <div key={d.dateStr}
                                    className={`border-r border-neutral-50 ${
                                      d.isToday ? 'bg-lime-50/40' : ''
                                    }`} />
                                ))}
                              </div>
                              {bookings.map(b => {
                                const barLeft = (b.barStart / 7) * 100
                                const barWidth = ((b.barEnd - b.barStart + 1) / 7) * 100
                                const barTop = globalMaxTracks > 1 ? ((b.track / globalMaxTracks) * rowHeight) + 1 : 1
                                const barHeight = maxTracks > 1 ? ((1 / maxTracks) * rowHeight) - 2 : rowHeight - 2
                                const isBooking = b.status === 'จอง'
                                const isCheckin = b.status === 'เช็คอิน'
                                const bg = isBooking ? 'bg-amber-50 text-amber-700 border-amber-200' : isCheckin ? 'bg-lime-50 text-lime-700 border-lime-200' : 'bg-neutral-50 text-neutral-400 border-neutral-200'
                                return (
                                  <motion.div key={b.id}
                                    initial={{ opacity: 0, x: -4 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2, delay: Math.min(b.track * 0.03, 0.12) }}
                                    className={`absolute rounded-[3px] flex items-center px-1 gap-0.5 overflow-hidden cursor-default border ${bg}`}
                                    style={{
                                      left: barLeft + '%',
                                      width: Math.max(1, barWidth) + '%',
                                      top: barTop + 'px',
                                      height: barHeight + 'px',
                                      minWidth: '8px',
                                    }}>
                                    <span className="text-[13px] font-semibold shrink-0 leading-none">{b.name}</span>
                                    <span className="shrink-0 text-[10px] leading-none ml-auto opacity-60 whitespace-nowrap">{b.status}</span>
                                  </motion.div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Right: Today Events */}
          <motion.div variants={itemAnim}>
            <Card className="h-full">
              <CardContent className="pt-5 sm:pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <h3 className="text-sm font-semibold text-neutral-800">วันนี้</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-lime-50 border border-lime-100/60">
                    <div className="w-8 h-8 rounded-lg bg-lime-100 flex items-center justify-center text-sm shrink-0">
                      <svg className="w-4 h-4 text-lime-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-lime-800">เช็คอิน</div>
                      <div className="text-[11px] text-lime-600">{todayEvents.checkins.length} รายการ{todayEvents.checkins.length > 0 ? ` (หลัง 14:00 น.)` : ''}</div>
                    </div>
                    <span className="ml-auto text-sm font-bold text-lime-700">{todayEvents.checkins.length}</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-rose-50 border border-rose-100/60">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-sm shrink-0">
                      <svg className="w-4 h-4 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-rose-800">เช็คเอาท์</div>
                      <div className="text-[11px] text-rose-600">{todayEvents.checkouts.length} รายการ{todayEvents.checkouts.length > 0 ? ` (หลัง 12:00 น.)` : ''}</div>
                    </div>
                    <span className="ml-auto text-sm font-bold text-rose-700">{todayEvents.checkouts.length}</span>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-sky-50 border border-sky-100/60">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sm shrink-0">
                      <svg className="w-4 h-4 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-sky-800">กำลังพัก</div>
                      <div className="text-[11px] text-sky-600">ห้องรายวันที่มีผู้พัก</div>
                    </div>
                    <span className="ml-auto text-sm font-bold text-sky-700">{stats.dailyActive}</span>
                  </div>
                </div>
                {(todayEvents.checkins.length > 0 || todayEvents.checkouts.length > 0) && (
                  <div className="mt-3 pt-3 border-t border-neutral-100 space-y-1">
                    {todayEvents.checkins.map(ev => (
                      <div key={ev.id} className="flex items-center gap-2 text-[11px] text-neutral-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-lime-400 shrink-0" />
                        <span className="font-medium text-neutral-700">{ev.roomNum}</span>
                        <span>{ev.name}</span>
                        <span className="text-lime-500 ml-auto">เช็คอิน</span>
                      </div>
                    ))}
                    {todayEvents.checkouts.map(ev => (
                      <div key={ev.id} className="flex items-center gap-2 text-[11px] text-neutral-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                        <span className="font-medium text-neutral-700">{ev.roomNum}</span>
                        <span>{ev.name}</span>
                        <span className="text-rose-500 ml-auto">เช็คเอาท์</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* === Room Overview === */}
        <motion.div variants={itemAnim}>
          <Card>
            <CardContent className="pt-5 sm:pt-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-2 h-2 rounded-full bg-lime-400" />
                <h3 className="text-sm font-semibold text-neutral-800">ภาพรวมห้องพัก</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Occupancy Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-neutral-500">อัตราการเข้าพัก</span>
                    <span className="text-xs font-bold text-neutral-700">{occupancyRate}%</span>
                  </div>
                  <div className="h-3 sm:h-4 rounded-full bg-neutral-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${occupancyRate}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-lime-400 to-lime-500"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-lime-400" /> มีผู้พัก {stats.occupied}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neutral-300" /> ว่าง {stats.vacant}</span>
                    <span>รวม {stats.total}</span>
                  </div>
                </div>

                {/* Daily vs Monthly split */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl border bg-amber-50/50 border-amber-100/60">
                    <div className="text-[11px] font-medium text-neutral-500 mb-1">รายวัน</div>
                    <div className="text-xl font-bold text-amber-700">
                      {rooms.filter(r => r.rentalType === 'daily' || r.rentalType === 'รายวัน').length}
                      <span className="text-sm font-normal text-neutral-400 ml-1">ห้อง</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border bg-teal-50/50 border-teal-100/60">
                    <div className="text-[11px] font-medium text-neutral-500 mb-1">รายเดือน</div>
                    <div className="text-xl font-bold text-teal-700">
                      {rooms.filter(r => !r.rentalType || r.rentalType === 'monthly' || r.rentalType === 'รายเดือน').length}
                      <span className="text-sm font-normal text-neutral-400 ml-1">ห้อง</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* === Recent Invoices === */}
        <motion.div variants={itemAnim}>
          <Card>
            <CardContent className="pt-5 sm:pt-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-lime-400" />
                  <h3 className="text-sm font-semibold text-neutral-800">ใบแจ้งหนี้ล่าสุด</h3>
                </div>
                <Button size="sm" variant="outline" onClick={() => navigate('/billing')}>ดูทั้งหมด</Button>
              </div>

              {recentInvoices.length === 0 ? (
                <div className="text-center py-10">
                  <svg className="w-10 h-10 mx-auto mb-3 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  <div className="text-sm font-medium text-neutral-500 mb-1">ยังไม่มีใบแจ้งหนี้</div>
                  <div className="text-xs text-neutral-400">ใบแจ้งหนี้จะแสดงที่นี่เมื่อเริ่มบันทึกข้อมูล</div>
                </div>
              ) : (
                <>
                  {/* Mobile: card list */}
                  <div className="md:hidden space-y-2">
                    {recentInvoices.map((inv, i) => (
                      <motion.div key={inv._id || i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.03 }}
                        className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 bg-white">
                        <span className="inline-flex items-center justify-center w-9 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-lime-500 text-neutral-900 text-xs font-bold shadow-sm shrink-0">
                          {inv.roomDisplay}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-neutral-800 truncate">{inv.tenantName}</span>
                            <span className="text-sm font-semibold text-neutral-800 ml-2">{inv.total?.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-neutral-400">{formatMonth(inv.month)}</span>
                            <span className="text-[11px] text-neutral-300">•</span>
                            <span className="text-[11px] text-neutral-400">ค่าเช่า {inv.rent?.toLocaleString()}</span>
                            <Badge variant={inv.paid ? 'success' : 'warning'} className="ml-auto text-[10px] px-1.5 py-0.5">
                              {inv.paid ? 'ชำระแล้ว' : 'รอชำระ'}
                            </Badge>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {/* Desktop: table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-100">
                          {['ห้อง', 'ผู้พัก', 'เดือน', 'ค่าเช่า', 'รวม', 'สถานะ'].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-50">
                        {recentInvoices.map((inv, i) => (
                          <motion.tr key={inv._id || i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.25, delay: i * 0.03 }}
                            className="hover:bg-lime-50/40 transition-colors">
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center justify-center w-8 h-7 rounded-lg bg-gradient-to-br from-lime-400 to-lime-500 text-neutral-900 text-xs font-bold shadow-sm">
                                {inv.roomDisplay}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-neutral-700 font-medium">{inv.tenantName}</td>
                            <td className="px-4 py-3 text-neutral-500">{formatMonth(inv.month)}</td>
                            <td className="px-4 py-3 text-neutral-700">{inv.rent?.toLocaleString()}</td>
                            <td className="px-4 py-3 font-semibold text-neutral-800">{inv.total?.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <Badge variant={inv.paid ? 'success' : 'warning'}>
                                {inv.paid ? 'ชำระแล้ว' : 'รอชำระ'}
                              </Badge>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
