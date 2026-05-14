import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from './ui/modal'
import Button from './ui/button'
import Input from './ui/input'

export default function RoomModal() {
  const { editRoom, saveRoom, setModal } = useApp()
  const [num, setNum] = useState(editRoom?.number || '')
  const [rent, setRent] = useState(editRoom?.rent ? editRoom.rent.toString() : '')
  const [name, setName] = useState(editRoom?.tenantName || '')
  const [phone, setPhone] = useState(editRoom?.tenantPhone || '')
  const [userId, setUserId] = useState(editRoom?.tenantUserId || '')
  const [note, setNote] = useState(editRoom?.note || '')

  const handleSave = () => {
    if (!num.trim()) return
    saveRoom({
      id: editRoom?.id || undefined, number: num.trim(), rent: parseFloat(rent) || 0,
      tenantName: name.trim(), tenantPhone: phone.trim(), tenantUserId: userId.trim(), note: note.trim(),
    })
  }

  return (
    <Modal open={true} onClose={() => setModal(null)}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 text-base shadow-sm">🚪</div>
          <div>
            <h3 className="text-base font-semibold text-neutral-800">{editRoom ? 'แก้ไขห้อง' : 'เพิ่มห้อง'}</h3>
            <p className="text-xs text-neutral-400">{editRoom ? 'แก้ไขข้อมูลห้องพัก' : 'เพิ่มห้องพักใหม่ในระบบ'}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="หมายเลขห้อง" value={num} onChange={e => setNum(e.target.value)} placeholder="เช่น 101" autoFocus />
            <Input label="ค่าเช่า/เดือน (บาท)" type="number" value={rent} onChange={e => setRent(e.target.value)} placeholder="3500" />
          </div>
          <Input label="ชื่อผู้พัก" value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อ-นามสกุล" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="เบอร์โทรศัพท์" value={phone} onChange={e => setPhone(e.target.value)} placeholder="081-234-5678" />
            <Input label="LINE User ID" value={userId} onChange={e => setUserId(e.target.value)} placeholder="Uxxxxxxxxx" />
          </div>
          <Input label="หมายเหตุ" value={note} onChange={e => setNote(e.target.value)} placeholder="หมายเหตุเพิ่มเติม" />
        </div>
        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-neutral-100">
          <Button variant="ghost" onClick={() => setModal(null)}>ยกเลิก</Button>
          <Button onClick={handleSave}>{editRoom ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มห้อง'}</Button>
        </div>
      </div>
    </Modal>
  )
}
