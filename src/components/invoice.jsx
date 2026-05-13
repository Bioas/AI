import { useApp } from '../context/AppContext'
import { formatMonth } from '../lib/constants'

export default function Invoice() {
  const { rooms, invMonth, setInvMonth, calcInv, downloadPdf, sendInvLine, setViewInv, setModal } = useApp()

  const handleView = (inv) => {
    setViewInv(inv)
    setModal('invoice')
  }

  return (
    <div className="animate-fadeInUp">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
          🧾 ใบแจ้งหนี้
        </h2>
      </div>

      <div className="flex items-center gap-3 mb-7 bg-white px-5 py-3.5 rounded-xl shadow-sm w-fit">
        <label className="font-semibold text-slate-900 text-sm">📅 เลือกเดือน:</label>
        <input
          type="month"
          value={invMonth}
          onChange={e => setInvMonth(e.target.value)}
          className="px-4 py-2.5 border-2 border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
        />
      </div>

      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300">
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-emerald-50/50">
                {['ห้อง', 'ผู้พัก', 'ค่าเช่า', 'ค่าไฟ', 'ค่าน้ำ', 'รวม', 'จัดการ'].map(h => (
                  <th key={h} className="text-left px-4 py-3.5 font-bold text-slate-500 text-[11px] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rooms.filter(r => r.tenantName).length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="text-center py-14 text-slate-400">
                    <div className="text-4xl mb-4 animate-float">🧾</div>
                    <p>ยังไม่มีข้อมูล</p>
                  </div>
                </td></tr>
              ) : rooms.filter(r => r.tenantName).map((r, i) => {
                const inv = calcInv(r, invMonth)
                return (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <span className="inline-block bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm shadow-emerald-200">{inv.room}</span>
                    </td>
                    <td className="px-4 py-4 text-slate-900">{inv.tenant}</td>
                    <td className="px-4 py-4 text-slate-900">{inv.rent.toLocaleString()}</td>
                    <td className="px-4 py-4 text-slate-900">{inv.elecCost.toLocaleString()} <span className="text-slate-400 text-xs">({inv.elecUnits} หน่วย)</span></td>
                    <td className="px-4 py-4 text-slate-900">{inv.waterCost.toLocaleString()} <span className="text-slate-400 text-xs">({inv.waterUnits} หน่วย)</span></td>
                    <td className="px-4 py-4 text-lg font-extrabold text-slate-900">{inv.total.toLocaleString()} ฿</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1.5">
                        <button onClick={() => handleView(inv)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">👁️ ดู</button>
                        <button onClick={() => downloadPdf(inv)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">📄 PDF</button>
                        <button onClick={() => sendInvLine(inv)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 transition-colors">📱 LINE</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
