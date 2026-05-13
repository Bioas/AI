import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from './ui/modal'
import Button from './ui/button'
import Input from './ui/input'

function SettingFrame({ title, subtitle, icon, onClose, children, onSave, saving }) {
  return (
    <Modal open={true} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 text-base shadow-sm">{icon}</div>
          <div>
            <h3 className="text-base font-semibold text-neutral-800">{title}</h3>
            {subtitle && <p className="text-xs text-neutral-400">{subtitle}</p>}
          </div>
        </div>
        <div className="space-y-4">{children}</div>
        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-neutral-100">
          <Button variant="ghost" onClick={onClose} disabled={saving}>ยกเลิก</Button>
          <Button onClick={onSave} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
        </div>
      </div>
    </Modal>
  )
}

export function DormInfoModal({ onClose }) {
  const { settings, fetchAll, toast } = useApp()
  const [dormName, setDormName] = useState(settings.dormName || '')
  const [phone, setPhone] = useState(settings.phone || '')
  const [address, setAddress] = useState(settings.address || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const { api } = await import('../lib/api')
      await api('/api/settings', 'POST', { ...settings, dormName, phone, address })
      await fetchAll(); toast('บันทึกข้อมูลหอพักเรียบร้อย'); onClose()
    } catch (e) { toast(`บันทึกไม่สำเร็จ: ${e.message}`, true) }
    setSaving(false)
  }

  return (
    <SettingFrame title="แก้ไขข้อมูลหอพัก" subtitle="แก้ไขชื่อหอพัก เบอร์โทร และที่อยู่" icon="🏢" onClose={onClose} onSave={handleSave} saving={saving}>
      <Input label="ชื่อหอพัก" value={dormName} onChange={e => setDormName(e.target.value)} placeholder="ชื่อหอพัก" />
      <Input label="เบอร์โทรศัพท์" value={phone} onChange={e => setPhone(e.target.value)} placeholder="081-234-5678" />
      <Input label="ที่อยู่" value={address} onChange={e => setAddress(e.target.value)} placeholder="123 ถนนสุขุมวิท กรุงเทพฯ" />
    </SettingFrame>
  )
}

export function LogoModal({ onClose }) {
  const { settings, uploadLogo, removeLogo } = useApp()

  return (
    <Modal open={true} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 text-base shadow-sm">🖼️</div>
          <div>
            <h3 className="text-base font-semibold text-neutral-800">จัดการโลโก้</h3>
            <p className="text-xs text-neutral-400">อัปโหลดหรือลบโลโก้หอพัก</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-4 p-6 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
          {settings.logo ? (
            <img src={settings.logo} alt="โลโก้" className="w-24 h-24 object-contain rounded-xl border border-neutral-200 shadow-sm" />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-lime-100 to-lime-50 flex items-center justify-center text-3xl">🏠</div>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={() => document.getElementById('modalLogoInput')?.click()}>อัปโหลดรูป</Button>
            <Button variant="danger" size="sm" onClick={() => { removeLogo(); onClose() }}>ลบโลโก้</Button>
          </div>
          <input type="file" id="modalLogoInput" accept="image/*" style={{ display: 'none' }} onChange={e => { uploadLogo(e); onClose() }} />
          <p className="text-xs text-neutral-400">รองรับ PNG, JPG ขนาดไม่เกิน 2MB</p>
        </div>
        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-neutral-100">
          <Button variant="ghost" onClick={onClose}>ปิด</Button>
        </div>
      </div>
    </Modal>
  )
}

export function RatesModal({ onClose }) {
  const { settings, fetchAll, toast } = useApp()
  const [rateElec, setRateElec] = useState(settings.rateElec?.toString() || '7')
  const [rateWater, setRateWater] = useState(settings.rateWater?.toString() || '20')
  const [commonFee, setCommonFee] = useState(settings.commonFee?.toString() || '0')
  const [internetFee, setInternetFee] = useState(settings.internetFee?.toString() || '0')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const { api } = await import('../lib/api')
      await api('/api/settings', 'POST', { ...settings, rateElec: parseFloat(rateElec) || 7, rateWater: parseFloat(rateWater) || 20, commonFee: parseFloat(commonFee) || 0, internetFee: parseFloat(internetFee) || 0 })
      await fetchAll(); toast('บันทึกอัตราค่าใช้จ่ายเรียบร้อย'); onClose()
    } catch (e) { toast(`บันทึกไม่สำเร็จ: ${e.message}`, true) }
    setSaving(false)
  }

  return (
    <SettingFrame title="แก้ไขอัตราค่าใช้จ่าย" subtitle="แก้ไขอัตราค่าไฟ ค่าน้ำ ค่าส่วนกลาง และค่าอินเทอร์เน็ต" icon="💰" onClose={onClose} onSave={handleSave} saving={saving}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="ค่าไฟ (บาท/หน่วย)" type="number" value={rateElec} onChange={e => setRateElec(e.target.value)} />
        <Input label="ค่าน้ำ (บาท/หน่วย)" type="number" value={rateWater} onChange={e => setRateWater(e.target.value)} />
        <Input label="ค่าส่วนกลาง (บาท/เดือน)" type="number" value={commonFee} onChange={e => setCommonFee(e.target.value)} />
        <Input label="ค่าอินเทอร์เน็ต (บาท/เดือน)" type="number" value={internetFee} onChange={e => setInternetFee(e.target.value)} />
      </div>
    </SettingFrame>
  )
}

export function QrModal({ onClose }) {
  const { settings, uploadQr, removeQr } = useApp()

  return (
    <Modal open={true} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 text-base shadow-sm">📱</div>
          <div>
            <h3 className="text-base font-semibold text-neutral-800">จัดการ QR Code</h3>
            <p className="text-xs text-neutral-400">อัปโหลด QR Code สำหรับชำระเงิน</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-4 p-6 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
          {settings.qrCode ? (
            <img src={settings.qrCode} alt="QR Code" className="w-32 h-32 object-contain rounded-xl border border-neutral-200 shadow-sm" />
          ) : (
            <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-lime-100 to-lime-50 flex items-center justify-center text-3xl border border-dashed border-lime-200">📱</div>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={() => document.getElementById('modalQrInput')?.click()}>อัปโหลด QR Code</Button>
            <Button variant="danger" size="sm" onClick={() => { removeQr(); onClose() }}>ลบ QR Code</Button>
          </div>
          <input type="file" id="modalQrInput" accept="image/*" style={{ display: 'none' }} onChange={e => { uploadQr(e); onClose() }} />
          <p className="text-xs text-neutral-400">รองรับ PNG, JPG ขนาดไม่เกิน 2MB</p>
        </div>
        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-neutral-100">
          <Button variant="ghost" onClick={onClose}>ปิด</Button>
        </div>
      </div>
    </Modal>
  )
}

export function LineModal({ onClose }) {
  const { settings, fetchAll, toast, sendLineMsg } = useApp()
  const [token, setToken] = useState(settings.channelToken || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const { api } = await import('../lib/api')
      await api('/api/settings', 'POST', { ...settings, channelToken: token })
      await fetchAll(); toast('บันทึก LINE Token เรียบร้อย'); onClose()
    } catch (e) { toast(`บันทึกไม่สำเร็จ: ${e.message}`, true) }
    setSaving(false)
  }

  return (
    <Modal open={true} onClose={onClose} maxWidth="max-w-md">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 text-base shadow-sm">📱</div>
          <div>
            <h3 className="text-base font-semibold text-neutral-800">ตั้งค่า LINE Messaging</h3>
            <p className="text-xs text-neutral-400">ส่งใบแจ้งหนี้ให้ผู้พักผ่าน LINE</p>
          </div>
        </div>
        <div className="bg-lime-50 border border-lime-200 rounded-xl p-4 mb-5 text-xs text-lime-800 leading-relaxed">
          <strong>วิธีตั้งค่า:</strong> ไปที่ LINE Developers Console → สร้าง Channel → เปิด Messaging API → คัดลอก Channel Access Token → วางด้านล่าง
        </div>
        <Input label="Channel Access Token" type="text" placeholder="วาง Token ที่นี่..." value={token} onChange={e => setToken(e.target.value)} />
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={async () => {
            const uid = prompt('กรอก LINE User ID (ขึ้นต้นด้วย U):')
            if (!uid || !uid.startsWith('U')) { toast('User ID ไม่ถูกต้อง', true); return }
            await sendLineMsg(uid, `🧪 ข้อความทดสอบ\nเวลา: ${new Date().toLocaleString('th-TH')}\n✅ ระบบพร้อมใช้งาน!`)
          }}>🧪 ทดสอบส่งข้อความ</Button>
        </div>
        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-neutral-100">
          <Button variant="ghost" onClick={onClose} disabled={saving}>ยกเลิก</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
        </div>
      </div>
    </Modal>
  )
}
