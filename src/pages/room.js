import { useState } from 'react';
import styles from '../styles/Home.module.css';

export default function Room({ rooms, editRoom, modal, setModal, setEditRoom, saveRoom, deleteRoom, setToast }) {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h2>🚪 จัดการห้อง</h2>
        <button className={styles.btnPrimary} onClick={() => { setEditRoom(null); setModal('room'); }}>➕ เพิ่มห้อง</button>
      </div>
      <div className={styles.card}>
        <div className={styles.tableWrap}>
          <table>
            <thead><tr><th>ห้อง</th><th>ค่าเช่า/เดือน</th><th>ชื่อผู้พัก</th><th>เบอร์โทร</th><th>LINE User ID</th><th>จัดการ</th></tr></thead>
            <tbody>
              {rooms.length === 0 ? <tr><td colSpan={6}><div className={styles.emptyState}><div className={styles.emptyIcon}>🚪</div><p>ยังไม่มีห้อง</p></div></td></tr> :
                rooms.map((r, i) => (
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
  );
}
