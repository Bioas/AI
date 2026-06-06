import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/api'
import { formatThaiDate } from '../lib/constants'
import DatePickerField from './ui/datepicker'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import Badge from './ui/badge'
import Button from './ui/button'
import Spinner from './ui/spinner'
import Modal from './ui/modal'

const TABS = [
  { id: 'detail', label: 'รายละเอียด' },
  { id: 'guest', label: 'ผู้พัก' },
  { id: 'billing', label: 'ออกบิล' },
  { id: 'history', label: 'ประวัติ' },
]

export default function RoomDetailDaily() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { rooms, residents, invoices, meters, lineUsers, settings, setEditRoom, setEditResident, setViewOnly, setModal, deleteRoom, deleteResident, fetchRooms, fetchAll, assignResidentToRoom, calcInv, saveInvoice, setViewInv, downloadPdf, sendPdfToLine, toast } = useApp()
  const [activeTab, setActiveTab] = useState('detail')
  const [showSelectResident, setShowSelectResident] = useState(false)
  const [searchResident, setSearchResident] = useState('')
  const [showDeleteOptions, setShowDeleteOptions] = useState(false)
  const [confirmDeleteRoom, setConfirmDeleteRoom] = useState(false)
  const [confirmDeleteResident, setConfirmDeleteResident] = useState(false)
  const [selectedResidentForDates, setSelectedResidentForDates] = useState(null)
  const [checkInDate, setCheckInDate] = useState(null)
  const [checkOutDate, setCheckOutDate] = useState(null)
  const [assignExtraBed, setAssignExtraBed] = useState(0)
  const [assignDiscount, setAssignDiscount] = useState(0)
  const [billMonth, setBillMonth] = useState(new Date().toISOString().split('T')[0])
  const [confirmCancelPayment, setConfirmCancelPayment] = useState(false)
  const [cancelInvId, setCancelInvId] = useState(null)

  const room = useMemo(() => rooms.find(r => r.id === id), [rooms, id])
  const resident = useMemo(() => {
    if (!room) return null
    const now = new Date()
    const todayBkk = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    const bkkHour = Number(now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit' }))
    const daily = residents.filter(r =>
      r.roomId === room.id &&
      (r.rentalType === 'daily' || r.rentalType === 'รายวัน')
    )
    for (const res of daily) {
      const inBkk = new Date(res.moveInDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
      const outBkk = new Date(res.moveOutDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
      if (outBkk < todayBkk) continue
      if (outBkk === todayBkk && bkkHour >= 12) continue
      if (inBkk > todayBkk) continue
      if (inBkk === todayBkk && bkkHour < 14) continue
      return res
    }
    return null
  }, [room, residents])

  const pastResidents = useMemo(() => {
    if (!room) return []
    const now = new Date()
    const todayBkk = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    const bkkHour = Number(now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit' }))
    const roomInvNames = [...new Set(invoices.filter(x => x.roomId === room.id).map(x => x.tenantName).filter(Boolean))]
    const daily = residents.filter(r =>
      r.rentalType === 'daily' || r.rentalType === 'รายวัน'
    )
    return daily.filter(r => {
      if (r.id === resident?.id) return false
      const inRoom = r.roomId === room.id
      const wasInRoom = (!r.roomId || r.roomId === '') && roomInvNames.includes(r.name)
      if (!inRoom && !wasInRoom) return false
      const outBkk = new Date(r.moveOutDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
      if (outBkk < todayBkk) return true
      if (outBkk === todayBkk && bkkHour >= 12) return true
      return false
    }).sort((a, b) => new Date(b.moveOutDate) - new Date(a.moveOutDate))
  }, [room, residents, invoices, resident])

  const upcomingResident = useMemo(() => {
    if (!room) return null
    const now = new Date()
    const todayBkk = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    const bkkHour = Number(now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit' }))
    const daily = residents.filter(r =>
      r.roomId === room.id &&
      (r.rentalType === 'daily' || r.rentalType === 'รายวัน')
    ).sort((a, b) => new Date(a.moveInDate) - new Date(b.moveInDate))
    for (const res of daily) {
      const inBkk = new Date(res.moveInDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
      if (inBkk > todayBkk) return res
      if (inBkk === todayBkk && bkkHour < 14) return res
    }
    return null
  }, [room, residents])

  const roomInvoices = useMemo(() => {
    if (!room) return []
    return invoices.filter(x => x.roomId === room.id).sort((a, b) => b.month.localeCompare(a.month))
  }, [invoices, room])

  const unassignedResidents = useMemo(() => {
    const now = new Date()
    return residents.filter(r => {
      if (r.rentalType !== 'daily' && r.rentalType !== 'รายวัน') return false
      if (!r.roomId || r.roomId === '') return true
      if (r.moveOutDate) {
        const outDate = new Date(r.moveOutDate)
        if (outDate < now) return true
      }
      return false
    }).sort((a, b) => a.name.localeCompare(b.name))
  }, [residents])

  const filteredUnassigned = useMemo(() => {
    if (!searchResident.trim()) return unassignedResidents
    const q = searchResident.trim().toLowerCase()
    return unassignedResidents.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.phone.includes(q) ||
      r.idCard?.includes(q)
    )
  }, [unassignedResidents, searchResident])

  const handleSelectResident = (residentId) => {
    const r = residents.find(x => x.id === residentId)
    if (!r) return
    setSelectedResidentForDates(r)
    setCheckInDate(r.moveInDate ? new Date(r.moveInDate) : new Date())
    setCheckOutDate(r.moveOutDate ? new Date(r.moveOutDate) : null)
    setAssignExtraBed(0)
    setAssignDiscount(0)
    setShowSelectResident(false)
    setSearchResident('')
  }

  const confirmAssignWithDates = async () => {
    if (!selectedResidentForDates || !checkInDate || !checkOutDate) {
      toast('กรุณาเลือกวันเช็คอินและเช็คเอาท์', true)
      return
    }
    try {
      const r = selectedResidentForDates
      await api('/api/residents', 'PUT', {
        id: r.id,
        name: r.name,
        idCard: r.idCard,
        phone: r.phone,
        email: r.email || '',
        roomId: room.id,
        moveInDate: checkInDate.toISOString(),
        moveOutDate: checkOutDate.toISOString(),
        deposit: r.deposit,
        licensePlate: r.licensePlate || '',
        emergencyContact: r.emergencyContact || '',
        emergencyPhone: r.emergencyPhone || '',
        lineUserId: r.lineUserId || '',
        rentalType: r.rentalType || room.rentalType || 'daily',
        tenantType: r.tenantType || 'individual',
        companyName: r.companyName || '',
        companyAddress: r.companyAddress || '',
        companyTaxId: r.companyTaxId || '',
      })
      await api('/api/rooms', 'PUT', {
        id: room.id,
        roomNumber: room.roomNumber,
        roomCode: room.roomCode || '',
        rentPrice: room.rentPrice,
        rentalType: 'daily',
        roomType: room.roomType,
        prevElecMeter: room.prevElecMeter || 0,
        prevWaterMeter: room.prevWaterMeter || 0,
        extraBed: assignExtraBed,
        discount: assignDiscount,
        note: room.note || '',
        residentId: r.id,
      })
      await fetchRooms()
      setSelectedResidentForDates(null)
      setCheckInDate(null)
      setCheckOutDate(null)
      setAssignExtraBed(0)
      setAssignDiscount(0)
      toast('มอบหมายผู้เช่าเข้าห้องสำเร็จ')
    } catch (e) {
      toast(`ไม่สำเร็จ: ${e.message}`, true)
    }
  }

  if (!room) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <svg className="w-14 h-14 mx-auto mb-4 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">ไม่พบห้องนี้</h3>
            <p className="text-sm text-neutral-500 mb-4">ห้องที่คุณกำลังมองหาไม่มีอยู่ในระบบ</p>
            <Button onClick={() => navigate('/rooms')}>กลับหน้าจัดการห้อง</Button>
          </div>
        </div>
      </motion.div>
    )
  }

  const displayNumber = room.roomNumber || room.number
  const displayRent = room.rentPrice || room.rent
  const isDaily = room.rentalType === 'daily' || room.rentalType === 'รายวัน'
  const status = resident
    ? { label: 'มีผู้พัก', variant: 'success' }
    : upcomingResident
      ? { label: 'กำลังจะมีผู้เข้าพัก', variant: 'warning' }
      : { label: 'ว่าง', variant: 'default' }

  const handleEdit = () => { setEditRoom(room); setModal('room') }
  const handleDelete = () => {
    setConfirmDeleteRoom(true)
  }

  const handleConfirmDelete = () => {
    setConfirmDeleteRoom(false)
    deleteRoom(room.id)
    navigate('/rooms')
  }

  const handleAddResident = () => {
    setEditResident({ roomId: room.id, rentalType: 'daily' })
    setViewOnly(false)
    setModal('resident')
  }

  const handleEditResident = () => {
    if (resident) {
      setEditResident({ ...resident, rentalType: 'daily' })
      setViewOnly(false)
      setModal('resident')
    }
  }

  const handleDeleteResident = () => {
    if (resident) setShowDeleteOptions(true)
  }

  const handleRemoveFromRoom = async () => {
    if (!resident) return
    try {
      await api('/api/residents', 'PUT', {
        id: resident.id,
        name: resident.name,
        idCard: resident.idCard,
        phone: resident.phone,
        email: resident.email || '',
        roomId: '',
        moveInDate: resident.moveInDate,
        moveOutDate: resident.moveOutDate,
        deposit: resident.deposit,
        licensePlate: resident.licensePlate || '',
        emergencyContact: resident.emergencyContact || '',
        emergencyPhone: resident.emergencyPhone || '',
        lineUserId: resident.lineUserId || '',
        rentalType: 'daily',
        tenantType: resident.tenantType || 'individual',
        companyName: resident.companyName || '',
        companyAddress: resident.companyAddress || '',
        companyTaxId: resident.companyTaxId || '',
      })
      await api('/api/rooms', 'PUT', {
        id: room.id,
        roomNumber: room.roomNumber,
        roomCode: room.roomCode || '',
        rentPrice: room.rentPrice,
        rentalType: 'daily',
        roomType: room.roomType,
        prevElecMeter: room.prevElecMeter || 0,
        prevWaterMeter: room.prevWaterMeter || 0,
        extraBed: 0,
        discount: 0,
        note: room.note || '',
        residentId: null,
      })
      await fetchRooms()
      setShowDeleteOptions(false)
      toast('ย้ายผู้พักออกจากห้องสำเร็จ')
    } catch (e) {
      toast(`ไม่สำเร็จ: ${e.message}`, true)
    }
  }

  const handleDeleteFromSystem = () => {
    setConfirmDeleteResident(true)
  }

  const handleConfirmDeleteResident = () => {
    setConfirmDeleteResident(false)
    deleteResident(resident.id)
    fetchRooms()
    setShowDeleteOptions(false)
  }

  const formatDate = (d) => {
    if (!d) return '—'
    return formatThaiDate(d)
  }

  const getLineName = (lineUserId) => {
    if (!lineUserId) return null
    const u = lineUsers.find(x => x.userId === lineUserId)
    return u ? u.displayName : null
  }

  const getDailyStatus = (r) => {
    if (!r?.moveOutDate) return { label: 'เช็คอิน', variant: 'success' }
    const now = new Date()
    const todayBkk = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    const inBkk = new Date(r.moveInDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    const outBkk = new Date(r.moveOutDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    const bkkHour = Number(now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit' }))
    if (inBkk > todayBkk || (inBkk === todayBkk && bkkHour < 14)) return { label: 'จอง', variant: 'warning' }
    if (outBkk > todayBkk || (outBkk === todayBkk && bkkHour < 12)) return { label: 'เช็คอิน', variant: 'success' }
    return { label: 'เช็คเอาท์แล้ว', variant: 'default' }
  }

  const renderDetail = () => (
    <div className="space-y-6">
      <Card><CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-sky-400 to-sky-500" />
          <h3 className="text-sm font-semibold text-neutral-800">ข้อมูลห้อง</h3>
        </div>
        <dl className="divide-y divide-neutral-50">
          <div className="py-3 flex justify-between">
            <dt className="text-sm text-neutral-500">หมายเลขห้อง</dt>
            <dd className="text-sm font-medium text-neutral-800">{displayNumber}</dd>
          </div>
          {room.roomCode && (
            <div className="py-3 flex justify-between">
              <dt className="text-sm text-neutral-500">รหัสห้อง</dt>
              <dd className="text-sm font-medium text-neutral-800">{room.roomCode}</dd>
            </div>
          )}
          <div className="py-3 flex justify-between">
            <dt className="text-sm text-neutral-500">ประเภทห้อง</dt>
            <dd className="text-sm font-medium text-neutral-800">{room.roomType || 'ไม่มีทีวี'}</dd>
          </div>
          <div className="py-3 flex justify-between">
            <dt className="text-sm text-neutral-500">ประเภทการเช่า</dt>
            <dd className="text-sm font-medium text-neutral-800">{room.rentalType === 'daily' ? 'รายวัน' : room.rentalType === 'monthly' ? 'รายเดือน' : room.rentalType || 'รายวัน'}</dd>
          </div>
          <div className="py-3 flex justify-between">
            <dt className="text-sm text-neutral-500">ค่าเช่า/วัน</dt>
            <dd className="text-sm font-medium text-neutral-800">{displayRent?.toLocaleString()} บาท</dd>
          </div>
          {room.extraBed > 0 && (
            <div className="py-3 flex justify-between">
              <dt className="text-sm text-neutral-500">เตียงเสริม</dt>
              <dd className="text-sm font-medium text-neutral-800">{room.extraBed} เตียง</dd>
            </div>
          )}
          {room.discount > 0 && (
            <div className="py-3 flex justify-between">
              <dt className="text-sm text-neutral-500">ส่วนลด</dt>
              <dd className="text-sm font-medium text-rose-600">{room.discount.toLocaleString()} บาท</dd>
            </div>
          )}
          <div className="py-3 flex justify-between">
            <dt className="text-sm text-neutral-500">สถานะ</dt>
            <dd><Badge variant={status.variant}>{status.label}</Badge></dd>
          </div>
          {room.note && (
            <div className="py-3 flex justify-between">
              <dt className="text-sm text-neutral-500">หมายเหตุ</dt>
              <dd className="text-sm text-neutral-700">{room.note}</dd>
            </div>
          )}
        </dl>
      </CardContent></Card>
    </div>
  )

  const renderGuest = () => {
    if (!resident) {
      return (
        <div className="space-y-6">
          <Card><CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-lime-400 to-lime-500" />
              <h3 className="text-sm font-semibold text-neutral-800">เพิ่มผู้พักให้กับห้องนี้</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => setShowSelectResident(true)}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-lime-200 hover:border-lime-400 hover:bg-lime-50/50 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-lime-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-lime-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-neutral-800">เลือกผู้พักที่มีอยู่แล้ว</div>
                  <div className="text-xs text-neutral-400 mt-1">มี {unassignedResidents.length} คนที่ยังไม่มีห้อง</div>
                </div>
              </button>
              <button onClick={handleAddResident}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-sky-200 hover:border-sky-400 hover:bg-sky-50/50 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-neutral-800">เพิ่มผู้พักใหม่</div>
                  <div className="text-xs text-neutral-400 mt-1">กรอกข้อมูลผู้พักใหม่ทั้งหมด</div>
                </div>
              </button>
            </div>
          </CardContent></Card>
        </div>
      )
    }

    const dailyStatus = getDailyStatus(resident)

    return (
      <div className="space-y-6">
        <Card><CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
             <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-lime-400 to-lime-500" />
              <h3 className="text-sm font-semibold text-neutral-800">ข้อมูลผู้พักปัจจุบัน</h3>
             </div>
             <div className="flex gap-1.5 sm:gap-2">
               <Button size="sm" onClick={handleEditResident}><span className="sm:hidden"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></span><span className="hidden sm:inline">แก้ไข</span></Button>
               <Button variant="danger" size="sm" onClick={handleDeleteResident}><span className="sm:hidden"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></span><span className="hidden sm:inline">ลบ</span></Button>
             </div>
           </div>

          <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-lime-50 border border-lime-100">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 shadow-sm">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div className="flex-1">
              <div className="text-base font-bold text-neutral-800">{resident.name}</div>
              <div className="text-sm text-neutral-500">{resident.phone}</div>
            </div>
            <Badge variant={dailyStatus.variant}>{dailyStatus.label}</Badge>
          </div>

          <dl className="divide-y divide-neutral-50">
            <div className="py-3 flex justify-between">
              <dt className="text-sm text-neutral-500">เลขบัตรประชาชน</dt>
              <dd className="text-sm font-medium text-neutral-800">{resident.idCard?.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5')}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-sm text-neutral-500">เบอร์โทรศัพท์</dt>
              <dd className="text-sm font-medium text-neutral-800">{resident.phone}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-sm text-neutral-500">อีเมล</dt>
              <dd className="text-sm font-medium text-neutral-800">{resident.email || <span className="text-neutral-300 italic">—</span>}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-sm text-neutral-500">เช็คอิน</dt>
              <dd className="text-sm font-medium text-neutral-800">{formatDate(resident.moveInDate)}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-sm text-neutral-500">เช็คเอาท์</dt>
              <dd className="text-sm font-medium text-neutral-800">{formatDate(resident.moveOutDate)}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-sm text-neutral-500">ค่ามัดจำ</dt>
              <dd className="text-sm font-medium text-neutral-800">{resident.deposit ? `${resident.deposit.toLocaleString()} บาท` : <span className="text-neutral-300 italic">—</span>}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-sm text-neutral-500">ทะเบียนรถ</dt>
              <dd className="text-sm font-medium text-neutral-800">{resident.licensePlate || <span className="text-neutral-300 italic">—</span>}</dd>
            </div>
            {resident.tenantType === 'company' && (
              <>
                <div className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                  <dt className="text-sm text-neutral-500">ชื่อบริษัท</dt>
                  <dd className="text-sm font-medium text-neutral-800">{resident.companyName || <span className="text-neutral-300 italic">—</span>}</dd>
                </div>
                <div className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                  <dt className="text-sm text-neutral-500">ที่อยู่บริษัท</dt>
                  <dd className="text-sm font-medium text-neutral-800">{resident.companyAddress || <span className="text-neutral-300 italic">—</span>}</dd>
                </div>
                <div className="py-3 flex justify-between">
                  <dt className="text-sm text-neutral-500">เลขประจำตัวผู้เสียภาษี</dt>
                  <dd className="text-sm font-medium text-neutral-800">{resident.companyTaxId || <span className="text-neutral-300 italic">—</span>}</dd>
                </div>
              </>
            )}
          </dl>
        </CardContent></Card>
      </div>
    )
  }

  const renderBilling = () => {
    const inv = room && billMonth ? calcInv(room, billMonth) : null
    return (
      <Card><CardContent className="pt-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-500" />
            <h3 className="text-sm font-semibold text-neutral-800">ออกบิล</h3>
          </div>
          <div className="w-40">
            <DatePickerField
              selected={billMonth ? new Date(billMonth) : new Date()}
              onChange={d => { if (d) setBillMonth(d.toISOString().split('T')[0]) }} />
          </div>
        </div>
        {inv ? (
          <div className="rounded-2xl bg-white border border-neutral-100 shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-3 border-b border-neutral-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 text-sm shadow-sm">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v12"/><path d="M9 9.5c0-1 1.5-1.5 3-1.5s3 .5 3 1.5"/><path d="M9 14.5c0 1 1.5 1.5 3 1.5s3-.5 3-1.5"/></svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-neutral-800">สรุปค่าใช้จ่าย</div>
                    <div className="text-[10px] text-neutral-400">ห้อง {displayNumber}</div>
                  </div>
                </div>
                <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${inv._saved && inv.paid ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${inv._saved && inv.paid ? 'bg-green-500' : 'bg-amber-500'}`} />
                  {inv._saved && inv.paid ? 'ชำระแล้ว' : 'รอชำระ'}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 space-y-2">
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400">
                    <svg className="w-3.5 h-3.5 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  </span>
                  <span className="text-sm text-neutral-600">ค่าเช่า</span>
                </div>
                <span className="text-sm font-semibold text-neutral-800">{inv.rent?.toLocaleString()} บาท</span>
              </div>
              {inv.days > 1 && (
                <div className="flex items-center justify-between py-1.5 pl-5">
                  <span className="text-xs text-neutral-400">{inv.rent / inv.days} บาท × {inv.days} คืน</span>
                  <span className="text-xs text-neutral-400">—</span>
                </div>
              )}
              {inv.discount > 0 && (
                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">
                      <svg className="w-3.5 h-3.5 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                    </span>
                    <span className="text-sm text-neutral-600">ส่วนลด</span>
                  </div>
                  <span className="text-sm font-semibold text-rose-500">-{inv.discount.toLocaleString()} บาท</span>
                </div>
              )}
              {inv.extraBedCost > 0 && (
                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">
                      <svg className="w-3.5 h-3.5 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 4v16"/><path d="M2 8h20"/><path d="M22 8v12"/><path d="M6 8v12"/><rect x="2" y="12" width="20" height="4"/></svg>
                    </span>
                    <span className="text-sm text-neutral-600">เตียงเสริม</span>
                  </div>
                  <span className="text-sm text-neutral-800">{inv.extraBedCost.toLocaleString()} บาท</span>
                </div>
              )}
              {inv.elecCost > 0 && (
                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">
                      <svg className="w-3.5 h-3.5 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    </span>
                    <span className="text-sm text-neutral-600">ค่าไฟ</span>
                  </div>
                  <span className="text-sm text-neutral-800">{inv.elecCost?.toLocaleString()} บาท <span className="text-[11px] text-neutral-400">({inv.elecUnits || 0} หน่วย)</span></span>
                </div>
              )}
              {inv.waterCost > 0 && (
                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">
                      <svg className="w-3.5 h-3.5 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                    </span>
                    <span className="text-sm text-neutral-600">ค่าน้ำ</span>
                  </div>
                  <span className="text-sm text-neutral-800">{inv.waterCost?.toLocaleString()} บาท <span className="text-[11px] text-neutral-400">({inv.waterUnits || 0} หน่วย)</span></span>
                </div>
              )}
              {(inv.commonFee || 0) > 0 && (
                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">
                      <svg className="w-3.5 h-3.5 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><line x1="8" y1="6" x2="10" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="6" x2="16" y2="6"/><line x1="14" y1="10" x2="16" y2="10"/></svg>
                    </span>
                    <span className="text-sm text-neutral-600">ค่าส่วนกลาง</span>
                  </div>
                  <span className="text-sm font-semibold text-neutral-800">{inv.commonFee?.toLocaleString()} บาท</span>
                </div>
              )}
              {(inv.internetFee || 0) > 0 && (
                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">
                      <svg className="w-3.5 h-3.5 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    </span>
                    <span className="text-sm text-neutral-600">ค่าเน็ต</span>
                  </div>
                  <span className="text-sm font-semibold text-neutral-800">{inv.internetFee?.toLocaleString()} บาท</span>
                </div>
              )}
            </div>

            <div className="mx-5 my-2 h-px bg-gradient-to-r from-transparent via-lime-200 to-transparent" />

            <div className="px-5 pb-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-bold text-neutral-800">รวมทั้งสิ้น</span>
                <span className="text-lg font-bold text-lime-600">{inv.total?.toLocaleString()} บาท</span>
              </div>
            </div>

            <div className="px-5 pb-5 flex flex-wrap justify-end gap-2">
              <Button size="sm" onClick={() => { setViewInv({ ...inv, docNumber: '', _isDaily: true }); setModal('invoice') }}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                ใบแจ้งหนี้
              </Button>
              <Button size="sm" onClick={() => { setViewInv({ ...inv, docNumber: '', _isDaily: true }); setModal('receipt') }}> ใบเสร็จ</Button>
              {inv._saved && inv.paid ? (
                <Button size="sm" onClick={() => { setCancelInvId(inv._id); setConfirmCancelPayment(true) }}>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                  รอชำระ
                </Button>
              ) : (
                <Button size="sm" onClick={async () => {
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
                    toast('บันทึกและชำระสำเร็จ')
                  } catch (e) {
                    toast(`ไม่สำเร็จ: ${e.message}`, true)
                  }
                }}>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  ชำระแล้ว
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-neutral-100 shadow-sm">
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lime-100 to-lime-50 flex items-center justify-center mb-4 shadow-sm">
                <svg className="w-8 h-8 text-lime-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v12"/><path d="M9 9.5c0-1 1.5-1.5 3-1.5s3 .5 3 1.5"/><path d="M9 14.5c0 1 1.5 1.5 3 1.5s3-.5 3-1.5"/></svg>
              </div>
              <h4 className="text-base font-semibold text-neutral-700 mb-1">ยังไม่มีข้อมูลการออกบิล</h4>
              <p className="text-sm text-neutral-400 text-center max-w-xs">บันทึกค่ามิเตอร์และตรวจสอบข้อมูลผู้พักให้ครบถ้วนก่อนออกบิล</p>
            </div>
          </div>
        )}
      </div>
      </CardContent></Card>
    )
  }

  const renderHistory = () => {
    const guestMap = new Map()
    for (const r of pastResidents) {
      const days = Math.max(1, Math.ceil((new Date(r.moveOutDate) - new Date(r.moveInDate)) / (1000 * 60 * 60 * 24)))
      guestMap.set(r.id, {
        id: r.id, name: r.name, phone: r.phone,
        moveIn: r.moveInDate, moveOut: r.moveOutDate, days,
        source: 'resident',
      })
    }
    for (const inv of roomInvoices) {
      const name = inv.tenantName || 'ไม่ระบุ'
      const exists = [...guestMap.values()].find(g => g.name === name)
      if (!exists && inv.moveInDate && inv.moveOutDate) {
        const days = Math.max(1, Math.ceil((new Date(inv.moveOutDate) - new Date(inv.moveInDate)) / (1000 * 60 * 60 * 24)))
        guestMap.set('inv-' + name, {
          id: 'inv-' + name, name, phone: inv.tenantPhone || '',
          moveIn: inv.moveInDate, moveOut: inv.moveOutDate, days,
          source: 'invoice',
        })
      }
    }
    const invByGuest = new Map()
    for (const inv of roomInvoices) {
      const name = inv.tenantName || 'ไม่ระบุ'
      if (!invByGuest.has(name)) invByGuest.set(name, [])
      invByGuest.get(name).push(inv)
    }
    const entries = [...guestMap.values()].map(g => ({
      ...g, invoices: (invByGuest.get(g.name) || []).sort((a, b) => b.month.localeCompare(a.month)),
    }))
    entries.sort((a, b) => b.moveOut.localeCompare(a.moveOut))

    const hasData = entries.length > 0

    return (
    <Card><CardContent className="pt-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-5 rounded-full bg-gradient-to-b from-violet-400 to-violet-500" />
        <h3 className="text-sm font-semibold text-neutral-800">ประวัติการเข้าพัก</h3>
        {hasData && <span className="text-[10px] text-neutral-400 ml-auto">{entries.length} ท่าน</span>}
      </div>
      {hasData ? (
        <div className="relative">
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-violet-200 via-violet-100 to-transparent" />
          <div className="space-y-4">
            {entries.map((entry, i) => (
              <div key={entry.id} className="relative pl-8">
                <div className="absolute left-[5px] top-[14px] w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm bg-violet-400" />
                <div className="rounded-xl border border-violet-100/60 bg-violet-50/40 p-3 transition-all hover:shadow-sm hover:border-violet-200/60">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <svg className="w-3.5 h-3.5 text-violet-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <span className="text-sm font-semibold text-neutral-800 truncate">{entry.name}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span className="text-[10px] text-neutral-400">{formatDate(entry.moveIn)} → {formatDate(entry.moveOut)}</span>
                        <span className="text-[10px] font-medium text-violet-500">{entry.days} คืน</span>
                      </div>
                      {entry.phone && <div className="text-[10px] text-neutral-400 mt-0.5">
                        <svg className="w-3 h-3 inline mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        {entry.phone}
                      </div>}
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${entry.source === 'resident' ? 'bg-violet-100 text-violet-600' : 'bg-amber-100 text-amber-600'}`}>
                      {entry.source === 'resident' ? 'ผู้พัก' : 'จากบิล'}
                    </span>
                  </div>
                  {entry.invoices.length > 0 && (
                    <div className="border-t border-violet-100/60 pt-2 mt-1 space-y-1">
                      {entry.invoices.map(inv => (
                        <div key={inv.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/60">
                          <div className="flex items-center gap-2 min-w-0">
                            <svg className="w-3 h-3 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            <span className="text-xs text-neutral-500">{inv.month}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {inv.paid && <span className="text-[10px] text-emerald-500 font-medium">ชำระแล้ว</span>}
                            <span className="text-xs font-semibold text-neutral-700">{inv.total?.toLocaleString()} บาท</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center text-2xl mb-3 shadow-sm border border-violet-200/40">
            <svg className="w-6 h-6 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <h4 className="text-sm font-semibold text-neutral-700 mb-1">ไม่มีประวัติ</h4>
          <p className="text-xs text-neutral-400 text-center">ห้องนี้ยังไม่มีประวัติการเข้าพัก</p>
        </div>
      )}
    </CardContent></Card>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'detail': return renderDetail()
      case 'guest': return renderGuest()
      case 'billing': return renderBilling()
      case 'history': return renderHistory()
      default: return renderDetail()
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader
        title={`ห้อง ${displayNumber}`}
        description={resident ? resident.name : 'ห้องว่าง'}
        action={
          <div className="flex gap-1.5 sm:gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/rooms')}><span className="sm:hidden"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg></span><span className="hidden sm:inline">← กลับ</span></Button>
            <Button variant="outline" size="sm" onClick={handleEdit}><span className="sm:hidden"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></span><span className="hidden sm:inline">แก้ไข</span></Button>
            <Button variant="danger" size="sm" onClick={handleDelete}><span className="sm:hidden"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></span><span className="hidden sm:inline">ลบ</span></Button>
          </div>
        }
      />

      <Card className="mb-6 overflow-hidden">
        <div className="relative px-4 sm:px-6 py-5 sm:py-7">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 text-2xl sm:text-3xl font-bold shadow-lg shadow-lime-200/50">
                {room.roomCode || displayNumber}
              </div>
              <div className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                status.variant === 'success' ? 'bg-lime-500' : status.variant === 'warning' ? 'bg-amber-400' : 'bg-neutral-300'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg sm:text-xl font-bold text-neutral-800 truncate">ห้อง {displayNumber}</h2>
                <Badge variant={status.variant} className="shrink-0">{status.label}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-neutral-500">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-lime-50 text-lime-600 shrink-0">รายวัน</span>
                <span>{room.roomType || 'ไม่มีทีวี'}</span>
                <span className="text-neutral-300 hidden sm:inline">•</span>
                <span className="font-medium">{displayRent?.toLocaleString()} บาท/วัน</span>
              </div>
              {resident && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-neutral-100">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white shrink-0">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <span className="text-sm text-neutral-600 truncate">{resident.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {resident ? (
        <>
          <div className="flex gap-0.5 sm:gap-1 mb-6 bg-white rounded-2xl p-1.5 shadow-sm border border-neutral-100 sm:overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1 px-1 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                   activeTab === tab.id
                     ? 'bg-lime-500 text-white shadow-sm'
                     : 'text-neutral-500 hover:bg-neutral-50'
                 }`}>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {renderContent()}
        </>
      ) : (
        <Card><CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-3xl bg-lime-100 flex items-center justify-center mx-auto mb-4">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-lime-600"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h3 className="text-lg font-bold text-neutral-800 mb-2">ห้องนี้ยังไม่มีผู้พัก</h3>
            <p className="text-sm text-neutral-500 mb-6">เพิ่มผู้พักเพื่อเริ่มจัดการข้อมูลห้องนี้</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={handleAddResident}> เพิ่มผู้พักใหม่</Button>
              <Button variant="outline" onClick={() => setShowSelectResident(true)}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                เลือกผู้พักที่มีอยู่แล้ว
              </Button>
            </div>
          </div>
        </CardContent></Card>
      )}

      {showSelectResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => { setShowSelectResident(false); setSearchResident('') }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-neutral-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-neutral-800">เลือกผู้พักที่มีอยู่แล้ว</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">ห้อง {displayNumber}</p>
                </div>
                <button onClick={() => { setShowSelectResident(false); setSearchResident('') }} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="mt-3 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" value={searchResident} onChange={e => setSearchResident(e.target.value)}
                  placeholder="ค้นหาชื่อ เบอร์โทร..."
                  className="w-full h-9 pl-9 pr-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 transition-all" />
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {filteredUnassigned.length === 0 ? (
                <div className="text-center py-8 text-sm text-neutral-400">ไม่พบผู้พักที่สามารถเลือกได้</div>
              ) : (
                filteredUnassigned.map(r => (
                  <button key={r.id} onClick={() => handleSelectResident(r.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-lime-50 transition-colors text-left">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 shrink-0">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-neutral-800 truncate">{r.name}</div>
                        {r.tenantType === 'company' ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 bg-amber-50 text-amber-600">บริษัท</span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 bg-sky-50 text-sky-600">ทั่วไป</span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-400">{r.phone}{r.roomId ? ` • ห้อง ${rooms.find(x => x.id === r.roomId)?.roomNumber || ''}` : ' • ยังไม่มีห้อง'}</div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-neutral-300 shrink-0"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {selectedResidentForDates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => { setSelectedResidentForDates(null); setCheckInDate(null); setCheckOutDate(null); setAssignExtraBed(0); setAssignDiscount(0) }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-neutral-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-neutral-800">กำหนดวันเข้าพัก</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">{selectedResidentForDates.name} — ห้อง {displayNumber}</p>
                </div>
                <button onClick={() => { setSelectedResidentForDates(null); setCheckInDate(null); setCheckOutDate(null); setAssignExtraBed(0); setAssignDiscount(0) }} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">วันเช็คอิน *</label>
                <DatePickerField selected={checkInDate} onChange={setCheckInDate} />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">วันเช็คเอาท์ *</label>
                <DatePickerField selected={checkOutDate} onChange={setCheckOutDate} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">เตียงเสริม</label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setAssignExtraBed(Math.max(0, assignExtraBed - 1))}
                      className="w-9 h-9 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors text-lg font-medium">−</button>
                    <span className="w-8 text-center text-sm font-semibold text-neutral-800">{assignExtraBed}</span>
                    <button type="button" onClick={() => setAssignExtraBed(Math.min(5, assignExtraBed + 1))}
                      className="w-9 h-9 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors text-lg font-medium">+</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">ส่วนลด (บาท)</label>
                  <input type="number" min="0" value={assignDiscount} onChange={e => setAssignDiscount(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full h-9 px-3 rounded-xl border border-neutral-200 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 transition-all" />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-neutral-100 flex gap-3">
              <button onClick={() => { setSelectedResidentForDates(null); setCheckInDate(null); setCheckOutDate(null); setAssignExtraBed(0); setAssignDiscount(0) }}
                className="flex-1 h-10 rounded-xl text-sm font-medium text-neutral-500 hover:bg-neutral-100 transition-colors">
                ยกเลิก
              </button>
              <button onClick={confirmAssignWithDates}
                className="flex-1 h-10 rounded-xl text-sm font-semibold text-white bg-lime-500 hover:bg-lime-600 transition-colors shadow-sm">
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteRoom && (
        <Modal open={true} onClose={() => setConfirmDeleteRoom(false)} maxWidth="max-w-md">
          <div className="p-5">
            <h3 className="text-base font-bold text-neutral-800 mb-1">ลบห้อง</h3>
            <p className="text-sm text-neutral-600 mb-5">
              ต้องการลบห้อง <strong>{displayNumber}</strong> ใช่หรือไม่?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDeleteRoom(false)}
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

      {confirmDeleteResident && (
        <Modal open={true} onClose={() => setConfirmDeleteResident(false)} maxWidth="max-w-md">
          <div className="p-5">
            <h3 className="text-base font-bold text-neutral-800 mb-1">ลบผู้พัก</h3>
            <p className="text-sm text-neutral-600 mb-5">
              ต้องการลบข้อมูลผู้พัก <strong>{resident?.name}</strong> ออกจากระบบถาวรใช่หรือไม่?<br />
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDeleteResident(false)}
                className="flex-1 h-9 rounded-xl text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors">
                ยกเลิก
              </button>
              <button onClick={handleConfirmDeleteResident}
                className="flex-1 h-9 rounded-xl text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm">
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </Modal>
      )}

      {confirmCancelPayment && (
        <Modal open={true} onClose={() => setConfirmCancelPayment(false)} maxWidth="max-w-md">
          <div className="p-5">
            <h3 className="text-base font-bold text-neutral-800 mb-1">เปลี่ยนเป็นรอชำระ</h3>
            <p className="text-sm text-neutral-600 mb-5">
              ต้องการเปลี่ยนสถานะบิลของห้อง <strong>{displayNumber}</strong> ({resident?.name}) และลบเอกสารนี้ทิ้งใช่หรือไม่?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmCancelPayment(false)}
                className="flex-1 h-9 rounded-xl text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors">
                ยกเลิก
              </button>
              <button onClick={async () => {
                const id = cancelInvId
                setConfirmCancelPayment(false)
                setCancelInvId(null)
                try {
                  await api('/api/invoices', 'DELETE', { id })
                  await fetchAll()
                  toast('เปลี่ยนเป็นรอชำระแล้ว')
                } catch (e) {
                  toast(`ไม่สำเร็จ: ${e.message}`, true)
                }
              }}
                className="flex-1 h-9 rounded-xl text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 transition-colors shadow-sm">
                ยืนยัน
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteOptions && resident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteOptions(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-neutral-800">จัดการผู้พัก</h3>
                  <p className="text-xs text-neutral-400">{resident.name} — ห้อง {displayNumber}</p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <button onClick={handleRemoveFromRoom}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors text-left group">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-amber-800">ย้ายออกจากห้อง</div>
                  <div className="text-xs text-amber-600 mt-0.5">ผู้พักจะยังอยู่ในระบบ แต่จะออกจากห้องนี้ ห้องจะกลายเป็นห้องว่าง</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-amber-400 shrink-0"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <button onClick={handleDeleteFromSystem}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 transition-colors text-left group">
                <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-rose-800">ลบออกจากระบบ</div>
                  <div className="text-xs text-rose-600 mt-0.5">ลบข้อมูลผู้พักถาวร ไม่สามารถกู้คืนได้</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-rose-400 shrink-0"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            <div className="p-4 border-t border-neutral-100">
              <button onClick={() => setShowDeleteOptions(false)}
                className="w-full h-10 rounded-xl text-sm font-medium text-neutral-500 hover:bg-neutral-100 transition-colors">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
