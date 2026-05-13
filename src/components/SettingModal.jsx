import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from './Modal'
import Button from './ui/button'
import Input from './ui/input'
import Card, { CardContent } from './ui/card'

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
      await fetchAll()
      toast('บันทึกข้อมูลหอพักเรียบร้อย')
      onClose()
    } catch (e) {
      toast(`บันทึกไม่สำเร็จ: ${e.message}`, true)
    }
    setSaving(false)
  }

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-zinc-900 mb-6">🏢 แก้ไขข้อมูลหอพัก</h3>
        <div className="space-y-4">
          <Input label="ชื่อหอพัก" value={dormName} onChange={e => setDormName(e.target.value)} placeholder="ชื่อหอพัก" />
          <Input label="เบอร์โทรศัพท์" value={phone} onChange={e => setPhone(e.target.value)} placeholder="081-234-5678" />
          <Input label="ที่อยู่" value={address} onChange={e => setAddress(e.target.value)} placeholder="123 ถนนสุขุมวิท กรุงเทพฯ" />
        </div>
        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-zinc-100">
          <Button variant="ghost" onClick={onClose} disabled={saving}>ยกเลิก</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
        </div>
      </div>
    </Modal>
  )
}

export function LogoModal({ onClose }) {
  const { settings, uploadLogo, removeLogo, toast } = useApp()

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-zinc-900 mb-6">🖼️ จัดการโลโก้</h3>
        <div className="flex flex-col items-center gap-4 p-6 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
          {settings.logo ? (
            <img src={settings.logo} alt="Logo" className="w-24 h-24 object-contain rounded-xl border border-zinc-200" />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-zinc-200 flex items-center justify-center text-3xl">🏠</div>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={() => document.getElementById('modalLogoInput')?.click()}>อัปโหลดรูป</Button>
            <Button variant="danger" size="sm" onClick={() => { removeLogo(); onClose() }}>ลบโลโก้</Button>
          </div>
          <input type="file" id="modalLogoInput" accept="image/*" style={{ display: 'none' }}
            onChange={e => { uploadLogo(e); onClose() }} />
          <p className="text-xs text-zinc-400">รองรับ PNG, JPG ขนาดไม่เกิน 2MB</p>
        </div>
        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-zinc-100">
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
      await api('/api/settings', 'POST', {
        ...settings,
        rateElec: parseFloat(rateElec) || 7,
        rateWater: parseFloat(rateWater) || 20,
        commonFee: parseFloat(commonFee) || 0,
        internetFee: parseFloat(internetFee) || 0,
      })
      await fetchAll()
      toast('บันทึกอัตราค่าใช้จ่ายเรียบร้อย')
      onClose()
    } catch (e) {
      toast(`บันทึกไม่สำเร็จ: ${e.message}`, true)
    }
    setSaving(false)
  }

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-zinc-900 mb-6">💰 แก้ไขอัตราค่าใช้จ่าย</h3>
        <div className="space-y-4">
          <Input label="ค่าไฟ (บาท/หน่วย)" type="number" value={rateElec} onChange={e => setRateElec(e.target.value)} />
          <Input label="ค่าน้ำ (บาท/หน่วย)" type="number" value={rateWater} onChange={e => setRateWater(e.target.value)} />
          <Input label="ค่าส่วนกลาง (บาท/เดือน)" type="number" value={commonFee} onChange={e => setCommonFee(e.target.value)} />
          <Input label="ค่าอินเทอร์เน็ต (บาท/เดือน)" type="number" value={internetFee} onChange={e => setInternetFee(e.target.value)} />
        </div>
        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-zinc-100">
          <Button variant="ghost" onClick={onClose} disabled={saving}>ยกเลิก</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
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
      await fetchAll()
      toast('บันทึก LINE Token เรียบร้อย')
      onClose()
    } catch (e) {
      toast(`บันทึกไม่สำเร็จ: ${e.message}`, true)
    }
    setSaving(false)
  }

  return (
    <Modal onClose={onClose} maxWidth="max-w-md">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-zinc-900 mb-1">📱 ตั้งค่า LINE Messaging</h3>
        <p className="text-xs text-zinc-500 mb-5">ส่งใบแจ้งหนี้ให้ผู้พักผ่าน LINE</p>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 text-xs text-blue-800 leading-relaxed">
          <strong>วิธีตั้งค่า:</strong> ไปที่ LINE Developers Console → สร้าง Channel → เปิด Messaging API → คัดลอก Channel Access Token → วางด้านล่าง
        </div>

        <Input
          label="Channel Access Token"
          type="text"
          placeholder="วาง Token ที่นี่..."
          value={token}
          onChange={e => setToken(e.target.value)}
        />

        <div className="mt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              const uid = prompt('กรอก LINE User ID (ขึ้นต้นด้วย U):')
              if (!uid || !uid.startsWith('U')) { toast('User ID ไม่ถูกต้อง', true); return }
              await sendLineMsg(uid, `🧪 ข้อความทดสอบ\nเวลา: ${new Date().toLocaleString('th-TH')}\n✅ ระบบพร้อมใช้งาน!`)
            }}
          >
            🧪 ทดสอบส่งข้อความ
          </Button>
        </div>

        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-zinc-100">
          <Button variant="ghost" onClick={onClose} disabled={saving}>ยกเลิก</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
        </div>
      </div>
    </Modal>
  )
}
