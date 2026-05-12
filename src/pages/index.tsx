import { useState, useEffect, useCallback, useRef } from 'react';
import styles from '../styles/Home.module.css';

const api = async (path: string, method: string, body?: any) => {
  const opts: any = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  return res.json();
};

const THAI_MONTHS = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const formatMonth = (ym: string) => {
  const [y, m] = ym.split('-');
  return THAI_MONTHS[parseInt(m)] + ' ' + (parseInt(y) + 543);
};
const getPrevMonth = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
};

export default function Home() {
  const [page, setPage] = useState('dashboard');
  const [rooms, setRooms] = useState<any[]>([]);
  const [meters, setMeters] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ dormName: '', address: '', phone: '', rateElec: 7, rateWater: 20, channelToken: '', logo: '' });
  const [toasts, setToasts] = useState<{ id: string; msg: string; err: boolean }[]>([]);
  const [modal, setModal] = useState<'room' | 'invoice' | null>(null);
  const [editRoom, setEditRoom] = useState<any>(null);
  const [meterMonth, setMeterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [invMonth, setInvMonth] = useState(new Date().toISOString().slice(0, 7));
  const [viewInv, setViewInv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [meterLocal, setMeterLocal] = useState<Record<string, any>>({});

  const toast = useCallback((msg: string, err = false) => {
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

  // ─── Room CRUD ───────────────────────────────────────────────
  const saveRoom = async (data: any) => {
    const body = data.id ? { ...data } : data;
    const method = body.id ? 'PUT' : 'POST';
    await api('/api/rooms', method, body);
    await fetchAll(); setModal(null); setEditRoom(null);
    toast(body.id ? 'แก้ไขห้องสำเร็จ' : 'เพิ่มห้องสำเร็จ');
  };

  const deleteRoom = async (id: string) => {
    if (!confirm('ต้องการลบห้องนี้?')) return;
    await api('/api/rooms', 'DELETE', { id });
    await fetchAll(); toast('ลบห้องสำเร็จ');
  };

  // ─── Meter (local state first, save on button) ───────────────
  const initMeterLocal = useCallback(() => {
    const local: Record<string, any> = {};
    rooms.filter(r => r.tenantName).forEach(r => {
      const pm = getPrevMonth(meterMonth);
      const cur = meters.find(x => x.roomId === r.id && x.month === meterMonth) || { elec: '', water: '' };
      const prev = meters.find(x => x.roomId === r.id && x.month === pm) || { elec: '', water: '' };
      local[r.id] = { cur: { ...cur }, prev: { ...prev } };
    });
    setMeterLocal(local);
  }, [rooms, meters, meterMonth]);

  useEffect(() => { initMeterLocal(); }, [initMeterLocal]);

  const setMeterField = (rid: string, section: 'cur' | 'prev', field: 'elec' | 'water', val: string) => {
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
    for (const rid of Object.keys(meterLocal)) {
      const data = meterLocal[rid];
      // Save current month
      if (data.cur.elec !== '' || data.cur.water !== '') {
        const existing = meters.find(x => x.roomId === rid && x.month === meterMonth);
        const body: any = { roomId: rid, month: meterMonth, elec: Number(data.cur.elec) || 0, water: Number(data.cur.water) || 0 };
        if (existing) await api('/api/meters', 'PUT', { ...existing, ...body });
        else await api('/api/meters', 'POST', body);
        saved++;
      }
      // Save previous month if edited
      if (data.prev.elec !== '' || data.prev.water !== '') {
        const pm = getPrevMonth(meterMonth);
        const existing = meters.find(x => x.roomId === rid && x.month === pm);
        const body: any = { roomId: rid, month: pm, elec: Number(data.prev.elec) || 0, water: Number(data.prev.water) || 0 };
        if (existing) await api('/api/meters', 'PUT', { ...existing, ...body });
        else await api('/api/meters', 'POST', body);
        saved++;
      }
    }
    await fetchAll();
    toast(`บันทึก ${saved} รายการสำเร็จ`);
  };

  // ─── Invoice Calculation ─────────────────────────────────────
  const calcInv = (room: any, m: string) => {
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

  // ─── PDF ─────────────────────────────────────────────────────
  const downloadPdf = async (inv: any) => {
    const el = document.getElementById('invoicePdf');
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

  // ─── LINE ────────────────────────────────────────────────────
  const sendLineMsg = async (to: string, text: string) => {
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
    } catch (err: any) { toast('ข้อผิดพลาด: ' + err.message, true); return false; }
  };

  const sendInvLine = (inv: any) => {
    if (!inv.userId) { toast('ผู้พักห้องนี้ยังไม่ได้กรอก LINE User ID', true); return; }
    const md = formatMonth(inv.month);
    const text = `🏠 ใบแจ้งหนี้ - ห้อง ${inv.room}\n━━━━━━━━━━━━━━━\n📅 เดือน ${md}\n👤 ${inv.tenant}\n━━━━━━━━━━━━━━━\n🏠 ค่าเช่า: ${inv.rent.toLocaleString()} ฿\n⚡ ค่าไฟ: ${inv.elecCost.toLocaleString()} ฿ (${inv.elecUnits} หน่วย)\n💧 ค่าน้ำ: ${inv.waterCost.toLocaleString()} ฿ (${inv.waterUnits} หน่วย)\n━━━━━━━━━━━━━━━\n💰 รวมทั้งหมด: ${inv.total.toLocaleString()} ฿\n━━━━━━━━━━━━━━━\nกรุณาชำระเงินภายในวันที่ 5\nขอบคุณครับ 🙏`;
    sendLineMsg(inv.userId, text);
  };

  // ─── Logo ───────────────────────────────────────────────────
  const uploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast('ไฟล์ใหญ่เกิน 2MB', true); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const s = { ...settings, logo: ev.target?.result as string };
      api('/api/settings', 'POST', s).then(() => { setSettings(s); toast('อัปโหลดโลโก้สำเร็จ'); });
    };
    reader.readAsDataURL(f);
    e.target.value = '';
  };

  const removeLogo = () => {
    const s = { ...settings, logo: '' };
    api('/api/settings', 'POST', s).then(() => { setSettings(s); toast('ลบโลโก้สำเร็จ'); });
  };

  // ─── Settings save (debounced) ──────────────────────────────
  const settingsTimer = useRef<any>(null);
  const saveSettingsDelayed = (key: string, value: any) => {
    const s = { ...settings, [key]: value };
    setSettings(s);
    clearTimeout(settingsTimer.current);
    settingsTimer.current = setTimeout(() => api('/api/settings', 'POST', s), 800);
  };

  // ─── Backup ─────────────────────────────────────────────────
  const exportData = () => {
    const data = { rooms, meters, settings, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `dorm_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast('Export สำเร็จ');
  };

  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const d = JSON.parse(ev.target?.result as string);
        if (!d.rooms || !d.settings) { toast('ไฟล์ JSON ไม่ถูกต้อง', true); return; }
        if (!confirm('⚠️ Import จะทับข้อมูลปัจจุบันทั้งหมด\nดำเนินการต่อ?')) return;
        for (const r of d.rooms) await api('/api/rooms', 'POST', r);
        if (d.meters) for (const m of d.meters) await api('/api/meters', 'POST', m);
        await api('/api/settings', 'POST', d.settings);
        await fetchAll();
        toast('✅ Import สำเร็จ!');
      } catch (err: any) { toast('❌ ' + err.message, true); }
    };
    reader.readAsText(f);
    e.target.value = '';
  };

  // ─── Dashboard Data ──────────────────────────────────────────
  const now = new Date();
  const cm = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  const occ = rooms.filter(r => r.tenantName);
  let pending = 0; let revenue = 0;
  occ.forEach(r => {
    const hasMeter = meters.some(x => x.roomId === r.id && x.month === cm);
    if (!hasMeter) pending++; else { const inv = calcInv(r, cm); revenue += inv.total; }
  });

  const recentData = occ.map(r => {
    let la: string | null = null;
    for (let y = now.getFullYear(); y >= now.getFullYear() - 1; y--) {
      for (let m = 11; m >= 0; m--) {
        const ym = y + '-' + String(m + 1).padStart(2, '0');
        if (meters.some(x => x.roomId === r.id && x.month === ym)) { la = ym; break; }
      }
      if (la) break;
    }
    return la ? { room: r, month: la, inv: calcInv(r, la) } : null;
  }).filter(Boolean).sort((a: any, b: any) => b.month.localeCompare(a.month)).slice(0, 10);

  if (loading) return (
    <div className={styles.loadingWrapper}>
      <div className={styles.spinner} />
      <p>กำลังโหลดข้อมูล...</p>
    </div>
  );

  return (
    <div className={styles.wrapper}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <div className={styles.sidebarLogoIcon}>🏠</div>
          <h1>{settings.dormName || 'หอพัก Billing'}</h1>
          <p className={styles.sidebarSub}>ระบบจัดการค่าเช่ารายเดือน</p>
        </div>
        {([
          ['dashboard', '📊', 'แดชบอร์ด'],
          ['rooms', '🚪', 'จัดการห้อง'],
          ['meters', '⚡', 'บันทึกหน่วย'],
          ['invoices', '🧾', 'ใบแจ้งหนี้'],
          ['settings', '⚙️', 'ตั้งค่า']
        ] as const).map(([p, icon, label]) => (
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
        {/* DASHBOARD */}
        {page === 'dashboard' && (
          <div className={styles.page}>
            <div className={styles.pageHeader}><h2>📊 แดชบอร์ด</h2>
              <span className={styles.dateLabel}>{now.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className={styles.statsGrid}>
              {[
                ['🚪', rooms.length, 'ห้องทั้งหมด', 'blue'],
                ['👥', occ.length, 'ผู้พักอาศัย', 'green'],
                ['📋', pending, 'รอเรียกเก็บ', 'yellow'],
                ['💰', revenue.toLocaleString(), 'รายได้ (บาท)', 'red']
              ].map(([icon, val, label, color], i) => (
                <div key={i} className={`${styles.statCard} ${styles[color]}`} style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className={styles.statLabel}>{label}</div>
                  <div className={styles.statValue}>{val}</div>
                  <span className={styles.statIconBig}>{icon}</span>
                </div>
              ))}
            </div>
            <div className={styles.card}>
              <h3>📋 รายการล่าสุด</h3>
              <div className={styles.tableWrap}>
                <table>
                  <thead><tr><th>ห้อง</th><th>ผู้พัก</th><th>เดือน</th><th>ค่าเช่า</th><th>ค่าไฟ</th><th>ค่าน้ำ</th><th>รวม</th><th>สถานะ</th></tr></thead>
                  <tbody>
                    {recentData.length === 0 ? <tr><td colSpan={8}><div className={styles.emptyState}><div className={styles.emptyIcon}>📋</div><p>ยังไม่มีข้อมูลใบแจ้งหนี้</p></div></td></tr> :
                      recentData.map((d: any, i: number) => (
                        <tr key={i} style={{ animationDelay: `${i * 0.05}s` }}>
                          <td><span className={styles.roomNumber}>{d.inv.room}</span></td>
                          <td>{d.inv.tenant}</td>
                          <td>{formatMonth(d.month)}</td>
                          <td>{d.inv.rent.toLocaleString()}</td>
                          <td>{d.inv.elecCost.toLocaleString()}</td>
                          <td>{d.inv.waterCost.toLocaleString()}</td>
                          <td className={styles.highlight}>{d.inv.total.toLocaleString()} ฿</td>
                          <td><span className={styles.badgeUnpaid}>รอชำระ</span></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ROOMS */}
        {page === 'rooms' && (
          <div className={styles.page}>
            <div className={styles.pageHeader}><h2>🚪 จัดการห้อง</h2>
              <button className={styles.btnPrimary} onClick={() => { setEditRoom(null); setModal('room'); }}>➕ เพิ่มห้อง</button>
            </div>
            <div className={styles.card}>
              <div className={styles.tableWrap}>
                <table>
                  <thead><tr><th>ห้อง</th><th>ค่าเช่า/เดือน</th><th>ชื่อผู้พัก</th><th>เบอร์โทร</th><th>LINE User ID</th><th>จัดการ</th></tr></thead>
                  <tbody>
                    {rooms.length === 0 ? <tr><td colSpan={6}><div className={styles.emptyState}><div className={styles.emptyIcon}>🚪</div><p>ยังไม่มีห้อง</p></div></td></tr> :
                      rooms.map((r: any, i: number) => (
                        <tr key={r.id} style={{ animationDelay: `${i * 0.05}s` }}>
                          <td><span className={styles.roomNumber}>{r.number}</span></td>
                          <td>{r.rent.toLocaleString()} ฿</td>
                          <td>{r.tenantName || <span className={styles.emptyText}>— ว่าง —</span>}</td>
                          <td>{r.tenantPhone || <span className={styles.emptyText}>—</span>}</td>
                          <td className={styles.mono}>{r.tenantUserId || <span className={styles.emptyText}>ยังไม่ได้ตั้งค่า</span>}</td>
                          <td><div className={styles.actionBtns}>
                            <button className={styles.btnEdit} onClick={() => { setEditRoom(r); setModal('room'); }}>✏️ แก้ไข</button>
                            <button className={styles.btnDelete} onClick={() => deleteRoom(r.id)}>🗑️ ลบ</button>
                          </div></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* METERS */}
        {page === 'meters' && (() => {
          const occRooms = rooms.filter(r => r.tenantName);
          return (
            <div className={styles.page}>
              <div className={styles.pageHeader}><h2>⚡ บันทึกหน่วย ค่าไฟ/น้ำ</h2>
                <button className={styles.btnPrimary} onClick={saveAllMeters}>💾 บันทึกทั้งหมด</button>
              </div>
              <div className={styles.monthSelector}>
                <label>📅 เลือกเดือน:</label>
                <input type="month" value={meterMonth} onChange={e => setMeterMonth(e.target.value)} />
              </div>
              <div className={styles.card}>
                <h3>📝 บันทึกหน่วยใช้ — <span>{formatMonth(meterMonth)}</span></h3>
                <p className={styles.hint}>💡 แก้ไขหน่วยก่อนหน้าได้ที่ช่องสีเหลือง แล้วกด "บันทึกทั้งหมด"</p>
                <div className={styles.tableWrap}>
                  <table>
                    <thead><tr><th>ห้อง</th><th>ผู้พัก</th><th>ไฟ ก่อนหน้า</th><th>ไฟ ปัจจุบัน</th><th>ใช้จริง</th><th>น้ำ ก่อนหน้า</th><th>น้ำ ปัจจุบัน</th><th>ใช้จริง</th></tr></thead>
                    <tbody>
                      {occRooms.length === 0 ? <tr><td colSpan={8}><div className={styles.emptyState}><div className={styles.emptyIcon}>📝</div><p>ยังไม่มีห้องที่มีผู้พักอาศัย</p></div></td></tr> :
                        occRooms.map((r: any, i: number) => {
                          const ml = meterLocal[r.id] || { cur: { elec: '', water: '' }, prev: { elec: '', water: '' } };
                          const eu = (ml.cur.elec !== '' && ml.prev.elec !== '') ? Math.max(0, Number(ml.cur.elec) - Number(ml.prev.elec)) : '—';
                          const wu = (ml.cur.water !== '' && ml.prev.water !== '') ? Math.max(0, Number(ml.cur.water) - Number(ml.prev.water)) : '—';
                          return (
                            <tr key={r.id} style={{ animationDelay: `${i * 0.05}s` }}>
                              <td><span className={styles.roomNumber}>{r.number}</span></td>
                              <td>{r.tenantName}</td>
                              <td><input type="number" value={ml.prev.elec} onChange={e => setMeterField(r.id, 'prev', 'elec', e.target.value)} className={styles.meterInput + ' ' + styles.meterPrev} /></td>
                              <td><input type="number" value={ml.cur.elec} onChange={e => setMeterField(r.id, 'cur', 'elec', e.target.value)} className={styles.meterInput} /></td>
                              <td className={styles.usedCell}>{eu}</td>
                              <td><input type="number" value={ml.prev.water} onChange={e => setMeterField(r.id, 'prev', 'water', e.target.value)} className={styles.meterInput + ' ' + styles.meterPrev} /></td>
                              <td><input type="number" value={ml.cur.water} onChange={e => setMeterField(r.id, 'cur', 'water', e.target.value)} className={styles.meterInput} /></td>
                              <td className={styles.usedCell}>{wu}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className={styles.card}>
                <h3>💡 อัตราค่าหน่วย</h3>
                <div className={styles.rateRow}>
                  <div className={styles.rateItem}><span>⚡ ค่าไฟ</span><input type="number" value={settings.rateElec} onChange={e => saveSettingsDelayed('rateElec', parseFloat(e.target.value) || 7)} /> <span>บาท/หน่วย</span></div>
                  <div className={styles.rateItem}><span>💧 ค่าน้ำ</span><input type="number" value={settings.rateWater} onChange={e => saveSettingsDelayed('rateWater', parseFloat(e.target.value) || 20)} /> <span>บาท/หน่วย</span></div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* INVOICES */}
        {page === 'invoices' && (
          <div className={styles.page}>
            <div className={styles.pageHeader}><h2>🧾 ใบแจ้งหนี้</h2></div>
            <div className={styles.monthSelector}>
              <label>📅 เลือกเดือน:</label>
              <input type="month" value={invMonth} onChange={e => setInvMonth(e.target.value)} />
            </div>
            <div className={styles.card}>
              <div className={styles.tableWrap}>
                <table>
                  <thead><tr><th>ห้อง</th><th>ผู้พัก</th><th>ค่าเช่า</th><th>ค่าไฟ</th><th>ค่าน้ำ</th><th>รวม</th><th>จัดการ</th></tr></thead>
                  <tbody>
                    {rooms.filter(r => r.tenantName).length === 0 ?
                      <tr><td colSpan={7}><div className={styles.emptyState}><div className={styles.emptyIcon}>🧾</div><p>ยังไม่มีข้อมูล</p></div></td></tr> :
                      rooms.filter(r => r.tenantName).map((r: any, i: number) => {
                        const inv = calcInv(r, invMonth);
                        return (
                          <tr key={r.id} style={{ animationDelay: `${i * 0.05}s` }}>
                            <td><span className={styles.roomNumber}>{inv.room}</span></td>
                            <td>{inv.tenant}</td>
                            <td>{inv.rent.toLocaleString()}</td>
                            <td>{inv.elecCost.toLocaleString()} <small>({inv.elecUnits} หน่วย)</small></td>
                            <td>{inv.waterCost.toLocaleString()} <small>({inv.waterUnits} หน่วย)</small></td>
                            <td className={styles.totalCell}>{inv.total.toLocaleString()} ฿</td>
                            <td><div className={styles.actionBtns}>
                              <button className={styles.btnView} onClick={() => { setViewInv(inv); setModal('invoice'); }}>👁️ ดู</button>
                              <button className={styles.btnPdf} onClick={() => downloadPdf(inv)}>📄 PDF</button>
                              <button className={styles.btnLine} onClick={() => sendInvLine(inv)}>📱 LINE</button>
                            </div></td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {page === 'settings' && (
          <div className={styles.page}>
            <div className={styles.pageHeader}><h2>⚙️ ตั้งค่าระบบ</h2></div>
            <div className={styles.card}>
              <h3>🏢 ข้อมูลหอพัก</h3>
              <div className={styles.logoUpload}>
                <div className={styles.logoBox}>
                  {settings.logo ? <img src={settings.logo} alt="Logo" /> : <div className={styles.logoPh}>🏠</div>}
                </div>
                <div>
                  <p className={styles.logoLabel}>โลโก้หอพัก (แสดงใน PDF)</p>
                  <div className={styles.logoBtns}>
                    <button className={styles.btnUpload} onClick={() => document.getElementById('logoInput')?.click()}>📷 อัปโหลด</button>
                    <button className={styles.btnRemove} onClick={removeLogo}>🗑️ ลบ</button>
                  </div>
                  <input type="file" id="logoInput" accept="image/*" style={{ display: 'none' }} onChange={uploadLogo} />
                  <p className={styles.hint}>รองรับ PNG, JPG ขนาดไม่เกิน 2MB</p>
                </div>
              </div>
              <div className={styles.settingsGrid}>
                <div className={styles.formGroup}><label>ชื่อหอพัก</label><input value={settings.dormName} onChange={e => saveSettingsDelayed('dormName', e.target.value)} /></div>
                <div className={styles.formGroup}><label>เบอร์โทรศัพท์</label><input value={settings.phone} onChange={e => saveSettingsDelayed('phone', e.target.value)} /></div>
              </div>
              <div className={styles.formGroup}><label>ที่อยู่</label><input value={settings.address} onChange={e => saveSettingsDelayed('address', e.target.value)} /></div>
            </div>

            <div className={styles.card}>
              <h3>📱 LINE Messaging API</h3>
              <div className={styles.infoBox}>
                📌 <strong>วิธีตั้งค่า:</strong><br />
                1. สร้าง Channel ที่ <code>developers.line.biz/console</code><br />
                2. เปิด Messaging API → คัดลอก <strong>Channel Access Token</strong><br />
                3. ผู้พักเพิ่มบอทเป็นเพื่อน → ระบบส่งใบแจ้งหนี้ผ่าน LINE ได้
              </div>
              <div className={styles.lineStatus}>
                <span className={`${styles.dot} ${settings.channelToken ? styles.dotGreen : styles.dotRed}`} />
                {settings.channelToken ? 'Token ถูกตั้งค่าแล้ว' : 'ยังไม่ได้ตั้งค่า Token'}
              </div>
              <div className={styles.formGroup}><label>Channel Access Token</label><input type="text" placeholder="eyJhbGciOi..." value={settings.channelToken || ''} onChange={e => saveSettingsDelayed('channelToken', e.target.value)} /></div>
              <button className={styles.btnTest} onClick={async () => {
                const uid = prompt('กรอก LINE User ID เพื่อทดสอบ (ขึ้นต้นด้วย U):');
                if (!uid || !uid.startsWith('U')) { toast('User ID ไม่ถูกต้อง', true); return; }
                await sendLineMsg(uid, `🧪 ทดสอบ LINE\nเวลา: ${new Date().toLocaleString('th-TH')}\n✅ ระบบพร้อมใช้งาน!`);
              }}>🧪 ทดสอบส่งข้อความ</button>
            </div>

            <div className={styles.card}>
              <h3>🗂️ สำรอง & กู้คืนข้อมูล</h3>
              <p className={styles.hint}>💡 Export ไว้พกไป Import ในเครื่องอื่น</p>
              <div className={styles.backupBtns}>
                <button className={styles.btnExport} onClick={exportData}>📤 Export</button>
                <button className={styles.btnImport} onClick={() => document.getElementById('importFile')?.click()}>📥 Import</button>
              </div>
              <input type="file" id="importFile" accept=".json" style={{ display: 'none' }} onChange={importData} />
            </div>
          </div>
        )}
      </div>

      {/* ROOM MODAL */}
      {modal === 'room' && <RoomModal room={editRoom} onClose={() => { setModal(null); setEditRoom(null); }} onSave={saveRoom} />}

      {/* INVOICE MODAL */}
      {modal === 'invoice' && viewInv && (
        <div className={styles.modalOverlay} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 740 }}>
            <h3>🧾 ใบแจ้งหนี้</h3>
            <div id="invoicePdf"><InvoicePreview inv={viewInv} settings={settings} /></div>
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

// ─── Room Modal ────────────────────────────────────────────────
function RoomModal({ room, onClose, onSave }: { room: any; onClose: () => void; onSave: (d: any) => void }) {
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

// ─── Invoice Preview ───────────────────────────────────────────
function InvoicePreview({ inv, settings }: { inv: any; settings: any }) {
  const lh = settings.logo ? <img src={settings.logo} style={{ height: 60, objectFit: 'contain', marginBottom: 10 }} alt="" /> : null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 40, fontFamily: 'inherit' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        {lh}
        <h2 style={{ color: '#059669', fontSize: 26, margin: 0 }}>{settings.dormName}</h2>
        <p style={{ color: '#6b7280', margin: '4px 0' }}>{settings.address}</p>
        <p style={{ color: '#6b7280', margin: '4px 0' }}>โทร: {settings.phone}</p>
        <hr style={{ margin: '20px 0', border: 'none', borderTop: '3px solid #10b981' }} />
        <h3 style={{ color: '#059669', margin: 0, fontSize: 20 }}>ใบแจ้งหนี้ค่าเช่าประจำเดือน {formatMonth(inv.month)}</h3>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, padding: 18, background: '#f0fdf4', borderRadius: 12 }}>
        <div><strong>ผู้พัก:</strong> {inv.tenant}<br /><strong>ห้อง:</strong> {inv.room}</div>
        <div style={{ textAlign: 'right' }}><strong>วันที่:</strong> {new Date().toLocaleDateString('th-TH')}<br /><strong>สถานะ:</strong> รอชำระ</div>
      </div>
      <table>
        <thead><tr><th>รายการ</th><th>รายละเอียด</th><th style={{ textAlign: 'right' }}>จำนวนเงิน (บาท)</th></tr></thead>
        <tbody>
          <tr><td>ค่าเช่าห้อง</td><td>ห้อง {inv.room}</td><td style={{ textAlign: 'right' }}>{inv.rent.toLocaleString()}</td></tr>
          <tr><td>ค่าไฟฟ้า</td><td>{inv.elecUnits} หน่วย × {inv.rateElec} บาท</td><td style={{ textAlign: 'right' }}>{inv.elecCost.toLocaleString()}</td></tr>
          <tr><td>ค่าน้ำประปา</td><td>{inv.waterUnits} หน่วย × {inv.rateWater} บาท</td><td style={{ textAlign: 'right' }}>{inv.waterCost.toLocaleString()}</td></tr>
        </tbody>
      </table>
      <div style={{ fontSize: 22, fontWeight: 800, textAlign: 'right', paddingTop: 18, borderTop: '3px solid #10b981', color: '#059669' }}>
        ยอดรวม: {inv.total.toLocaleString()} บาท
      </div>
    </div>
  );
}
