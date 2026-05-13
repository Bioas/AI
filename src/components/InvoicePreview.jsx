import { useApp } from '../context/AppContext'
import { formatMonth } from '../lib/constants'

export default function InvoicePreview({ inv }) {
  const { settings } = useApp()
  const cf = settings.commonFee || 0
  const inf = settings.internetFee || 0
  const items = [
    { desc: 'ค่าเช่าห้อง', detail: `ห้อง ${inv.room}`, amount: inv.rent },
    { desc: 'ค่าไฟฟ้า', detail: `${inv.elecUnits} หน่วย × ${inv.rateElec} บาท`, amount: inv.elecCost },
    { desc: 'ค่าน้ำประปา', detail: `${inv.waterUnits} หน่วย × ${inv.rateWater} บาท`, amount: inv.waterCost },
    ...(cf > 0 ? [{ desc: 'ค่าส่วนกลาง', detail: '', amount: cf }] : []),
    ...(inf > 0 ? [{ desc: 'ค่าอินเทอร์เน็ต', detail: '', amount: inf }] : []),
  ]
  const total = items.reduce((s, i) => s + i.amount, 0)
  const now = new Date()
  const y = now.getFullYear() + 543
  const m = now.toLocaleDateString('th-TH', { month: 'short' })
  const issueDate = `30 ${m} ${y}`

  return (
    <div id="invoicePdfContent" className="bg-white mx-auto font-sans text-[11px] text-neutral-700 leading-relaxed" style={{ padding: 40 }}>
      {/* Top accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-amber-600 to-amber-400 rounded-full mb-6" />

      {/* Header */}
      <div className="flex justify-between items-start pb-6 mb-6 border-b border-amber-200/60">
        <div className="flex items-center gap-3">
          {settings.logo && <img src={settings.logo} alt="" className="h-20 w-20 object-contain shrink-0" />}
          <div>
            <div className="flex items-center gap-3">
              <span className="text-base font-bold text-amber-800">{settings.dormName || 'หอพัก'}</span>
              <span className="text-amber-300 font-light">|</span>
              <span className="text-base font-bold text-amber-700">ใบแจ้งหนี้</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">{settings.address}</div>
            <div className="text-[10px] text-neutral-400">โทร {settings.phone}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-base font-bold text-amber-800">{issueDate}</div>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-6 px-4 py-3 bg-gradient-to-r from-amber-50/80 to-amber-50/30 rounded-lg border border-amber-100/60">
        <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
          <div><span className="text-amber-500">ผู้พัก</span> <span className="font-medium text-neutral-800 ml-2">{inv.tenant}</span></div>
          <div className="text-right"><span className="text-amber-500">ห้อง</span> <span className="font-medium text-neutral-800 ml-2">{inv.room}</span></div>
          <div><span className="text-amber-500">เดือน</span> <span className="font-medium text-neutral-800 ml-2">{formatMonth(inv.month)}</span></div>
          <div className="text-right"><span className="text-amber-500">วันที่</span> <span className="font-medium text-neutral-800 ml-2">{issueDate}</span></div>
        </div>
      </div>

      {/* Table */}
      <table className="w-full mb-6">
        <thead>
          <tr className="border-b-2 border-amber-200/60">
            <th className="text-left pb-2 font-semibold text-[10px] text-amber-700 uppercase tracking-wider">รายการ</th>
            <th className="text-left pb-2 font-semibold text-[10px] text-amber-700 uppercase tracking-wider">รายละเอียด</th>
            <th className="text-right pb-2 font-semibold text-[10px] text-amber-700 uppercase tracking-wider">จำนวนเงิน</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b border-amber-50">
              <td className="py-2 pr-2 text-[11px] text-neutral-800">{item.desc}</td>
              <td className="py-2 pr-2 text-[10px] text-neutral-400">{item.detail}</td>
              <td className="py-2 text-right text-[11px] font-medium text-neutral-800">{item.amount.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total */}
      <div className="flex justify-end pb-6 mb-6 border-b border-amber-200/60">
        <div className="flex items-baseline gap-6">
          <span className="text-sm font-bold text-amber-700">รวมทั้งสิ้น</span>
          <span className="text-base font-bold text-amber-700">{total.toLocaleString()} บาท</span>
        </div>
      </div>

      {/* Payment */}
      <div className="flex gap-6">
        <div className="flex-1 space-y-2">
          <div className="text-[10px] text-neutral-500 leading-snug">
            <div className="font-semibold text-amber-700 mb-0.5">💳 ช่องทางการชำระเงิน</div>
            พร้อมเพย์ <span className="font-semibold text-neutral-700">0902439797</span><br />
            นงลักษณ์ นิพรรัมย์ — ธนาคารกรุงไทย
          </div>
          <div className="text-[10px] text-amber-600/70 leading-snug pt-2 border-t border-amber-100">
            ⚠️ กำหนดชำระภายในวันที่ 5 ของทุกเดือน<br />
            หากชำระหลังกำหนด คิดค่าปรับวันละ 50 บาท
          </div>
        </div>
        {settings.qrCode && (
          <div className="shrink-0 flex flex-col items-center justify-center">
            <div className="p-2 border-2 border-dashed border-amber-200 rounded-xl">
              <img src={settings.qrCode} alt="QR" className="w-20 h-20 object-contain" />
            </div>
            <span className="text-[8px] text-amber-400 mt-1">สแกนชำระเงิน</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-6 pt-4 border-t border-amber-100">
        <p className="text-[9px] text-amber-400">{settings.dormName || 'หอพัก'} • โทร {settings.phone}</p>
      </div>
    </div>
  )
}
