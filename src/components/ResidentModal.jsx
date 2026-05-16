import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { naturalSortRoomNumber } from '../lib/constants'
import DatePickerField from './ui/datepicker'
import Select from './ui/select'
import Badge from './ui/badge'
import Modal from './ui/modal'
import Button from './ui/button'
import Input from './ui/input'

function parseDate(dateStr) {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function fmtDate(date) {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function ResidentModal() {
  const { editResident, rooms, residents, lineUsers, saveResident, setModal, viewOnly, setViewOnly, setEditResident } = useApp()
  const ro = viewOnly && editResident
  const isNewForRoom = editResident && editResident.roomId && !editResident.id
  const isNew = !editResident?.id && !isNewForRoom

  const [rentalTypeStep, setRentalTypeStep] = useState(isNew ? 'select' : 'form')
  const [rentalType, setRentalType] = useState(editResident?.rentalType || 'monthly')

  const [name, setName] = useState(editResident?.name || '')
  const [idCard, setIdCard] = useState(editResident?.idCard || '')
  const [phone, setPhone] = useState(editResident?.phone || '')
  const [email, setEmail] = useState(editResident?.email || '')
  const [roomId, setRoomId] = useState(editResident?.roomId || '')
  const [deposit, setDeposit] = useState(editResident?.deposit?.toString() || '')
  const [licensePlate, setLicensePlate] = useState(editResident?.licensePlate || '')
  const [emergencyContact, setEmergencyContact] = useState(editResident?.emergencyContact || '')
  const [emergencyPhone, setEmergencyPhone] = useState(editResident?.emergencyPhone || '')
  const [lineUserId, setLineUserId] = useState(editResident?.lineUserId || '')

  const [moveInDate, setMoveInDate] = useState(parseDate(editResident?.moveInDate))
  const [moveOutDate, setMoveOutDate] = useState(parseDate(editResident?.moveOutDate))

  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const occupiedRoomIds = useMemo(() => {
    if (editResident) {
      return residents.filter(r => r.id !== editResident.id).map(r => r.roomId)
    }
    return residents.map(r => r.roomId)
  }, [residents, editResident])

  const availableRooms = useMemo(() => {
    const filtered = rooms.filter(r => {
      const isOccupied = occupiedRoomIds.includes(r.id)
      if (rentalType === 'daily') return !isOccupied && r.rentalType === 'รายวัน'
      return !isOccupied && r.rentalType !== 'รายวัน'
    })
    filtered.sort(naturalSortRoomNumber)
    return filtered
  }, [rooms, occupiedRoomIds, rentalType])

  const selectedRoom = rooms.find(r => r.id === roomId)

  const roomOptions = useMemo(() => {
    if (isNewForRoom) return []
    const opts = []
    if (editResident && selectedRoom && !availableRooms.find(r => r.id === roomId)) {
      opts.push({ value: roomId, label: `ห้อง ${selectedRoom.roomNumber || selectedRoom.number} (แก้ไข)` })
    }
    opts.push({ value: '', label: '-- เลือกห้อง --' })
    availableRooms.forEach(r => {
      const rentLabel = r.rentalType === 'รายวัน' ? 'รายวัน' : 'รายเดือน'
      opts.push({ value: r.id, label: `ห้อง ${r.roomNumber || r.number} (${rentLabel})` })
    })
    return opts
  }, [availableRooms, editResident, selectedRoom, roomId, isNewForRoom])

  const lineOptions = useMemo(() => {
    const opts = [{ value: '', label: '— ไม่เชื่อมโยง LINE —' }]
    lineUsers.filter(u => u.isFollowing && (!u.residentId || u.residentId === editResident?.id)).forEach(u => {
      opts.push({ value: u.userId, label: `${u.displayName} (${u.userId.slice(0, 12)}...)${!u.isActive ? ' [ปิดใช้งาน]' : ''}` })
    })
    return opts
  }, [lineUsers, editResident])

  const formatDeposit = (val) => {
    const num = val.replace(/[^\d]/g, '')
    if (!num) return ''
    return Number(num).toLocaleString()
  }

  const handleIdCard = (val) => {
    const nums = val.replace(/\D/g, '').slice(0, 13)
    setIdCard(nums)
  }

  const handlePhone = (val) => {
    const nums = val.replace(/\D/g, '').slice(0, 10)
    setPhone(nums)
  }

  const handleEmergencyPhone = (val) => {
    const nums = val.replace(/\D/g, '').slice(0, 10)
    setEmergencyPhone(nums)
  }

  const handleDeposit = (val) => {
    const nums = val.replace(/[^\d]/g, '')
    setDeposit(nums)
  }

  const validate = () => {
    const errs = {}
    if (!name.trim()) errs.name = 'กรุณากรอกชื่อ-นามสกุล'
    if (!idCard) errs.idCard = 'กรุณากรอกเลขบัตรประชาชน'
    else if (idCard.length !== 13) errs.idCard = 'เลขบัตรประชาชนต้องมี 13 หลัก'
    if (!phone) errs.phone = 'กรุณากรอกเบอร์โทร'
    else if (phone.length < 9) errs.phone = 'เบอร์โทรไม่ถูกต้อง'
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'รูปแบบอีเมลไม่ถูกต้อง'
    if (!moveInDate) errs.moveInDate = rentalType === 'daily' ? 'กรุณาเลือกวันเช็คอิน' : 'กรุณาเลือกวันที่เข้าพัก'
    if (!moveOutDate) errs.moveOutDate = rentalType === 'daily' ? 'กรุณาเลือกวันเช็คเอาท์' : 'กรุณาเลือกวันหมดสัญญา'
    if (rentalType === 'monthly' && (deposit === '' || isNaN(Number(deposit)))) errs.deposit = 'กรุณากรอกค่ามัดจำ'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    const data = {
      id: editResident?.id || undefined,
      name: name.trim(),
      idCard,
      phone,
      email: email.trim(),
      roomId,
      moveInDate: fmtDate(moveInDate),
      moveOutDate: fmtDate(moveOutDate),
      deposit: Number(deposit) || 0,
      licensePlate: licensePlate.trim(),
      emergencyContact: emergencyContact.trim(),
      emergencyPhone,
      lineUserId,
      rentalType,
    }
    await saveResident(data)
    setSaving(false)
  }

  const handleSelectRentalType = (type) => {
    setRentalType(type)
    setRentalTypeStep('form')
  }

  const handleBackToSelect = () => {
    setRentalTypeStep('select')
    setRentalType('monthly')
  }

  const lineName = lineUsers.find(u => u.userId === lineUserId)?.displayName

  const renderRentalTypeSelect = () => (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 text-base shadow-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <div>
          <h3 className="text-base font-semibold text-neutral-800">เพิ่มผู้พักอาศัย</h3>
          <p className="text-xs text-neutral-400">เลือกประเภทการเข้าพัก</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button onClick={() => handleSelectRentalType('monthly')}
          className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed border-lime-300 bg-lime-50/30 hover:bg-lime-50/60 transition-all group">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-sm">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-neutral-800">รายเดือน</div>
            <div className="text-sm text-neutral-500 mt-1">เช่ารายเดือน มีสัญญาเช่า</div>
            <div className="text-xs text-neutral-400 mt-2">วันที่เข้าพัก • วันหมดสัญญา • ค่ามัดจำ</div>
          </div>
        </button>

        <button onClick={() => handleSelectRentalType('daily')}
          className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50/30 hover:bg-sky-50/60 transition-all group">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-sm">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v.01"/><path d="M9 12v.01"/><path d="M9 15v.01"/><path d="M9 18v.01"/></svg>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-neutral-800">รายวัน</div>
            <div className="text-sm text-neutral-500 mt-1">เช่ารายวัน พักชั่วคราว</div>
            <div className="text-xs text-neutral-400 mt-2">เช็คอิน • เช็คเอาท์ • ค่ามัดจำ • ทะเบียนรถ</div>
          </div>
        </button>
      </div>

      <div className="flex justify-end mt-6 pt-4 border-t border-neutral-100">
        <Button variant="ghost" onClick={() => setModal(null)}>ยกเลิก</Button>
      </div>
    </div>
  )

  const renderForm = () => (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 text-base shadow-sm">👤</div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-neutral-800">
            {ro ? 'ดูข้อมูลผู้พัก' : isNewForRoom ? `เพิ่มผู้พัก — ห้อง ${selectedRoom?.roomNumber || selectedRoom?.number || ''}` : editResident ? 'แก้ไขข้อมูลผู้พัก' : rentalType === 'daily' ? 'เพิ่มผู้พักรายวัน' : 'เพิ่มผู้พักรายเดือน'}
          </h3>
          <p className="text-xs text-neutral-400">
            {ro ? 'รายละเอียดข้อมูลผู้พักอาศัย' : isNewForRoom ? 'เพิ่มผู้พักใหม่ให้กับห้องนี้' : editResident ? 'แก้ไขข้อมูลผู้พักอาศัยในระบบ' : rentalType === 'daily' ? 'เพิ่มผู้พักรายวันใหม่ในระบบ' : 'เพิ่มผู้พักรายเดือนใหม่ในระบบ'}
          </p>
        </div>
        {!ro && !isNewForRoom && !editResident && (
          <button onClick={handleBackToSelect} className="text-xs text-lime-600 hover:text-lime-700 font-medium">
            ← เปลี่ยนประเภท
          </button>
        )}
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ro ? (
            <>
              <div>
                <label className="block text-xs text-neutral-400 mb-0.5">ชื่อ-นามสกุล</label>
                <div className="h-10 px-3.5 flex items-center bg-neutral-50 border border-neutral-100 rounded-xl text-sm text-neutral-700">{name || <span className="text-neutral-300 italic">—</span>}</div>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-0.5">เลขบัตรประชาชน</label>
                <div className="h-10 px-3.5 flex items-center bg-neutral-50 border border-neutral-100 rounded-xl text-sm text-neutral-700">{idCard || <span className="text-neutral-300 italic">—</span>}</div>
              </div>
            </>
          ) : (
            <>
              <Input label="ชื่อ-นามสกุล *" value={name} onChange={e => setName(e.target.value)}
                placeholder="ชื่อ-นามสกุล" error={errors.name} autoFocus />
              <Input label="เลขบัตรประชาชน *" value={idCard} onChange={e => handleIdCard(e.target.value)}
                placeholder="13 หลัก" inputMode="numeric" maxLength={13} error={errors.idCard} />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ro ? (
            <>
              <div>
                <label className="block text-xs text-neutral-400 mb-0.5">เบอร์โทรศัพท์</label>
                <div className="h-10 px-3.5 flex items-center bg-neutral-50 border border-neutral-100 rounded-xl text-sm text-neutral-700">{phone || <span className="text-neutral-300 italic">—</span>}</div>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-0.5">อีเมล</label>
                <div className="h-10 px-3.5 flex items-center bg-neutral-50 border border-neutral-100 rounded-xl text-sm text-neutral-700">{email || <span className="text-neutral-300 italic">—</span>}</div>
              </div>
            </>
          ) : (
            <>
              <Input label="เบอร์โทรศัพท์ *" value={phone} onChange={e => handlePhone(e.target.value)}
                placeholder="0812345678" inputMode="numeric" maxLength={10} error={errors.phone} />
              <Input label="อีเมล" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com" error={errors.email} />
            </>
          )}
        </div>

        {isNewForRoom ? (
          <div>
            <label className="block text-xs text-neutral-400 mb-0.5">หมายเลขห้องพัก</label>
            <div className="h-10 px-3.5 flex items-center bg-neutral-50 border border-neutral-100 rounded-xl text-sm text-neutral-700">{selectedRoom ? `ห้อง ${selectedRoom.roomNumber || selectedRoom.number} — ค่าเช่า ${(selectedRoom.rentPrice || selectedRoom.rent)?.toLocaleString()} บาท/${selectedRoom.rentalType === 'รายวัน' ? 'วัน' : 'เดือน'}` : <span className="text-neutral-300 italic">—</span>}</div>
          </div>
        ) : ro ? (
          <div>
            <label className="block text-xs text-neutral-400 mb-0.5">หมายเลขห้องพัก</label>
            <div className="h-10 px-3.5 flex items-center bg-neutral-50 border border-neutral-100 rounded-xl text-sm text-neutral-700">{selectedRoom ? `ห้อง ${selectedRoom.roomNumber || selectedRoom.number} — ค่าเช่า ${(selectedRoom.rentPrice || selectedRoom.rent)?.toLocaleString()} บาท/${selectedRoom.rentalType === 'รายวัน' ? 'วัน' : 'เดือน'}` : <span className="text-neutral-300 italic">—</span>}</div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">หมายเลขห้องพัก</label>
            <Select value={roomId} onChange={setRoomId} options={roomOptions} placeholder="-- เลือกห้อง --" searchable error={errors.roomId} />
            {errors.roomId && <p className="text-xs text-rose-500 mt-1">{errors.roomId}</p>}
            {selectedRoom && (
              <p className="text-xs text-neutral-400 mt-1.5">
                ค่าเช่า {(selectedRoom.rentPrice || selectedRoom.rent)?.toLocaleString()} บาท/{selectedRoom.rentalType === 'รายวัน' ? 'วัน' : 'เดือน'}
                {selectedRoom.roomType ? ` — ${selectedRoom.roomType}` : ''}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ro ? (
            <>
              <div>
                <label className="block text-xs text-neutral-400 mb-0.5">{rentalType === 'daily' ? 'เช็คอิน' : 'วันที่เข้าพัก'}</label>
                <div className="h-10 px-3.5 flex items-center bg-neutral-50 border border-neutral-100 rounded-xl text-sm text-neutral-700">{moveInDate ? `${moveInDate.getDate()} ${moveInDate.toLocaleString('default', { month: 'long' })} ${moveInDate.getFullYear() + 543}` : <span className="text-neutral-300 italic">—</span>}</div>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-0.5">{rentalType === 'daily' ? 'เช็คเอาท์' : 'วันหมดสัญญา'}</label>
                <div className="h-10 px-3.5 flex items-center bg-neutral-50 border border-neutral-100 rounded-xl text-sm text-neutral-700">{moveOutDate ? `${moveOutDate.getDate()} ${moveOutDate.toLocaleString('default', { month: 'long' })} ${moveOutDate.getFullYear() + 543}` : <span className="text-neutral-300 italic">—</span>}</div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">{rentalType === 'daily' ? 'วันเช็คอิน *' : 'วันที่เข้าพัก *'}</label>
                <DatePickerField selected={moveInDate} onChange={setMoveInDate} error={errors.moveInDate} />
                {errors.moveInDate && <p className="text-xs text-rose-500 mt-1">{errors.moveInDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">{rentalType === 'daily' ? 'วันเช็คเอาท์ *' : 'วันหมดสัญญา *'}</label>
                <DatePickerField selected={moveOutDate} onChange={setMoveOutDate} error={errors.moveOutDate} />
                {errors.moveOutDate && <p className="text-xs text-rose-500 mt-1">{errors.moveOutDate}</p>}
              </div>
            </>
          )}
        </div>

        {rentalType === 'monthly' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ro ? (
              <div>
                <label className="block text-xs text-neutral-400 mb-0.5">ค่ามัดจำ</label>
                <div className="h-10 px-3.5 flex items-center bg-neutral-50 border border-neutral-100 rounded-xl text-sm text-neutral-700">{deposit ? `${Number(deposit).toLocaleString()} บาท` : <span className="text-neutral-300 italic">—</span>}</div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">ค่ามัดจำ *</label>
                <div className="relative">
                  <input type="text" value={deposit ? formatDeposit(deposit) : deposit} onChange={e => handleDeposit(e.target.value)}
                    placeholder="0" inputMode="numeric"
                    className={`w-full h-10 px-3.5 bg-white border rounded-xl text-sm text-neutral-800 placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 ${errors.deposit ? 'border-rose-300' : 'border-neutral-200'}`} />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-neutral-400">บาท</span>
                </div>
                {errors.deposit && <p className="text-xs text-rose-500 mt-1">{errors.deposit}</p>}
              </div>
            )}
            {ro ? (
              <div>
                <label className="block text-xs text-neutral-400 mb-0.5">ชื่อผู้ติดต่อฉุกเฉิน</label>
                <div className="h-10 px-3.5 flex items-center bg-neutral-50 border border-neutral-100 rounded-xl text-sm text-neutral-700">{emergencyContact || <span className="text-neutral-300 italic">—</span>}</div>
              </div>
            ) : (
              <Input label="ชื่อผู้ติดต่อฉุกเฉิน" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)}
                placeholder="ชื่อผู้ติดต่อ" />
            )}
          </div>
        )}

        {rentalType === 'monthly' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ro ? (
              <div>
                <label className="block text-xs text-neutral-400 mb-0.5">เบอร์โทรฉุกเฉิน</label>
                <div className="h-10 px-3.5 flex items-center bg-neutral-50 border border-neutral-100 rounded-xl text-sm text-neutral-700">{emergencyPhone || <span className="text-neutral-300 italic">—</span>}</div>
              </div>
            ) : (
              <Input label="เบอร์โทรฉุกเฉิน" value={emergencyPhone} onChange={e => handleEmergencyPhone(e.target.value)}
                placeholder="0812345678" inputMode="numeric" maxLength={10} />
            )}
            {ro ? (
              <div>
                <label className="block text-xs text-neutral-400 mb-0.5">เชื่อมโยงบัญชี LINE</label>
                <div className="h-10 px-3.5 flex items-center bg-neutral-50 border border-neutral-100 rounded-xl text-sm text-neutral-700">{lineName || <span className="text-neutral-300 italic">—</span>}</div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">เชื่อมโยงบัญชี LINE</label>
                <Select value={lineUserId} onChange={setLineUserId} options={lineOptions} placeholder="— ไม่เชื่อมโยง LINE —" />
              </div>
            )}
          </div>
        )}

        {rentalType === 'daily' && !ro && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">ค่ามัดจำ</label>
              <div className="relative">
                <input type="text" value={deposit ? formatDeposit(deposit) : deposit} onChange={e => handleDeposit(e.target.value)}
                  placeholder="0" inputMode="numeric"
                  className={`w-full h-10 px-3.5 bg-white border rounded-xl text-sm text-neutral-800 placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 ${errors.deposit ? 'border-rose-300' : 'border-neutral-200'}`} />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-neutral-400">บาท</span>
              </div>
              {errors.deposit && <p className="text-xs text-rose-500 mt-1">{errors.deposit}</p>}
            </div>
            <Input label="ทะเบียนรถ" value={licensePlate} onChange={e => setLicensePlate(e.target.value)}
              placeholder="กข 1234 กรุงเทพมหานคร" />
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-neutral-100">
        {ro ? (
          <>
            <Button variant="ghost" onClick={() => setModal(null)}>ปิด</Button>
            <Button onClick={() => { setViewOnly(false); setEditResident(editResident) }}>✎ แก้ไขข้อมูล</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => { setViewOnly(false); setModal(null) }} disabled={saving}>ยกเลิก</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'กำลังบันทึก...' : isNewForRoom ? 'เพิ่มผู้พัก' : editResident ? 'บันทึกการเปลี่ยนแปลง' : rentalType === 'daily' ? 'เพิ่มผู้พักรายวัน' : 'เพิ่มผู้พักรายเดือน'}</Button>
          </>
        )}
      </div>
    </div>
  )

  return (
    <Modal open={true} onClose={() => setModal(null)} maxWidth="max-w-2xl">
      {rentalTypeStep === 'select' && !editResident ? renderRentalTypeSelect() : renderForm()}
    </Modal>
  )
}
