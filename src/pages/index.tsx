import { useState, useEffect, useCallback, useRef } from 'react';
import styles from '../styles/Home.module.css';

interface Room {
  id: string; number: string; rent: number;
  tenantName: string; tenantPhone: string; tenantLineId: string; note: string;
}
interface UtilityRecord {
  id: string; roomId: string; month: string;
  elecReading: number; waterReading: number;
  prevElecReading: number; prevWaterReading: number;
  elecUsed: number; waterUsed: number; note: string; createdAt: string;
}
interface Invoice {
  id: string; roomId: string; roomNumber: string; tenantName: string; month: string;
  rent: number; elecUnits: number; elecRate: number; elecAmount: number;
  waterUnits: number; waterRate: number; waterAmount: number; total: number;
  status: 'pending' | 'paid' | 'overdue'; paidDate?: string; note: string; createdAt: string;
}
interface PendingLineUser {
  id: string; lineUserId: string; lineDisplayName?: string; linePictureUrl?: string;
  roomId?: string; status: 'pending' | 'matched' | 'ignored'; createdAt: string;
}
interface Settings {
  dormName: string; address: string; phone: string;
  rateElec: number; rateWater: number; logo: string;
}
type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: string; message: string; type: ToastType; }

const MONTHS = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const THAI_MONTHS = ['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

export default function Home() {
  const [pg, setPg] = useState('dashboard');
  const [sb, setSb] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [utils, setUtils] = useState<UtilityRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [lines, setLines] = useState<PendingLineUser[]>([]);
  const [stg, setStg] = useState<Settings | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [roomM, setRoomM] = useState<Room | null | 'new'>(null);
  const [utilM, setUtilM] = useState<{ roomId: string; month: string } | null>(null);
  const [viewInv, setViewInv] = useState<Invoice | null>(null);
  const [delC, setDelC] = useState<{ t: string; id: string } | null>(null);
  const [deling, setDeling] = useState(false);
  const [invMonth, setInvMonth] = useState(new Date().toISOString().slice(0, 7));
  const [utilFilter, setUtilFilter] = useState('');
  const [invFilter, setInvFilter] = useState('all');
  const invRef = useRef<HTMLDivElement>(null);
  const tRef = useRef<Record<string, any>>({});

  const toast = useCallback((m: string, t: ToastType = 'success') => {
    const id = Date.now().toString(36);
    setToasts(p => [...p, { id, message: m, type: t }]);
    tRef.current[id] = setTimeout(() => { setToasts(p => p.filter(x => x.id !== id)); delete tRef.current[id]; }, 3500);
  }, []);
  useEffect(() => () => { Object.values(tRef.current).forEach(clearTimeout); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [r, u, i, l, s] = await Promise.all([
        fetch('/api/rooms').then(x => x.json()).catch(() => []),
        fetch('/api/utilities').then(x => x.json()).catch(() => []),
        fetch('/api/invoices').then(x => x.json()).catch(() => []),
        fetch('/api/pending-lines').then(x => x.json()).catch(() => []),
        fetch('/api/settings').then(x => x.json()).catch(() => null)
      ]);
      setRooms(r); setUtils(u); setInvoices(i); setLines(l); setStg(s);
    } catch { toast('โหลดข้อมูลไม่สําเร็จ', 'error'); }
    setLoading(false);
  };
  useEffect(() => { fetchAll(); }, []);

  const api = async (path: string, method: string, body?: any) => {
    const opts: any = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    return fetch(path, opts);
  };

  const saveRoom = async (room: Room) => {
    const m = rooms.some(r => r.id === room.id) ? 'PUT' : 'POST';
    const r = await api('/api/rooms', m, room);
    if (r.ok) { await fetchAll(); setRoomM(null); toast('บันทึกห้องสําเร็จ'); }
    else toast('เกิดข้อผิดพลาด', 'error');
  };
  const deleteRoom = async (id: string) => {
    setDeling(true);
    const r = await api('/api/rooms', 'DELETE', { id });
    if (r.ok) { await fetchAll(); toast('ลบห้องสําเร็จ'); }
    else toast('เกิดข้อผิดพลาด', 'error');
    setDeling(false); setDelC(null);
  };

  const saveUtil = async (rec: UtilityRecord) => {
    const prev = utils.filter(u => u.roomId === rec.roomId && u.month < rec.month).sort((a, b) => b.month.localeCompare(a.month))[0];
    if (prev) {
      rec.prevElecReading = prev.elecReading; rec.prevWaterReading = prev.waterReading;
      rec.elecUsed = rec.elecReading - prev.elecReading; rec.waterUsed = rec.waterReading - prev.waterReading;
    }
    rec.id = rec.id || Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    rec.createdAt = new Date().toISOString();
    const m = utils.some(u => u.id === rec.id) ? 'PUT' : 'POST';
    const r = await api('/api/utilities', m, rec);
    if (r.ok) { await fetchAll(); setUtilM(null); toast('บันทึกหน่วยสําเร็จ'); }
    else toast('เกิดข้อผิดพลาด', 'error');
  };

  const genInvoices = async (month: string) => {
    if (!stg) return;
    const ex = invoices.filter(i => i.month === month);
    if (ex.length && !confirm('ใบแจ้งหนี้เดือนนี้มีอยู่แล้ว ต้องการสร้างใหม่?')) return;
    for (const inv of ex) await api('/api/invoices', 'DELETE', { id: inv.id });
    for (const room of rooms) {
      const u = utils.filter(x => x.roomId === room.id && x.month === month).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      const inv: Invoice = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        roomId: room.id, roomNumber: room.number, tenantName: room.tenantName, month,
        rent: room.rent,
        elecUnits: u?.elecUsed || 0, elecRate: stg.rateElec, elecAmount: (u?.elecUsed || 0) * stg.rateElec,
        waterUnits: u?.waterUsed || 0, waterRate: stg.rateWater, waterAmount: (u?.waterUsed || 0) * stg.rateWater,
        total: room.rent + (u?.elecUsed || 0) * stg.rateElec + (u?.waterUsed || 0) * stg.rateWater,
        status: 'pending', note: '', createdAt: new Date().toISOString(),
      };
      await api('/api/invoices', 'POST', inv);
    }
    await fetchAll(); toast('สร้างใบแจ้งหนี้สําเร็จ');
  };

  const updateInvStatus = async (inv: Invoice, status: Invoice['status']) => {
    const u = { ...inv, status, paidDate: status === 'paid' ? new Date().toISOString() : undefined };
    await api('/api/invoices', 'PUT', u); await fetchAll();
    toast(status === 'paid' ? 'ยืนยันชําระสําเร็จ' : 'อัปเดตสถานะสําเร็จ');
  };

  const exportPDF = async (inv: Invoice) => {
    if (typeof window === 'undefined') return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('ใบแจ้งหนี้', 105, 30, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`ห้อง ${inv.roomNumber} - เดือน ${THAI_MONTHS[parseInt(inv.month.split('-')[1])]} ${parseInt(inv.month.split('-')[0]) + 543}`, 105, 45, { align: 'center' });
    doc.setFontSize(12);
    const y0 = 65;
    doc.text(`ชื่อผู้พัก: ${inv.tenantName}`, 20, y0);
    doc.text(`ค่าเช่า: ${inv.rent.toLocaleString()} บาท`, 20, y0 + 10);
    doc.text(`ค่าไฟ: ${inv.elecUnits} หน่วย x ${inv.elecRate} = ${inv.elecAmount.toLocaleString()} บาท`, 20, y0 + 20);
    doc.text(`ค่าน้ำ: ${inv.waterUnits} หน่วย x ${inv.waterRate} = ${inv.waterAmount.toLocaleString()} บาท`, 20, y0 + 30);
    doc.setFontSize(16);
    doc.text(`รวมทั้งหมด: ${inv.total.toLocaleString()} บาท`, 20, y0 + 50);
    doc.setFontSize(10);
    doc.text(`สถานะ: ${inv.status === 'paid' ? 'ชำระแล้ว' : inv.status === 'overdue' ? 'ค้างชำระ' : 'รอชำระ'}`, 20, y0 + 60);
    doc.save(`invoice_${inv.roomNumber}_${inv.month}.pdf`);
    toast('สร้าง PDF สำเร็จ');
  };

  const matchLine = async (lineId: string, roomId: string) => {
    const line = lines.find(l => l.lineUserId === lineId);
    if (line) {
      await api('/api/pending-lines', 'PUT', { ...line, roomId, status: 'matched' });
      const room = rooms.find(r => r.id === roomId);
      if (room) {
        await api('/api/rooms', 'PUT', { ...room, tenantLineId: lineId });
      }
      await fetchAll(); toast('จับคู่ LINE สำเร็จ');
    }
  };

  const migrateData = async () => {
    const ls = {
      rooms: JSON.parse(localStorage.getItem('dorm_rooms') || '[]'),
      utilities: JSON.parse(localStorage.getItem('dorm_utilities') || '[]'),
      invoices: JSON.parse(localStorage.getItem('dorm_invoices') || '[]'),
      pendingLines: JSON.parse(localStorage.getItem('dorm_pending_lines') || '[]'),
    };
    const hasData = Object.values(ls).some((a: any) => a.length > 0);
    if (!hasData) { toast('ไม่มีข้อมูลใน LocalStorage', 'warning'); return; }
    const r = await api('/api/migrate', 'POST', ls);
    if (r.ok) { await fetchAll(); toast('ย้ายข้อมูลสำเร็จ'); }
    else toast('เกิดข้อผิดพลาด', 'error');
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const occupied = rooms.filter(r => r.tenantName).length;
  const vacant = rooms.length - occupied;
  const totalRent = rooms.reduce((s, r) => s + r.rent, 0);
  const pendingInvoices = invoices.filter(i => i.status === 'pending');
  const totalPending = pendingInvoices.reduce((s, i) => s + i.total, 0);

  const filteredUtils = utils.filter(u => {
    if (!utilFilter) return true;
    const room = rooms.find(r => r.id === u.roomId);
    return room?.number.includes(utilFilter) || room?.tenantName.includes(utilFilter);
  });

  const filteredInvoices = invoices.filter(i => {
    if (invFilter === 'all') return true;
    return i.status === invFilter;
  });

  if (loading) return <div className={styles.container}><div className={styles.loading}><div className={styles.spinner} /><p>กำลังโหลด...</p></div></div>;

  return (
    <div className={styles.container}>
      {sb && <div className={styles.overlay} onClick={() => setSb(false)} />}
      <nav className={`${styles.sidebar} ${sb ? styles.open : ''}`}>
        <button className={styles.closeBtn} onClick={() => setSb(false)}>✕</button>
        <div className={styles.logo}><span className={styles.logoIcon}>🏠</span><div><h1>{stg?.dormName || 'หอพัก Billing'}</h1><p className={styles.logoSub}>ระบบจัดการหอพัก</p></div></div>
        <div className={styles.navLabel}>เมนูหลัก</div>
        {([['dashboard','📊','แดชบอร์ด'],['rooms','🚪','จัดการห้อง'],['utilities','⚡','บันทึกหน่วย'],['billing','💰','ใบแจ้งหนี้'],['lines','💬','LINE Admin'],['settings','⚙️','ตั้งค่า']] as const).map(([p,icon,label]) => (
          <button key={p} className={`${styles.navItem} ${pg===p?styles.active:''}`} onClick={()=>{setPg(p);setSb(false);}}>
            <span className={styles.navIcon}>{icon}</span><span>{label}</span>
          </button>
        ))}
        <div className={styles.sideFooter}>
          <div className={styles.quickStat}><span className={styles.qsVal}>{rooms.length}</span><span className={styles.qsLbl}>ห้อง</span></div>
          <div className={styles.quickStat}><span className={styles.qsVal}>{occupied}</span><span className={styles.qsLbl}>มีผู้พัก</span></div>
        </div>
      </nav>
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.hdrLeft}>
            <button className={styles.menuBtn} onClick={()=>setSb(true)}>☰</button>
            <div>
              <h2 className={styles.title}>{pg==='dashboard'?'📊 ภาพรวม':pg==='rooms'?'🚪 จัดการห้อง':pg==='utilities'?'⚡ บันทึกหน่วย':pg==='billing'?'💰 ใบแจ้งหนี้':pg==='lines'?'💬 LINE Admin':'⚙️ ตั้งค่า'}</h2>
              <p className={styles.subtitle}>{pg==='dashboard'?'ติดตามสถานะหอพัก':pg==='rooms'?'จัดการข้อมูลห้องและผู้พัก':pg==='utilities'?'บันทึกหน่วยไฟ/น้ำรายเดือน':pg==='billing'?'จัดการใบแจ้งหนี้':pg==='lines'?'จัดการ LINE User ID':'ตั้งค่าระบบ'}</p>
            </div>
          </div>
          <div className={styles.hdrDate}>{new Date().toLocaleDateString('th-TH',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
        </header>

        {/* DASHBOARD */}
        {pg==='dashboard' && <Dashboard rooms={rooms} occupied={occupied} vacant={vacant} totalRent={totalRent} pendingInvoices={pendingInvoices.length} totalPending={totalPending} utils={utils} invoices={invoices} setPg={setPg} />}

        {/* ROOMS */}
        {pg==='rooms' && <RoomsPage rooms={rooms} onAdd={()=>setRoomM('new')} onEdit={r=>setRoomM(r)} onDelete={id=>setDelC({t:'room',id})} delC={delC} deling={deling} onDeleteConfirm={deleteRoom} setDelC={setDelC} />}

        {/* UTILITIES */}
        {pg==='utilities' && <UtilitiesPage rooms={rooms} utils={utils} settings={stg} filter={utilFilter} setFilter={setUtilFilter} onAdd={rm=>setUtilM({roomId:rm,month:currentMonth})} onSave={saveUtil} />}

        {/* BILLING */}
        {pg==='billing' && <BillingPage invoices={invoices} settings={stg} filter={invFilter} setFilter={setInvFilter} month={invMonth} setMonth={setInvMonth} onGenerate={genInvoices} onStatusUpdate={updateInvStatus} onExportPDF={exportPDF} viewInv={viewInv} setViewInv={setViewInv} invRef={invRef} />}

        {/* LINE ADMIN */}
        {pg==='lines' && <LinesPage lines={lines} rooms={rooms} onMatch={matchLine} onMigrate={migrateData} />}

        {/* SETTINGS */}
        {pg==='settings' && <SettingsPage settings={stg} onSave={async s=>{const r=await api('/api/settings','POST',s);if(r.ok){setStg(s);toast('บันทึกสำเร็จ');}else toast('เกิดข้อผิดพลาด','error');}} />}
      </main>

      {roomM!==null && <RoomModal room={roomM==='new'?null:roomM} onClose={()=>setRoomM(null)} onSave={saveRoom} />}
      {utilM && <UtilModal roomId={utilM.roomId} month={utilM.month} rooms={rooms} utils={utils} onClose={()=>setUtilM(null)} onSave={saveUtil} />}
      <Toasts toasts={toasts} remove={(id)=>{setToasts(p=>p.filter(t=>t.id!==id));clearTimeout(tRef.current[id]);delete tRef.current[id];}} />
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────
function Dashboard({rooms,occupied,vacant,totalRent,pendingInvoices,totalPending,utils,invoices,setPg}:{
  rooms:Room[];occupied:number;vacant:number;totalRent:number;
  pendingInvoices:number;totalPending:number;utils:UtilityRecord[];invoices:Invoice[];setPg:(p:string)=>void;
}) {
  const occ = rooms.length ? Math.round(occupied/rooms.length*100) : 0;
  const paid = invoices.filter(i=>i.status==='paid').length;
  return (
    <div className={styles.content}>
      <div className={styles.stats}>
        {[
          ['🏢',`${rooms.length}`,'ห้องทั้งหมด','blue'],
          ['✅',`${occupied}`,'มีผู้พัก','green'],
          ['🔑',`${vacant}`,'ห้องว่าง','orange'],
          ['💰',`${totalRent.toLocaleString()}`,'ค่าเช่ารวม','purple'],
          ['📋',`${pendingInvoices}`,'รอชำระ','pink'],
          ['💵',`${totalPending.toLocaleString()}`,'ยอดค้างชำระ','teal'],
        ].map(([icon,val,label,color],i) => (
          <div key={i} className={`${styles.stat} ${styles[color]}`}>
            <div className={styles.statIcon}>{icon}</div>
            <div className={styles.statVal}>{val}</div>
            <div className={styles.statLbl}>{label}</div>
          </div>
        ))}
      </div>
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>อัตราการเข้าพัก</h3>
        <div className={styles.bar}><div className={styles.barFill} style={{width:`${occ}%`}}/></div>
        <div className={styles.barLbls}><span>ว่าง {vacant}</span><span>มีผู้พัก {occupied} ({occ}%)</span></div>
      </div>
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>ห้องล่าสุด</h3>
        {rooms.length===0 ? <p className={styles.empty}>ยังไม่มีห้อง <button className={styles.btnSm} onClick={()=>setPg('rooms')}>➕ เพิ่มห้อง</button></p> :
          <div className={styles.grid}>
            {rooms.slice(0,6).map(r=>(
              <div key={r.id} className={styles.rCard}>
                <div className={styles.rHead}><span className={styles.rBadge}>{r.number}</span>
                  <span className={r.tenantName?styles.sOcc:styles.sVac}>{r.tenantName?'มีผู้พัก':'ว่าง'}</span></div>
                <div className={styles.rBody}>{r.tenantName?<><div className={styles.rName}>{r.tenantName}</div><div className={styles.rPhone}>{r.tenantPhone}</div></>:<div className={styles.rEmpty}>พร้อมให้ผู้พักใหม่</div>}</div>
                <div className={styles.rFoot}><span className={styles.rRent}>{r.rent.toLocaleString()} ฿</span>{r.tenantLineId&&<span className={styles.rLine}>💬</span>}</div>
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  );
}

// ─── Rooms Page ────────────────────────────────────────────────
function RoomsPage({rooms,onAdd,onEdit,onDelete,delC,deling,onDeleteConfirm,setDelC}:{
  rooms:Room[];onAdd:()=>void;onEdit:(r:Room)=>void;onDelete:(id:string)=>void;
  delC:{t:string;id:string}|null;deling:boolean;onDeleteConfirm:(id:string)=>void;setDelC:(d:{t:string;id:string}|null)=>void;
}) {
  const [search,setSearch] = useState('');
  const filtered = rooms.filter(r => !search || r.number.toLowerCase().includes(search.toLowerCase()) || r.tenantName.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className={styles.content}>
      <div className={styles.topBar}>
        <div className={styles.search}>
          <span>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาห้อง, ชื่อผู้พัก..." />
          {search && <button className={styles.sClear} onClick={()=>setSearch('')}>✕</button>}
        </div>
        <button className={styles.btn} onClick={onAdd}>➕ เพิ่มห้อง</button>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>ห้อง</th><th>ค่าเช่า</th><th>ผู้พัก</th><th>เบอร์โทร</th><th>LINE</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
          <tbody>
            {filtered.length===0 ? <tr><td colSpan={7}><div className={styles.emptyState}><span>🔍</span><p>ไม่พบข้อมูล</p></div></td></tr> :
              filtered.map(r=>(
                <tr key={r.id}>
                  <td><span className={styles.rNum}>{r.number}</span></td>
                  <td>{r.rent.toLocaleString()} ฿</td>
                  <td>{r.tenantName||<span className={styles.muted}>— ว่าง —</span>}</td>
                  <td>{r.tenantPhone||<span className={styles.muted}>—</span>}</td>
                  <td>{r.tenantLineId||<span className={styles.muted}>—</span>}</td>
                  <td><span className={r.tenantName?styles.badgeOcc:styles.badgeVac}>{r.tenantName?'มีผู้พัก':'ว่าง'}</span></td>
                  <td>
                    <div className={styles.actBtns}>
                      <button className={styles.editB} onClick={()=>onEdit(r)}>✏️</button>
                      {delC?.t==='room'&&delC?.id===r.id ?
                        <div className={styles.delConf}><button className={styles.delYes} disabled={deling} onClick={()=>onDeleteConfirm(r.id)}>{deling?'⏳':'✓'}</button><button className={styles.delNo} disabled={deling} onClick={()=>setDelC(null)}>✕</button></div> :
                        <button className={styles.delB} onClick={()=>setDelC({t:'room',id:r.id})}>🗑️</button>}
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Utilities Page ────────────────────────────────────────────
function UtilitiesPage({rooms,utils,settings,filter,setFilter,onAdd,onSave}:{
  rooms:Room[];utils:UtilityRecord[];settings:Settings|null;filter:string;setFilter:(s:string)=>void;onAdd:(rm:string)=>void;onSave:(r:UtilityRecord)=>void;
}) {
  return (
    <div className={styles.content}>
      <div className={styles.topBar}>
        <div className={styles.search}>
          <span>🔍</span>
          <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="ค้นหาห้อง, ชื่อ..." />
        </div>
      </div>
      {rooms.filter(r=>!filter||r.number.includes(filter)||r.tenantName.includes(filter)).length===0 ?
        <div className={styles.emptyState}><span>🏠</span><p>ยังไม่มีห้อง</p></div> :
        <div className={styles.utilGrid}>
          {rooms.filter(r=>!filter||r.number.includes(filter)||r.tenantName.includes(filter)).map(room=>{
            const latest = utils.filter(u=>u.roomId===room.id).sort((a,b)=>b.month.localeCompare(a.month))[0];
            return (
              <div key={room.id} className={styles.utilCard}>
                <div className={styles.utilHead}>
                  <span className={styles.utilBadge}>{room.number}</span>
                  <span>{room.tenantName||'ว่าง'}</span>
                </div>
                {latest ? (
                  <div className={styles.utilInfo}>
                    <div>เดือน: {latest.month}</div>
                    <div>ไฟ: {latest.elecUsed} หน่วย (อ่าน {latest.elecReading})</div>
                    <div>น้ำ: {latest.waterUsed} หน่วย (อ่าน {latest.waterReading})</div>
                  </div>
                ) : <div className={styles.utilNone}>ยังไม่มีข้อมูล</div>}
                <button className={styles.btnSm} onClick={()=>onAdd(room.id)}>➕ บันทึกหน่วย</button>
              </div>
            );
          })}
        </div>
      }
    </div>
  );
}

// ─── Billing Page ──────────────────────────────────────────────
function BillingPage({invoices,settings,filter,setFilter,month,setMonth,onGenerate,onStatusUpdate,onExportPDF,viewInv,setViewInv,invRef}:{
  invoices:Invoice[];settings:Settings|null;filter:string;setFilter:(s:string)=>void;
  month:string;setMonth:(s:string)=>void;onGenerate:(m:string)=>void;
  onStatusUpdate:(inv:Invoice,s:Invoice['status'])=>void;onExportPDF:(inv:Invoice)=>void;
  viewInv:Invoice|null;setViewInv:(inv:Invoice|null)=>void;invRef:React.RefObject<HTMLDivElement>;
}) {
  const filtered = invoices.filter(i => filter==='all' || i.status===filter);
  return (
    <div className={styles.content}>
      <div className={styles.topBar}>
        <div className={styles.genRow}>
          <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className={styles.monthInput} />
          <button className={styles.btn} onClick={()=>onGenerate(month)}>📄 สร้างใบแจ้งหนี้</button>
        </div>
        <div className={styles.filterTabs}>
          {(['all','pending','paid','overdue'] as const).map(f=>(
            <button key={f} className={`${styles.fTab} ${filter===f?styles.fActive:''}`} onClick={()=>setFilter(f)}>
              {f==='all'?'ทั้งหมด':f==='pending'?'รอชำระ':f==='paid'?'ชำระแล้ว':'ค้างชำระ'}
              {f!=='all'&&<span className={styles.fCnt}>{invoices.filter(i=>i.status===f).length}</span>}
            </button>
          ))}
        </div>
      </div>
      {filtered.length===0 ? <div className={styles.emptyState}><span>📋</span><p>ไม่มีใบแจ้งหนี้</p></div> :
        <div className={styles.invGrid}>
          {filtered.map(inv=>(
            <div key={inv.id} className={`${styles.invCard} ${styles[`st${inv.status}`]}`}>
              <div className={styles.invHead}>
                <span className={styles.invRoom}>{inv.roomNumber}</span>
                <span className={`${styles.invStatus} ${styles[`st${inv.status}`]}`}>{inv.status==='paid'?'ชำระแล้ว':inv.status==='overdue'?'ค้างชำระ':'รอชำระ'}</span>
              </div>
              <div className={styles.invName}>{inv.tenantName}</div>
              <div className={styles.invMonth}>เดือน {THAI_MONTHS[parseInt(inv.month.split('-')[1])]} {parseInt(inv.month.split('-')[0])+543}</div>
              <div className={styles.invBreakdown}>
                <span>เช่า: {inv.rent.toLocaleString()}</span>
                <span>ไฟ: {inv.elecAmount.toLocaleString()}</span>
                <span>น้ำ: {inv.waterAmount.toLocaleString()}</span>
              </div>
              <div className={styles.invTotal}>{inv.total.toLocaleString()} ฿</div>
              <div className={styles.invActs}>
                <button className={styles.btnSm} onClick={()=>{setViewInv(inv);setTimeout(()=>{if(invRef.current)onExportPDF(inv);},100);}}>📄 PDF</button>
                {inv.status==='pending'&&<button className={`${styles.btnSm} ${styles.btnGreen}`} onClick={()=>onStatusUpdate(inv,'paid')}>✓ ชำระแล้ว</button>}
                {inv.status==='pending'&&<button className={`${styles.btnSm} ${styles.btnRed}`} onClick={()=>onStatusUpdate(inv,'overdue')}>⚠ ค้างชำระ</button>}
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

// ─── Lines Page ────────────────────────────────────────────────
function LinesPage({lines,rooms,onMatch,onMigrate}:{
  lines:PendingLineUser[];rooms:Room[];onMatch:(lineId:string,roomId:string)=>void;onMigrate:()=>void;
}) {
  const pending = lines.filter(l=>l.status==='pending');
  const matched = lines.filter(l=>l.status==='matched');
  return (
    <div className={styles.content}>
      <div className={styles.topBar}>
        <h3 className={styles.cardTitle}>LINE User ID ที่รอจับคู่ ({pending.length})</h3>
        <button className={styles.btn} onClick={onMigrate}>📦 ย้ายข้อมูลจาก LocalStorage</button>
      </div>
      {pending.length===0 ? <div className={styles.emptyState}><span>💬</span><p>ยังไม่มี LINE User ID ใหม่</p></div> :
        <div className={styles.lineGrid}>
          {pending.map(l=>(
            <div key={l.id} className={styles.lineCard}>
              {l.linePictureUrl && <img src={l.linePictureUrl} alt="" className={styles.linePic} />}
              <div className={styles.lineName}>{l.lineDisplayName||l.lineUserId}</div>
              <div className={styles.lineId}>{l.lineUserId}</div>
              <select className={styles.lineSelect} onChange={e=>{if(e.target.value)onMatch(l.lineUserId,e.target.value);}}>
                <option value="">— เลือกห้อง —</option>
                {rooms.map(r=><option key={r.id} value={r.id}>{r.number} {r.tenantName?`(${r.tenantName})`:''}</option>)}
              </select>
            </div>
          ))}
        </div>
      }
      {matched.length>0 && <>
        <h3 className={styles.cardTitle}>จับคู่แล้ว ({matched.length})</h3>
        <div className={styles.lineGrid}>
          {matched.map(l=>{
            const room = rooms.find(r=>r.id===l.roomId);
            return (
              <div key={l.id} className={`${styles.lineCard} ${styles.lineMatched}`}>
                {l.linePictureUrl && <img src={l.linePictureUrl} alt="" className={styles.linePic} />}
                <div className={styles.lineName}>{l.lineDisplayName||l.lineUserId}</div>
                <div className={styles.lineRoom}>→ {room?.number||'ไม่พบห้อง'}</div>
              </div>
            );
          })}
        </div>
      </>}
    </div>
  );
}

// ─── Settings Page ─────────────────────────────────────────────
function SettingsPage({settings,onSave}:{settings:Settings|null;onSave:(s:Settings)=>void;}) {
  const [s,setS] = useState<Settings>(settings||{dormName:'',address:'',phone:'',rateElec:7,rateWater:20,logo:''});
  const save = () => onSave(s);
  return (
    <div className={styles.content}>
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>ข้อมูลหอพัก</h3>
        <div className={styles.formRow}><div className={styles.fg}><label>ชื่อหอพัก</label><input value={s.dormName} onChange={e=>setS({...s,dormName:e.target.value})}/></div>
        <div className={styles.fg}><label>เบอร์โทรศัพท์</label><input value={s.phone} onChange={e=>setS({...s,phone:e.target.value})}/></div></div>
        <div className={styles.fg}><label>ที่อยู่</label><input value={s.address} onChange={e=>setS({...s,address:e.target.value})}/></div>
        <div className={styles.formRow}><div className={styles.fg}><label>ค่าไฟฟ้า (บาท/หน่วย)</label><input type="number" value={s.rateElec} onChange={e=>setS({...s,rateElec:+e.target.value})}/></div>
        <div className={styles.fg}><label>ค่าน้ำประปา (บาท/หน่วย)</label><input type="number" value={s.rateWater} onChange={e=>setS({...s,rateWater:+e.target.value})}/></div></div>
        <button className={styles.btn} onClick={save}>💾 บันทึก</button>
      </div>
    </div>
  );
}

// ─── Room Modal ────────────────────────────────────────────────
function RoomModal({room,onClose,onSave}:{room:Room|null;onClose:()=>void;onSave:(r:Room)=>void;}) {
  const [r,setR] = useState<Room>(room||{id:'',number:'',rent:0,tenantName:'',tenantPhone:'',tenantLineId:'',note:''});
  return (
    <div className={styles.modalBg} onClick={onClose}>
      <div className={styles.modal} onClick={e=>e.stopPropagation()}>
        <div className={styles.modalHead}><h3>{room?'✏️ แก้ไขห้อง':'➕ เพิ่มห้อง'}</h3><button onClick={onClose}>✕</button></div>
        <div className={styles.modalBody}>
          <div className={styles.formRow}><div className={styles.fg}><label>หมายเลขห้อง</label><input value={r.number} onChange={e=>setR({...r,number:e.target.value})}/></div>
          <div className={styles.fg}><label>ค่าเช่า (บาท)</label><input type="number" value={r.rent} onChange={e=>setR({...r,rent:+e.target.value})}/></div></div>
          <div className={styles.fg}><label>ชื่อผู้พัก</label><input value={r.tenantName} onChange={e=>setR({...r,tenantName:e.target.value})}/></div>
          <div className={styles.formRow}><div className={styles.fg}><label>เบอร์โทร</label><input value={r.tenantPhone} onChange={e=>setR({...r,tenantPhone:e.target.value})}/></div>
          <div className={styles.fg}><label>LINE User ID</label><input value={r.tenantLineId} onChange={e=>setR({...r,tenantLineId:e.target.value})}/></div></div>
          <div className={styles.fg}><label>หมายเหตุ</label><input value={r.note} onChange={e=>setR({...r,note:e.target.value})}/></div>
        </div>
        <div className={styles.modalFoot}><button className={styles.cancelBtn} onClick={onClose}>ยกเลิก</button><button className={styles.btn} onClick={()=>{if(!r.number)return alert('กรุณาระบุหมายเลขห้อง');onSave(r);}}>💾 บันทึก</button></div>
      </div>
    </div>
  );
}

// ─── Utility Modal ─────────────────────────────────────────────
function UtilModal({roomId,month,rooms,utils,onClose,onSave}:{roomId:string;month:string;rooms:Room[];utils:UtilityRecord[];onClose:()=>void;onSave:(r:UtilityRecord)=>void;}) {
  const [elec,setElec] = useState(0);
  const [water,setWater] = useState(0);
  const [note,setNote] = useState('');
  const room = rooms.find(r=>r.id===roomId);
  const prev = utils.filter(u=>u.roomId===roomId&&u.month<month).sort((a,b)=>b.month.localeCompare(a.month))[0];
  return (
    <div className={styles.modalBg} onClick={onClose}>
      <div className={styles.modal} onClick={e=>e.stopPropagation()}>
        <div className={styles.modalHead}><h3>⚡ บันทึกหน่วย — ห้อง {room?.number}</h3><button onClick={onClose}>✕</button></div>
        <div className={styles.modalBody}>
          <p className={styles.muted}>เดือน: {month}</p>
          {prev && <p className={styles.muted}>เดือนก่อนหน้า — ไฟ: {prev.elecReading}, น้ำ: {prev.waterReading}</p>}
          <div className={styles.formRow}><div className={styles.fg}><label>หน่วยไฟ (อ่าน)</label><input type="number" value={elec} onChange={e=>setElec(+e.target.value)}/></div>
          <div className={styles.fg}><label>หน่วยน้ำ (อ่าน)</label><input type="number" value={water} onChange={e=>setWater(+e.target.value)}/></div></div>
          {prev && <div className={styles.formRow}><div className={styles.fg}><label>ไฟใช้จริง</label><input disabled value={Math.max(0,elec-prev.elecReading)}/></div>
          <div className={styles.fg}><label>น้ำใช้จริง</label><input disabled value={Math.max(0,water-prev.waterReading)}/></div></div>}
          <div className={styles.fg}><label>หมายเหตุ</label><input value={note} onChange={e=>setNote(e.target.value)}/></div>
        </div>
        <div className={styles.modalFoot}><button className={styles.cancelBtn} onClick={onClose}>ยกเลิก</button><button className={styles.btn} onClick={()=>{onSave({id:'',roomId,month,elecReading:elec,waterReading:water,prevElecReading:prev?.elecReading||0,prevWaterReading:prev?.waterReading||0,elecUsed:prev?Math.max(0,elec-prev.elecReading):elec,waterUsed:prev?Math.max(0,water-prev.waterReading):water,note,createdAt:''});}}>💾 บันทึก</button></div>
      </div>
    </div>
  );
}

// ─── Toasts ────────────────────────────────────────────────────
function Toasts({toasts,remove}:{toasts:Toast[];remove:(id:string)=>void;}) {
  return (
    <div className={styles.toastBox}>
      {toasts.map(t=>(
        <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
          <span>{t.type==='success'?'✅':t.type==='error'?'❌':t.type==='warning'?'⚠️':'ℹ️'}</span>
          <span>{t.message}</span>
          <button onClick={()=>remove(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}
