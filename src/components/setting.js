import styles from '../styles/Home.module.css';

export default function Setting({ settings, setSettings, saveSettingsDelayed, uploadLogo, removeLogo, sendLineMsg, exportData, importData, setToast }) {
  return (
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
        <h3>💰 อัตราค่าใช้จ่าย</h3>
        <div className={styles.settingsGrid}>
          <div className={styles.formGroup}><label>ค่าไฟต่อหน่วย (บาท)</label><input type="number" value={settings.rateElec} onChange={e => saveSettingsDelayed('rateElec', parseFloat(e.target.value) || 0)} /></div>
          <div className={styles.formGroup}><label>ค่าน้ำต่อหน่วย (บาท)</label><input type="number" value={settings.rateWater} onChange={e => saveSettingsDelayed('rateWater', parseFloat(e.target.value) || 0)} /></div>
          <div className={styles.formGroup}><label>ค่าส่วนกลาง/เดือน (บาท)</label><input type="number" value={settings.commonFee || 0} onChange={e => saveSettingsDelayed('commonFee', parseFloat(e.target.value) || 0)} /></div>
          <div className={styles.formGroup}><label>ค่าอินเตอร์เน็ต/เดือน (บาท)</label><input type="number" value={settings.internetFee || 0} onChange={e => saveSettingsDelayed('internetFee', parseFloat(e.target.value) || 0)} /></div>
        </div>
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
          if (!uid || !uid.startsWith('U')) { setToast('User ID ไม่ถูกต้อง', true); return; }
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
  );
}
