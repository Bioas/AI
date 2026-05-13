import { useApp } from '../context/AppContext'
import { formatMonth } from '../lib/constants'

export default function InvoicePreview({ inv }) {
  const { settings } = useApp()
  const commonFee = settings.commonFee || 0
  const internetFee = settings.internetFee || 0
  const grandTotal = inv.total + commonFee + internetFee

  return (
    <div id="invoicePdfContent" className="bg-white rounded-xl p-6 max-w-md mx-auto font-sans text-sm">
      <div className="text-center mb-5 border-b border-zinc-100 pb-4">
        {settings.logo && <img src={settings.logo} alt="โลโก้" className="h-10 object-contain mx-auto mb-2" />}
        <h2 className="text-emerald-700 text-lg font-bold mb-0.5">{settings.dormName}</h2>
        <p className="text-zinc-400 text-xs">{settings.address}</p>
        <p className="text-zinc-400 text-xs">โทร: {settings.phone}</p>
      </div>

      <div className="text-center mb-4">
        <h3 className="text-emerald-700 font-bold">ใบแจ้งหนี้ — {formatMonth(inv.month)}</h3>
      </div>

      <div className="flex justify-between mb-4 p-3 bg-zinc-50 rounded-lg text-xs">
        <div>
          <p><span className="text-zinc-500">ผู้พัก:</span> <span className="font-medium">{inv.tenant}</span></p>
          <p><span className="text-zinc-500">ห้อง:</span> <span className="font-medium">{inv.room}</span></p>
        </div>
        <div className="text-right">
          <p><span className="text-zinc-500">วันที่:</span> {new Date().toLocaleDateString('th-TH')}</p>
          <p><span className="text-amber-600 font-medium">รอชำระ</span></p>
        </div>
      </div>

      <table className="w-full text-xs mb-4">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="text-left py-2 font-medium text-zinc-600">รายการ</th>
            <th className="text-left py-2 font-medium text-zinc-600">รายละเอียด</th>
            <th className="text-right py-2 font-medium text-zinc-600">บาท</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['ค่าเช่าห้อง', `ห้อง ${inv.room}`, inv.rent],
            ['ค่าไฟ', `${inv.elecUnits} หน่วย × ${inv.rateElec}`, inv.elecCost],
            ['ค่าน้ำ', `${inv.waterUnits} หน่วย × ${inv.rateWater}`, inv.waterCost],
            ...(commonFee > 0 ? [['ค่าส่วนกลาง', '', commonFee]] : []),
            ...(internetFee > 0 ? [['ค่าอินเทอร์เน็ต', '', internetFee]] : []),
          ].map(([label, detail, amount], i) => (
            <tr key={i} className="border-b border-zinc-50">
              <td className="py-2 text-zinc-700">{label}</td>
              <td className="py-2 text-zinc-400">{detail}</td>
              <td className="py-2 text-right font-medium">{amount.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end py-2.5 border-t-2 border-emerald-600 mb-3">
        <span className="text-base font-bold text-emerald-700">รวม: {grandTotal.toLocaleString()} บาท</span>
      </div>

      <div className="bg-amber-50 rounded-lg p-3 mb-2">
        <p className="text-xs text-amber-800 text-center">⚠️ กรุณาชำระภายในวันที่ 5 ของทุกเดือน</p>
      </div>
      <div className="bg-zinc-50 rounded-lg p-3">
        <p className="text-xs text-zinc-600 text-center">💳 ชำระที่สำนักงานหอพัก หรือโอนเข้าบัญชีธนาคาร</p>
      </div>
    </div>
  )
}
