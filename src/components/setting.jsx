import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import Input from './ui/input'
import Button from './ui/button'

export default function Setting() {
  const { settings, saveSettingsDelayed, uploadLogo, removeLogo, sendLineMsg, exportData, importData, toast } = useApp()

  const sections = [
    {
      title: '🏢 Dormitory Info',
      fields: [
        { key: 'dormName', label: 'Dorm Name', type: 'text', placeholder: 'Dorm name' },
        { key: 'phone', label: 'Phone', type: 'text', placeholder: '081-234-5678' },
        { key: 'address', label: 'Address', type: 'text', placeholder: '123 Main St, Bangkok', fullWidth: true },
      ],
    },
    {
      title: '💰 Rates',
      fields: [
        { key: 'rateElec', label: 'Electricity (THB/unit)', type: 'number' },
        { key: 'rateWater', label: 'Water (THB/unit)', type: 'number' },
        { key: 'commonFee', label: 'Common Fee (THB/mo)', type: 'number' },
        { key: 'internetFee', label: 'Internet (THB/mo)', type: 'number' },
      ],
    },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader title="Settings" description="Configure your dormitory system" />

      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-zinc-900 mb-5">🏢 Dormitory Info</h3>
            <div className="flex flex-col sm:flex-row items-start gap-5 mb-6 p-4 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
              <div className="w-16 h-16 shrink-0">
                {settings.logo ? (
                  <img src={settings.logo} alt="Logo" className="w-16 h-16 object-contain rounded-lg border border-zinc-200" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-zinc-200 flex items-center justify-center text-2xl">🏠</div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900 mb-2">Logo</p>
                <div className="flex gap-2">
                  <button onClick={() => document.getElementById('logoInput')?.click()}
                    className="h-9 px-4 rounded-xl text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-sm">Upload</button>
                  <button onClick={removeLogo}
                    className="h-9 px-4 rounded-xl text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors">Remove</button>
                </div>
                <input type="file" id="logoInput" accept="image/*" style={{ display: 'none' }} onChange={uploadLogo} />
                <p className="text-xs text-zinc-400 mt-1.5">PNG, JPG max 2MB</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Dorm Name" value={settings.dormName} onChange={e => saveSettingsDelayed('dormName', e.target.value)} placeholder="Dorm name" />
              <Input label="Phone" value={settings.phone} onChange={e => saveSettingsDelayed('phone', e.target.value)} placeholder="081-234-5678" />
            </div>
            <div className="mt-4">
              <Input label="Address" value={settings.address} onChange={e => saveSettingsDelayed('address', e.target.value)} placeholder="123 Main St, Bangkok" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-zinc-900 mb-5">💰 Rates</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['rateElec', 'rateWater', 'commonFee', 'internetFee'].map(key => (
                <Input
                  key={key}
                  label={{
                    rateElec: 'Electricity (THB/unit)',
                    rateWater: 'Water (THB/unit)',
                    commonFee: 'Common Fee (THB/mo)',
                    internetFee: 'Internet (THB/mo)',
                  }[key]}
                  type="number"
                  value={settings[key] || 0}
                  onChange={e => saveSettingsDelayed(key, parseFloat(e.target.value) || 0)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-zinc-900 mb-1">📱 LINE Messaging</h3>
            <p className="text-xs text-zinc-400 mb-5">Send invoices directly to tenants via LINE</p>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 text-xs text-blue-800 leading-relaxed">
              <strong>Setup:</strong> Create a channel at LINE Developers Console → enable Messaging API → copy Channel Access Token → paste below.
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className={`w-2 h-2 rounded-full ${settings.channelToken ? 'bg-emerald-500' : 'bg-red-400'}`} />
              <span className="text-xs text-zinc-500">{settings.channelToken ? 'Token configured' : 'No token set'}</span>
            </div>

            <Input
              label="Channel Access Token"
              type="text"
              placeholder="Paste your LINE token here..."
              value={settings.channelToken || ''}
              onChange={e => saveSettingsDelayed('channelToken', e.target.value)}
            />

            <div className="mt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  const uid = prompt('Enter LINE User ID (starts with U):')
                  if (!uid || !uid.startsWith('U')) { toast('Invalid User ID', true); return }
                  await sendLineMsg(uid, `🧪 Test message\nTime: ${new Date().toLocaleString('th-TH')}\n✅ System ready!`)
                }}
              >
                🧪 Test Message
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-zinc-900 mb-1">🗂️ Backup & Restore</h3>
            <p className="text-xs text-zinc-400 mb-5">Export your data for backup or import to another instance</p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={exportData}>📤 Export</Button>
              <Button size="sm" onClick={() => document.getElementById('importFile')?.click()}>📥 Import</Button>
              <input type="file" id="importFile" accept=".json" style={{ display: 'none' }} onChange={importData} />
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
