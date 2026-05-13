import { useApp } from '../context/AppContext'
import { formatMonth } from '../lib/constants'

const invId = () => Math.random().toString(36).substring(2, 8).toUpperCase()

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
  const date = new Date()
  const issueDate = date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div id="invoicePdfContent" className="bg-white mx-auto font-sans text-[11px] text-neutral-700 leading-relaxed" style={{ padding: 40 }}>
      {/* Header */}
      <div className="flex justify-between items-start pb-6 mb-6 border-b border-neutral-200">
        {settings.logo && <img src={settings.logo} alt="" className="h-16 w-16 object-contain" />}
        <div className="flex items-center gap-4">
          <div>
            <div className="text-base font-bold text-neutral-800">{settings.dormName || 'หอพัก'}</div>
            <div className="text-[10px] text-neutral-400">{settings.address}</div>
            <div className="text-[10px] text-neutral-400">โทร {settings.phone}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-base font-bold text-neutral-800">ใบแจ้งหนี้</div>
          <div className="text-[10px] text-neutral-400">{issueDate}</div>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-6 px-4 py-3 bg-neutral-50 rounded-lg border border-neutral-100">
        <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
          <div><span className="text-neutral-400">ผู้พัก</span> <span className="font-medium text-neutral-800 ml-2">{inv.tenant}</span></div>
          <div className="text-right"><span className="text-neutral-400">ห้อง</span> <span className="font-medium text-neutral-800 ml-2">{inv.room}</span></div>
          <div><span className="text-neutral-400">เดือน</span> <span className="font-medium text-neutral-800 ml-2">{formatMonth(inv.month)}</span></div>
          <div className="text-right"><span className="text-neutral-400">วันที่</span> <span className="font-medium text-neutral-800 ml-2">{issueDate}</span></div>
        </div>
      </div>

      {/* Table */}
      <table className="w-full mb-6">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="text-left pb-2 font-medium text-[10px] text-neutral-400">รายการ</th>
            <th className="text-left pb-2 font-medium text-[10px] text-neutral-400">รายละเอียด</th>
            <th className="text-right pb-2 font-medium text-[10px] text-neutral-400">จำนวนเงิน</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b border-neutral-50">
              <td className="py-2 pr-2 text-[11px] text-neutral-700">{item.desc}</td>
              <td className="py-2 pr-2 text-[10px] text-neutral-400">{item.detail}</td>
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
        <div className="flex-1 space-y-2">
          <div className="text-[10px] text-neutral-400 leading-snug">
            <div className="font-medium text-neutral-600 mb-0.5">💳 ช่องทางการชำระเงิน</div>
            พร้อมเพย์ <span className="font-semibold text-neutral-700">0902439797</span><br />
            นงลักษณ์ นิพรรัมย์ — ธนาคารกรุงไทย
          </div>
          <div className="text-[10px] text-neutral-400 leading-snug pt-2 border-t border-neutral-100">
            ⚠️ กำหนดชำระภายในวันที่ 5 ของทุกเดือน<br />
            หากชำระหลังกำหนด คิดค่าปรับวันละ 50 บาท
          </div>
        </div>
        {settings.qrCode && (
          <div className="shrink-0 flex flex-col items-center justify-center">
            <div className="p-2 border-2 border-dashed border-neutral-300 rounded-xl">
              <img src={settings.qrCode} alt="QR" className="w-20 h-20 object-contain" />
            </div>
            <span className="text-[8px] text-neutral-300 mt-1">สแกนชำระเงิน</span>
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
