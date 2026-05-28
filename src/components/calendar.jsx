import { motion } from 'framer-motion'
import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/api'
import PageHeader from './ui/page-header'
import Card, { CardContent } from './ui/card'
import Modal from './ui/modal'
import Button from './ui/button'
import DatePickerField from './ui/datepicker'

const THAI_MONTHS = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
const DAY_HEADERS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
const BOOKING_COLORS = ['#dcfce7', '#e0f2fe', '#fef3c7', '#ffe4e6', '#f3e8ff', '#ccfbf1', '#ffedd5', '#ecfdf5']

export default function Calendar() {
  const navigate = useNavigate()
  const { rooms, residents, toast, fetchRooms, fetchResidents } = useApp()
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [showAdd, setShowAdd] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [detailRoomId, setDetailRoomId] = useState(null)
  const [detailResidentId, setDetailResidentId] = useState(null)
  const [formRoom, setFormRoom] = useState('')
  const [formName, setFormName] = useState('')
  const [formCheckIn, setFormCheckIn] = useState('')
  const [formCheckOut, setFormCheckOut] = useState('')
  const [formExtraBed, setFormExtraBed] = useState(0)
  const [formDiscount, setFormDiscount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [isEditingDetail, setIsEditingDetail] = useState(false)
  const [viewMode, setViewMode] = useState('month')

  const getMonday = (d) => {
    const date = new Date(d)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    date.setDate(diff)
    date.setHours(0, 0, 0, 0)
    return date
  }

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const yearBE = year + 543
  const weekStart = viewMode === 'week' ? getMonday(viewDate) : null
  const weekEnd = weekStart ? new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6) : null

  const dailyRooms = useMemo(() =>
    rooms.filter(r => r.rentalType === 'daily' || r.rentalType === 'รายวัน')
      .sort((a, b) => (a.roomNumber || a.number || '').localeCompare(b.roomNumber || b.number || '', undefined, { numeric: true })),
    [rooms]
  )

  const dailyResidents = useMemo(() =>
    residents.filter(r => r.rentalType === 'daily' || r.rentalType === 'รายวัน'),
    [residents]
  )

  const roomLabel = useCallback((room) => room?.roomNumber || room?.number || '', [])

  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days = useMemo(() => {
    if (viewMode === 'week' && weekStart && weekEnd) {
      const arr = []
      for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
        const dateObj = new Date(d)
        arr.push({
          day: dateObj.getDate(),
          dayOfWeek: dateObj.getDay(),
          dateStr: `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`,
          isToday: dateObj.getDate() === today.getDate() && dateObj.getMonth() === today.getMonth() && dateObj.getFullYear() === today.getFullYear(),
          month: dateObj.getMonth(),
          year: dateObj.getFullYear(),
        })
      }
      return arr
    }
    const arr = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d)
      arr.push({
        day: d,
        dayOfWeek: dateObj.getDay(),
        dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        isToday: d === today.getDate() && month === today.getMonth() && year === today.getFullYear(),
      })
    }
    return arr
  }, [year, month, daysInMonth, today, viewMode, weekStart, weekEnd])

  const roomBookings = useMemo(() => {
    const map = {}
    const rangeStart = viewMode === 'week' && weekStart ? new Date(weekStart) : new Date(year, month, 1)
    const rangeEnd = viewMode === 'week' && weekEnd ? new Date(weekEnd) : new Date(year, month, daysInMonth)
    const rangeLen = Math.round((rangeEnd - rangeStart) / 86400000) + 1
    for (const room of dailyRooms) {
      const roomNum = roomLabel(room)
      let bookings = dailyResidents.filter(r => {
        if (r.roomId === room.id) return true
        if (!r.roomId && r.roomNumber === roomNum) return true
        return false
      }).map((r, idx) => {
        const inD = new Date(r.moveInDate)
        const outD = new Date(r.moveOutDate)
        if (outD < rangeStart || inD > rangeEnd) return null
        const bStart = Math.round((inD - rangeStart) / 86400000) + 1
        const bEnd = Math.round((outD - rangeStart) / 86400000) + 1
        const startDay = inD < rangeStart ? 1 : Math.min(rangeLen, bStart)
        const endDay = outD > rangeEnd ? rangeLen : Math.max(1, bEnd)
        return {
          ...r,
          startDay,
          endDay,
          roomNum: roomLabel(room),
          color: BOOKING_COLORS[idx % BOOKING_COLORS.length],
        }
      }).filter(Boolean)
      if (bookings.length > 1) {
        const sorted = [...bookings].sort((a, b) => a.startDay - b.startDay)
        const tracks = []
        for (const b of sorted) {
          let placed = false
          for (let t = 0; t < tracks.length; t++) {
            if (tracks[t] < b.startDay) {
              tracks[t] = b.endDay
              b.track = t
              placed = true
              break
            }
          }
          if (!placed) {
            tracks.push(b.endDay)
            b.track = tracks.length - 1
          }
        }
        for (const b of bookings) b.totalTracks = tracks.length
      } else if (bookings.length === 1) {
        bookings[0].track = 0
        bookings[0].totalTracks = 1
      }
      if (bookings.length > 0) map[room.id] = bookings
    }
    return map
  }, [dailyRooms, dailyResidents, viewMode, weekStart, weekEnd, year, month, daysInMonth, roomLabel])

  const weeks = useMemo(() => {
    if (viewMode !== 'month' || days.length === 0) return []
    const offset = (days[0].dayOfWeek + 6) % 7
    const w = []
    let row = []
    for (let i = 0; i < offset; i++) row.push(null)
    for (const d of days) {
      row.push(d)
      if (row.length === 7) {
        w.push(row)
        row = []
      }
    }
    if (row.length > 0) {
      while (row.length < 7) row.push(null)
      w.push(row)
    }
    return w
  }, [days, viewMode])

  const weekBookings = useMemo(() => {
    if (viewMode !== 'month') return []
    const now = new Date()
    const todayBkk = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    return weeks.map(week => {
      const validDays = week.filter(Boolean)
      if (validDays.length < 1) return []
      const wkStart = new Date(validDays[0].dateStr); wkStart.setHours(0, 0, 0, 0)
      const lastDayStr = validDays[validDays.length - 1].dateStr
      const wkEnd = new Date(lastDayStr); wkEnd.setHours(0, 0, 0, 0)
      wkEnd.setDate(wkEnd.getDate() + 1)
      let list = dailyResidents.filter(r => {
        const inD = new Date(r.moveInDate); inD.setHours(0, 0, 0, 0)
        const outD = new Date(r.moveOutDate); outD.setHours(0, 0, 0, 0)
        outD.setDate(outD.getDate() + 1)
        return outD > wkStart && inD < wkEnd
      }).map(r => {
        const inD = new Date(r.moveInDate); inD.setHours(0, 0, 0, 0)
        const outD = new Date(r.moveOutDate); outD.setHours(0, 0, 0, 0)
        const room = dailyRooms.find(x => x.id === r.roomId) || (r.roomNumber ? dailyRooms.find(x => roomLabel(x) === r.roomNumber) : undefined)
        const barStart = Math.max(0, Math.round((inD - wkStart) / 86400000))
        const barEnd = Math.min(6, Math.round((outD - wkStart) / 86400000))
        const inBkk = new Date(r.moveInDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
        const outBkk = new Date(r.moveOutDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
        const bkkHour = Number(now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit' }))
        const stat = inBkk > todayBkk ? 'จอง' : (outBkk > todayBkk || (outBkk === todayBkk && bkkHour < 12)) ? 'เช็คอิน' : 'เช็คเอาท์'
        return {
          ...r,
          roomNum: room ? roomLabel(room) : '',
          barStart, barEnd,
          barLeftPct: (barStart / 7) * 100,
          barWidthPct: ((barEnd - barStart + 1) / 7) * 100,
          status: stat,
          track: 0, totalTracks: 1,
        }
      })
      if (list.length > 1) {
        const sorted = [...list].sort((a, b) => a.barStart - b.barStart)
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
        for (const b of list) b.totalTracks = tracks.length
      }
      return list
    })
  }, [weeks, dailyResidents, dailyRooms, roomLabel, viewMode])

  const openAdd = useCallback((dateStr) => {
    const d = dateStr ? new Date(dateStr) : new Date()
    const next = new Date(d)
    next.setDate(d.getDate() + 1)
    setFormCheckIn(d.toISOString().split('T')[0])
    setFormCheckOut(next.toISOString().split('T')[0])
    setFormName('')
    setFormRoom(dailyRooms.length > 0 ? dailyRooms[0].id : '')
    setFormExtraBed(0)
    setFormDiscount(0)
    setShowAdd(true)
  }, [dailyRooms])

  const openDetail = useCallback((roomId, residentId) => {
    setDetailRoomId(roomId)
    setDetailResidentId(residentId)
    setIsEditingDetail(false)
    setShowDetail(true)
  }, [])

  const handleSave = async () => {
    if (!formName.trim()) { toast('กรุณากรอกชื่อผู้เข้าพัก', true); return }
    if (!formCheckIn) { toast('กรุณาเลือกวันเช็คอิน', true); return }
    if (!formCheckOut) { toast('กรุณาเลือกวันเช็คเอาท์', true); return }
    if (!formRoom) { toast('กรุณาเลือกห้อง', true); return }
    if (formCheckOut <= formCheckIn) { toast('วันเช็คเอาท์ต้องมากกว่าวันเช็คอิน', true); return }
    setSaving(true)
    try {
      const room = dailyRooms.find(r => r.id === formRoom)
      const res = await api('/api/residents', 'POST', {
        name: formName.trim(), idCard: '', phone: '', email: '',
        roomId: formRoom, moveInDate: formCheckIn, moveOutDate: formCheckOut,
        deposit: 0, licensePlate: '', emergencyContact: '', emergencyPhone: '',
        lineUserId: '', rentalType: 'daily', tenantType: 'individual',
      })
      await api('/api/rooms', 'PUT', {
        id: formRoom, roomNumber: room.roomNumber, roomCode: room.roomCode || '',
        rentPrice: room.rentPrice, rentalType: 'daily', roomType: room.roomType,
        prevElecMeter: room.prevElecMeter || 0, prevWaterMeter: room.prevWaterMeter || 0,
        extraBed: formExtraBed, discount: formDiscount, note: room.note || '',
        residentId: res.id,
      })
      await Promise.all([fetchRooms(), fetchResidents()])
      setShowAdd(false)
      toast('เพิ่มการจองสำเร็จ')
    } catch (e) { toast(`ไม่สำเร็จ: ${e.message}`, true) }
    setSaving(false)
  }

  const handleEditSave = async () => {
    if (!formName.trim()) { toast('กรุณากรอกชื่อผู้เข้าพัก', true); return }
    if (!formCheckIn) { toast('กรุณาเลือกวันเช็คอิน', true); return }
    if (!formCheckOut) { toast('กรุณาเลือกวันเช็คเอาท์', true); return }
    if (formCheckOut <= formCheckIn) { toast('วันเช็คเอาท์ต้องมากกว่าวันเช็คอิน', true); return }
    setSaving(true)
    try {
      await api('/api/residents', 'PUT', {
        id: detailResidentId, name: formName.trim(),
        moveInDate: formCheckIn, moveOutDate: formCheckOut,
        roomId: detailRoomId, rentalType: 'daily',
      })
      const room = rooms.find(r => r.id === detailRoomId)
      if (room) {
        await api('/api/rooms', 'PUT', {
          id: detailRoomId, roomNumber: room.roomNumber, roomCode: room.roomCode || '',
          rentPrice: room.rentPrice, rentalType: 'daily', roomType: room.roomType,
          prevElecMeter: room.prevElecMeter || 0, prevWaterMeter: room.prevWaterMeter || 0,
          extraBed: formExtraBed, discount: formDiscount, note: room.note || '',
          residentId: detailResidentId,
        })
      }
      await Promise.all([fetchRooms(), fetchResidents()])
      setIsEditingDetail(false)
      toast('แก้ไขการจองสำเร็จ')
    } catch (e) { toast(`ไม่สำเร็จ: ${e.message}`, true) }
    setSaving(false)
  }

  const prev = () => {
    if (viewMode === 'week') {
      const d = new Date(weekStart || viewDate)
      d.setDate(d.getDate() - 7)
      setViewDate(d)
    } else {
      setViewDate(new Date(year, month - 1, 1))
    }
  }
  const next = () => {
    if (viewMode === 'week') {
      const d = new Date(weekStart || viewDate)
      d.setDate(d.getDate() + 7)
      setViewDate(d)
    } else {
      setViewDate(new Date(year, month + 1, 1))
    }
  }

  const bookingStatus = (b) => {
    const now = new Date()
    const todayBkk = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    const inBkk = new Date(b.moveInDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    if (inBkk > todayBkk) return 'จอง'
    const outBkk = new Date(b.moveOutDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    const bkkHour = Number(now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit' }))
    if (outBkk > todayBkk || (outBkk === todayBkk && bkkHour < 12)) return 'เช็คอิน'
    return 'เช็คเอาท์'
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader
        title="📅 ปฏิทินการจอง"
        description="ดูภาพรวมการจองห้องพักรายวัน"
        action={<Button onClick={() => openAdd('')}>＋ จองห้องพัก</Button>}
      />

      <Card className="overflow-hidden">
        <CardContent className="pt-0 p-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 sm:px-5 py-3 sm:py-4 border-b border-neutral-100">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1">
                <button onClick={prev}
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 active:bg-neutral-200 transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <h2 className="text-sm sm:text-base font-bold text-neutral-800 min-w-[140px] sm:min-w-[180px] text-center select-none leading-tight">
                  {viewMode === 'week' && weekStart && weekEnd
                    ? (weekStart.getMonth() === weekEnd.getMonth() && weekStart.getFullYear() === weekEnd.getFullYear()
                      ? `${weekStart.getDate()}-${weekEnd.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : `${weekStart.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} - ${weekEnd.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`)
                    : `${THAI_MONTHS[month + 1]} ${yearBE}`
                  }
                </h2>
                <button onClick={next}
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 active:bg-neutral-200 transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
              <div className="flex rounded-lg sm:rounded-xl border border-neutral-200 overflow-hidden">
                <button onClick={() => { setViewDate(new Date(today.getFullYear(), today.getMonth(), 1)); setViewMode('month') }}
                  className={`px-2.5 sm:px-3 h-8 sm:h-9 text-[11px] sm:text-xs font-semibold transition-all ${viewMode === 'month' ? 'bg-lime-500 text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-50'}`}>
                  เดือน
                </button>
                <button onClick={() => { setViewDate(getMonday(today)); setViewMode('week') }}
                  className={`px-2.5 sm:px-3 h-8 sm:h-9 text-[11px] sm:text-xs font-semibold transition-all ${viewMode === 'week' ? 'bg-lime-500 text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-50'}`}>
                  สัปดาห์
                </button>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400">
              <span>{dailyRooms.length} ห้อง</span>
              <span className="w-1 h-1 rounded-full bg-neutral-300" />
              <span>{dailyResidents.length} การจอง</span>
            </div>
          </div>

          {dailyRooms.length === 0 ? (
            <div className="text-center py-12 sm:py-16 px-4">
              <div className="text-4xl sm:text-5xl mb-4">📅</div>
              <h3 className="text-base font-semibold text-neutral-700 mb-1">ไม่มีห้องรายวัน</h3>
              <p className="text-sm text-neutral-400">กรุณาเพิ่มห้องพักประเภท รายวัน ก่อน</p>
            </div>
          ) : (
            <>
              {/* Mobile: traditional calendar grid (month view only) */}
              <div className="lg:hidden">
                {viewMode === 'month' ? (
                  <div>
                    <div className="flex border-b border-neutral-100">
                      {['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'].map(h => (
                        <div key={h} className="w-[14.285%] shrink-0 px-1 py-2 text-center text-[10px] font-semibold text-neutral-400">
                          {h}
                        </div>
                      ))}
                    </div>
                    {weeks.map((week, wi) => {
                      const wkBookings = weekBookings[wi] || []
                      const maxTracks = Math.max(1, ...wkBookings.map(b => b.totalTracks || 1))
                      const rowH = Math.max(64, 28 + maxTracks * 18)
                      return (
                        <div key={wi} className="relative border-b border-neutral-50" style={{ minHeight: rowH + 'px' }}>
                          <div className="flex" style={{ minHeight: rowH + 'px' }}>
                            {week.map((d, di) => {
                              if (!d) return <div key={di} className="w-[14.285%] shrink-0 border-r border-neutral-50" />
                              return (
                                <div key={d.dateStr}
                                  onClick={() => openAdd(d.dateStr)}
                                  className={`w-[14.285%] shrink-0 border-r border-neutral-50 cursor-pointer hover:bg-lime-50/30 transition-colors ${
                                    d.isToday ? 'bg-lime-50/60' : ''
                                  }`}>
                                  <div className={`text-[10px] font-semibold text-center pt-1.5 pb-0.5 ${
                                    d.isToday ? 'text-lime-700' : d.dayOfWeek === 0 ? 'text-rose-400' : 'text-neutral-500'
                                  }`}>
                                    {d.day}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          {wkBookings.length > 0 && (
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                              {wkBookings.map(b => {
                                const barTop = 26 + (b.track || 0) * 18
                                const isBooking = b.status === 'จอง'
                                const isCheckin = b.status === 'เช็คอิน'
                                const bg = isBooking ? 'bg-amber-100 text-amber-800 border-amber-200' : isCheckin ? 'bg-lime-100 text-lime-800 border-lime-200' : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                                return (
                                  <motion.div key={b.id}
                                    initial={{ opacity: 0, x: -4 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2, delay: Math.min((b.track || 0) * 0.03, 0.15) }}
                                    onClick={() => openDetail(b.roomId, b.id)}
                                    className={'absolute pointer-events-auto rounded-[2px] flex items-center px-1 gap-0.5 cursor-pointer hover:opacity-80 transition-opacity z-20 overflow-hidden ' + bg}
                                    style={{
                                      left: b.barLeftPct + '%',
                                      width: Math.max(0.5, b.barWidthPct) + '%',
                                      top: barTop + 'px',
                                      height: '16px',
                                      borderWidth: '1px',
                                    }}>
                                    <span className="font-semibold shrink-0 text-[8px] leading-none">{b.roomNum}</span>
                                    <span className="truncate text-[8px] leading-none">{b.name}</span>
                                    <span className="shrink-0 text-[7px] leading-none ml-auto opacity-60">{b.status}</span>
                                  </motion.div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  /* Mobile week view: compact horizontal scroll */
                  <div className="overflow-x-auto">
                    <div className="min-w-0">
                      <div className="grid" style={{ gridTemplateColumns: `64px repeat(${days.length}, 1fr)` }}>
                        <div className="sticky left-0 z-10 bg-white px-1.5 py-2 border-b border-r border-neutral-100 text-[10px] font-semibold text-neutral-500">
                          ห้อง
                        </div>
                        {days.map(d => (
                          <div key={d.dateStr}
                            className={`px-0.5 py-1.5 border-b border-r border-neutral-50 text-center text-[10px] font-medium ${
                              d.isToday ? 'bg-lime-50 text-lime-700 font-bold' : 'text-neutral-400'
                            } ${d.dayOfWeek === 0 ? 'text-rose-400' : ''}`}>
                            <div>{d.day}</div>
                            <div className="text-[8px] opacity-60">{DAY_HEADERS[d.dayOfWeek]}</div>
                          </div>
                        ))}
                      </div>
                      {dailyRooms.map(room => {
                        const bookings = roomBookings[room.id] || []
                        return (
                          <div key={room.id} className="grid" style={{ gridTemplateColumns: `64px repeat(${days.length}, 1fr)` }}>
                            <div className="sticky left-0 z-10 bg-white px-1.5 py-2.5 border-b border-r border-neutral-50 text-[11px] font-medium text-neutral-700 truncate">
                              {roomLabel(room)}
                            </div>
                            {(() => {
                              const maxTracks = Math.max(1, ...bookings.map(b => b.totalTracks || 1))
                              const rowHeight = Math.max(40, maxTracks * 40)
                              return (
                                <div className="relative col-span-full" style={{ gridColumn: '2 / ' + (days.length + 2), minHeight: rowHeight + 'px' }}>
                                  <div className="grid h-full" style={{ gridTemplateColumns: 'repeat(' + days.length + ', 1fr)' }}>
                                    {days.map(d => (
                                      <div key={d.dateStr}
                                        onClick={() => openAdd(d.dateStr)}
                                        className={`border-b border-r border-neutral-50 transition-colors cursor-pointer hover:bg-lime-50/30 ${
                                          d.isToday ? 'bg-lime-50/50' : ''
                                        }`} />
                                    ))}
                                  </div>
                                  {bookings.map(b => {
                                    const left = ((b.startDay - 1) / days.length) * 100
                                    const width = ((b.endDay - b.startDay + 1) / days.length) * 100
                                    const track = b.track || 0
                                    const totalTracks = b.totalTracks || 1
                                    const barTop = totalTracks > 1 ? ((track / totalTracks) * rowHeight) + 1 + 'px' : '1px'
                                    const barHeight = totalTracks > 1 ? ((1 / totalTracks) * rowHeight) - 2 + 'px' : (rowHeight - 2) + 'px'
                                    const s = bookingStatus(b)
                                    const barStyle = s === 'จอง' ? 'bg-amber-100 text-amber-800 border-amber-200' : s === 'เช็คอิน' ? 'bg-lime-100 text-lime-800 border-lime-200' : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                                    return (
                                      <motion.div key={b.id}
                                        initial={{ opacity: 0, y: 3 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: Math.min(track * 0.04, 0.15) }}
                                        onClick={() => openDetail(b.roomId, b.id)}
                                        className={'absolute rounded-[3px] flex items-center justify-center px-1 gap-0.5 cursor-pointer hover:scale-[1.03] hover:shadow-sm transition-all overflow-hidden z-20 border ' + barStyle}
                                        style={{ left: left + '%', width: width + '%', top: barTop, height: barHeight }}>
                                        <span className="truncate text-[8px] leading-none font-medium">{b.name}</span>
                                        <span className="shrink-0 text-[7px] leading-none font-medium opacity-60">{s}</span>
                                      </motion.div>
                                    )
                                  })}
                                </div>
                              )
                            })()}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop: horizontal scroll layout */}
              <div className="hidden lg:block overflow-x-auto overflow-y-visible">
                <div className={viewMode === 'week' ? 'min-w-0' : 'min-w-0'}>
                  <div className="grid" style={{ gridTemplateColumns: `110px repeat(${days.length}, 1fr)` }}>
                    <div className="sticky left-0 z-10 bg-white px-3 py-2.5 border-b border-r border-neutral-100 text-xs font-semibold text-neutral-500">
                      ห้อง
                    </div>
                    {days.map(d => (
                      <div key={d.dateStr}
                        className={`px-0.5 py-2 border-b border-r border-neutral-50 text-center text-[11px] font-medium transition-colors ${
                          d.isToday ? 'bg-lime-50 text-lime-700 font-bold' : 'text-neutral-400'
                        } ${d.dayOfWeek === 0 ? 'text-rose-400' : ''}`}>
                        <div>{d.day}</div>
                        <div className="text-[9px] opacity-60">{DAY_HEADERS[d.dayOfWeek]}</div>
                      </div>
                    ))}
                  </div>
                  {dailyRooms.map(room => {
                    const bookings = roomBookings[room.id] || []
                    return (
                      <div key={room.id} className="grid" style={{ gridTemplateColumns: `110px repeat(${days.length}, 1fr)` }}>
                        <div className="sticky left-0 z-10 bg-white px-3 py-3 border-b border-r border-neutral-50 text-sm font-medium text-neutral-700 truncate flex items-center gap-2">
                          {roomLabel(room)}
                          {(() => {
                            if (!room.residentId && !room.tenantName) return null
                            const res = dailyResidents.find(r => r.id === room.residentId)
                            if (res && res.moveInDate) {
                              const today = new Date()
                              today.setHours(0, 0, 0, 0)
                              const inDate = new Date(res.moveInDate)
                              inDate.setHours(0, 0, 0, 0)
                              if (inDate > today) return <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            }
                            return <span className="w-1.5 h-1.5 rounded-full bg-lime-500 shrink-0" />
                          })()}
                        </div>
                        {(() => {
                          const maxTracks = Math.max(1, ...bookings.map(b => b.totalTracks || 1))
                          const rowHeight = Math.max(52, maxTracks * 52)
                          return (
                            <div className="relative col-span-full" style={{ gridColumn: '2 / ' + (days.length + 2), minHeight: rowHeight + 'px' }}>
                              <div className="grid h-full" style={{ gridTemplateColumns: 'repeat(' + days.length + ', 1fr)' }}>
                                {days.map(d => (
                                  <div key={d.dateStr}
                                    onClick={() => openAdd(d.dateStr)}
                                    className={`border-b border-r border-neutral-50 transition-colors cursor-pointer hover:bg-lime-50/30 ${
                                      d.isToday ? 'bg-lime-50/50' : ''
                                    }`} />
                                ))}
                              </div>
                              {bookings.map(b => {
                                const left = ((b.startDay - 1) / days.length) * 100
                                const width = ((b.endDay - b.startDay + 1) / days.length) * 100
                                const track = b.track || 0
                                const totalTracks = b.totalTracks || 1
                                const barTop = totalTracks > 1 ? ((track / totalTracks) * rowHeight) + 2 + 'px' : '2px'
                                const barHeight = totalTracks > 1 ? ((1 / totalTracks) * rowHeight) - 4 + 'px' : (rowHeight - 4) + 'px'
                                const s = bookingStatus(b)
                                const barStyle = s === 'จอง' ? 'bg-amber-100 text-amber-800 border-amber-200' : s === 'เช็คอิน' ? 'bg-lime-100 text-lime-800 border-lime-200' : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                                return (
                                  <motion.div key={b.id}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25, delay: Math.min(track * 0.04, 0.2) }}
                                    onClick={() => openDetail(b.roomId, b.id)}
                                    className={'absolute rounded-[3px] flex items-center justify-center px-1 gap-1 cursor-pointer hover:scale-[1.02] hover:shadow-sm transition-all overflow-hidden z-20 border ' + barStyle}
                                    style={{ left: left + '%', width: width + '%', top: barTop, height: barHeight }}>
                                    <span className="truncate text-xs font-medium">{b.name}</span>
                                    <span className="shrink-0 text-[10px] font-medium opacity-60">{s}</span>
                                  </motion.div>
                                )
                              })}
                            </div>
                          )
                        })()}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {dailyRooms.length > 0 && (
        <div className="mt-3 sm:mt-4 text-center sm:text-left text-[11px] sm:text-xs text-neutral-400">
          คลิกที่แถบจองเพื่อดูรายละเอียด • คลิกที่ช่องว่างเพื่อเพิ่มการจอง
        </div>
      )}

      {/* Add Booking Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)}>
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-neutral-100">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 text-sm sm:text-base shadow-sm shrink-0">📅</div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-neutral-800">เพิ่มการจอง</h3>
              <p className="text-xs text-neutral-400">บันทึกการจองห้องพักรายวัน</p>
            </div>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">ห้อง</label>
              <select value={formRoom} onChange={e => setFormRoom(e.target.value)}
                className="w-full h-9 sm:h-10 px-3 rounded-xl border border-neutral-200 text-sm text-neutral-800 bg-white focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 transition-all">
                {dailyRooms.map(r => {
                  const existingRes = dailyResidents.find(x => x.id === r.residentId)
                  const label = existingRes
                    ? `(เช็คเอาท์ ${new Date(existingRes.moveOutDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })})`
                    : '(ว่าง)'
                  return (
                    <option key={r.id} value={r.id}>
                      ห้อง {roomLabel(r)} {label}
                    </option>
                  )
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">ชื่อผู้เข้าพัก</label>
              <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                placeholder="ชื่อ-นามสกุล"
                className="w-full h-9 sm:h-10 px-3 rounded-xl border border-neutral-200 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">วันที่เช็คอิน</label>
                <DatePickerField
                  selected={formCheckIn ? new Date(formCheckIn + 'T00:00:00') : null}
                  onChange={(date) => setFormCheckIn(date ? date.toISOString().split('T')[0] : '')}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">วันที่เช็คเอาท์</label>
                <DatePickerField
                  selected={formCheckOut ? new Date(formCheckOut + 'T00:00:00') : null}
                  onChange={(date) => setFormCheckOut(date ? date.toISOString().split('T')[0] : '')}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">เตียงเสริม</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setFormExtraBed(Math.max(0, formExtraBed - 1))}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors text-base sm:text-lg font-medium">−</button>
                  <span className="w-7 sm:w-8 text-center text-sm font-semibold text-neutral-800">{formExtraBed}</span>
                  <button type="button" onClick={() => setFormExtraBed(Math.min(5, formExtraBed + 1))}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors text-base sm:text-lg font-medium">+</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">ส่วนลด (บาท)</label>
                <input type="number" min="0" value={formDiscount} onChange={e => setFormDiscount(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full h-9 sm:h-10 px-3 rounded-xl border border-neutral-200 text-sm text-neutral-800 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 transition-all" />
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-neutral-100">
            <button onClick={() => setShowAdd(false)} disabled={saving}
              className="h-9 sm:h-10 px-4 sm:px-5 rounded-xl text-sm font-medium text-neutral-500 hover:bg-neutral-100 transition-colors">ยกเลิก</button>
            <button onClick={handleSave} disabled={saving}
              className="h-9 sm:h-10 px-4 sm:px-5 rounded-xl text-sm font-semibold text-white bg-lime-500 hover:bg-lime-600 transition-all shadow-sm disabled:opacity-50">
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
          </div>
        </div>
      </Modal>

      {/* Booking Detail Modal */}
      <Modal open={showDetail} onClose={() => { setShowDetail(false); setDetailRoomId(null); setDetailResidentId(null); setIsEditingDetail(false) }}>
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-neutral-100">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 text-sm sm:text-base shadow-sm shrink-0">📋</div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-neutral-800">{isEditingDetail ? 'แก้ไขการจอง' : 'รายละเอียดการจอง'}</h3>
            </div>
          </div>
          {(() => {
            const room = rooms.find(r => r.id === detailRoomId) || (detailResidentId ? (() => { const res = residents.find(x => x.id === detailResidentId); return res?.roomNumber ? rooms.find(x => roomLabel(x) === res.roomNumber) : undefined })() : undefined)
            const resident = residents.find(r => r.id === detailResidentId)
            if (!resident) return <p className="text-sm text-neutral-400 text-center py-4">ไม่พบข้อมูล</p>
            if (!room && !isEditingDetail) return (
              <>
                <p className="text-sm text-neutral-400 text-center py-4">ไม่พบข้อมูลห้อง</p>
                <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-neutral-100">
                  <button onClick={() => { setShowDetail(false); setDetailRoomId(null); setDetailResidentId(null) }}
                    className="h-9 sm:h-10 px-4 sm:px-5 rounded-xl text-sm font-medium text-neutral-500 hover:bg-neutral-100 transition-colors">ปิด</button>
                </div>
              </>
            )
            if (isEditingDetail) {
              return (
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">ชื่อผู้เข้าพัก</label>
                    <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                      className="w-full h-9 sm:h-10 px-3 rounded-xl border border-neutral-200 text-sm text-neutral-800 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">เช็คอิน</label>
                      <DatePickerField
                        selected={formCheckIn ? new Date(formCheckIn + 'T00:00:00') : null}
                        onChange={(date) => setFormCheckIn(date ? date.toISOString().split('T')[0] : '')}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">เช็คเอาท์</label>
                      <DatePickerField
                        selected={formCheckOut ? new Date(formCheckOut + 'T00:00:00') : null}
                        onChange={(date) => setFormCheckOut(date ? date.toISOString().split('T')[0] : '')}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">เตียงเสริม</label>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setFormExtraBed(Math.max(0, formExtraBed - 1))}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors text-base sm:text-lg font-medium">−</button>
                        <span className="w-7 sm:w-8 text-center text-sm font-semibold text-neutral-800">{formExtraBed}</span>
                        <button type="button" onClick={() => setFormExtraBed(Math.min(5, formExtraBed + 1))}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors text-base sm:text-lg font-medium">+</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">ส่วนลด (บาท)</label>
                      <input type="number" min="0" value={formDiscount} onChange={e => setFormDiscount(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full h-9 sm:h-10 px-3 rounded-xl border border-neutral-200 text-sm text-neutral-800 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 transition-all" />
                    </div>
                  </div>
                </div>
              )
            }
            const formatDate = (d) => {
              if (!d) return '—'
              return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
            }
            return (
              <dl className="divide-y divide-neutral-50">
                <div className="py-2.5 sm:py-3 flex justify-between">
                  <dt className="text-xs sm:text-sm text-neutral-500">ชื่อห้อง</dt>
                  <dd className="text-xs sm:text-sm font-medium text-neutral-800">{room.roomNumber || room.number}</dd>
                </div>
                <div className="py-2.5 sm:py-3 flex justify-between">
                  <dt className="text-xs sm:text-sm text-neutral-500">ชื่อผู้พัก</dt>
                  <dd className="text-xs sm:text-sm font-medium text-neutral-800">{resident.name}</dd>
                </div>
                <div className="py-2.5 sm:py-3 flex justify-between">
                  <dt className="text-xs sm:text-sm text-neutral-500">เตียงเสริม</dt>
                  <dd className="text-xs sm:text-sm font-medium text-neutral-800">{room.extraBed || 0} เตียง</dd>
                </div>
                <div className="py-2.5 sm:py-3 flex justify-between">
                  <dt className="text-xs sm:text-sm text-neutral-500">มัดจำ</dt>
                  <dd className="text-xs sm:text-sm font-medium text-neutral-800">{resident.deposit ? `${resident.deposit.toLocaleString()} บาท` : '—'}</dd>
                </div>
                <div className="py-2.5 sm:py-3 flex justify-between">
                  <dt className="text-xs sm:text-sm text-neutral-500">เช็คอิน</dt>
                  <dd className="text-xs sm:text-sm font-medium text-neutral-800">{formatDate(resident.moveInDate)}</dd>
                </div>
                <div className="py-2.5 sm:py-3 flex justify-between">
                  <dt className="text-xs sm:text-sm text-neutral-500">เช็คเอาท์</dt>
                  <dd className="text-xs sm:text-sm font-medium text-neutral-800">{formatDate(resident.moveOutDate)}</dd>
                </div>
                {room.discount > 0 && (
                  <div className="py-2.5 sm:py-3 flex justify-between">
                    <dt className="text-xs sm:text-sm text-neutral-500">ส่วนลด</dt>
                    <dd className="text-xs sm:text-sm font-medium text-rose-600">{room.discount.toLocaleString()} บาท</dd>
                  </div>
                )}
              </dl>
            )
          })()}
          <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-neutral-100">
            {isEditingDetail ? (
              <>
                <button onClick={() => { setIsEditingDetail(false) }} disabled={saving}
                  className="h-9 sm:h-10 px-4 sm:px-5 rounded-xl text-sm font-medium text-neutral-500 hover:bg-neutral-100 transition-colors">ยกเลิก</button>
                <button onClick={handleEditSave} disabled={saving}
                  className="h-9 sm:h-10 px-4 sm:px-5 rounded-xl text-sm font-semibold text-white bg-lime-500 hover:bg-lime-600 transition-all shadow-sm disabled:opacity-50">
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
              </>
            ) : (
              <>
                <button onClick={() => { setShowDetail(false); setDetailRoomId(null); setDetailResidentId(null); setIsEditingDetail(false) }}
                  className="h-9 sm:h-10 px-4 sm:px-5 rounded-xl text-sm font-medium text-neutral-500 hover:bg-neutral-100 transition-colors">ปิด</button>
                <button onClick={() => {
                  const rm = rooms.find(r => r.id === detailRoomId)
                  const rs = residents.find(r => r.id === detailResidentId)
                  if (rm && rs) {
                    setFormName(rs.name || '')
                    setFormCheckIn(rs.moveInDate ? rs.moveInDate.split('T')[0] : '')
                    setFormCheckOut(rs.moveOutDate ? rs.moveOutDate.split('T')[0] : '')
                    setFormExtraBed(rm.extraBed || 0)
                    setFormDiscount(rm.discount || 0)
                  }
                  setIsEditingDetail(true)
                }}
                  className="h-9 sm:h-10 px-4 sm:px-5 rounded-xl text-sm font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-all shadow-sm">แก้ไข</button>
                <button onClick={() => { navigate(`/rooms/${detailRoomId}`) }}
                  className="h-9 sm:h-10 px-4 sm:px-5 rounded-xl text-sm font-semibold text-white bg-lime-500 hover:bg-lime-600 transition-all shadow-sm">ไปหน้าห้องพัก</button>
              </>
            )}
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
