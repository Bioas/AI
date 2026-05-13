import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from './Modal'
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
      id: editRoom?.id || undefined,
      number: num.trim(),
      rent: parseFloat(rent) || 0,
      tenantName: name.trim(),
      tenantPhone: phone.trim(),
      tenantUserId: userId.trim(),
      note: note.trim(),
    })
  }

  return (
    <Modal onClose={() => setModal(null)}>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-zinc-900 mb-6">
          {editRoom ? 'Edit Room' : 'Add Room'}
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Room Number" value={num} onChange={e => setNum(e.target.value)} placeholder="e.g. 101" autoFocus />
            <Input label="Monthly Rent (THB)" type="number" value={rent} onChange={e => setRent(e.target.value)} placeholder="3500" />
          </div>
          <Input label="Tenant Name" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="081-234-5678" />
            <Input label="LINE User ID" value={userId} onChange={e => setUserId(e.target.value)} placeholder="Uxxxxxxxxx" />
          </div>
          <Input label="Notes" value={note} onChange={e => setNote(e.target.value)} placeholder="Optional notes" />
        </div>

        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-zinc-100">
          <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={handleSave}>{editRoom ? 'Save Changes' : 'Add Room'}</Button>
        </div>
      </div>
    </Modal>
  )
}
