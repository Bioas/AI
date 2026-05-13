import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Modal from './Modal';

export default function RoomModal() {
  const { editRoom, saveRoom } = useApp();
  const [num, setNum] = useState(editRoom?.number || '');
  const [rent, setRent] = useState(editRoom?.rent ? editRoom.rent.toString() : '');
  const [name, setName] = useState(editRoom?.tenantName || '');
  const [phone, setPhone] = useState(editRoom?.tenantPhone || '');
  const [userId, setUserId] = useState(editRoom?.tenantUserId || '');
  const [note, setNote] = useState(editRoom?.note || '');

  const handleSave = () => {
    if (!num.trim()) { alert('กรุณาระบุหมายเลขห้อง'); return; }
    saveRoom({
      id: editRoom?.id || undefined,
      number: num.trim(),
      rent: parseFloat(rent) || 0,
      tenantName: name.trim(),
      tenantPhone: phone.trim(),
      tenantUserId: userId.trim(),
      note: note.trim(),
    });
  };

  return (
    <Modal>
      <h3 className="text-2xl font-extrabold text-slate-900 mb-7">
        {editRoom ? '✏️ แก้ไขห้อง' : '➕ เพิ่มห้อง'}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">หมายเลขห้อง</label>
          <input value={num} onChange={e => setNum(e.target.value)} placeholder="เช่น 101" autoFocus
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">ค่าเช่าต่อเดือน (บาท)</label>
          <input type="number" value={rent} onChange={e => setRent(e.target.value)} placeholder="3500"
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
        </div>
      </div>

      <div className="mt-5">
        <label className="block text-sm font-semibold text-slate-900 mb-2">ชื่อผู้พัก</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อ-นามสกุล"
          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">เบอร์โทรศัพท์</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="081-234-5678"
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">LINE User ID</label>
          <input value={userId} onChange={e => setUserId(e.target.value)} placeholder="Uxxxxxxxxx"
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
        </div>
      </div>

      <div className="mt-5">
        <label className="block text-sm font-semibold text-slate-900 mb-2">หมายเหตุ</label>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="เช่น รวมค่าเน็ต"
          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
      </div>

      <div className="flex gap-3.5 justify-end mt-8">
        <button onClick={() => setModal(null)}
          className="bg-slate-100 text-slate-500 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-all">ยกเลิก</button>
        <button onClick={handleSave}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all duration-300">💾 บันทึก</button>
      </div>
    </Modal>
  );
}
