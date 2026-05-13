import { motion } from 'framer-motion'
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import InfoRow from './ui/info-row'
import Button from './ui/button'
import { DormInfoModal, LogoModal, RatesModal, LineModal } from './SettingModal'

export default function Setting() {
  const { settings, exportData, importData } = useApp()
  const [activeSection, setActiveSection] = useState(null)

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader title="ตั้งค่าระบบ" description="จัดการข้อมูลหอพัก อัตราค่าใช้จ่าย และการเชื่อมต่อ LINE" />

      <div className="space-y-5">
        <Card><CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-800">🏢 ข้อมูลหอพัก</h3>
            <Button size="sm" variant="secondary" onClick={() => setActiveSection('dorm')}>แก้ไข</Button>
          </div>
          <dl className="divide-y divide-neutral-50">
            <InfoRow label="ชื่อหอพัก" value={settings.dormName || '—'} />
            <InfoRow label="เบอร์โทรศัพท์" value={settings.phone || '—'} />
            <InfoRow label="ที่อยู่" value={settings.address || '—'} />
          </dl>
        </CardContent></Card>

        <Card><CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-800">🖼️ โลโก้หอพัก</h3>
            <Button size="sm" variant="secondary" onClick={() => setActiveSection('logo')}>จัดการ</Button>
          </div>
          <div className="flex items-center gap-4">
            {settings.logo ? (
              <img src={settings.logo} alt="โลโก้" className="w-16 h-16 object-contain rounded-xl border border-neutral-200 shadow-sm" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-lime-100 to-lime-50 flex items-center justify-center text-2xl">🏠</div>
            )}
            <div className="text-xs text-neutral-500">{settings.logo ? 'มีโลโก้' : 'ยังไม่มีโลโก้'}</div>
          </div>
        </CardContent></Card>

        <Card><CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-800">💰 อัตราค่าใช้จ่าย</h3>
            <Button size="sm" variant="secondary" onClick={() => setActiveSection('rates')}>แก้ไข</Button>
          </div>
          <dl className="divide-y divide-neutral-50">
            <InfoRow label="ค่าไฟ" value={`${settings.rateElec || 7} บาท/หน่วย`} />
            <InfoRow label="ค่าน้ำ" value={`${settings.rateWater || 20} บาท/หน่วย`} />
            <InfoRow label="ค่าส่วนกลาง" value={`${settings.commonFee || 0} บาท/เดือน`} />
            <InfoRow label="ค่าอินเทอร์เน็ต" value={`${settings.internetFee || 0} บาท/เดือน`} />
          </dl>
        </CardContent></Card>

        <Card><CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-800">📱 LINE Messaging</h3>
              <p className="text-xs text-neutral-400 mt-0.5">ส่งใบแจ้งหนี้ผ่าน LINE ให้ผู้พัก</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setActiveSection('line')}>ตั้งค่า</Button>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${settings.channelToken ? 'bg-emerald-500' : 'bg-rose-400'}`} />
            <span className="text-xs text-neutral-500">{settings.channelToken ? 'เชื่อมต่อ LINE แล้ว' : 'ยังไม่ได้ตั้งค่า LINE Token'}</span>
          </div>
        </CardContent></Card>

        <Card><CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-neutral-800 mb-1">🗂️ สำรองและกู้คืนข้อมูล</h3>
          <p className="text-xs text-neutral-400 mb-5">ส่งออกข้อมูลเพื่อสำรอง หรือนำเข้าจากไฟล์สำรอง</p>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={exportData}>📤 ส่งออกข้อมูล</Button>
            <Button size="sm" onClick={() => document.getElementById('importFile')?.click()}>📥 นำเข้าข้อมูล</Button>
            <input type="file" id="importFile" accept=".json" style={{ display: 'none' }} onChange={importData} />
          </div>
        </CardContent></Card>
      </div>

      {activeSection === 'dorm' && <DormInfoModal onClose={() => setActiveSection(null)} />}
      {activeSection === 'logo' && <LogoModal onClose={() => setActiveSection(null)} />}
      {activeSection === 'rates' && <RatesModal onClose={() => setActiveSection(null)} />}
      {activeSection === 'line' && <LineModal onClose={() => setActiveSection(null)} />}
    </motion.div>
  )
}
