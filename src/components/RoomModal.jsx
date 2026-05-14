import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from './ui/modal'
import Button from './ui/button'
import Input from './ui/input'

export default function RoomModal() {
  const { editRoom, rooms, residents, saveRoom, setModal } = useApp()

  const [roomNumber, setRoomNumber] = useState(editRoom?.roomNumber || editRoom?.number || '')
  const [residentId, setResidentId] = useState(editRoom?.residentId || '')
  const [rentPrice, setRentPrice] = useState((editRoom?.rentPrice || editRoom?.rent || '').toString())
  const [roomType, setRoomType] = useState(editRoom?.roomType || 'ไม่มีทีวี')
  const [note, setNote] = useState(editRoom?.note || '')

  const [errors, setErrors] = useState({})

  const occupiedRoomIds = rooms
    .filter(r => r.residentId && r.id !== editRoom?.id)
    .map(r => r.residentId)

  const availableResidents = residents.filter(r => !occupiedRoomIds.includes(r.id))

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
    if (!rentPrice || isNaN(Number(rentPrice))) errs.rentPrice = 'กรุณากรอกค่าเช่า'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const selectedResident = residentId ? residents.find(r => r.id === residentId) : null
    saveRoom({
      id: editRoom?.id || undefined,
      roomNumber: roomNumber.trim(),
      residentId: residentId || null,
      rentPrice: Number(rentPrice) || 0,
      roomType,
      note: note.trim(),
    })
  }

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
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">ค่าเช่า/เดือน *</label>
              <div className="relative">
                <input type="text" value={rentPrice ? formatRent(rentPrice) : rentPrice} onChange={e => handleRentChange(e.target.value)}
                  placeholder="0" inputMode="numeric"
                  className={`w-full h-10 px-3.5 bg-white border rounded-xl text-sm text-neutral-800 placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 ${errors.rentPrice ? 'border-rose-300' : 'border-neutral-200'}`} />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-neutral-400">บาท</span>
              </div>
              {errors.rentPrice && <p className="text-xs text-rose-500 mt-1">{errors.rentPrice}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">ชื่อผู้เช่า</label>
              <select value={residentId} onChange={e => setResidentId(e.target.value)}
                className="w-full h-10 px-3.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800 transition-all duration-200 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100">
                <option value="">— ว่าง —</option>
                {availableResidents.map(r => (
                  <option key={r.id} value={r.id}>{r.name} (ห้อง {r.roomNumber})</option>
                ))}
                {editRoom?.residentId && residents.find(r => r.id === editRoom.residentId) && (
                  <option value={editRoom.residentId}>
                    {residents.find(r => r.id === editRoom.residentId)?.name} (แก้ไข)
                  </option>
                )}
              </select>
              {residentId && (
                <p className="text-xs text-lime-600 mt-1">✓ เชื่อมโยงผู้พักแล้ว</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">ประเภทห้องพัก *</label>
              <select value={roomType} onChange={e => setRoomType(e.target.value)}
                className="w-full h-10 px-3.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800 transition-all duration-200 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100">
                <option value="ไม่มีทีวี">ไม่มีทีวี</option>
                <option value="มีทีวี">มีทีวี</option>
              </select>
            </div>
          </div>

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
