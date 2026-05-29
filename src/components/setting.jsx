import { motion } from 'framer-motion'
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import InfoRow from './ui/info-row'
import Button from './ui/button'
import { DormInfoModal, LogoModal, RatesModal, LineModal, QrModal, SignatureModal, StampModal } from './SettingModal'

export default function Setting() {
  const { settings, exportData, importData, fetchAll } = useApp()
  const [activeSection, setActiveSection] = useState(null)

  const handleReload = async () => {
    await fetchAll()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader title="ตั้งค่าระบบ" description="จัดการข้อมูลหอพัก อัตราค่าใช้จ่าย และการเชื่อมต่อ LINE" />

      <div className="space-y-6">
        <Card><CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-lime-400 to-lime-500" />
              <h3 className="text-sm font-semibold text-neutral-800">ข้อมูลหอพัก</h3>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setActiveSection('dorm')}>แก้ไข</Button>
          </div>
          <dl className="divide-y divide-neutral-50">
            <InfoRow label="ชื่อหอพัก" value={settings.dormName || '—'} />
            <InfoRow label="เบอร์โทรศัพท์" value={settings.phone || '—'} />
            <InfoRow label="เลขประจำตัวผู้เสียภาษี" value={settings.taxId || '—'} />
            <InfoRow label="ที่อยู่" value={settings.address || '—'} />
          </dl>
        </CardContent></Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card onClick={() => setActiveSection('logo')}><CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-sky-400 to-sky-500" />
                <h3 className="text-sm font-semibold text-neutral-800">โลโก้หอพัก</h3>
              </div>
              <span className="hidden sm:inline"><Button size="sm" variant="secondary">จัดการ</Button></span>
            </div>
            <div className="flex items-center gap-4">
              {settings.logo ? (
                <img src={settings.logo} alt="โลโก้" className="w-16 h-16 object-contain rounded-xl border border-neutral-200 shadow-sm" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-lime-100 to-lime-50 flex items-center justify-center text-2xl"><svg className="w-3.5 h-3.5 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
              )}
              <div className="text-xs text-neutral-500">{settings.logo ? 'มีโลโก้' : 'ยังไม่มีโลโก้'}</div>
            </div>
          </CardContent></Card>

          <Card onClick={() => setActiveSection('qr')}><CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-violet-400 to-violet-500" />
                <h3 className="text-sm font-semibold text-neutral-800">QR Code ชำระเงิน</h3>
              </div>
              <span className="hidden sm:inline"><Button size="sm" variant="secondary">จัดการ</Button></span>
            </div>
            <div className="flex items-center gap-4">
              {settings.qrCode ? (
                <img src={settings.qrCode} alt="QR Code" className="w-16 h-16 object-contain rounded-xl border border-neutral-200 shadow-sm" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-lime-100 to-lime-50 flex items-center justify-center text-2xl border border-dashed border-lime-200"><svg className="w-4 h-4 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg></div>
              )}
              <div className="text-xs text-neutral-500">{settings.qrCode ? 'มี QR Code' : 'ยังไม่มี QR Code'}</div>
            </div>
          </CardContent></Card>

          <Card onClick={() => setActiveSection('signature')}><CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-amber-400 to-amber-500" />
                <h3 className="text-sm font-semibold text-neutral-800">ลายเซ็น</h3>
              </div>
              <span className="hidden sm:inline"><Button size="sm" variant="secondary">จัดการ</Button></span>
            </div>
            <div className="flex items-center gap-4">
              {settings.signature ? (
                <img src={settings.signature} alt="ลายเซ็น" className="w-16 h-8 object-contain rounded-lg border border-neutral-200 shadow-sm" />
              ) : (
                <div className="w-16 h-8 rounded-lg bg-gradient-to-br from-lime-100 to-lime-50 flex items-center justify-center text-lg border border-dashed border-lime-200"><svg className="w-4 h-4 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div>
              )}
              <div className="text-xs text-neutral-500">{settings.signature ? 'มีลายเซ็น' : 'ยังไม่มีลายเซ็น'}</div>
            </div>
          </CardContent></Card>

          <Card onClick={() => setActiveSection('stamp')}><CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-rose-400 to-rose-500" />
                <h3 className="text-sm font-semibold text-neutral-800">ตรายาง</h3>
              </div>
              <span className="hidden sm:inline"><Button size="sm" variant="secondary">จัดการ</Button></span>
            </div>
            <div className="flex items-center gap-4">
              {settings.stamp ? (
                <img src={settings.stamp} alt="ตรายาง" className="w-16 h-16 object-contain rounded-xl border border-neutral-200 shadow-sm" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-lime-100 to-lime-50 flex items-center justify-center text-2xl border border-dashed border-lime-200"><svg className="w-4 h-4 inline" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="6"/></svg></div>
              )}
              <div className="text-xs text-neutral-500">{settings.stamp ? 'มีตรายาง' : 'ยังไม่มีตรายาง'}</div>
            </div>
          </CardContent></Card>
        </div>

        <Card><CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-500" />
              <h3 className="text-sm font-semibold text-neutral-800">อัตราค่าใช้จ่าย</h3>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setActiveSection('rates')}>แก้ไข</Button>
          </div>
          <dl className="divide-y divide-neutral-50">
            <InfoRow label="ค่าไฟ" value={`${settings.rateElec || 7} บาท/หน่วย`} />
            <InfoRow label="ค่าน้ำ" value={`${settings.rateWater || 20} บาท/หน่วย`} />
            <InfoRow label="ค่าส่วนกลาง" value={`${settings.commonFee || 0} บาท/เดือน`} />
            <InfoRow label="ค่าอินเทอร์เน็ต" value={`${settings.internetFee || 0} บาท/เดือน`} />
            <InfoRow label="ค่าเตียงเสริม" value={`${settings.extraBedRate || 200} บาท/เตียง`} />
          </dl>
        </CardContent></Card>

        <Card><CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-teal-400 to-teal-500" />
                <h3 className="text-sm font-semibold text-neutral-800">LINE Messaging</h3>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">ส่งใบแจ้งหนี้ผ่าน LINE ให้ผู้พัก</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setActiveSection('line')}>ตั้งค่า</Button>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${settings.channelToken ? 'bg-emerald-500' : 'bg-rose-400'}`} />
            <span className="text-xs text-neutral-500">{settings.channelToken ? 'เชื่อมต่อ LINE แล้ว' : 'ยังไม่ได้ตั้งค่า LINE Token'}</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-2 h-2 rounded-full ${settings.channelSecret ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            <span className="text-xs text-neutral-500">{settings.channelSecret ? 'ตั้งค่า Webhook แล้ว' : 'ยังไม่ได้ตั้งค่า Webhook Secret'}</span>
          </div>
        </CardContent></Card>

        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-4 rounded-full bg-gradient-to-b from-indigo-400 to-indigo-500" />
            <h3 className="text-sm font-semibold text-neutral-800">สำรองและกู้คืนข้อมูล</h3>
          </div>
          <p className="text-xs text-neutral-400 mb-5">ส่งออกข้อมูลเพื่อสำรอง หรือนำเข้าจากไฟล์สำรอง</p>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={exportData}><svg className="w-4 h-4 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> ส่งออกข้อมูล</Button>
            <Button size="sm" onClick={() => document.getElementById('importFile')?.click()}><svg className="w-4 h-4 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> นำเข้าข้อมูล</Button>
            <input type="file" id="importFile" accept=".json" style={{ display: 'none' }} onChange={importData} />
          </div>
        </CardContent></Card>
      </div>

      {activeSection === 'dorm' && <DormInfoModal onClose={() => setActiveSection(null)} />}
      {activeSection === 'logo' && <LogoModal onClose={() => setActiveSection(null)} />}
      {activeSection === 'rates' && <RatesModal onClose={() => setActiveSection(null)} />}
      {activeSection === 'line' && <LineModal onClose={() => setActiveSection(null)} />}
      {activeSection === 'qr' && <QrModal onClose={() => setActiveSection(null)} />}
      {activeSection === 'signature' && <SignatureModal onClose={() => setActiveSection(null)} />}
      {activeSection === 'stamp' && <StampModal onClose={() => setActiveSection(null)} />}
    </motion.div>
  )
}
