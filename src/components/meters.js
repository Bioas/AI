import { useApp } from '../context/AppContext';
import { formatMonth } from '../lib/constants';

export default function Meters() {
  const { rooms, settings, meterMonth, setMeterMonth, meterLocal, setMeterField, saveAllMeters, saveSettingsDelayed } = useApp();

  const occRooms = rooms.filter(r => r.tenantName);

  return (
    <div className="animate-fadeInUp">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
          ⚡ บันทึกหน่วย ค่าไฟ/น้ำ
        </h2>
        <button
          onClick={saveAllMeters}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-emerald-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
        >
          💾 บันทึกทั้งหมด
        </button>
      </div>

      <div className="flex items-center gap-3 mb-7 bg-white px-5 py-3.5 rounded-xl shadow-sm w-fit">
        <label className="font-semibold text-slate-900 text-sm">📅 เลือกเดือน:</label>
        <input
          type="month"
          value={meterMonth}
          onChange={e => setMeterMonth(e.target.value)}
          className="px-4 py-2.5 border-2 border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
        />
      </div>

      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300">
        <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2.5">
          📝 บันทึกหน่วยใช้ — <span className="text-emerald-600">{formatMonth(meterMonth)}</span>
        </h3>
        <p className="text-sm text-slate-400 mb-5">💡 แก้ไขหน่วยก่อนหน้าได้ที่ช่องสีเหลือง แล้วกด "บันทึกทั้งหมด"</p>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-emerald-50/50">
                {['ห้อง', 'ผู้พัก', 'ไฟ ก่อนหน้า', 'ไฟ ปัจจุบัน', 'ใช้จริง', 'น้ำ ก่อนหน้า', 'น้ำ ปัจจุบัน', 'ใช้จริง'].map(h => (
                  <th key={h} className="text-left px-3 py-3.5 font-bold text-slate-500 text-[11px] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {occRooms.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="text-center py-14 text-slate-400">
                    <div className="text-4xl mb-4 animate-float">📝</div>
                    <p>ยังไม่มีห้องที่มีผู้พักอาศัย</p>
                  </div>
                </td></tr>
              ) : occRooms.map((r, i) => {
                const ml = meterLocal[r.id] || { cur: { elec: '', water: '' }, prev: { elec: '', water: '' } };
                const eu = (ml.cur.elec !== '' && ml.prev.elec !== '') ? Math.max(0, Number(ml.cur.elec) - Number(ml.prev.elec)) : '—';
                const wu = (ml.cur.water !== '' && ml.prev.water !== '') ? Math.max(0, Number(ml.cur.water) - Number(ml.prev.water)) : '—';
                return (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 py-4">
                      <span className="inline-block bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm shadow-emerald-200">{r.number}</span>
                    </td>
                    <td className="px-3 py-4 text-slate-900">{r.tenantName}</td>
                    <td className="px-3 py-4">
                      <input type="number" value={ml.prev.elec} onChange={e => setMeterField(r.id, 'prev', 'elec', e.target.value)}
                        className="w-20 px-2.5 py-2 border-2 border-amber-300 bg-amber-50 rounded-lg text-center text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
                    </td>
                    <td className="px-3 py-4">
                      <input type="number" value={ml.cur.elec} onChange={e => setMeterField(r.id, 'cur', 'elec', e.target.value)}
                        className="w-20 px-2.5 py-2 border-2 border-slate-200 rounded-lg text-center text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
                    </td>
                    <td className="px-3 py-4 font-bold text-emerald-600 text-sm">{eu}</td>
                    <td className="px-3 py-4">
                      <input type="number" value={ml.prev.water} onChange={e => setMeterField(r.id, 'prev', 'water', e.target.value)}
                        className="w-20 px-2.5 py-2 border-2 border-amber-300 bg-amber-50 rounded-lg text-center text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
                    </td>
                    <td className="px-3 py-4">
                      <input type="number" value={ml.cur.water} onChange={e => setMeterField(r.id, 'cur', 'water', e.target.value)}
                        className="w-20 px-2.5 py-2 border-2 border-slate-200 rounded-lg text-center text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
                    </td>
                    <td className="px-3 py-4 font-bold text-emerald-600 text-sm">{wu}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300">
        <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2.5">💡 อัตราค่าหน่วย</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-900">
            <span>⚡ ค่าไฟ</span>
            <input type="number" value={settings.rateElec} onChange={e => saveSettingsDelayed('rateElec', parseFloat(e.target.value) || 7)}
              className="w-20 px-3 py-2.5 border-2 border-slate-200 rounded-lg text-center text-sm font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
            <span>บาท/หน่วย</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-900">
            <span>💧 ค่าน้ำ</span>
            <input type="number" value={settings.rateWater} onChange={e => saveSettingsDelayed('rateWater', parseFloat(e.target.value) || 20)}
              className="w-20 px-3 py-2.5 border-2 border-slate-200 rounded-lg text-center text-sm font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
            <span>บาท/หน่วย</span>
          </div>
        </div>
      </div>
    </div>
  );
}
