import { motion } from 'framer-motion'
import { useState, useMemo, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api, getCurrentMonth } from '../lib/api'
import { formatThaiDate, getContractStatus, getPrevMeter, calcWaterCost } from '../lib/constants'
import DatePickerField from './ui/datepicker'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import Badge from './ui/badge'
import Button from './ui/button'
import ContractPreview from './ContractPreview'
import Spinner from './ui/spinner'
import Modal from './ui/modal'

const TABS = [
  { id: 'detail', label: 'รายละเอียด', icon: '' },
  { id: 'tenant', label: 'ผู้พัก', icon: '👤' },
  { id: 'contract', label: 'สัญญาเช่า', icon: '📋' },
  { id: 'meter', label: 'บันทึกมิเตอร์', icon: '⚡' },
  { id: 'billing', label: 'ออกบิล', icon: '💰' },
]

export default function RoomDetailMonthly() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { rooms, residents, invoices, meters, lineUsers, settings, setEditRoom, setEditResident, setViewOnly, setModal, deleteRoom, deleteResident, downloadContractPdf, fetchRooms, assignResidentToRoom, toast, calcInv, saveInvoice, setViewInv, fetchAll, downloadPdf, sendPdfToLine } = useApp()
  const [activeTab, setActiveTab] = useState('detail')
  const [contractResident, setContractResident] = useState(null)
  const [showContractPreview, setShowContractPreview] = useState(false)
  const [showSelectResident, setShowSelectResident] = useState(false)
  const [searchResident, setSearchResident] = useState('')
  const [showDeleteOptions, setShowDeleteOptions] = useState(false)
  const [confirmDeleteRoom, setConfirmDeleteRoom] = useState(false)
  const [confirmDeleteResident, setConfirmDeleteResident] = useState(false)
  const [confirmCancelPayment, setConfirmCancelPayment] = useState(false)
  const [cancelInvId, setCancelInvId] = useState(null)
  const [meterModalOpen, setMeterModalOpen] = useState(false)
  const [selectedResidentForDates, setSelectedResidentForDates] = useState(null)
  const [moveInDate, setMoveInDate] = useState(null)
  const [moveOutDate, setMoveOutDate] = useState(null)
  const [previewScale, setPreviewScale] = useState(1)
  const [previewHeight, setPreviewHeight] = useState(0)
  const previewOuterRef = useRef(null)
  const previewInnerRef = useRef(null)
  const [curElec, setCurElec] = useState('')
  const [curWater, setCurWater] = useState('')
  const [meterMonth, setMeterMonth] = useState(getCurrentMonth())
  const [billMonth, setBillMonth] = useState(getCurrentMonth())

  const room = useMemo(() => rooms.find(r => r.id === id), [rooms, id])
  const resident = useMemo(() => {
    if (!room) return null
    if (room.residentId) return residents.find(r => r.id === room.residentId)
    return null
  }, [room, residents])

  const roomInvoices = useMemo(() => {
    if (!room) return []
    return invoices.filter(x => x.roomId === room.id).sort((a, b) => b.month.localeCompare(a.month))
  }, [invoices, room])

  const roomMeters = useMemo(() => {
    if (!room) return []
    return meters.filter(x => x.roomId === room.id).sort((a, b) => b.month.localeCompare(a.month))
  }, [meters, room])

  const unassignedResidents = useMemo(() => {
    return residents.filter(r => {
      if (r.rentalType !== 'monthly' && r.rentalType !== 'รายเดือน') return false
      return !r.roomId || r.roomId === ''
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
    setMoveInDate(r.moveInDate ? new Date(r.moveInDate) : new Date())
    setMoveOutDate(r.moveOutDate ? new Date(r.moveOutDate) : null)
    setShowSelectResident(false)
    setSearchResident('')
  }

  const confirmAssignWithDates = async () => {
    if (!selectedResidentForDates || !moveInDate || !moveOutDate) {
      toast('กรุณาเลือกวันที่เข้าพักและวันหมดสัญญา', true)
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
        moveInDate: moveInDate.toISOString(),
        moveOutDate: moveOutDate.toISOString(),
        deposit: r.deposit,
        licensePlate: r.licensePlate || '',
        emergencyContact: r.emergencyContact || '',
        emergencyPhone: r.emergencyPhone || '',
        lineUserId: r.lineUserId || '',
        rentalType: r.rentalType || room.rentalType || 'monthly',
      })
      await fetchRooms()
      setSelectedResidentForDates(null)
      setMoveInDate(null)
      setMoveOutDate(null)
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
            <div className="text-4xl mb-4">🚪</div>
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
  const status = room.status === 'มีผู้พัก' || room.residentId || room.tenantName
    ? { label: 'มีผู้พัก', variant: 'success' }
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
    setEditResident({ roomId: room.id, rentalType: 'monthly' })
    setViewOnly(false)
    setModal('resident')
  }

  const handleEditResident = () => {
    if (resident) {
      setEditResident({ ...resident, rentalType: 'monthly' })
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
        emergencyContact: resident.emergencyContact || '',
        emergencyPhone: resident.emergencyPhone || '',
        lineUserId: resident.lineUserId || '',
        rentalType: 'monthly',
      })
      await api('/api/rooms', 'PUT', {
        id: room.id,
        roomNumber: room.roomNumber,
        rentPrice: room.rentPrice,
        roomType: room.roomType,
        prevElecMeter: room.prevElecMeter || 0,
        prevWaterMeter: room.prevWaterMeter || 0,
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

  const handleContract = () => {
    if (resident) {
      setContractResident(resident)
      setTimeout(() => downloadContractPdf(resident), 100)
      setTimeout(() => setContractResident(null), 200)
    }
  }

  useEffect(() => {
    const outer = previewOuterRef.current
    const inner = previewInnerRef.current
    if (!outer || !inner) return
    const update = () => {
      const cw = outer.clientWidth
      const s = Math.min(1, cw / 550)
      setPreviewScale(s)
      setPreviewHeight(inner.scrollHeight * s)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(outer)
    return () => ro.disconnect()
  }, [showContractPreview, resident])

  useEffect(() => {
    if (!room || !meters) return
    const existing = meters.find(x => x.roomId === room.id && x.month === meterMonth)
    if (existing) {
      setCurElec(String(existing.elec))
      setCurWater(String(existing.water))
    } else {
      setCurElec('')
      setCurWater('')
    }
  }, [room, meters, meterMonth])

  const meterPrev = useMemo(() => {
    if (!room) return null
    return getPrevMeter(room.id, meterMonth, meters, room.prevElecMeter ?? '', room.prevWaterMeter ?? '')
  }, [room, meterMonth, meters])

  const prevElec = meterPrev?.elec ?? room?.prevElecMeter ?? ''
  const prevWater = meterPrev?.water ?? room?.prevWaterMeter ?? ''
  const elecUsage = curElec && prevElec !== '' ? Math.max(0, Number(curElec) - Number(prevElec)) : 0
  const waterUsage = curWater && prevWater !== '' ? Math.max(0, Number(curWater) - Number(prevWater)) : 0
  const elecCostVal = elecUsage * (settings?.rateElec || 7)
  const waterCostVal = calcWaterCost(waterUsage, settings?.rateWater || 20)

  const handleSaveMeter = async () => {
    if (!room || !curElec || !curWater) {
      toast('กรุณากรอกค่ามิเตอร์ให้ครบ', true)
      return
    }
    try {
      const existing = meters.find(x => x.roomId === room.id && x.month === meterMonth)
      const body = { roomId: room.id, month: meterMonth, elec: Number(curElec), water: Number(curWater) }
      if (existing) {
        await api('/api/meters', 'PUT', { ...body, id: existing.id })
      } else {
        await api('/api/meters', 'POST', body)
      }
      await fetchAll()
      toast('บันทึกค่ามิเตอร์สำเร็จ')
    } catch (e) {
      toast(`บันทึกไม่สำเร็จ: ${e.message}`, true)
    }
  }

  const formatDate = (d) => {
    if (!d) return '—'
    return formatThaiDate(d)
  }

  const formatMonth = (m) => {
    if (!m) return '—'
    const [y, mo] = m.split('-').map(Number)
    return new Date(y, mo - 1).toLocaleDateString('th-TH', { year: 'numeric', month: 'long' })
  }

  const getLineName = (lineUserId) => {
    if (!lineUserId) return null
    const u = lineUsers.find(x => x.userId === lineUserId)
    return u ? u.displayName : null
  }

  const renderDetail = () => (
    <div className="space-y-6">
      <Card><CardContent className="pt-6">
        <h3 className="text-sm font-semibold text-neutral-800 mb-4">ข้อมูลห้อง</h3>
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
            <dd className="text-sm font-medium text-neutral-800">{room.rentalType === 'daily' ? 'รายวัน' : room.rentalType === 'monthly' ? 'รายเดือน' : room.rentalType || 'รายเดือน'}</dd>
          </div>
          <div className="py-3 flex justify-between">
            <dt className="text-sm text-neutral-500">ค่าเช่า/เดือน</dt>
            <dd className="text-sm font-medium text-neutral-800">{displayRent?.toLocaleString()} บาท</dd>
          </div>
          <div className="py-3 flex justify-between">
            <dt className="text-sm text-neutral-500">สถานะ</dt>
            <dd><Badge variant={status.variant}>{status.label}</Badge></dd>
          </div>
          <div className="py-3 flex justify-between">
            <dt className="text-sm text-neutral-500">มิเตอร์ไฟฟ้า (ก่อนหน้า)</dt>
            <dd className="text-sm font-medium text-neutral-800">{room.prevElecMeter || 0}</dd>
          </div>
          <div className="py-3 flex justify-between">
            <dt className="text-sm text-neutral-500">มิเตอร์น้ำ (ก่อนหน้า)</dt>
            <dd className="text-sm font-medium text-neutral-800">{room.prevWaterMeter || 0}</dd>
          </div>
          {room.note && (
            <div className="py-3 flex justify-between">
              <dt className="text-sm text-neutral-500">หมายเหตุ</dt>
              <dd className="text-sm text-neutral-700">{room.note}</dd>
            </div>
          )}
        </dl>
      </CardContent></Card>

      {roomInvoices.length > 0 && (
        <Card><CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-neutral-800 mb-4">ประวัติเอกสาร</h3>
          <div className="space-y-2">
            {roomInvoices.slice(0, 6).map(inv => (
              <div key={inv.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-neutral-50">
                <div>
                  <div className="text-sm font-medium text-neutral-700">{formatMonth(inv.month)}</div>
                  <div className="text-xs text-neutral-400">{inv.tenantName || 'ไม่ระบุ'}</div>
                </div>
                <div className="text-sm font-semibold text-neutral-800">{inv.total?.toLocaleString()} บาท</div>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}

      {roomMeters.length > 0 && (
        <Card><CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-neutral-800 mb-4">ประวัติมิเตอร์</h3>
          <div className="space-y-2">
            {roomMeters.slice(0, 6).map(m => (
              <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-neutral-50">
                <div className="text-sm font-medium text-neutral-700">{formatMonth(m.month)}</div>
                <div className="flex gap-4 text-xs">
                  <span className="text-amber-600">⚡ {m.elec}</span>
                  <span className="text-blue-600">💧 {m.water}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}
    </div>
  )

  const renderTenant = () => {
    if (!resident) {
      return (
        <div className="space-y-6">
          <Card><CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-neutral-800 mb-4">เพิ่มผู้พักให้กับห้องนี้</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => setShowSelectResident(true)}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-lime-200 hover:border-lime-400 hover:bg-lime-50/50 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-lime-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">👥</div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-neutral-800">เลือกผู้พักที่มีอยู่แล้ว</div>
                  <div className="text-xs text-neutral-400 mt-1">มี {unassignedResidents.length} คนที่ยังไม่มีห้อง</div>
                </div>
              </button>
              <button onClick={handleAddResident}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-sky-200 hover:border-sky-400 hover:bg-sky-50/50 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">➕</div>
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

    const contractStatus = getContractStatus(resident.moveOutDate)
    const lineName = getLineName(resident.lineUserId)

    return (
      <div className="space-y-6">
        <Card><CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
             <h3 className="text-sm font-semibold text-neutral-800">ข้อมูลผู้พักปัจจุบัน</h3>
             <div className="flex gap-1.5 sm:gap-2">
               <Button size="sm" onClick={handleEditResident}><span className="sm:hidden"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></span><span className="hidden sm:inline">แก้ไข</span></Button>
               <Button variant="danger" size="sm" onClick={handleDeleteResident}><span className="sm:hidden"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></span><span className="hidden sm:inline">ลบ</span></Button>
             </div>
           </div>

          <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-lime-50 border border-lime-100">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 text-xl font-bold shadow-sm">
              {resident.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1">
              <div className="text-base font-bold text-neutral-800">{resident.name}</div>
              <div className="text-sm text-neutral-500">{resident.phone}{lineName ? ` • LINE: ${lineName}` : ''}</div>
            </div>
            <Badge variant={contractStatus.variant}>{contractStatus.label}</Badge>
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
              <dt className="text-sm text-neutral-500">วันที่เข้าพัก</dt>
              <dd className="text-sm font-medium text-neutral-800">{formatDate(resident.moveInDate)}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-sm text-neutral-500">วันหมดสัญญา</dt>
              <dd className="text-sm font-medium text-neutral-800">{formatDate(resident.moveOutDate)}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-sm text-neutral-500">เงินมัดจำ</dt>
              <dd className="text-sm font-medium text-neutral-800">{resident.deposit?.toLocaleString()} บาท</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-sm text-neutral-500">ผู้ติดต่อฉุกเฉิน</dt>
              <dd className="text-sm font-medium text-neutral-800">{resident.emergencyContact || <span className="text-neutral-300 italic">—</span>}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-sm text-neutral-500">เบอร์ฉุกเฉิน</dt>
              <dd className="text-sm font-medium text-neutral-800">{resident.emergencyPhone || <span className="text-neutral-300 italic">—</span>}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-sm text-neutral-500">LINE</dt>
              <dd className="text-sm font-medium text-neutral-800">{lineName || <span className="text-neutral-300 italic">—</span>}</dd>
            </div>
          </dl>
        </CardContent></Card>
      </div>
    )
  }

  const renderContract = () => (
    <Card><CardContent className="pt-6">
      <h3 className="text-sm font-semibold text-neutral-800 mb-4">สัญญาเช่า</h3>
      {resident ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-lime-50 border border-lime-100">
            <div className="text-sm font-medium text-lime-800 mb-2">สัญญาเช่าปัจจุบัน</div>
            <dl className="space-y-1 text-sm text-lime-700">
              <div className="flex justify-between"><span>ผู้พัก</span><span className="font-medium">{resident.name}</span></div>
              <div className="flex justify-between"><span>วันที่เริ่ม</span><span className="font-medium">{formatDate(resident.moveInDate)}</span></div>
              <div className="flex justify-between"><span>วันที่สิ้นสุด</span><span className="font-medium">{formatDate(resident.moveOutDate)}</span></div>
              <div className="flex justify-between"><span>ค่าเช่า/เดือน</span><span className="font-medium">{displayRent?.toLocaleString()} บาท</span></div>
              <div className="flex justify-between"><span>เงินมัดจำ</span><span className="font-medium">{resident.deposit?.toLocaleString()} บาท</span></div>
            </dl>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setShowContractPreview(true)}>️ ดูตัวอย่างสัญญาเช่า</Button>
            <Button size="sm" onClick={handleContract}>📄 ดาวน์โหลดสัญญาเช่า</Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📋</div>
          <h4 className="text-sm font-semibold text-neutral-700 mb-1">ไม่มีสัญญาเช่า</h4>
          <p className="text-xs text-neutral-400 mb-4">ห้องนี้ยังไม่มีผู้พักจึงไม่มีสัญญา</p>
          <Button size="sm" onClick={handleAddResident}>＋ เพิ่มผู้พักเพื่อสร้างสัญญา</Button>
        </div>
      )}
    </CardContent></Card>
  )

  const renderMeter = () => {
    const hasData = curElec && curWater && prevElec !== '' && prevWater !== ''
    return (
    <Card><CardContent className="pt-6">
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-800">บันทึกค่ามิเตอร์</h3>
        <div className="flex items-center gap-2">
          <div className="w-40">
            <DatePickerField
              selected={meterMonth ? new Date(meterMonth + '-01') : new Date()}
              onChange={d => { if (d) setMeterMonth(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')) }}
              showMonthPicker />
          </div>
          <Button size="sm" onClick={() => setMeterModalOpen(true)}>✏️ แก้ไข</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative overflow-hidden rounded-2xl bg-white border border-neutral-100 shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500" />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white text-sm shadow-sm">⚡</div>
              <div>
                <div className="text-sm font-semibold text-neutral-800">มิเตอร์ไฟฟ้า</div>
                <div className="text-[10px] text-neutral-400">อัตราหน่วยละ {settings?.rateElec || 7} บาท</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-neutral-50 rounded-xl px-3 py-2.5 text-center">
                <div className="text-[10px] text-neutral-400 mb-0.5">ก่อนหน้า</div>
                <div className="text-sm font-bold text-neutral-600 font-mono">{prevElec || 0}</div>
              </div>
              <div className="bg-amber-50/50 rounded-xl px-3 py-2.5 text-center ring-1 ring-amber-200/50">
                <div className="text-[10px] text-amber-500 mb-0.5">บันทึก</div>
                <div className="text-sm font-bold text-amber-700 font-mono">{curElec || <span className="text-neutral-300">—</span>}</div>
              </div>
              <div className={`rounded-xl px-3 py-2.5 text-center ${hasData ? 'bg-lime-50 ring-1 ring-lime-200/50' : 'bg-neutral-50'}`}>
                <div className="text-[10px] text-neutral-400 mb-0.5">ที่ใช้</div>
                <div className="text-sm font-bold font-mono">{hasData ? <span className="text-lime-600">{elecUsage}</span> : <span className="text-neutral-300">—</span>}</div>
              </div>
            </div>
            {hasData && (
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-neutral-400">ค่าไฟฟ้า</span>
                <span className="text-sm font-bold text-amber-600">{elecCostVal.toLocaleString()} บาท</span>
              </div>
            )}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-white border border-neutral-100 shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 to-sky-500" />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-sky-500 flex items-center justify-center text-white text-sm shadow-sm">💧</div>
              <div>
                <div className="text-sm font-semibold text-neutral-800">มิเตอร์น้ำ</div>
                <div className="text-[10px] text-neutral-400">อัตราหน่วยละ {settings?.rateWater || 20} บาท</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-neutral-50 rounded-xl px-3 py-2.5 text-center">
                <div className="text-[10px] text-neutral-400 mb-0.5">ก่อนหน้า</div>
                <div className="text-sm font-bold text-neutral-600 font-mono">{prevWater || 0}</div>
              </div>
              <div className="bg-sky-50/50 rounded-xl px-3 py-2.5 text-center ring-1 ring-sky-200/50">
                <div className="text-[10px] text-sky-500 mb-0.5">บันทึก</div>
                <div className="text-sm font-bold text-sky-700 font-mono">{curWater || <span className="text-neutral-300">—</span>}</div>
              </div>
              <div className={`rounded-xl px-3 py-2.5 text-center ${hasData ? 'bg-lime-50 ring-1 ring-lime-200/50' : 'bg-neutral-50'}`}>
                <div className="text-[10px] text-neutral-400 mb-0.5">ที่ใช้</div>
                <div className="text-sm font-bold font-mono">{hasData ? <span className="text-lime-600">{waterUsage}</span> : <span className="text-neutral-300">—</span>}</div>
              </div>
            </div>
            {hasData && (
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-neutral-400">ค่าน้ำ</span>
                <span className="text-sm font-bold text-sky-600">{waterCostVal.toLocaleString()} บาท</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {hasData && (
        <div className="flex justify-end">
          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <span>⚡ {elecCostVal.toLocaleString()} บาท</span>
            <span>💧 {waterCostVal.toLocaleString()} บาท</span>
            <span className="font-semibold text-neutral-600">รวม {(elecCostVal + waterCostVal).toLocaleString()} บาท</span>
          </div>
        </div>
      )}
      </div>
    </CardContent></Card>
    )
  }

  const renderBilling = () => {
    const inv = room && billMonth ? calcInv(room, billMonth) : null
    return (
      <Card><CardContent className="pt-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-800">ออกบิล</h3>
          <div className="w-40">
            <DatePickerField
              selected={billMonth ? new Date(billMonth + '-01') : new Date()}
              onChange={d => { if (d) setBillMonth(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')) }}
              showMonthPicker />
          </div>
        </div>
        {inv ? (
          <div className="rounded-2xl bg-white border border-neutral-100 shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-3 border-b border-neutral-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 text-sm shadow-sm">💰</div>
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
                  <span className="text-xs text-neutral-400">🏠</span>
                  <span className="text-sm text-neutral-600">ค่าเช่า</span>
                </div>
                <span className="text-sm font-semibold text-neutral-800">{inv.rent?.toLocaleString()} บาท</span>
              </div>
              {inv.discount > 0 && (
                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">🏷️</span>
                    <span className="text-sm text-neutral-600">ส่วนลด</span>
                  </div>
                  <span className="text-sm font-semibold text-rose-500">-{inv.discount.toLocaleString()} บาท</span>
                </div>
              )}
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400">⚡</span>
                  <span className="text-sm text-neutral-600">ค่าไฟ</span>
                </div>
                <span className="text-sm text-neutral-800">{inv.elecCost?.toLocaleString()} บาท <span className="text-[11px] text-neutral-400">({inv.elecUnits || 0} หน่วย)</span></span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400">💧</span>
                  <span className="text-sm text-neutral-600">ค่าน้ำ</span>
                </div>
                <span className="text-sm text-neutral-800">{inv.waterCost?.toLocaleString()} บาท <span className="text-[11px] text-neutral-400">({inv.waterUnits || 0} หน่วย)</span></span>
              </div>
              {(inv.commonFee || 0) > 0 && (
                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">🏢</span>
                    <span className="text-sm text-neutral-600">ค่าส่วนกลาง</span>
                  </div>
                  <span className="text-sm font-semibold text-neutral-800">{inv.commonFee?.toLocaleString()} บาท</span>
                </div>
              )}
              {(inv.internetFee || 0) > 0 && (
                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">🌐</span>
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
              <Button size="sm" onClick={() => { setViewInv({ ...inv, docNumber: '' }); setModal('invoice') }}>🧾 ใบแจ้งหนี้</Button>
              <Button size="sm" onClick={() => { setViewInv({ ...inv, docNumber: '' }); setModal('receipt') }}> ใบเสร็จ</Button>
              {inv._saved && inv.paid ? (
                <Button size="sm" onClick={() => { setCancelInvId(inv._id); setConfirmCancelPayment(true) }}>🔄 รอชำระ</Button>
              ) : (
                <Button size="sm" onClick={async () => {
                  try {
                    await saveInvoice(room, inv, true)
                    toast('บันทึกและชำระสำเร็จ')
                  } catch (e) {
                    toast(`ไม่สำเร็จ: ${e.message}`, true)
                  }
                }}>✅ ชำระแล้ว</Button>
              )}
              {inv.userId && (
                <Button size="sm" onClick={async () => {
                  try {
                    if (!inv._saved) await saveInvoice(room, inv, false)
                    await sendPdfToLine(inv)
                  } catch (e) {
                    toast(`ส่ง LINE ไม่สำเร็จ: ${e.message}`, true)
                  }
                }}>📱 ส่ง LINE</Button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-neutral-100 shadow-sm">
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lime-100 to-lime-50 flex items-center justify-center text-3xl mb-4 shadow-sm">💰</div>
              <h4 className="text-base font-semibold text-neutral-700 mb-1">ยังไม่มีข้อมูลการออกบิล</h4>
              <p className="text-sm text-neutral-400 text-center max-w-xs">บันทึกค่ามิเตอร์และตรวจสอบข้อมูลผู้พักให้ครบถ้วนก่อนออกบิล</p>
            </div>
          </div>
        )}
      </div>
      </CardContent></Card>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'detail': return renderDetail()
      case 'tenant': return renderTenant()
      case 'contract': return renderContract()
      case 'meter': return renderMeter()
      case 'billing': return renderBilling()
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

      <Card className="mb-6"><CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 text-2xl font-bold shadow-sm">
            {displayNumber}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-lg font-bold text-neutral-800">ห้อง {displayNumber}</h2>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <div className="text-sm text-neutral-500">
              <div className="sm:hidden space-y-0.5">
                <span>{room.roomType || 'ไม่มีทีวี'}</span>
                <div className="flex items-center gap-1">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-lime-50 text-lime-600">{room.rentalType === 'daily' ? 'รายวัน' : room.rentalType === 'monthly' ? 'รายเดือน' : room.rentalType || 'รายเดือน'}</span>
                  <span className="font-medium">{displayRent?.toLocaleString()} บาท/เดือน</span>
                </div>
              </div>
              <span className="hidden sm:inline">{room.roomType || 'ไม่มีทีวี'} • {room.rentalType === 'daily' ? 'รายวัน' : room.rentalType === 'monthly' ? 'รายเดือน' : room.rentalType || 'รายเดือน'} • {displayRent?.toLocaleString()} บาท/เดือน</span>
            </div>
            {resident && (
              <div className="flex items-center gap-2 mt-1">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                  {resident.name.charAt(0)}
                </div>
                <span className="text-sm text-neutral-600">{resident.name}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent></Card>

      {resident ? (
        <>
          <div className="flex gap-1 mb-6 bg-white rounded-2xl p-1.5 shadow-sm border border-neutral-100 overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                   activeTab === tab.id
                     ? 'bg-lime-500 text-white shadow-sm'
                     : 'text-neutral-500 hover:bg-neutral-50'
                 }`}>
                <span><span className="hidden sm:inline">{tab.icon} </span>{tab.label}</span>
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
              <Button variant="outline" onClick={() => setShowSelectResident(true)}>👥 เลือกผู้พักที่มีอยู่แล้ว</Button>
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
                <div className="text-center py-8 text-sm text-neutral-400">ไม่พบผู้พักรายเดือนที่ยังไม่มีห้อง</div>
              ) : (
                filteredUnassigned.map(r => (
                  <button key={r.id} onClick={() => handleSelectResident(r.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-lime-50 transition-colors text-left">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 text-sm font-bold shrink-0">
                      {r.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-neutral-800 truncate">{r.name}</div>
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

      {contractResident && (
        <div className="fixed left-0 top-0 -z-50 opacity-0 pointer-events-none" aria-hidden="true">
          <ContractPreview resident={contractResident} />
        </div>
      )}

      {selectedResidentForDates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => { setSelectedResidentForDates(null); setMoveInDate(null); setMoveOutDate(null) }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-neutral-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-neutral-800">กำหนดวันเข้าพัก</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">{selectedResidentForDates.name} — ห้อง {displayNumber}</p>
                </div>
                <button onClick={() => { setSelectedResidentForDates(null); setMoveInDate(null); setMoveOutDate(null) }} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">วันที่เข้าพัก *</label>
                <DatePickerField selected={moveInDate} onChange={setMoveInDate} />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">วันหมดสัญญา *</label>
                <DatePickerField selected={moveOutDate} onChange={setMoveOutDate} />
              </div>
            </div>
            <div className="p-4 border-t border-neutral-100 flex gap-3">
              <button onClick={() => { setSelectedResidentForDates(null); setMoveInDate(null); setMoveOutDate(null) }}
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

      {meterModalOpen && (
        <Modal open={true} onClose={() => setMeterModalOpen(false)}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-100">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 text-xs font-bold shadow-sm">{displayNumber}</span>
              <div>
                <h3 className="text-base font-semibold text-neutral-800">บันทึกหน่วยมิเตอร์</h3>
                <p className="text-xs text-neutral-400">{resident?.name || 'ไม่มีผู้พัก'}</p>
                {room?.roomType && <p className="text-xs text-lime-600 mt-0.5">{room.roomType}</p>}
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center text-xs">⚡</div>
                  <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">มิเตอร์ไฟฟ้า</h4>
                  <span className="ml-auto text-[10px] text-neutral-400">ก่อนหน้า {prevElec || 0}</span>
                </div>
                <input
                  type="number" value={curElec} onChange={e => setCurElec(e.target.value.replace(/\D/g, ''))}
                  inputMode="numeric"
                  className="w-full h-10 px-3.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100"
                  placeholder="เลขปัจจุบัน" />
                {elecUsage > 0 && (
                  <p className="text-xs text-teal-600 font-medium mt-2">ใช้ไป {elecUsage} หน่วย = {elecCostVal.toLocaleString()} บาท</p>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-cyan-50 border border-cyan-100 flex items-center justify-center text-xs">💧</div>
                  <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">มิเตอร์น้ำ</h4>
                  <span className="ml-auto text-[10px] text-neutral-400">ก่อนหน้า {prevWater || 0}</span>
                </div>
                <input
                  type="number" value={curWater} onChange={e => setCurWater(e.target.value.replace(/\D/g, ''))}
                  inputMode="numeric"
                  className="w-full h-10 px-3.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100"
                  placeholder="เลขปัจจุบัน" />
                {waterUsage > 0 && (
                  <p className="text-xs text-teal-600 font-medium mt-2">ใช้ไป {waterUsage} หน่วย = {waterCostVal.toLocaleString()} บาท{waterUsage > 0 && waterUsage <= 4 ? ' (เหมาจ่าย)' : ''}</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-neutral-100">
              <Button variant="ghost" onClick={() => setMeterModalOpen(false)}>ยกเลิก</Button>
              <Button onClick={() => { handleSaveMeter(); setMeterModalOpen(false) }} disabled={!curElec || !curWater}>บันทึก</Button>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteOptions && resident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteOptions(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center text-white text-lg">⚠️</div>
                <div>
                  <h3 className="text-base font-semibold text-neutral-800">จัดการผู้พัก</h3>
                  <p className="text-xs text-neutral-400">{resident.name} — ห้อง {displayNumber}</p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <button onClick={handleRemoveFromRoom}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors text-left group">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🚪</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-amber-800">ย้ายออกจากห้อง</div>
                  <div className="text-xs text-amber-600 mt-0.5">ผู้พักจะยังอยู่ในระบบ แต่จะออกจากห้องนี้ ห้องจะกลายเป็นห้องว่าง</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-amber-400 shrink-0"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <button onClick={handleDeleteFromSystem}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 transition-colors text-left group">
                <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">️</div>
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

      {showContractPreview && resident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowContractPreview(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[550px] mx-4 overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-semibold text-neutral-800">📋 ตัวอย่างสัญญาเช่า</h3>
                <p className="text-xs text-neutral-400 mt-0.5">ห้อง {displayNumber} — {resident.name}</p>
              </div>
              <button onClick={() => setShowContractPreview(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div ref={previewOuterRef} className="overflow-hidden" style={{ height: previewHeight || 'auto' }}>
                <div ref={previewInnerRef} style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left', width: 550 }}>
                  <ContractPreview resident={resident} />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-neutral-100 flex gap-3 justify-end shrink-0">
              <Button variant="ghost" onClick={() => setShowContractPreview(false)}>ปิด</Button>
              <Button size="sm" onClick={() => { setShowContractPreview(false); handleContract(); }}>📄 ดาวน์โหลด PDF</Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
