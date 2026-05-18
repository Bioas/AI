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

const RENTAL_TYPE_OPTIONS = [
  { value: 'รายเดือน', label: 'รายเดือน' },
  { value: 'รายวัน', label: 'รายวัน' },
]

export default function RoomModal() {
  const { editRoom, rooms, saveRoom, setModal } = useApp()

  const [roomNumber, setRoomNumber] = useState(editRoom?.roomNumber || editRoom?.number || '')
  const [roomCode, setRoomCode] = useState(editRoom?.roomCode || '')
  const [rentPrice, setRentPrice] = useState((editRoom?.rentPrice || editRoom?.rent || '').toString())
  const [rentalType, setRentalType] = useState(editRoom?.rentalType || 'monthly')
  const [roomType, setRoomType] = useState(editRoom?.roomType || 'ไม่มีทีวี')
  const [prevElecMeter, setPrevElecMeter] = useState(editRoom?.prevElecMeter?.toString() || '')
  const [prevWaterMeter, setPrevWaterMeter] = useState(editRoom?.prevWaterMeter?.toString() || '')
  const [note, setNote] = useState(editRoom?.note || '')

  const [errors, setErrors] = useState({})

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
      prevElecMeter: rentalType === 'daily' ? 0 : (prevElecMeter ? Number(prevElecMeter) : 0),
      prevWaterMeter: rentalType === 'daily' ? 0 : (prevWaterMeter ? Number(prevWaterMeter) : 0),
      note: note.trim(),
      residentId: editRoom?.residentId || null,
    })
  }

  const residentName = editRoom?.tenantName || ''

  return (
    <Modal open={true} onClose={() => setModal(null)} maxWidth="max-w-xl">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 text-base shadow-sm">🚪</div>
          <div>
            <h3 className="text-base font-semibold text-neutral-800">{editRoom ? 'แก้ไขห้องพัก' : 'เพิ่มห้องพัก'}</h3>
            <p className="text-xs text-neutral-400">{editRoom ? 'แก้ไขข้อมูลห้องพัก' : 'เพิ่มห้องพักใหม่ในระบบ'}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="หมายเลขห้องพัก *" value={roomNumber} onChange={e => setRoomNumber(e.target.value)}
              placeholder="เช่น 101" error={errors.roomNumber} autoFocus />
            <Input label="รหัสห้อง *" value={roomCode} onChange={e => setRoomCode(e.target.value)}
              placeholder="เช่น A-101" error={errors.roomCode} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">ประเภทการเช่า *</label>
              <Select value={rentalType} onChange={setRentalType} options={RENTAL_TYPE_OPTIONS} placeholder="เลือกประเภท" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">ประเภทห้องพัก *</label>
              <Select value={roomType} onChange={setRoomType} options={ROOM_TYPE_OPTIONS} placeholder="เลือกประเภท" />
            </div>
            <div />
          </div>

          {editRoom && residentName && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">ผู้พักปัจจุบัน</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-10 px-3.5 flex items-center bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-500">
                  {residentName}
                </div>
                <button onClick={() => {
                  if (window.confirm(`ต้องการลบ "${residentName}" ออกจากห้องนี้?`)) {
                    saveRoom({
                      id: editRoom.id,
                      roomNumber: roomNumber.trim(),
                      roomCode: roomCode.trim(),
                      rentPrice: Number(rentPrice) || 0,
                      roomType,
                      prevElecMeter: prevElecMeter ? Number(prevElecMeter) : 0,
                      prevWaterMeter: prevWaterMeter ? Number(prevWaterMeter) : 0,
                      note: note.trim(),
                      residentId: null,
                    })
                  }
                }}
                  className="h-10 px-3 rounded-xl text-xs font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors border border-rose-200 shrink-0">
                  ลบผู้เช่า
                </button>
              </div>
            </div>
          )}

          {rentalType !== 'daily' && (
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
    </Modal>
  )
}
