import { useApp } from '../context/AppContext';
import Link from 'next/link';

export default function Setting() {
  const { settings, saveSettingsDelayed, uploadLogo, removeLogo, sendLineMsg, exportData, importData, toast } = useApp();

  return (
    <div className="animate-fadeInUp">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
          ⚙️ ตั้งค่าระบบ
        </h2>
      </div>

      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300">
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2.5">🏢 ข้อมูลหอพัก</h3>
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-7 p-5 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all duration-300">
          <div className="w-20 h-20 shrink-0">
            {settings.logo ? (
              <img src={settings.logo} alt="Logo" className="w-20 h-20 object-contain rounded-xl border border-slate-200" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-300 to-emerald-400 flex items-center justify-center text-3xl text-slate-900">
                🏠
              </div>
            )}
          </div>
          <div>
            <p className="font-bold text-sm text-slate-900 mb-2.5">โลโก้หอพัก (แสดงใน PDF)</p>
            <div className="flex gap-2.5 mb-2">
              <button onClick={() => document.getElementById('logoInput')?.click()}
                className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 hover:shadow-md transition-all duration-300">📷 อัปโหลด</button>
              <button onClick={removeLogo}
                className="bg-red-50 text-red-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-100 transition-all duration-300">🗑️ ลบ</button>
            </div>
            <input type="file" id="logoInput" accept="image/*" style={{ display: 'none' }} onChange={uploadLogo} />
            <p className="text-xs text-slate-400">รองรับ PNG, JPG ขนาดไม่เกิน 2MB</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">ชื่อหอพัก</label>
            <input value={settings.dormName} onChange={e => saveSettingsDelayed('dormName', e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">เบอร์โทรศัพท์</label>
            <input value={settings.phone} onChange={e => saveSettingsDelayed('phone', e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
          </div>
        </div>
        <div className="mt-5">
          <label className="block text-sm font-semibold text-slate-900 mb-2">ที่อยู่</label>
          <input value={settings.address} onChange={e => saveSettingsDelayed('address', e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300">
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2.5">💰 อัตราค่าใช้จ่าย</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            ['rateElec', 'ค่าไฟต่อหน่วย (บาท)', 0],
            ['rateWater', 'ค่าน้ำต่อหน่วย (บาท)', 0],
            ['commonFee', 'ค่าส่วนกลาง/เดือน (บาท)', 0],
            ['internetFee', 'ค่าอินเตอร์เน็ต/เดือน (บาท)', 0],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-slate-900 mb-2">{label}</label>
              <input type="number" value={settings[key] || 0}
                onChange={e => saveSettingsDelayed(key, parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300">
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2.5">📱 LINE Messaging API</h3>
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/50 rounded-xl p-5 mb-5 text-sm text-slate-900 leading-relaxed">
          📌 <strong>วิธีตั้งค่า:</strong><br />
          1. สร้าง Channel ที่ <code className="bg-emerald-200/50 px-2 py-0.5 rounded text-xs font-mono">developers.line.biz/console</code><br />
          2. เปิด Messaging API → คัดลอก <strong>Channel Access Token</strong><br />
          3. ผู้พักเพิ่มบอทเป็นเพื่อน → ระบบส่งใบแจ้งหนี้ผ่าน LINE ได้
        </div>
        <div className="flex items-center gap-2.5 mb-5 text-sm font-semibold text-slate-900">
          <span className={`w-3 h-3 rounded-full ${settings.channelToken ? 'bg-green-500 shadow-md shadow-green-500/50' : 'bg-red-500 shadow-md shadow-red-500/50'}`} />
          {settings.channelToken ? 'Token ถูกตั้งค่าแล้ว' : 'ยังไม่ได้ตั้งค่า Token'}
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Channel Access Token</label>
          <input type="text" placeholder="eyJhbGciOi..." value={settings.channelToken || ''}
            onChange={e => saveSettingsDelayed('channelToken', e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all" />
        </div>
        <button onClick={async () => {
          const uid = prompt('กรอก LINE User ID เพื่อทดสอบ (ขึ้นต้นด้วย U):');
          if (!uid || !uid.startsWith('U')) { toast('User ID ไม่ถูกต้อง', true); return; }
          await sendLineMsg(uid, `🧪 ทดสอบ LINE\nเวลา: ${new Date().toLocaleString('th-TH')}\n✅ ระบบพร้อมใช้งาน!`);
        }}
          className="mt-4 bg-gradient-to-r from-violet-500 to-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-violet-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          🧪 ทดสอบส่งข้อความ
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300">
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2.5">🗂️ สำรอง & กู้คืนข้อมูล</h3>
        <p className="text-sm text-slate-400 mb-5">💡 Export ไว้พกไป Import ในเครื่องอื่น</p>
        <div className="flex gap-3.5 flex-wrap">
          <button onClick={exportData}
            className="bg-transparent border-2 border-emerald-600 text-emerald-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-600 hover:text-white hover:shadow-md transition-all duration-300">📤 Export</button>
          <button onClick={() => document.getElementById('importFile')?.click()}
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 hover:shadow-md transition-all duration-300">📥 Import</button>
        </div>
        <input type="file" id="importFile" accept=".json" style={{ display: 'none' }} onChange={importData} />
      </div>
    </div>
  );
}
