import { useApp } from '../context/AppContext'
import { formatMonth } from '../lib/constants'

const invId = () => Math.random().toString(36).substring(2, 8).toUpperCase()

export default function InvoicePreview({ inv }) {
  const { settings } = useApp()
  const cf = settings.commonFee || 0
  const inf = settings.internetFee || 0
  const items = [
    { desc: 'ค่าเช่าห้อง', qty: 1, unit: inv.rent, amount: inv.rent },
    { desc: 'ค่าไฟฟ้า', qty: inv.elecUnits, unit: inv.rateElec, amount: inv.elecCost },
    { desc: 'ค่าน้ำประปา', qty: inv.waterUnits, unit: inv.rateWater, amount: inv.waterCost },
    ...(cf > 0 ? [{ desc: 'ค่าส่วนกลาง', qty: 1, unit: cf, amount: cf }] : []),
    ...(inf > 0 ? [{ desc: 'ค่าอินเทอร์เน็ต', qty: 1, unit: inf, amount: inf }] : []),
  ]
  const subtotal = items.reduce((s, i) => s + i.amount, 0)
  const date = new Date()
  const issueDate = date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
  const dueDate = new Date(date.getFullYear(), date.getMonth(), 5)
  if (dueDate < date) dueDate.setMonth(dueDate.getMonth() + 1)
  const dueStr = dueDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div id="invoicePdfContent" className="bg-white w-[210mm] min-h-[297mm] mx-auto font-sans flex flex-col text-[11px] leading-relaxed text-slate-800" style={{ padding: '10mm 12mm' }}>
      {/* Header */}
      <div className="flex justify-between items-start pb-5 mb-5 border-b border-slate-200">
        <div className="flex items-center gap-4">
          {settings.logo && <img src={settings.logo} alt="" className="h-14 w-14 object-contain" />}
          <div>
            <div className="text-base font-bold text-slate-800">{settings.dormName || 'หอพัก'}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{settings.address}</div>
            <div className="text-[10px] text-slate-400">โทร: {settings.phone}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-blue-600 tracking-wide">INVOICE</div>
          <div className="text-[10px] text-slate-400 mt-1 space-y-0.5">
            <div>เลขที่: INV-{date.getFullYear() + 543}-{invId()}</div>
            <div>วันที่ออก: {issueDate}</div>
            <div>กำหนดชำระ: {dueStr}</div>
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-6">
        <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">ผู้รับใบแจ้งหนี้</div>
        <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400">ชื่อ:</span>{' '}
              <span className="font-semibold text-slate-800">{inv.tenant}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400">ห้อง:</span>{' '}
              <span className="font-semibold text-slate-800">{inv.room}</span>
            </div>
            <div>
              <span className="text-slate-400">เดือน:</span>{' '}
              <span className="font-semibold text-slate-800">{formatMonth(inv.month)}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400">วันที่:</span>{' '}
              <span className="font-semibold text-slate-800">{issueDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <table className="w-full mb-4">
        <thead>
          <tr className="border-b-2 border-slate-200">
            <th className="text-left py-2.5 pr-2 font-semibold text-[9px] text-slate-400 uppercase tracking-wider w-[45%]">รายการ</th>
            <th className="text-right py-2.5 px-2 font-semibold text-[9px] text-slate-400 uppercase tracking-wider w-[15%]">จำนวน</th>
            <th className="text-right py-2.5 px-2 font-semibold text-[9px] text-slate-400 uppercase tracking-wider w-[20%]">ราคา/หน่วย</th>
            <th className="text-right py-2.5 pl-2 font-semibold text-[9px] text-slate-400 uppercase tracking-wider w-[20%]">จำนวนเงิน</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-slate-50/50' : ''}>
              <td className="py-2.5 pr-2 text-[11px] text-slate-800">{item.desc}</td>
              <td className="py-2.5 px-2 text-right text-[11px] text-slate-600">{item.qty.toLocaleString()}</td>
              <td className="py-2.5 px-2 text-right text-[11px] text-slate-600">{item.unit.toLocaleString()}</td>
              <td className="py-2.5 pl-2 text-right text-[11px] font-semibold text-slate-800">{item.amount.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="flex justify-end mb-6">
        <div className="w-56">
          <div className="flex justify-between py-1.5 text-[11px] text-slate-600">
            <span>รวมก่อนภาษี</span>
            <span>{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-1.5 text-[11px] text-slate-600 border-t border-slate-100">
            <span>ส่วนลด</span>
            <span>0</span>
          </div>
          <div className="flex justify-between py-1.5 text-[11px] text-slate-600 border-t border-slate-100">
            <span>ภาษี (VAT 0%)</span>
            <span>0</span>
          </div>
          <div className="flex justify-between items-center py-2.5 mt-1.5 px-3 bg-blue-600 rounded-lg">
            <span className="text-sm font-bold text-white">รวมทั้งสิ้น</span>
            <span className="text-sm font-bold text-white">{subtotal.toLocaleString()} บาท</span>
          </div>
        </div>
      </div>

      {/* Payment + QR */}
      <div className="flex gap-4 mt-auto pt-4 border-t border-slate-200">
        <div className="flex-1 space-y-2">
          <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">ช่องทางการชำระเงิน</div>
          <div className="bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
            <p className="text-[10px] text-slate-600 leading-snug">
              โอนเข้าบัญชี พร้อมเพย์ <strong className="text-slate-800">0902439797</strong><br />
              นงลักษณ์ นิพรรัมย์ — ธนาคารกรุงไทย
            </p>
          </div>
          <div className="bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
            <p className="text-[10px] text-amber-700 leading-snug">
              ⚠️ กำหนดชำระภายในวันที่ 5 ของทุกเดือน<br />
              หากชำระหลังกำหนด คิดค่าปรับวันละ 50 บาท
            </p>
          </div>
        </div>
        {settings.qrCode && (
          <div className="shrink-0 flex flex-col items-center justify-center px-2">
            <img src={settings.qrCode} alt="QR" className="w-24 h-24 object-contain" />
            <span className="text-[9px] text-slate-400 mt-1">สแกนเพื่อชำระ</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-3 pt-2.5 border-t border-slate-100">
        <p className="text-[9px] text-slate-300">ขอบคุณที่ใช้บริการ • {settings.dormName || 'หอพัก'} • โทร: {settings.phone}</p>
      </div>
    </div>
  )
}
