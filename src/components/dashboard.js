import styles from '../styles/Home.module.css';

const THAI_MONTHS = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

function formatMonth(ym) {
  const [y, m] = ym.split('-');
  return THAI_MONTHS[parseInt(m)] + ' ' + (parseInt(y) + 543);
}

export default function Dashboard({ rooms, meters, calcInv, formatMonth }) {
  const now = new Date();
  const cm = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  const occ = rooms.filter(r => r.tenantName);
  let pending = 0;
  let revenue = 0;
  
  occ.forEach(r => {
    const hasMeter = meters.some(x => x.roomId === r.id && x.month === cm);
    if (!hasMeter) pending++; else { const inv = calcInv(r, cm); revenue += inv.total; }
  });

  const recentData = occ.map(r => {
    let la = null;
    for (let y = now.getFullYear(); y >= now.getFullYear() - 1; y--) {
      for (let m = 11; m >= 0; m--) {
        const ym = y + '-' + String(m + 1).padStart(2, '0');
        if (meters.some(x => x.roomId === r.id && x.month === ym)) { la = ym; break; }
      }
      if (la) break;
    }
    return la ? { room: r, month: la, inv: calcInv(r, la) } : null;
  }).filter(Boolean).sort((a, b) => b.month.localeCompare(a.month)).slice(0, 10);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h2>📊 แดชบอร์ด</h2>
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
                recentData.map((d, i) => (
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
  );
}
