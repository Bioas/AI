import { useApp } from '../context/AppContext'

export default function Room() {
  const { rooms, setEditRoom, setModal, deleteRoom } = useApp()

  const handleDelete = (id, number) => {
    if (!window.confirm(`⚠️ ต้องการลบห้อง ${number}?`)) return
    deleteRoom(id)
  }

  return (
    <div className="animate-fadeInUp">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
          🚪 จัดการห้อง
        </h2>
        <button
          onClick={() => { setEditRoom(null); setModal('room') }}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-emerald-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
        >
          ➕ เพิ่มห้อง
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300">
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-emerald-50/50">
                {['ห้อง', 'ค่าเช่า/เดือน', 'ชื่อผู้พัก', 'เบอร์โทร', 'LINE User ID', 'จัดการ'].map(h => (
                  <th key={h} className="text-left px-4 py-3.5 font-bold text-slate-500 text-[11px] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rooms.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="text-center py-14 text-slate-400">
                    <div className="text-4xl mb-4 animate-float">🚪</div>
                    <p>ยังไม่มีห้อง</p>
                  </div>
                </td></tr>
              ) : rooms.map((r, i) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <span className="inline-block bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm shadow-emerald-200">{r.number}</span>
                  </td>
                  <td className="px-4 py-4 text-slate-900 font-medium">{r.rent.toLocaleString()} ฿</td>
                  <td className="px-4 py-4 text-slate-900">{r.tenantName || <span className="text-slate-300 italic">—</span>}</td>
                  <td className="px-4 py-4 text-slate-900">{r.tenantPhone || <span className="text-slate-300 italic">—</span>}</td>
                  <td className="px-4 py-4 text-xs font-mono text-slate-600">{r.tenantUserId || <span className="text-slate-300 italic">ยังไม่ได้ตั้งค่า</span>}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => { setEditRoom(r); setModal('room') }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors"
                      >✏️ แก้ไข</button>
                      <button
                        onClick={() => handleDelete(r.id, r.number)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                      >🗑️ ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
