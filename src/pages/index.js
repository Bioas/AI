import { useState, useEffect, useCallback, useRef } from 'react';
import styles from '../styles/Home.module.css';
import Dashboard from './dashboard';
import Room from './room';
import Meters from './meters';
import Invoice from './invoice';
import Setting from './setting';

const api = async (path, method, body) => {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  return res.json();
};

const THAI_MONTHS = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

function formatMonth(ym) {
  const [y, m] = ym.split('-');
  return THAI_MONTHS[parseInt(m)] + ' ' + (parseInt(y) + 543);
}

function getPrevMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

export default function Home() {
  const [page, setPage] = useState('dashboard');
  const [rooms, setRooms] = useState([]);
  const [meters, setMeters] = useState([]);
  const [settings, setSettings] = useState({ dormName: '', address: '', phone: '', rateElec: 7, rateWater: 20, channelToken: '', logo: '', commonFee: 0, internetFee: 0 });
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);
  const [editRoom, setEditRoom] = useState(null);
  const [meterMonth, setMeterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [invMonth, setInvMonth] = useState(new Date().toISOString().slice(0, 7));
  const [viewInv, setViewInv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meterLocal, setMeterLocal] = useState({});

  const toast = useCallback((msg, err = false) => {
    const id = Date.now().toString(36);
    setToasts(p => [...p, { id, msg, err }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [r, m, s] = await Promise.all([
        api('/api/rooms', 'GET'),
        api('/api/meters', 'GET'),
        api('/api/settings', 'GET')
      ]);
      setRooms(r || []);
      setMeters(m || []);
      setSettings(s || {});
    } catch { toast('โหลดข้อมูลไม่สำเร็จ', true); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // Room CRUD
  const saveRoom = async (data) => {
    const body = data.id ? { ...data } : data;
    const method = body.id ? 'PUT' : 'POST';
    await api('/api/rooms', method, body);
    await fetchAll(); setModal(null); setEditRoom(null);
    toast(body.id ? 'แก้ไขห้องสำเร็จ' : 'เพิ่มห้องสำเร็จ');
  };

  const deleteRoom = async (id) => {
    if (!confirm('ต้องการลบห้องนี้?')) return;
    await api('/api/rooms', 'DELETE', { id });
    await fetchAll(); toast('ลบห้องสำเร็จ');
  };

  // Meter functions
  const initMeterLocal = useCallback(() => {
    const local = {};
    rooms.filter(r => r.tenantName).forEach(r => {
      const pm = getPrevMonth(meterMonth);
      const cur = meters.find(x => x.roomId === r.id && x.month === meterMonth) || { elec: '', water: '' };
      const prev = meters.find(x => x.roomId === r.id && x.month === pm) || { elec: '', water: '' };
      local[r.id] = { cur: { ...cur }, prev: { ...prev } };
    });
    setMeterLocal(local);
  }, [rooms, meters, meterMonth]);

  useEffect(() => { initMeterLocal(); }, [initMeterLocal]);

  const setMeterField = (rid, section, field, val) => {
    setMeterLocal(prev => ({
      ...prev,
      [rid]: {
        ...prev[rid],
        [section]: { ...prev[rid]?.[section], [field]: val }
      }
    }));
  };

  const saveAllMeters = async () => {
    let saved = 0;
    let errors = 0;
    for (const rid of Object.keys(meterLocal)) {
      const data = meterLocal[rid];
      if (data.cur.elec !== '' || data.cur.water !== '') {
        const existing = meters.find(x => x.roomId === rid && x.month === meterMonth);
        const body = { roomId: rid, month: meterMonth, elec: Number(data.cur.elec) || 0, water: Number(data.cur.water) || 0 };
        try {
          if (existing) {
            await api('/api/meters', 'PUT', { roomId: rid, month: meterMonth, elec: body.elec, water: body.water });
          } else {
            await api('/api/meters', 'POST', body);
          }
          saved++;
        } catch (err) {
          errors++;
          console.error('Error saving meter data for room', rid, err);
        }
      }
      if (data.prev.elec !== '' || data.prev.water !== '') {
        const pm = getPrevMonth(meterMonth);
        const existing = meters.find(x => x.roomId === rid && x.month === pm);
        const body = { roomId: rid, month: pm, elec: Number(data.prev.elec) || 0, water: Number(data.prev.water) || 0 };
        try {
          if (existing) {
            await api('/api/meters', 'PUT', { roomId: rid, month: pm, elec: body.elec, water: body.water });
          } else {
            await api('/api/meters', 'POST', body);
          }
          saved++;
        } catch (err) {
          errors++;
          console.error('Error saving previous meter data for room', rid, err);
        }
      }
    }
    await fetchAll();
    if (errors > 0) {
      toast(`บันทึก ${saved} รายการสำเร็จ, ${errors} รายการผิดพลาด`, errors > 0);
    } else {
      toast(`บันทึก ${saved} รายการสำเร็จ`);
    }
  };

  // Invoice Calculation
  const calcInv = (room, m) => {
    const cur = meters.find(x => x.roomId === room.id && x.month === m) || { elec: 0, water: 0 };
    const pm = getPrevMonth(m);
    const prev = meters.find(x => x.roomId === room.id && x.month === pm) || { elec: 0, water: 0 };
    const eu = Math.max(0, Number(cur.elec || 0) - Number(prev.elec || 0));
    const wu = Math.max(0, Number(cur.water || 0) - Number(prev.water || 0));
    return {
      room: room.number, tenant: room.tenantName, phone: room.tenantPhone,
      userId: room.tenantUserId, month: m, rent: room.rent,
      elecUnits: eu, elecCost: eu * settings.rateElec,
      waterUnits: wu, waterCost: wu * settings.rateWater,
      prevElec: prev.elec || 0, curElec: cur.elec || 0,
      prevWater: prev.water || 0, curWater: cur.water || 0,
      total: room.rent + eu * settings.rateElec + wu * settings.rateWater,
      rateElec: settings.rateElec, rateWater: settings.rateWater
    };
  };

  // PDF
  const downloadPdf = async (inv) => {
    const el = document.getElementById('invoicePdfContent');
    if (!el) return;
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const doc = new jsPDF('p', 'mm', 'a4');
    const pw = 210 - 20;
    const ph = (canvas.height * pw) / canvas.width;
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, pw, ph);
    doc.save(`invoice_${inv.room}_${inv.month}.pdf`);
    toast('ดาวน์โหลด PDF สำเร็จ');
  };

  // LINE
  const sendLineMsg = async (to, text) => {
    if (!settings.channelToken) { toast('กรุณาตั้งค่า Channel Access Token ก่อน', true); return false; }
    try {
      const res = await fetch('/api/line/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, text, token: settings.channelToken })
      });
      const data = await res.json();
      if (res.ok) { toast('ส่ง LINE สำเร็จ!'); return true; }
      toast('ส่งไม่สำเร็จ: ' + (data.error || data.message || 'Unknown error'), true);
      return false;
    } catch (err) { toast('ข้อผิดพลาด: ' + err.message, true); return false; }
  };

  const sendInvLine = (inv) => {
    if (!inv.userId) { toast('ผู้พักห้องนี้ยังไม่ได้กรอก LINE User ID', true); return; }
    const md = formatMonth(inv.month);
    const text = `🏠 ใบแจ้งหนี้ - ห้อง ${inv.room}\n━━━━━━━━━━━━━━━\n📅 เดือน ${md}\n👤 ${inv.tenant}\n━━━━━━━━━━━━━━━\n🏠 ค่าเช่า: ${inv.rent.toLocaleString()} ฿\n⚡ ค่าไฟ: ${inv.elecCost.toLocaleString()} ฿ (${inv.elecUnits} หน่วย)\n💧 ค่าน้ำ: ${inv.waterCost.toLocaleString()} ฿ (${inv.waterUnits} หน่วย)\n━━━━━━━━━━━━━━━\n💰 รวมทั้งหมด: ${inv.total.toLocaleString()} ฿\n━━━━━━━━━━━━━━━\nกรุณาชำระเงินภายในวันที่ 5\nขอบคุณครับ 🙏`;
    sendLineMsg(inv.userId, text);
  };

  // Logo
  const uploadLogo = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast('ไฟล์ใหญ่เกิน 2MB', true); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const s = { ...settings, logo: ev.target?.result };
      api('/api/settings', 'POST', s).then(() => { setSettings(s); toast('อัปโหลดโลโก้สำเร็จ'); });
    };
    reader.readAsDataURL(f);
    e.target.value = '';
  };

  const removeLogo = () => {
    const s = { ...settings, logo: '' };
    api('/api/settings', 'POST', s).then(() => { setSettings(s); toast('ลบโลโก้สำเร็จ'); });
  };

  // Settings save (debounced)
  const settingsTimer = useRef(null);
  const saveSettingsDelayed = (key, value) => {
    const s = { ...settings, [key]: value };
    setSettings(s);
    clearTimeout(settingsTimer.current);
    settingsTimer.current = setTimeout(() => api('/api/settings', 'POST', s), 800);
  };

  // Backup
  const exportData = () => {
    const data = { rooms, meters, settings, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `dorm_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast('Export สำเร็จ');
  };

  const importData = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const d = JSON.parse(ev.target?.result);
        if (!d.rooms || !d.settings) { toast('ไฟล์ JSON ไม่ถูกต้อง', true); return; }
        if (!confirm('⚠️ Import จะทับข้อมูลปัจจุบันทั้งหมด\nดำเนินการต่อ?')) return;
        for (const r of d.rooms) await api('/api/rooms', 'POST', r);
        if (d.meters) for (const m of d.meters) await api('/api/meters', 'POST', m);
        await api('/api/settings', 'POST', d.settings);
        await fetchAll();
        toast('✅ Import สำเร็จ!');
      } catch (err) { toast('❌ ' + err.message, true); }
    };
    reader.readAsText(f);
    e.target.value = '';
  };

  if (loading) return (
    <div className={styles.loadingWrapper}>
      <div className={styles.spinner} />
      <p>กำลังโหลดข้อมูล...</p>
    </div>
  );

  const navItems = [
    ['dashboard', '📊', 'แดชบอร์ด'],
    ['room', '🚪', 'จัดการห้อง'],
    ['meters', '⚡', 'บันทึกหน่วย'],
    ['invoice', '🧾', 'ใบแจ้งหนี้'],
    ['setting', '⚙️', 'ตั้งค่า']
  ];

  return (
    <div className={styles.wrapper}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <div className={styles.sidebarLogoIcon}>🏠</div>
          <h1>{settings.dormName || 'หอพัก Billing'}</h1>
          <p className={styles.sidebarSub}>ระบบจัดการค่าเช่ารายเดือน</p>
        </div>
        {navItems.map(([p, icon, label]) => (
          <div key={p} className={`${styles.navItem} ${page === p ? styles.active : ''}`} onClick={() => setPage(p)}>
            <span className={styles.navIcon}>{icon}</span><span>{label}</span>
          </div>
        ))}
        <div className={styles.sidebarFooter}>
          <label>LINE Channel Token</label>
          <input type="text" placeholder="ใส่ Token..."
            value={settings.channelToken || ''}
            onChange={e => saveSettingsDelayed('channelToken', e.target.value)}
          />
        </div>
      </aside>

      {/* Main */}
      <div className={styles.main}>
        {page === 'dashboard' && (
          <Dashboard
            setToast={toast}
            rooms={rooms}
            meters={meters}
            settings={settings}
            calcInv={calcInv}
            formatMonth={formatMonth}
          />
        )}
        {page === 'room' && (
          <Room
            setToast={toast}
            rooms={rooms}
            editRoom={editRoom}
            modal={modal}
            setModal={setModal}
            setEditRoom={setEditRoom}
            saveRoom={saveRoom}
            deleteRoom={deleteRoom}
          />
        )}
        {page === 'meters' && (
          <Meters
            setToast={toast}
            rooms={rooms}
            meters={meters}
            settings={settings}
            meterMonth={meterMonth}
            setMeterMonth={setMeterMonth}
            meterLocal={meterLocal}
            setMeterLocal={setMeterLocal}
            setMeterField={setMeterField}
            saveAllMeters={saveAllMeters}
            saveSettingsDelayed={saveSettingsDelayed}
            formatMonth={formatMonth}
            initMeterLocal={initMeterLocal}
          />
        )}
        {page === 'invoice' && (
          <Invoice
            setToast={toast}
            rooms={rooms}
            meters={meters}
            settings={settings}
            invMonth={invMonth}
            setInvMonth={setInvMonth}
            viewInv={viewInv}
            setViewInv={setViewInv}
            modal={modal}
            setModal={setModal}
            calcInv={calcInv}
            downloadPdf={downloadPdf}
            sendInvLine={sendInvLine}
            formatMonth={formatMonth}
          />
        )}
        {page === 'setting' && (
          <Setting
            setToast={toast}
            settings={settings}
            setSettings={setSettings}
            saveSettingsDelayed={saveSettingsDelayed}
            uploadLogo={uploadLogo}
            removeLogo={removeLogo}
            sendLineMsg={sendLineMsg}
            exportData={exportData}
            importData={importData}
          />
        )}
      </div>

      {/* ROOM MODAL */}
      {modal === 'room' && (
        <RoomModal
          room={editRoom}
          onClose={() => { setModal(null); setEditRoom(null); }}
          onSave={saveRoom}
        />
      )}

      {/* INVOICE MODAL */}
      {modal === 'invoice' && viewInv && (
        <div className={styles.modalOverlay} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <h3>🧾 ใบแจ้งหนี้</h3>
            <InvoicePreview inv={viewInv} settings={settings} formatMonth={formatMonth} />
            <div className={styles.modalActions}>
              <button className={styles.btnClose} onClick={() => setModal(null)}>ปิด</button>
              <button className={styles.btnPrimary} onClick={() => downloadPdf(viewInv)}>📄 PDF</button>
              <button className={styles.btnSuccess} onClick={() => sendInvLine(viewInv)}>📱 LINE</button>
            </div>
          </div>
        </div>
      )}

      {/* TOASTS */}
      <div className={styles.toastContainer}>
        {toasts.map(t => (
          <div key={t.id} className={`${styles.toast} ${t.err ? styles.toastErr : ''}`}>
            <span>{t.err ? '❌' : '✅'}</span><span>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Room Modal Component
function RoomModal({ room, onClose, onSave }) {
  const [num, setNum] = useState(room?.number || '');
  const [rent, setRent] = useState(room?.rent ? room.rent.toString() : '');
  const [name, setName] = useState(room?.tenantName || '');
  const [phone, setPhone] = useState(room?.tenantPhone || '');
  const [userId, setUserId] = useState(room?.tenantUserId || '');
  const [note, setNote] = useState(room?.note || '');

  const save = () => {
    if (!num.trim()) { alert('กรุณาระบุหมายเลขห้อง'); return; }
    onSave({
      id: room?.id || undefined,
      number: num.trim(),
      rent: parseFloat(rent) || 0,
      tenantName: name.trim(),
      tenantPhone: phone.trim(),
      tenantUserId: userId.trim(),
      note: note.trim()
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3>{room ? '✏️ แก้ไขห้อง' : '➕ เพิ่มห้อง'}</h3>
        <div className={styles.formRow}>
          <div className={styles.formGroup}><label>หมายเลขห้อง</label><input value={num} onChange={e => setNum(e.target.value)} placeholder="เช่น 101" autoFocus /></div>
          <div className={styles.formGroup}><label>ค่าเช่าต่อเดือน (บาท)</label><input type="number" value={rent} onChange={e => setRent(e.target.value)} placeholder="3500" /></div>
        </div>
        <div className={styles.formGroup}><label>ชื่อผู้พัก</label><input value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อ-นามสกุล" /></div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}><label>เบอร์โทรศัพท์</label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="081-234-5678" /></div>
          <div className={styles.formGroup}><label>LINE User ID</label><input value={userId} onChange={e => setUserId(e.target.value)} placeholder="Uxxxxxxxxx" /></div>
        </div>
        <div className={styles.formGroup}><label>หมายเหตุ</label><input value={note} onChange={e => setNote(e.target.value)} placeholder="เช่น รวมค่าเน็ต" /></div>
        <div className={styles.modalActions}>
          <button className={styles.btnClose} onClick={onClose}>ยกเลิก</button>
          <button className={styles.btnPrimary} onClick={save}>💾 บันทึก</button>
        </div>
      </div>
    </div>
  );
}

// Invoice Preview Component
function InvoicePreview({ inv, settings, formatMonth }) {
  const lh = settings.logo ? <img src={settings.logo} style={{ height: 60, objectFit: 'contain', marginBottom: 10 }} alt="" /> : null;
  const commonFee = settings.commonFee || 0;
  const internetFee = settings.internetFee || 0;
  const grandTotal = inv.total + commonFee + internetFee;

  return (
    <div id="invoicePdfContent" style={{ background: '#fff', borderRadius: 16, padding: '40px 36px', fontFamily: 'inherit', maxWidth: 580, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        {lh}
        <h2 style={{ color: '#059669', fontSize: 28, margin: '8px 0 4px', fontWeight: 800 }}>{settings.dormName}</h2>
        <p style={{ color: '#6b7280', margin: '2px 0', fontSize: 14 }}>{settings.address}</p>
        <p style={{ color: '#6b7280', margin: '2px 0', fontSize: 14 }}>โทร: {settings.phone}</p>
        <div style={{ height: 3, background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: 2, margin: '20px 0 0' }} />
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h3 style={{ color: '#059669', margin: 0, fontSize: 22, fontWeight: 800 }}>ใบแจ้งหนี้ค่าเช่าประจำเดือน {formatMonth(inv.month)}</h3>
      </div>

      {/* Info Box */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, padding: '16px 20px', background: '#f0fdf4', borderRadius: 12, fontSize: 14 }}>
        <div>
          <div style={{ marginBottom: 4 }}><strong style={{ color: '#374151' }}>ผู้พัก:</strong> <span style={{ color: '#1f2937' }}>{inv.tenant}</span></div>
          <div><strong style={{ color: '#374151' }}>ห้อง:</strong> <span style={{ color: '#1f2937' }}>{inv.room}</span></div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ marginBottom: 4 }}><strong style={{ color: '#374151' }}>วันที่:</strong> <span style={{ color: '#1f2937' }}>{new Date().toLocaleDateString('th-TH')}</span></div>
          <div><strong style={{ color: '#374151' }}>สถานะ:</strong> <span style={{ color: '#f59e0b', fontWeight: 600 }}>รอชำระ</span></div>
        </div>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8, fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #10b981' }}>
            <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 700, color: '#1f2937', fontSize: 14 }}>รายการ</th>
            <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 700, color: '#1f2937', fontSize: 14 }}>รายละเอียด</th>
            <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: '#1f2937', fontSize: 14 }}>จำนวนเงิน (บาท)</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
            <td style={{ padding: '10px 8px', color: '#374151' }}>ค่าเช่าห้อง</td>
            <td style={{ padding: '10px 8px', color: '#6b7280' }}>ห้อง {inv.room}</td>
            <td style={{ padding: '10px 8px', textAlign: 'right', color: '#1f2937', fontWeight: 600 }}>{inv.rent.toLocaleString()}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
            <td style={{ padding: '10px 8px', color: '#374151' }}>ค่าไฟฟ้า</td>
            <td style={{ padding: '10px 8px', color: '#6b7280' }}>{inv.elecUnits} หน่วย × {inv.rateElec} บาท</td>
            <td style={{ padding: '10px 8px', textAlign: 'right', color: '#1f2937', fontWeight: 600 }}>{inv.elecCost.toLocaleString()}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
            <td style={{ padding: '10px 8px', color: '#374151' }}>ค่าน้ำประปา</td>
            <td style={{ padding: '10px 8px', color: '#6b7280' }}>{inv.waterUnits} หน่วย × {inv.rateWater} บาท</td>
            <td style={{ padding: '10px 8px', textAlign: 'right', color: '#1f2937', fontWeight: 600 }}>{inv.waterCost.toLocaleString()}</td>
          </tr>
          {commonFee > 0 && (
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '10px 8px', color: '#374151' }}>ค่าส่วนกลาง</td>
              <td style={{ padding: '10px 8px', color: '#6b7280' }}>-</td>
              <td style={{ padding: '10px 8px', textAlign: 'right', color: '#1f2937', fontWeight: 600 }}>{commonFee.toLocaleString()}</td>
            </tr>
          )}
          {internetFee > 0 && (
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '10px 8px', color: '#374151' }}>ค่าอินเตอร์เน็ต</td>
              <td style={{ padding: '10px 8px', color: '#6b7280' }}>-</td>
              <td style={{ padding: '10px 8px', textAlign: 'right', color: '#1f2937', fontWeight: 600 }}>{internetFee.toLocaleString()}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Total */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline', padding: '16px 0 8px', borderTop: '3px solid #10b981', marginBottom: 24 }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#059669' }}>ยอดรวม: {grandTotal.toLocaleString()} บาท</span>
      </div>

      {/* Payment Terms */}
      <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 18px', marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#92400e', lineHeight: 1.7, textAlign: 'center' }}>
          <strong>กำหนดชำระภายในวันที่ 5 ของทุกเดือน</strong><br />
          หากชำระหลังกำหนด คิดค่าปรับวันละ 50 บาท
        </p>
      </div>

      {/* Payment Info */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 18px' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#166534', lineHeight: 1.7, textAlign: 'center' }}>
          <strong>ชำระเงินที่ :</strong> สำนักงานหอพัก<br />
          <strong>หรือ โอนเข้าบัญชี</strong> พร้อมเพย์ <strong>090-243-9797</strong><br />
          นงลักษณ์ นิพรรัมย์ ธนาคารกรุงไทย
        </p>
      </div>
    </div>
  );
}
