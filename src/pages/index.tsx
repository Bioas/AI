import { useState, useEffect, useCallback } from 'react';
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
      setSettings(s || settings);
    } catch { toast('โหลดข้อมูลไม่สำเร็จ', true); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // ─── Room CRUD ───────────────────────────────────────────────
  const saveRoom = async (data: any) => {
    const method = editRoom ? 'PUT' : 'POST';
    const body = editRoom ? { ...editRoom, ...data } : data;
    await api('/api/rooms', method, body);
    await fetchAll(); setModal(null); setEditRoom(null);
    toast(editRoom ? 'แก้ไขห้องสำเร็จ' : 'เพิ่มห้องสำเร็จ');
  };

  const deleteRoom = async (id: string) => {
    if (!confirm('ต้องการลบห้องนี้?')) return;
    await api('/api/rooms', 'DELETE', { id });
    await fetchAll(); toast('ลบห้องสำเร็จ');
  };

  // ─── Meter ──────────────────────────────────────────────────
  const updateMeter = async (rid: string, m: string, field: string, val: string) => {
    const existing = meters.find(x => x.roomId === rid && x.month === m);
    const body: any = existing ? { ...existing } : { roomId: rid, month: m, elec: 0, water: 0 };
    body[field] = val !== '' ? Number(val) : 0;
    if (existing) await api('/api/meters', 'PUT', body);
    else await api('/api/meters', 'POST', body);
    await fetchAll(); toast('บันทึกหน่วยสำเร็จ');
  };

  const savePrev = async (rid: string, m: string, field: string, val: string) => {
    const pm = getPrevMonth(m);
    const existing = meters.find(x => x.roomId === rid && x.month === pm);
    const body: any = existing ? { ...existing } : { roomId: rid, month: pm, elec: 0, water: 0 };
    body[field] = Number(val) || 0;
    if (existing) await api('/api/meters', 'PUT', body);
    else await api('/api/meters', 'POST', body);
    await fetchAll(); toast('แก้ไขหน่วยก่อนหน้าสำเร็จ');
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
      const res = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + settings.channelToken },
        body: JSON.stringify({ to, messages: [{ type: 'text', text }] })
      });
      if (res.ok) { toast('ส่ง LINE สำเร็จ!'); return true; }
      const e = await res.json();
      toast('ส่งไม่สำเร็จ: ' + (e as any).message, true);
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

  if (loading) return <div className={styles.wrapper}><div className={styles.loading}><div className={styles.spinner} /><p>กำลังโหลด...</p></div></div>;

  return (
    <div className={styles.wrapper}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>🏠</div>
          <h1>{settings.dormName || 'หอพัก Billing'}</h1>
          <p className={styles.subtitle}>ระบบจัดการค่าเช่ารายเดือน</p>
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
        <div className={styles.settingSection}>
          <label>LINE Channel Access Token</label>
          <input type="text" placeholder="ใส่ Token..."
            value={settings.channelToken || ''}
            onChange={e => { const s = { ...settings, channelToken: e.target.value }; setSettings(s); api('/api/settings', 'POST', s); }}
          />
          <button onClick={() => toast('บันทึก Token สำเร็จ')}>💾 บันทึก</button>
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
              <div className={`${styles.statCard} ${styles.blue}`}><div className={styles.statLabel}>ห้องทั้งหมด</div><div className={styles.statValue}>{rooms.length}</div><span className={styles.statIconBig}>🚪</span></div>
              <div className={`${styles.statCard} ${styles.green}`}><div className={styles.statLabel}>ผู้พักอาศัย</div><div className={styles.statValue}>{occ.length}</div><span className={styles.statIconBig}>👥</span></div>
              <div className={`${styles.statCard} ${styles.yellow}`}><div className={styles.statLabel}>รอเรียกเก็บ (เดือนนี้)</div><div className={styles.statValue}>{pending}</div><span className={styles.statIconBig}>📋</span></div>
              <div className={`${styles.statCard} ${styles.red}`}><div className={styles.statLabel}>รายได้เดือนนี้ (บาท)</div><div className={styles.statValue}>{revenue.toLocaleString()}</div><span className={styles.statIconBig}>💰</span></div>
            </div>
            <div className={styles.card}>
              <h3>📋 รายการล่าสุด</h3>
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
        )}

        {/* ROOMS */}
        {page === 'rooms' && (
          <div className={styles.page}>
            <div className={styles.pageHeader}><h2>🚪 จัดการห้อง</h2>
              <button className={styles.btnPrimary} onClick={() => { setEditRoom(null); setModal('room'); }}>➕ เพิ่มห้อง</button>
            </div>
            <div className={styles.card}>
              <table>
                <thead><tr><th>ห้อง</th><th>ค่าเช่า/เดือน</th><th>ชื่อผู้พัก</th><th>เบอร์โทร</th><th>LINE User ID</th><th>จัดการ</th></tr></thead>
                <tbody>
                  {rooms.length === 0 ? <tr><td colSpan={6}><div className={styles.emptyState}><div className={styles.emptyIcon}>🚪</div><p>ยังไม่มีห้อง</p></div></td></tr> :
                    rooms.map((r: any, i: number) => (
                      <tr key={r.id} style={{ animationDelay: `${i * 0.05}s` }}>
                        <td><span className={styles.roomNumber}>{r.number}</span></td>
                        <td>{r.rent.toLocaleString()} ฿</td>
                        <td>{r.tenantName || <span style={{ color: '#ccc' }}>— ว่าง —</span>}</td>
                        <td>{r.tenantPhone || '—'}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.tenantUserId || <span style={{ color: '#ccc' }}>ยังไม่ได้ตั้งค่า</span>}</td>
                        <td><div className={styles.actionBtns}>
                          <button className={styles.btnWarningSm} onClick={() => { setEditRoom(r); setModal('room'); }}>✏️</button>
                          <button className={styles.btnDangerSm} onClick={() => deleteRoom(r.id)}>🗑️</button>
                        </div></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* METERS */}
        {page === 'meters' && (() => {
          const occRooms = rooms.filter(r => r.tenantName);
          const pm = getPrevMonth(meterMonth);
          return (
            <div className={styles.page}>
              <div className={styles.pageHeader}><h2>⚡ บันทึกหน่วย ค่าไฟ/น้ำ</h2></div>
              <div className={styles.monthSelector}>
                <label style={{ fontWeight: 700 }}>📅 เลือกเดือน:</label>
                <input type="month" value={meterMonth} onChange={e => setMeterMonth(e.target.value)} />
              </div>
              <div className={styles.card}>
                <h3>📝 บันทึกหน่วยใช้ — <span style={{ color: 'var(--primary)' }}>{formatMonth(meterMonth)}</span></h3>
                <p style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 16 }}>💡 คลิกที่ตัวเลขหน่วยก่อนหน้าเพื่อแก้ไขได้</p>
                <table>
                  <thead><tr><th>ห้อง</th><th>ผู้พัก</th><th>หน่วยไฟก่อนหน้า</th><th>หน่วยไฟปัจจุบัน</th><th>ใช้จริง</th><th>หน่วยน้ำก่อนหน้า</th><th>หน่วยน้ำปัจจุบัน</th><th>ใช้จริง</th><th>บันทึก</th></tr></thead>
                  <tbody>
                    {occRooms.length === 0 ? <tr><td colSpan={9}><div className={styles.emptyState}><div className={styles.emptyIcon}>📝</div><p>ยังไม่มีห้องที่มีผู้พักอาศัย</p></div></td></tr> :
                      occRooms.map((r: any, i: number) => {
                        const cur = meters.find(x => x.roomId === r.id && x.month === meterMonth) || { elec: 0, water: 0 };
                        const prev = meters.find(x => x.roomId === r.id && x.month === pm) || { elec: 0, water: 0 };
                        const eu = (cur.elec !== 0 || prev.elec !== 0) ? Math.max(0, Number(cur.elec) - Number(prev.elec)) : '—';
                        const wu = (cur.water !== 0 || prev.water !== 0) ? Math.max(0, Number(cur.water) - Number(prev.water)) : '—';
                        return (
                          <tr key={r.id} style={{ animationDelay: `${i * 0.05}s` }}>
                            <td><span className={styles.roomNumber}>{r.number}</span></td>
                            <td>{r.tenantName}</td>
                            <td>
                              <input type="number" defaultValue={prev.elec}
                                onChange={e => savePrev(r.id, meterMonth, 'elec', e.target.value)}
                                className={styles.meterInput + ' ' + styles.editable}
                              />
                              <div style={{ fontSize: 10, color: 'var(--text-light)', marginTop: 2 }}>แก้ไขได้</div>
                            </td>
                            <td><input type="number" defaultValue={cur.elec}
                              onChange={e => updateMeter(r.id, meterMonth, 'elec', e.target.value)}
                              className={styles.meterInput}
                            /></td>
                            <td className={styles.highlight}>{eu}</td>
                            <td><input type="number" defaultValue={prev.water}
                              onChange={e => savePrev(r.id, meterMonth, 'water', e.target.value)}
                              className={styles.meterInput + ' ' + styles.editable}
                            />
                              <div style={{ fontSize: 10, color: 'var(--text-light)', marginTop: 2 }}>แก้ไขได้</div>
                            </td>
                            <td><input type="number" defaultValue={cur.water}
                              onChange={e => updateMeter(r.id, meterMonth, 'water', e.target.value)}
                              className={styles.meterInput}
                            /></td>
                            <td className={styles.highlight}>{wu}</td>
                            <td><button className={styles.btnSuccessSm} onClick={() => { updateMeter(r.id, meterMonth, 'elec', String(cur.elec)); updateMeter(r.id, meterMonth, 'water', String(cur.water)); }}>💾</button></td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              <div className={styles.card}>
                <h3>💡 อัตราค่าหน่วย</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}><label>ค่าไฟต่อหน่วย (บาท)</label>
                    <input type="number" value={settings.rateElec}
                      onChange={e => { const s = { ...settings, rateElec: parseFloat(e.target.value) || 7 }; setSettings(s); api('/api/settings', 'POST', s); }}
                    />
                  </div>
                  <div className={styles.formGroup}><label>ค่าน้ำต่อหน่วย (บาท)</label>
                    <input type="number" value={settings.rateWater}
                      onChange={e => { const s = { ...settings, rateWater: parseFloat(e.target.value) || 20 }; setSettings(s); api('/api/settings', 'POST', s); }}
                    />
                  </div>
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
              <label style={{ fontWeight: 700 }}>📅 เลือกเดือน:</label>
              <input type="month" value={invMonth} onChange={e => setInvMonth(e.target.value)} />
            </div>
            <div className={styles.card}>
              <table>
                <thead><tr><th>ห้อง</th><th>ผู้พัก</th><th>ค่าเช่า</th><th>ค่าไฟ</th><th>ค่าน้ำ</th><th>รวมทั้งหมด</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
                <tbody>
                  {rooms.filter(r => r.tenantName).length === 0 ?
                    <tr><td colSpan={8}><div className={styles.emptyState}><div className={styles.emptyIcon}>🧾</div><p>ยังไม่มีข้อมูล</p></div></td></tr> :
                    rooms.filter(r => r.tenantName).map((r: any, i: number) => {
                      const inv = calcInv(r, invMonth);
                      const hasData = inv.elecUnits > 0 || inv.waterUnits > 0;
                      return (
                        <tr key={r.id} style={{ animationDelay: `${i * 0.05}s` }}>
                          <td><span className={styles.roomNumber}>{inv.room}</span></td>
                          <td>{inv.tenant}</td>
                          <td>{inv.rent.toLocaleString()}</td>
                          <td>{inv.elecCost.toLocaleString()} ({inv.elecUnits} หน่วย)</td>
                          <td>{inv.waterCost.toLocaleString()} ({inv.waterUnits} หน่วย)</td>
                          <td className={styles.highlight}>{inv.total.toLocaleString()} ฿</td>
                          <td><span className={hasData ? styles.badgeUnpaid : styles.badgePaid}>
                            {hasData ? 'รอชำระ' : '—'}
                          </span></td>
                          <td><div className={styles.actionBtns}>
                            <button className={styles.btnPrimarySm} onClick={() => { setViewInv(inv); setModal('invoice'); }}>👁️ ดู</button>
                            <button className={styles.btnSuccessSm} onClick={() => downloadPdf(inv)}>📄 PDF</button>
                            <button className={styles.btnSuccessSm} onClick={() => sendInvLine(inv)}>📱 LINE</button>
                          </div></td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {page === 'settings' && (
          <div className={styles.page}>
            <div className={styles.pageHeader}><h2>⚙️ ตั้งค่าระบบ</h2></div>
            <div className={styles.card}>
              <h3>🏢 ข้อมูลหอพัก</h3>
              <div className={styles.logoUploadArea}>
                <div id="logoPreview">
                  {settings.logo ? <img src={settings.logo} alt="Logo" /> : <div className={styles.logoPlaceholder}>🏠</div>}
                </div>
                <div>
                  <p style={{ fontWeight: 700, marginBottom: 8 }}>โลโก้หอพัก (แสดงใน PDF)</p>
                  <button className={styles.btnOutlineSm} onClick={() => document.getElementById('logoInput')?.click()}>📷 อัปโหลดโลโก้</button>
                  <button className={styles.btnDangerSm} onClick={removeLogo} style={{ marginLeft: 8 }}>🗑️ ลบ</button>
                  <input type="file" id="logoInput" accept="image/*" style={{ display: 'none' }} onChange={uploadLogo} />
                  <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 6 }}>รองรับ PNG, JPG ขนาดไม่เกิน 2MB</p>
                </div>
              </div>
              <div className={styles.formGroup}><label>ชื่อหอพัก</label><input value={settings.dormName} onChange={e => { const s = { ...settings, dormName: e.target.value }; setSettings(s); api('/api/settings', 'POST', s); }} /></div>
              <div className={styles.formGroup}><label>ที่อยู่</label><input value={settings.address} onChange={e => { const s = { ...settings, address: e.target.value }; setSettings(s); api('/api/settings', 'POST', s); }} /></div>
              <div className={styles.formGroup}><label>เบอร์โทรศัพท์</label><input value={settings.phone} onChange={e => { const s = { ...settings, phone: e.target.value }; setSettings(s); api('/api/settings', 'POST', s); }} /></div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}><label>ค่าไฟต่อหน่วย (บาท)</label><input type="number" value={settings.rateElec} onChange={e => { const s = { ...settings, rateElec: parseFloat(e.target.value) || 7 }; setSettings(s); api('/api/settings', 'POST', s); }} /></div>
                <div className={styles.formGroup}><label>ค่าน้ำต่อหน่วย (บาท)</label><input type="number" value={settings.rateWater} onChange={e => { const s = { ...settings, rateWater: parseFloat(e.target.value) || 20 }; setSettings(s); api('/api/settings', 'POST', s); }} /></div>
              </div>
            </div>

            <div className={styles.card}>
              <h3>📱 LINE Messaging API</h3>
              <div className={styles.infoBox}>📌 <strong>วิธีตั้งค่า:</strong><br />1. สร้าง Channel ที่ <code>https://developers.line.biz/console/</code><br />2. เปิดใช้งาน Messaging API → คัดลอก <strong>Channel Access Token</strong><br />3. ผู้พักต้อง <strong>เพิ่มบอทเป็นเพื่อน</strong> ใน LINE ก่อนระบบจึงจะส่งข้อความได้<br />4. ระบบจะส่งแจ้งเตือนเฉพาะผู้พักที่กรอก <strong>LINE User ID</strong> ไว้เท่านั้น</div>
              <div style={{ marginBottom: 16 }}>
                <span className={`${styles.lineStatus} ${settings.channelToken ? styles.lineConnected : styles.lineDisconnected}`}>
                  {settings.channelToken ? '🟢 Token ถูกตั้งค่าแล้ว' : '🔴 ยังไม่ได้ตั้งค่า Token'}
                </span>
              </div>
              <div className={styles.lineConfigSection}>
                <h4>🔑 Channel Access Token</h4>
                <div className={styles.formGroup}><input type="text" placeholder="eyJhbGciOi..." value={settings.channelToken || ''} onChange={e => { const s = { ...settings, channelToken: e.target.value }; setSettings(s); api('/api/settings', 'POST', s); }} /></div>
                <button className={styles.btnSuccess} onClick={async () => {
                  const uid = prompt('กรุณากรอก LINE User ID ของคุณเพื่อทดสอบ (ขึ้นต้นด้วย U):');
                  if (!uid || !uid.startsWith('U')) { toast('User ID ไม่ถูกต้อง', true); return; }
                  await sendLineMsg(uid, `🧪 ทดสอบ LINE Messaging API\nเวลา: ${new Date().toLocaleString('th-TH')}\n✅ ระบบพร้อมใช้งาน!`);
                }}>🧪 ทดสอบส่งข้อความ</button>
              </div>
            </div>

            <div className={styles.card}>
              <h3>🗂️ สำรอง & กู้คืนข้อมูล</h3>
              <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 16 }}>💡 Export ไว้พกไป Import ในเครื่องอื่น</p>
              <div className={styles.backupActions}>
                <button className={styles.btnOutline} onClick={exportData}>📤 Export ข้อมูล</button>
                <button className={styles.btnPrimary} onClick={() => document.getElementById('importFile')?.click()}>📥 Import ข้อมูล</button>
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
            <div id="invoicePdf">
              <InvoicePreview inv={viewInv} settings={settings} />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnOutline} onClick={() => setModal(null)}>ปิด</button>
              <button className={styles.btnPrimary} onClick={() => downloadPdf(viewInv)}>📄 ดาวน์โหลด PDF</button>
              <button className={styles.btnSuccess} onClick={() => sendInvLine(viewInv)}>📱 ส่ง LINE</button>
            </div>
          </div>
        </div>
      )}

      {/* TOASTS */}
      <div className={styles.toastContainer}>
        {toasts.map(t => (
          <div key={t.id} className={`${styles.toast} ${t.err ? styles.toastError : ''}`}>
            <span>{t.err ? '❌' : '✅'}</span><span>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Room Modal Component ──────────────────────────────────────
function RoomModal({ room, onClose, onSave }: { room: any; onClose: () => void; onSave: (d: any) => void }) {
  const [num, setNum] = useState(room?.number || '');
  const [rent, setRent] = useState(room?.rent || '');
  const [name, setName] = useState(room?.tenantName || '');
  const [phone, setPhone] = useState(room?.tenantPhone || '');
  const [userId, setUserId] = useState(room?.tenantUserId || '');
  const [note, setNote] = useState(room?.note || '');

  const save = () => {
    if (!num.trim()) { alert('กรุณาระบุหมายเลขห้อง'); return; }
    onSave({ number: num.trim(), rent: parseFloat(rent) || 0, tenantName: name.trim(), tenantPhone: phone.trim(), tenantUserId: userId.trim(), note: note.trim() });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3>{room ? '✏️ แก้ไขห้อง' : '➕ เพิ่มห้อง'}</h3>
        <div className={styles.formRow}>
          <div className={styles.formGroup}><label>หมายเลขห้อง</label><input value={num} onChange={e => setNum(e.target.value)} placeholder="เช่น 101" /></div>
          <div className={styles.formGroup}><label>ค่าเช่าต่อเดือน (บาท)</label><input type="number" value={rent} onChange={e => setRent(e.target.value)} placeholder="3500" /></div>
        </div>
        <div className={styles.formGroup}><label>ชื่อผู้พัก</label><input value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อ-นามสกุล" /></div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}><label>เบอร์โทรศัพท์</label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="081-234-5678" /></div>
          <div className={styles.formGroup}><label>LINE User ID (ขึ้นต้นด้วย U)</label><input value={userId} onChange={e => setUserId(e.target.value)} placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" /></div>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 16 }}>💡 หา User ID: ให้ผู้พักเพิ่มบอทเป็นเพื่อน → ดูจาก Webhook Event หรือใช้เครื่องมือตรวจสอบ</p>
        <div className={styles.formGroup}><label>หมายเหตุ</label><input value={note} onChange={e => setNote(e.target.value)} placeholder="เช่น รวมค่าเน็ต, ไม่รวมแอร์" /></div>
        <div className={styles.modalActions}>
          <button className={styles.btnOutline} onClick={onClose}>ยกเลิก</button>
          <button className={styles.btnPrimary} onClick={save}>💾 บันทึก</button>
        </div>
      </div>
    </div>
  );
}

// ─── Invoice Preview ───────────────────────────────────────────
function InvoicePreview({ inv, settings }: { inv: any; settings: any }) {
  const lh = settings.logo ? <img src={settings.logo} style={{ height: 60, objectFit: 'contain', marginBottom: 10 }} alt="Logo" /> : null;
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 40 }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        {lh}
        <h2 style={{ color: 'var(--primary-dark)', fontSize: 26, margin: 0 }}>{settings.dormName}</h2>
        <p style={{ color: 'var(--text-light)', margin: '4px 0' }}>{settings.address}</p>
        <p style={{ color: 'var(--text-light)', margin: '4px 0' }}>โทร: {settings.phone}</p>
        <hr style={{ margin: '20px 0', border: 'none', borderTop: '3px solid var(--primary)' }} />
        <h3 style={{ color: 'var(--primary-dark)', margin: 0, fontSize: 20 }}>ใบแจ้งหนี้ค่าเช่าประจำเดือน {formatMonth(inv.month)}</h3>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, padding: 18, background: 'linear-gradient(135deg,#f0fdf4,#ecfdf5)', borderRadius: 12 }}>
        <div><strong>ผู้พัก:</strong> {inv.tenant}<br /><strong>ห้อง:</strong> {inv.room}</div>
        <div style={{ textAlign: 'right' }}><strong>วันที่:</strong> {new Date().toLocaleDateString('th-TH')}<br /><strong>สถานะ:</strong> รอชำระ</div>
      </div>
      <table>
        <thead><tr><th>รายการ</th><th>รายละเอียด</th><th style={{ textAlign: 'right' }}>จำนวนเงิน (บาท)</th></tr></thead>
        <tbody>
          <tr><td>ค่าเช่าห้อง</td><td>ห้อง {inv.room}</td><td style={{ textAlign: 'right' }}>{inv.rent.toLocaleString()}</td></tr>
          <tr><td>ค่าไฟฟ้า</td><td>{inv.elecUnits} หน่วย × {inv.rateElec} บาท<br /><small>({inv.curElec} - {inv.prevElec})</small></td><td style={{ textAlign: 'right' }}>{inv.elecCost.toLocaleString()}</td></tr>
          <tr><td>ค่าน้ำประปา</td><td>{inv.waterUnits} หน่วย × {inv.rateWater} บาท<br /><small>({inv.curWater} - {inv.prevWater})</small></td><td style={{ textAlign: 'right' }}>{inv.waterCost.toLocaleString()}</td></tr>
        </tbody>
      </table>
      <div style={{ fontSize: 22, fontWeight: 800, textAlign: 'right', paddingTop: 18, borderTop: '3px solid var(--primary)', color: 'var(--primary-dark)' }}>
        ยอดรวมทั้งหมด: {inv.total.toLocaleString()} บาท
      </div>
      <p style={{ textAlign: 'center', marginTop: 28, color: 'var(--text-light)', fontSize: 13, lineHeight: 1.8 }}>
        กรุณาชำระเงินภายในวันที่ 5 ของทุกเดือน<br />โอนเข้าบัญชี xxx-x-xxxxx-x-x ธนาคาร xxx
      </p>
    </div>
  );
}
