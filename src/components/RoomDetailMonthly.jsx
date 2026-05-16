import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/api'
import { formatThaiDate, getContractStatus } from '../lib/constants'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import Badge from './ui/badge'
import Button from './ui/button'
import ContractPreview from './ContractPreview'
import Spinner from './ui/spinner'

const TABS = [
  { id: 'detail', label: 'รายละเอียด', icon: '' },
  { id: 'tenant', label: 'ผู้พัก', icon: '👤' },
  { id: 'contract', label: 'สัญญาเช่า', icon: '📋' },
  { id: 'booking', label: 'การจอง', icon: '📅' },
  { id: 'moveout', label: 'ย้ายออก', icon: '🚚' },
]

export default function RoomDetailMonthly() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { rooms, residents, invoices, meters, lineUsers, settings, setEditRoom, setEditResident, setViewOnly, setModal, deleteRoom, deleteResident, downloadContractPdf, fetchRooms, assignResidentToRoom, toast } = useApp()
  const [activeTab, setActiveTab] = useState('detail')
  const [contractResident, setContractResident] = useState(null)
  const [showContractPreview, setShowContractPreview] = useState(false)
  const [showSelectResident, setShowSelectResident] = useState(false)
  const [searchResident, setSearchResident] = useState('')
  const [showDeleteOptions, setShowDeleteOptions] = useState(false)

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
    return residents.filter(r => !r.roomId || r.roomId === '').sort((a, b) => a.name.localeCompare(b.name))
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

  const handleAssignResident = async (residentId) => {
    await assignResidentToRoom(residentId, room.id)
    setShowSelectResident(false)
    setSearchResident('')
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
    if (!window.confirm(`⚠️ ต้องการลบห้อง ${displayNumber} ใช่หรือไม่?`)) return
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
    if (!window.confirm(`⚠️ ต้องการลบข้อมูลผู้พัก "${resident.name}" ออกจากระบบถาวรใช่หรือไม่?\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`)) return
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
            <dd className="text-sm font-medium text-neutral-800">{room.rentalType || 'รายเดือน'}</dd>
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
                    <div className="text-center py-8 text-sm text-neutral-400">ไม่พบผู้พักที่ยังไม่มีห้อง</div>
                  ) : (
                    filteredUnassigned.map(r => (
                      <button key={r.id} onClick={() => handleAssignResident(r.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-lime-50 transition-colors text-left">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 text-sm font-bold shrink-0">
                          {r.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-neutral-800 truncate">{r.name}</div>
                          <div className="text-xs text-neutral-400">{r.phone}{r.roomNumber ? ` • ห้อง ${r.roomNumber}` : ' • ยังไม่มีห้อง'}</div>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-neutral-300 shrink-0"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
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
            <div className="flex gap-2">
              <Button size="sm" onClick={handleEditResident}>แก้ไข</Button>
              <Button variant="danger" size="sm" onClick={handleDeleteResident}>ลบ</Button>
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
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => setShowContractPreview(true)}>️ ดูตัวอย่างสัญญาเช่า</Button>
            <Button variant="outline" size="sm" onClick={handleContract}>📄 ดาวน์โหลดสัญญาเช่า</Button>
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

  const renderBooking = () => (
    <Card><CardContent className="pt-6">
      <h3 className="text-sm font-semibold text-neutral-800 mb-4">การจองห้อง</h3>
      <div className="text-center py-8">
        <div className="text-4xl mb-3">📅</div>
        <h4 className="text-sm font-semibold text-neutral-700 mb-1">ไม่มีข้อมูลการจอง</h4>
        <p className="text-xs text-neutral-400">ห้องนี้ยังไม่มีประวัติการจอง</p>
      </div>
    </CardContent></Card>
  )

  const renderMoveOut = () => (
    <Card><CardContent className="pt-6">
      <h3 className="text-sm font-semibold text-neutral-800 mb-4">ประวัติการย้ายออก</h3>
      <div className="text-center py-8">
        <div className="text-4xl mb-3">🚚</div>
        <h4 className="text-sm font-semibold text-neutral-700 mb-1">ไม่มีประวัติการย้ายออก</h4>
        <p className="text-xs text-neutral-400">ห้องนี้ยังไม่มีประวัติการย้ายออก</p>
      </div>
    </CardContent></Card>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'detail': return renderDetail()
      case 'tenant': return renderTenant()
      case 'contract': return renderContract()
      case 'booking': return renderBooking()
      case 'moveout': return renderMoveOut()
      default: return renderDetail()
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader
        title={`ห้อง ${displayNumber}`}
        description={resident ? resident.name : 'ห้องว่าง'}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/rooms')}>← กลับ</Button>
            <Button variant="outline" size="sm" onClick={handleEdit}>แก้ไข</Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>ลบ</Button>
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
              {room.roomType || 'ไม่มีทีวี'} • {room.rentalType || 'รายเดือน'} • {displayRent?.toLocaleString()} บาท/เดือน
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
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-lime-500 text-white shadow-sm'
                    : 'text-neutral-500 hover:bg-neutral-50'
                }`}>
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
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

      {contractResident && (
        <div className="fixed left-0 top-0 -z-50 opacity-0 pointer-events-none" aria-hidden="true">
          <ContractPreview resident={contractResident} />
        </div>
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
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
              <ContractPreview resident={resident} />
            </div>
            <div className="p-4 border-t border-neutral-100 flex gap-3 justify-end shrink-0">
              <Button variant="ghost" onClick={() => setShowContractPreview(false)}>ปิด</Button>
              <Button size="sm" onClick={() => { setShowContractPreview(false); handleContract(); }}> ดาวน์โหลด PDF</Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
