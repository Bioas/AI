import styles from '../styles/Home.module.css';

const THAI_MONTHS = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

function formatMonth(ym) {
  const [y, m] = ym.split('-');
  return THAI_MONTHS[parseInt(m)] + ' ' + (parseInt(y) + 543);
}

export default function Invoice({ rooms, meters, settings, invMonth, setInvMonth, calcInv, downloadPdf, sendInvLine, formatMonth }) {
  return (
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
                rooms.filter(r => r.tenantName).map((r, i) => {
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
                        <button className={styles.btnView} onClick={() => { /* view handled in parent */ }}>👁️ ดู</button>
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
  );
}
