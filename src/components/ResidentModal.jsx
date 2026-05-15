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

  const [name, setName] = useState(editResident?.name || '')
  const [idCard, setIdCard] = useState(editResident?.idCard || '')
  const [phone, setPhone] = useState(editResident?.phone || '')
  const [email, setEmail] = useState(editResident?.email || '')
  const [roomId, setRoomId] = useState(editResident?.roomId || '')
  const [deposit, setDeposit] = useState(editResident?.deposit?.toString() || '')
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
    const filtered = rooms.filter(r => !occupiedRoomIds.includes(r.id))
    filtered.sort(naturalSortRoomNumber)
    return filtered
  }, [rooms, occupiedRoomIds])
  const selectedRoom = rooms.find(r => r.id === roomId)

  const roomOptions = useMemo(() => {
    const opts = []
    if (editResident && selectedRoom && !availableRooms.find(r => r.id === roomId)) {
      opts.push({ value: roomId, label: `ห้อง ${selectedRoom.roomNumber || selectedRoom.number} (แก้ไข)` })
    }
    opts.push({ value: '', label: '-- เลือกห้อง --' })
    availableRooms.forEach(r => {
      opts.push({ value: r.id, label: `ห้อง ${r.roomNumber || r.number} (${r.tenantName || (r.status === 'มีผู้เช่า' ? 'มีผู้เช่า' : 'ว่าง')})` })
    })
    return opts
  }, [availableRooms, editResident, selectedRoom, roomId])

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
    if (!moveInDate) errs.moveInDate = 'กรุณาเลือกวันที่เข้าพัก'
    if (!moveOutDate) errs.moveOutDate = 'กรุณาเลือกวันหมดสัญญา'
    if (deposit === '' || isNaN(Number(deposit))) errs.deposit = 'กรุณากรอกค่ามัดจำ'
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
      emergencyContact: emergencyContact.trim(),
      emergencyPhone,
      lineUserId,
    }
    await saveResident(data)
    setSaving(false)
  }

  function Field({ label, children }) {
    return (
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>
        {children}
      </div>
    )
  }

  function ReadField({ label, value }) {
    return (
      <div>
        <label className="block text-xs text-neutral-400 mb-0.5">{label}</label>
        <div className="h-10 px-3.5 flex items-center bg-neutral-50 border border-neutral-100 rounded-xl text-sm text-neutral-700">{value || <span className="text-neutral-300 italic">—</span>}</div>
      </div>
    )
  }

  const lineName = lineUsers.find(u => u.userId === lineUserId)?.displayName

  return (
    <Modal open={true} onClose={() => setModal(null)} maxWidth="max-w-2xl">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 text-base shadow-sm">👤</div>
          <div>
            <h3 className="text-base font-semibold text-neutral-800">{ro ? 'ดูข้อมูลผู้พัก' : editResident ? 'แก้ไขข้อมูลผู้พัก' : 'เพิ่มผู้พักอาศัย'}</h3>
            <p className="text-xs text-neutral-400">{ro ? 'รายละเอียดข้อมูลผู้พักอาศัย' : editResident ? 'แก้ไขข้อมูลผู้พักอาศัยในระบบ' : 'เพิ่มผู้พักอาศัยใหม่ในระบบ'}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ro ? (
              <>
                <ReadField label="ชื่อ-นามสกุล" value={name} />
                <ReadField label="เลขบัตรประชาชน" value={idCard} />
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
                <ReadField label="เบอร์โทรศัพท์" value={phone} />
                <ReadField label="อีเมล" value={email} />
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

          {ro ? (
            <ReadField label="หมายเลขห้องพัก" value={selectedRoom ? `ห้อง ${selectedRoom.roomNumber || selectedRoom.number} — ค่าเช่า ${(selectedRoom.rentPrice || selectedRoom.rent)?.toLocaleString()} บาท/เดือน` : '—'} />
          ) : (
            <Field label="หมายเลขห้องพัก">
              <Select value={roomId} onChange={setRoomId} options={roomOptions} placeholder="-- เลือกห้อง --" searchable error={errors.roomId} />
              {errors.roomId && <p className="text-xs text-rose-500 mt-1">{errors.roomId}</p>}
              {selectedRoom && (
                <p className="text-xs text-neutral-400 mt-1.5">
                  ค่าเช่า {(selectedRoom.rentPrice || selectedRoom.rent)?.toLocaleString()} บาท/เดือน
                  {selectedRoom.roomType ? ` — ${selectedRoom.roomType}` : ''}
                </p>
              )}
            </Field>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ro ? (
              <>
                <ReadField label="วันที่เข้าพัก" value={moveInDate ? `${moveInDate.getDate()} ${moveInDate.toLocaleString('default', { month: 'long' })} ${moveInDate.getFullYear() + 543}` : '—'} />
                <ReadField label="วันหมดสัญญา" value={moveOutDate ? `${moveOutDate.getDate()} ${moveOutDate.toLocaleString('default', { month: 'long' })} ${moveOutDate.getFullYear() + 543}` : '—'} />
              </>
            ) : (
              <>
                <Field label="วันที่เข้าพัก *">
                  <DatePickerField selected={moveInDate} onChange={setMoveInDate} error={errors.moveInDate} />
                  {errors.moveInDate && <p className="text-xs text-rose-500 mt-1">{errors.moveInDate}</p>}
                </Field>
                <Field label="วันหมดสัญญา *">
                  <DatePickerField selected={moveOutDate} onChange={setMoveOutDate} error={errors.moveOutDate} />
                  {errors.moveOutDate && <p className="text-xs text-rose-500 mt-1">{errors.moveOutDate}</p>}
                </Field>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ro ? (
              <ReadField label="ค่ามัดจำ" value={deposit ? `${Number(deposit).toLocaleString()} บาท` : '—'} />
            ) : (
              <Field label="ค่ามัดจำ *">
                <div className="relative">
                  <input type="text" value={deposit ? formatDeposit(deposit) : deposit} onChange={e => handleDeposit(e.target.value)}
                    placeholder="0" inputMode="numeric"
                    className={`w-full h-10 px-3.5 bg-white border rounded-xl text-sm text-neutral-800 placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 ${errors.deposit ? 'border-rose-300' : 'border-neutral-200'}`} />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-neutral-400">บาท</span>
                </div>
                {errors.deposit && <p className="text-xs text-rose-500 mt-1">{errors.deposit}</p>}
              </Field>
            )}
            {ro ? (
              <ReadField label="ชื่อผู้ติดต่อฉุกเฉิน" value={emergencyContact} />
            ) : (
              <Input label="ชื่อผู้ติดต่อฉุกเฉิน" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)}
                placeholder="ชื่อผู้ติดต่อ" />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ro ? (
              <ReadField label="เบอร์โทรฉุกเฉิน" value={emergencyPhone} />
            ) : (
              <Input label="เบอร์โทรฉุกเฉิน" value={emergencyPhone} onChange={e => handleEmergencyPhone(e.target.value)}
                placeholder="0812345678" inputMode="numeric" maxLength={10} />
            )}
            {ro ? (
              <ReadField label="เชื่อมโยงบัญชี LINE" value={lineName || '—'} />
            ) : (
              <Field label="เชื่อมโยงบัญชี LINE">
                <Select value={lineUserId} onChange={setLineUserId} options={lineOptions} placeholder="— ไม่เชื่อมโยง LINE —" />
              </Field>
            )}
          </div>
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
              <Button onClick={handleSave} disabled={saving}>{saving ? 'กำลังบันทึก...' : editResident ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มผู้พัก'}</Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
