import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from './ui/modal'
import Button from './ui/button'
import Input from './ui/input'
import Select from './ui/select'

const ROOM_TYPE_OPTIONS = [
  { value: 'ไม่มีทีวี', label: 'ไม่มีทีวี' },
  { value: 'มีทีวี', label: 'มีทีวี' },
]

export default function RoomModal() {
  const { editRoom, rooms, saveRoom, setModal } = useApp()

  const [roomNumber, setRoomNumber] = useState(editRoom?.roomNumber || editRoom?.number || '')
  const [roomCode, setRoomCode] = useState(editRoom?.roomCode || '')
  const [rentPrice, setRentPrice] = useState((editRoom?.rentPrice || editRoom?.rent || '').toString())
  const [rentalType, setRentalType] = useState(editRoom?.rentalType || 'daily')
  const [roomType, setRoomType] = useState(editRoom?.roomType || 'ไม่มีทีวี')
  const [prevElecMeter, setPrevElecMeter] = useState(editRoom?.prevElecMeter?.toString() || '')
  const [prevWaterMeter, setPrevWaterMeter] = useState(editRoom?.prevWaterMeter?.toString() || '')
  const [extraBed, setExtraBed] = useState(editRoom?.extraBed ? String(editRoom.extraBed) : '0')
  const [discount, setDiscount] = useState((editRoom?.discount || '').toString())
  const [note, setNote] = useState(editRoom?.note || '')
 
  const [errors, setErrors] = useState({})
  const [confirmRemoveResident, setConfirmRemoveResident] = useState(false)

  const formatRent = (val) => {
    const nums = val.replace(/[^\d]/g, '')
    if (!nums) return ''
    return Number(nums).toLocaleString()
  }

  const handleRentChange = (val) => {
    const nums = val.replace(/[^\d]/g, '')
    setRentPrice(nums)
  }

  const validate = () => {
    const errs = {}
    if (!roomNumber.trim()) errs.roomNumber = 'กรุณากรอกหมายเลขห้อง'
    if (!roomCode.trim()) errs.roomCode = 'กรุณากรอกรหัสห้อง'
    if (!rentPrice || isNaN(Number(rentPrice))) errs.rentPrice = 'กรุณากรอกค่าเช่า'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    saveRoom({
      id: editRoom?.id || undefined,
      roomNumber: roomNumber.trim(),
      roomCode: roomCode.trim(),
      rentPrice: Number(rentPrice) || 0,
      rentalType,
      roomType,
      prevElecMeter: (rentalType === 'daily' || rentalType === 'รายวัน') ? 0 : (prevElecMeter ? Number(prevElecMeter) : 0),
      prevWaterMeter: (rentalType === 'daily' || rentalType === 'รายวัน') ? 0 : (prevWaterMeter ? Number(prevWaterMeter) : 0),
      extraBed: Number(extraBed) || 0,
      discount: Number(discount) || 0,
      note: note.trim(),
      residentId: editRoom?.residentId || null,
    })
  }

  const residentName = editRoom?.tenantName || ''

  const handleConfirmRemoveResident = () => {
    setConfirmRemoveResident(false)
    saveRoom({
      id: editRoom.id,
      roomNumber: roomNumber.trim(),
      roomCode: roomCode.trim(),
      rentPrice: Number(rentPrice) || 0,
      rentalType,
      roomType,
      prevElecMeter: rentalType === 'daily' || rentalType === 'รายวัน' ? 0 : (prevElecMeter ? Number(prevElecMeter) : 0),
      prevWaterMeter: rentalType === 'daily' || rentalType === 'รายวัน' ? 0 : (prevWaterMeter ? Number(prevWaterMeter) : 0),
      extraBed: Number(extraBed) || 0,
      discount: Number(discount) || 0,
      note: note.trim(),
      residentId: null,
    })
  }

  return (
    <Modal open={true} onClose={() => setModal(null)} maxWidth="max-w-xl">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 text-base shadow-sm"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
          <div>
            <h3 className="text-base font-semibold text-neutral-800">{editRoom ? 'แก้ไขห้องพัก' : 'เพิ่มห้องพัก'}</h3>
            <p className="text-xs text-neutral-400">{editRoom ? 'แก้ไขข้อมูลห้องพัก' : 'เพิ่มห้องพักใหม่ในระบบ'}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">ประเภทการเช่า *</label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setRentalType('daily')}
                className={`flex-1 h-10 px-4 rounded-xl text-sm font-medium border transition-all ${rentalType === 'daily' ? 'bg-sky-50 border-sky-400 text-sky-700' : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-300'}`}>
                รายวัน
              </button>
              <button type="button" onClick={() => setRentalType('monthly')}
                className={`flex-1 h-10 px-4 rounded-xl text-sm font-medium border transition-all ${rentalType === 'monthly' ? 'bg-lime-50 border-lime-400 text-lime-700' : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-300'}`}>
                รายเดือน
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="หมายเลขห้องพัก *" value={roomNumber} onChange={e => setRoomNumber(e.target.value)}
              placeholder="เช่น 101" error={errors.roomNumber} autoFocus />
            <Input label="รหัสห้อง *" value={roomCode} onChange={e => setRoomCode(e.target.value)}
              placeholder="เช่น A-101" error={errors.roomCode} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">ประเภทห้องพัก *</label>
              <Select value={roomType} onChange={setRoomType} options={ROOM_TYPE_OPTIONS} placeholder="เลือกประเภท" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">ค่าเช่า/{rentalType === 'daily' ? 'วัน' : 'เดือน'} *</label>
              <div className="relative">
                <input type="text" value={rentPrice ? formatRent(rentPrice) : rentPrice} onChange={e => handleRentChange(e.target.value)}
                  placeholder="0" inputMode="numeric"
                  className={`w-full h-10 px-3.5 bg-white border rounded-xl text-sm text-neutral-800 placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 ${errors.rentPrice ? 'border-rose-300' : 'border-neutral-200'}`} />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-neutral-400">บาท</span>
              </div>
              {errors.rentPrice && <p className="text-xs text-rose-500 mt-1">{errors.rentPrice}</p>}
            </div>
          </div>

          {(rentalType === 'daily' || rentalType === 'รายวัน') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">เตียงเสริม</label>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" onClick={() => setExtraBed(String(n))}
                      className={`w-10 h-10 rounded-xl text-sm font-semibold border transition-all ${
                        Number(extraBed) === n
                          ? 'bg-lime-500 text-white border-lime-500 shadow-sm'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                      }`}>{n}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">ส่วนลด</label>
                <div className="relative">
                  <input type="text" value={discount ? formatRent(discount) : discount} onChange={e => {
                    const nums = e.target.value.replace(/[^\d]/g, '')
                    setDiscount(nums)
                  }} placeholder="0" inputMode="numeric"
                    className="w-full h-10 px-3.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100" />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-neutral-400">บาท</span>
                </div>
              </div>
            </div>
          )}

          {editRoom && residentName && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">ผู้พักปัจจุบัน</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-10 px-3.5 flex items-center bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-500">
                  {residentName}
                </div>
                <button onClick={() => setConfirmRemoveResident(true)}
                  className="h-10 px-3 rounded-xl text-xs font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors border border-rose-200 shrink-0">
                  ลบผู้เช่า
                </button>
              </div>
            </div>
          )}

          {(rentalType !== 'daily' && rentalType !== 'รายวัน') && (
            <div>
              <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">เลขมิเตอร์เริ่มต้น (ก่อนหน้า)</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input label="เลขมิเตอร์ไฟฟ้า" type="number" value={prevElecMeter} onChange={e => setPrevElecMeter(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="0" />
                <Input label="เลขมิเตอร์น้ำ" type="number" value={prevWaterMeter} onChange={e => setPrevWaterMeter(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="0" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">หมายเหตุ</label>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="หมายเหตุเพิ่มเติม..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 resize-none" />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-neutral-100">
          <Button variant="ghost" onClick={() => setModal(null)}>ยกเลิก</Button>
          <Button onClick={handleSave}>{editRoom ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มห้อง'}</Button>
        </div>
      </div>

      {confirmRemoveResident && (
        <Modal open={true} onClose={() => setConfirmRemoveResident(false)} maxWidth="max-w-sm">
          <div className="p-5">
            <h3 className="text-base font-bold text-neutral-800 mb-1">ลบผู้เช่า</h3>
            <p className="text-sm text-neutral-600 mb-5">
              ต้องการลบ <strong>{residentName}</strong> ออกจากห้องนี้?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmRemoveResident(false)}
                className="flex-1 h-9 rounded-xl text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors">
                ยกเลิก
              </button>
              <button onClick={handleConfirmRemoveResident}
                className="flex-1 h-9 rounded-xl text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm">
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  )
}
