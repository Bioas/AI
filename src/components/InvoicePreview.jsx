import { useApp } from '../context/AppContext'
import { formatMonth } from '../lib/constants'

export default function InvoicePreview({ inv }) {
  const { settings } = useApp()
  const cf = settings.commonFee || 0
  const inf = settings.internetFee || 0
  const gt = inv.total + cf + inf
  const date = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div id="invoicePdfContent" className="bg-white w-[210mm] min-h-[297mm] mx-auto font-sans text-xs leading-relaxed flex flex-col" style={{ padding: '8mm 10mm' }}>
      {/* Header */}
      <div className="flex items-start justify-between pb-4 mb-4 border-b-2 border-amber-600">
        <div className="flex items-center gap-3">
          {settings.logo && <img src={settings.logo} alt="" className="h-14 w-14 object-contain rounded-lg border border-amber-100" />}
          <div>
            <h1 className="text-base font-bold text-amber-800">{settings.dormName || 'หอพัก'}</h1>
            <p className="text-[9px] text-neutral-500 mt-0.5">{settings.address}</p>
            <p className="text-[9px] text-neutral-500">โทร: {settings.phone}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-amber-700 tracking-wide">ใบแจ้งหนี้</div>
          <div className="text-[9px] text-neutral-500 mt-0.5">INVOICE</div>
        </div>
      </div>

      {/* Info Row */}
      <div className="flex justify-between mb-4 px-3 py-2.5 bg-amber-50/60 rounded-lg border border-amber-100">
        <div className="space-y-0.5">
          <p><span className="text-neutral-400">ผู้พัก:</span> <span className="font-semibold text-neutral-800">{inv.tenant}</span></p>
          <p><span className="text-neutral-400">ห้อง:</span> <span className="font-semibold text-neutral-800">{inv.room}</span></p>
        </div>
        <div className="text-right space-y-0.5">
          <p><span className="text-neutral-400">เดือน:</span> <span className="font-semibold text-neutral-800">{formatMonth(inv.month)}</span></p>
          <p><span className="text-neutral-400">วันที่:</span> <span className="font-semibold text-neutral-800">{date}</span></p>
        </div>
      </div>

      {/* Table */}
      <table className="w-full mb-3">
        <thead>
          <tr className="bg-amber-700 text-white">
            <th className="text-left py-2 px-3 font-semibold text-[9px] uppercase tracking-wider rounded-tl-lg">รายการ</th>
            <th className="text-left py-2 px-3 font-semibold text-[9px] uppercase tracking-wider">รายละเอียด</th>
            <th className="text-right py-2 px-3 font-semibold text-[9px] uppercase tracking-wider rounded-tr-lg">จำนวนเงิน</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['ค่าเช่าห้อง', `ห้อง ${inv.room}`, inv.rent],
            ['ค่าไฟฟ้า', `${inv.elecUnits} หน่วย × ${inv.rateElec} บาท`, inv.elecCost],
            ['ค่าน้ำประปา', `${inv.waterUnits} หน่วย × ${inv.rateWater} บาท`, inv.waterCost],
            ...(cf > 0 ? [['ค่าส่วนกลาง', '', cf]] : []),
            ...(inf > 0 ? [['ค่าอินเทอร์เน็ต', '', inf]] : []),
          ].map(([label, detail, amount], i) => (
            <tr key={i} className="border-b border-neutral-100">
              <td className="py-2 px-3 text-neutral-800">{label}</td>
              <td className="py-2 px-3 text-neutral-400 text-[9px]">{detail}</td>
              <td className="py-2 px-3 text-right font-medium text-neutral-800">{amount.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total */}
      <div className="flex justify-end items-center py-2.5 px-3 bg-amber-50 rounded-lg border border-amber-200 mb-4">
        <span className="text-sm font-bold text-amber-800">รวมทั้งสิ้น: {gt.toLocaleString()} บาท</span>
      </div>

      {/* Bottom section */}
      <div className="flex gap-3 mt-auto pt-3 border-t border-neutral-200">
        <div className="flex-1 space-y-2">
          <div className="bg-amber-50 rounded-lg px-3 py-2.5 border border-amber-100">
            <p className="text-[9px] text-amber-800 leading-relaxed">
              <span className="font-semibold">⚠️ กำหนดชำระ:</span> ภายในวันที่ 5 ของทุกเดือน<br />
              หากชำระหลังกำหนด คิดค่าปรับวันละ 50 บาท
            </p>
          </div>
          <div className="bg-neutral-50 rounded-lg px-3 py-2.5 border border-neutral-100">
            <p className="text-[9px] text-neutral-700 leading-relaxed">
              <span className="font-semibold">💳 ชำระเงินที่:</span> สำนักงานหอพัก<br />
              <span className="font-semibold">หรือ โอนเข้าบัญชี</span> พร้อมเพย์ 0902439797<br />
              นงลักษณ์ นิพรรัมย์ ธนาคารกรุงไทย
            </p>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-center justify-center">
          {settings.qrCode && (
            <>
              <img src={settings.qrCode} alt="QR" className="w-24 h-24 object-contain rounded-lg border border-neutral-200" />
              <span className="text-[8px] text-neutral-400 mt-1">สแกนชำระเงิน</span>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-3 pt-2 border-t border-neutral-100">
        <p className="text-[8px] text-neutral-300">ขอบคุณที่ใช้บริการ • {settings.dormName || 'หอพัก'}</p>
      </div>
    </div>
  )
}
