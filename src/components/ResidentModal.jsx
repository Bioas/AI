import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { THAI_MONTHS } from '../lib/constants'
import Badge from './ui/badge'
import Modal from './ui/modal'
import Button from './ui/button'
import Input from './ui/input'

const currentYear = new Date().getFullYear() + 543
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)
const MONTHS = THAI_MONTHS.slice(1).map((name, i) => ({ value: i + 1, label: name }))
const YEARS = Array.from({ length: 20 }, (_, i) => currentYear - 5 + i)

function pad(n) { return String(n).padStart(2, '0') }

function dateToStr(year, month, day) {
  const gy = year - 543
  return `${gy}-${pad(month)}-${pad(day)}`
}

export default function ResidentModal() {
  const { editResident, rooms, residents, lineUsers, saveResident, setModal } = useApp()

  const initDate = (dateStr) => {
    if (!dateStr) return { day: '', month: '', year: '' }
    const [y, m, d] = dateStr.split('-').map(Number)
    return { day: d, month: m, year: y + 543 }
  }

  const initMoveIn = initDate(editResident?.moveInDate)
  const initMoveOut = initDate(editResident?.moveOutDate)

  const [name, setName] = useState(editResident?.name || '')
  const [idCard, setIdCard] = useState(editResident?.idCard || '')
  const [phone, setPhone] = useState(editResident?.phone || '')
  const [email, setEmail] = useState(editResident?.email || '')
  const [roomId, setRoomId] = useState(editResident?.roomId || '')
  const [deposit, setDeposit] = useState(editResident?.deposit?.toString() || '')
  const [emergencyContact, setEmergencyContact] = useState(editResident?.emergencyContact || '')
  const [emergencyPhone, setEmergencyPhone] = useState(editResident?.emergencyPhone || '')
  const [lineUserId, setLineUserId] = useState(editResident?.lineUserId || '')

  const [miDay, setMiDay] = useState(initMoveIn.day)
  const [miMonth, setMiMonth] = useState(initMoveIn.month)
  const [miYear, setMiYear] = useState(initMoveIn.year)
  const [moDay, setMoDay] = useState(initMoveOut.day)
  const [moMonth, setMoMonth] = useState(initMoveOut.month)
  const [moYear, setMoYear] = useState(initMoveOut.year)

  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const occupiedRoomIds = useMemo(() => {
    if (editResident) {
      return residents.filter(r => r.id !== editResident.id).map(r => r.roomId)
    }
    return residents.map(r => r.roomId)
  }, [residents, editResident])

  const availableRooms = rooms.filter(r => !occupiedRoomIds.includes(r.id))

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
    if (!roomId) errs.roomId = 'กรุณาเลือกหมายเลขห้อง'
    if (!miDay || !miMonth || !miYear) errs.moveInDate = 'กรุณาเลือกวันที่เข้าพัก'
    if (!moDay || !moMonth || !moYear) errs.moveOutDate = 'กรุณาเลือกวันหมดสัญญา'
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
      moveInDate: dateToStr(miYear, miMonth, miDay),
      moveOutDate: dateToStr(moYear, moMonth, moDay),
      deposit: Number(deposit) || 0,
      emergencyContact: emergencyContact.trim(),
      emergencyPhone,
      lineUserId,
    }
    await saveResident(data)
    setSaving(false)
  }

  const selectedRoom = rooms.find(r => r.id === roomId)

  return (
    <Modal open={true} onClose={() => setModal(null)} maxWidth="max-w-2xl">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 text-base shadow-sm">👤</div>
          <div>
            <h3 className="text-base font-semibold text-neutral-800">{editResident ? 'แก้ไขข้อมูลผู้พัก' : 'เพิ่มผู้พักอาศัย'}</h3>
            <p className="text-xs text-neutral-400">{editResident ? 'แก้ไขข้อมูลผู้พักอาศัยในระบบ' : 'เพิ่มผู้พักอาศัยใหม่ในระบบ'}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="ชื่อ-นามสกุล *" value={name} onChange={e => setName(e.target.value)}
              placeholder="ชื่อ-นามสกุล" error={errors.name} autoFocus />
            <Input label="เลขบัตรประชาชน *" value={idCard} onChange={e => handleIdCard(e.target.value)}
              placeholder="13 หลัก" inputMode="numeric" maxLength={13} error={errors.idCard} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="เบอร์โทรศัพท์ *" value={phone} onChange={e => handlePhone(e.target.value)}
              placeholder="0812345678" inputMode="numeric" maxLength={10} error={errors.phone} />
            <Input label="อีเมล" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="example@email.com" error={errors.email} />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">หมายเลขห้องพัก *</label>
            <select value={roomId} onChange={e => setRoomId(e.target.value)}
              className={`w-full h-10 px-3.5 bg-white border rounded-xl text-sm text-neutral-800 transition-all duration-200 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 ${errors.roomId ? 'border-rose-300' : 'border-neutral-200'}`}>
              <option value="">-- เลือกห้อง --</option>
              {availableRooms.map(r => (
                <option key={r.id} value={r.id}>ห้อง {r.roomNumber || r.number} ({r.tenantName || (r.status === 'มีผู้เช่า' ? 'มีผู้เช่า' : 'ว่าง')})</option>
              ))}
              {editResident && selectedRoom && !availableRooms.find(r => r.id === roomId) && (
                <option value={roomId}>ห้อง {selectedRoom.roomNumber || selectedRoom.number} (แก้ไข)</option>
              )}
            </select>
            {errors.roomId && <p className="text-xs text-rose-500 mt-1">{errors.roomId}</p>}
            {selectedRoom && (
              <p className="text-xs text-neutral-400 mt-1.5">
                ค่าเช่า {(selectedRoom.rentPrice || selectedRoom.rent)?.toLocaleString()} บาท/เดือน
                {selectedRoom.roomType ? ` — ${selectedRoom.roomType}` : ''}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">วันที่เข้าพัก *</label>
              <div className="grid grid-cols-7 gap-1.5">
                <select value={miDay} onChange={e => setMiDay(Number(e.target.value))}
                  className={`col-span-2 h-10 px-2 bg-white border rounded-xl text-sm text-neutral-800 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 ${errors.moveInDate ? 'border-rose-300' : 'border-neutral-200'}`}>
                  <option value="">วัน</option>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={miMonth} onChange={e => setMiMonth(Number(e.target.value))}
                  className={`col-span-3 h-10 px-2 bg-white border rounded-xl text-sm text-neutral-800 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 ${errors.moveInDate ? 'border-rose-300' : 'border-neutral-200'}`}>
                  <option value="">เดือน</option>
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <select value={miYear} onChange={e => setMiYear(Number(e.target.value))}
                  className={`col-span-2 h-10 px-2 bg-white border rounded-xl text-sm text-neutral-800 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 ${errors.moveInDate ? 'border-rose-300' : 'border-neutral-200'}`}>
                  <option value="">ปี</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              {errors.moveInDate && <p className="text-xs text-rose-500 mt-1">{errors.moveInDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">วันหมดสัญญา *</label>
              <div className="grid grid-cols-7 gap-1.5">
                <select value={moDay} onChange={e => setMoDay(Number(e.target.value))}
                  className={`col-span-2 h-10 px-2 bg-white border rounded-xl text-sm text-neutral-800 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 ${errors.moveOutDate ? 'border-rose-300' : 'border-neutral-200'}`}>
                  <option value="">วัน</option>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={moMonth} onChange={e => setMoMonth(Number(e.target.value))}
                  className={`col-span-3 h-10 px-2 bg-white border rounded-xl text-sm text-neutral-800 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 ${errors.moveOutDate ? 'border-rose-300' : 'border-neutral-200'}`}>
                  <option value="">เดือน</option>
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <select value={moYear} onChange={e => setMoYear(Number(e.target.value))}
                  className={`col-span-2 h-10 px-2 bg-white border rounded-xl text-sm text-neutral-800 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 ${errors.moveOutDate ? 'border-rose-300' : 'border-neutral-200'}`}>
                  <option value="">ปี</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              {errors.moveOutDate && <p className="text-xs text-rose-500 mt-1">{errors.moveOutDate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="sm:pt-0">
              <Input label="ชื่อผู้ติดต่อฉุกเฉิน" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)}
                placeholder="ชื่อผู้ติดต่อ" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="เบอร์โทรฉุกเฉิน" value={emergencyPhone} onChange={e => handleEmergencyPhone(e.target.value)}
              placeholder="0812345678" inputMode="numeric" maxLength={10} />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">เชื่อมโยงบัญชี LINE</label>
            <select value={lineUserId} onChange={e => setLineUserId(e.target.value)}
              className="w-full h-10 px-3.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800 transition-all duration-200 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100">
              <option value="">-- ไม่เชื่อมโยง LINE --</option>
              {lineUsers.filter(u => u.isFollowing && (!u.residentId || u.residentId === editResident?.id)).map(u => (
                <option key={u.userId} value={u.userId}>
                  {u.displayName} ({u.userId.slice(0, 12)}...)
                  {!u.isActive ? ' [ปิดใช้งาน]' : ''}
                </option>
              ))}
            </select>
            {editResident?.lineUserId && !lineUserId && (
              <p className="text-xs text-amber-600 mt-1">กำลังเชื่อมโยงกับ {lineUsers.find(u => u.userId === editResident.lineUserId)?.displayName || editResident.lineUserId}</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-neutral-100">
          <Button variant="ghost" onClick={() => setModal(null)} disabled={saving}>ยกเลิก</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'กำลังบันทึก...' : editResident ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มผู้พัก'}</Button>
        </div>
      </div>
    </Modal>
  )
}
