import { useApp } from '../context/AppContext'
import { formatMonth } from '../lib/constants'

const invId = () => Math.random().toString(36).substring(2, 8).toUpperCase()

export default function InvoicePreview({ inv }) {
  const { settings } = useApp()
  const cf = settings.commonFee || 0
  const inf = settings.internetFee || 0
  const items = [
    { desc: 'ค่าเช่าห้อง', amount: inv.rent },
    { desc: 'ค่าไฟฟ้า', amount: inv.elecCost },
    { desc: 'ค่าน้ำประปา', amount: inv.waterCost },
    ...(cf > 0 ? [{ desc: 'ค่าส่วนกลาง', amount: cf }] : []),
    ...(inf > 0 ? [{ desc: 'ค่าอินเทอร์เน็ต', amount: inf }] : []),
  ]
  const total = items.reduce((s, i) => s + i.amount, 0)
  const date = new Date()
  const issueDate = date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div id="invoicePdfContent" className="bg-white mx-auto font-sans text-[11px] text-neutral-700 leading-relaxed" style={{ padding: 40 }}>
      {/* Header */}
      <div className="flex justify-between items-start pb-6 mb-6 border-b border-neutral-200">
        <div className="flex items-center gap-4">
          {settings.logo && <img src={settings.logo} alt="" className="h-12 w-12 object-contain" />}
          <div>
            <div className="text-base font-bold text-neutral-800">{settings.dormName || 'หอพัก'}</div>
            <div className="text-[10px] text-neutral-400">{settings.address}</div>
            <div className="text-[10px] text-neutral-400">โทร {settings.phone}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-base font-bold text-neutral-800">ใบแจ้งหนี้</div>
          <div className="text-[10px] text-neutral-400 mt-1">INV-{date.getFullYear() + 543}-{invId()}</div>
          <div className="text-[10px] text-neutral-400">{issueDate}</div>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-6">
        <div className="text-[10px] text-neutral-500 mb-2">{inv.tenant}</div>
        <div className="text-[10px] text-neutral-400">ห้อง {inv.room} • {formatMonth(inv.month)}</div>
      </div>

      {/* Table */}
      <table className="w-full mb-6">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="text-left pb-2 font-medium text-[10px] text-neutral-400">รายการ</th>
            <th className="text-right pb-2 font-medium text-[10px] text-neutral-400">จำนวนเงิน</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b border-neutral-50">
              <td className="py-2 text-[11px] text-neutral-700">{item.desc}</td>
              <td className="py-2 text-right text-[11px] text-neutral-700">{item.amount.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total */}
      <div className="flex justify-end pb-6 mb-6 border-b border-neutral-200">
        <div className="flex items-baseline gap-6">
          <span className="text-sm font-bold text-neutral-800">รวมทั้งสิ้น</span>
          <span className="text-base font-bold text-neutral-800">{total.toLocaleString()} บาท</span>
        </div>
      </div>

      {/* Payment */}
      <div className="flex gap-6">
        <div className="flex-1 space-y-1">
          <p className="text-[10px] text-neutral-400">ชำระผ่านพร้อมเพย์ 0902439797</p>
          <p className="text-[10px] text-neutral-400">นงลักษณ์ นิพรรัมย์ — ธนาคารกรุงไทย</p>
          <p className="text-[10px] text-neutral-400 mt-2">กำหนดชำระภายในวันที่ 5 ของทุกเดือน</p>
          <p className="text-[10px] text-neutral-400">หากชำระหลังกำหนด คิดค่าปรับวันละ 50 บาท</p>
        </div>
        {settings.qrCode && (
          <div className="shrink-0">
            <img src={settings.qrCode} alt="QR" className="w-20 h-20 object-contain" />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-6 pt-4 border-t border-neutral-100">
        <p className="text-[9px] text-neutral-300">{settings.dormName || 'หอพัก'} • โทร {settings.phone}</p>
      </div>
    </div>
  )
}
