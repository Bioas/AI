import { useEffect } from 'react';
import styles from '../styles/Home.module.css';

const THAI_MONTHS = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

function formatMonth(ym) {
  const [y, m] = ym.split('-');
  return THAI_MONTHS[parseInt(m)] + ' ' + (parseInt(y) + 543);
}

export default function Meters({ rooms, meters, settings, meterMonth, setMeterMonth, meterLocal, setMeterLocal, setMeterField, saveAllMeters, saveSettingsDelayed, formatMonth, initMeterLocal, setToast }) {
  useEffect(() => { initMeterLocal(); }, [initMeterLocal]);

  const occRooms = rooms.filter(r => r.tenantName);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h2>⚡ บันทึกหน่วย ค่าไฟ/น้ำ</h2>
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
                occRooms.map((r, i) => {
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
}
