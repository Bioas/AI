import { useApp } from '../context/AppContext'
import { formatMonth } from '../lib/constants'

export default function InvoicePreview({ inv }) {
  const { settings } = useApp()
  const commonFee = settings.commonFee || 0
  const internetFee = settings.internetFee || 0
  const grandTotal = inv.total + commonFee + internetFee

  return (
    <div id="invoicePdfContent" className="bg-white rounded-xl p-6 max-w-md mx-auto font-sans text-sm">
      <div className="text-center mb-5 border-b border-neutral-100 pb-4">
        {settings.logo && <img src={settings.logo} alt="โลโก้" className="h-16 object-contain mx-auto mb-3" />}
        <h2 className="text-amber-700 text-lg font-bold mb-0.5">{settings.dormName}</h2>
        <p className="text-neutral-400 text-xs">{settings.address}</p>
        <p className="text-neutral-400 text-xs">โทร: {settings.phone}</p>
      </div>
      <div className="text-center mb-4">
        <h3 className="text-amber-700 font-bold">ใบแจ้งหนี้ — {formatMonth(inv.month)}</h3>
      </div>
      <div className="flex justify-between mb-4 p-3 bg-neutral-50 rounded-lg text-xs">
        <div>
          <p><span className="text-neutral-500">ผู้พัก:</span> <span className="font-medium text-neutral-800">{inv.tenant}</span></p>
          <p><span className="text-neutral-500">ห้อง:</span> <span className="font-medium text-neutral-800">{inv.room}</span></p>
        </div>
        <div className="text-right">
          <p><span className="text-neutral-500">วันที่:</span> {new Date().toLocaleDateString('th-TH')}</p>
          <p><span className="text-amber-600 font-medium">รอชำระ</span></p>
        </div>
      </div>
      <table className="w-full text-xs mb-4">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="text-left py-2 font-medium text-neutral-500">รายการ</th>
            <th className="text-left py-2 font-medium text-neutral-500">รายละเอียด</th>
            <th className="text-right py-2 font-medium text-neutral-500">บาท</th>
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
            <tr key={i} className="border-b border-neutral-50">
              <td className="py-2 text-neutral-700">{label}</td>
              <td className="py-2 text-neutral-400">{detail}</td>
              <td className="py-2 text-right font-medium text-neutral-700">{amount.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end py-2.5 border-t-2 border-amber-500 mb-3">
        <span className="text-base font-bold text-amber-700">รวม: {grandTotal.toLocaleString()} บาท</span>
      </div>

      <div className="space-y-2">
        <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-100">
          <p className="text-xs text-amber-800 leading-relaxed text-center">
            กำหนดชำระภายในวันที่ 5 ของทุกเดือน<br />
            หากชำระหลังวันกำหนด คิดค่าปรับวันละ 50 บาท
          </p>
        </div>
        <div className="bg-neutral-50 rounded-xl p-3.5 border border-neutral-100">
          <p className="text-xs text-neutral-700 leading-relaxed text-center">
            <strong>ชำระเงินที่:</strong> สำนักงานหอพัก<br />
            <strong>หรือ โอนเข้าบัญชี</strong> พร้อมเพย์ 0902439797<br />
            นงลักษณ์ นิพรรัมย์ ธนาคารกรุงไทย
          </p>
        </div>
        {settings.qrCode && (
          <div className="flex justify-center pt-1">
            <img src={settings.qrCode} alt="QR Code พร้อมเพย์" className="w-28 h-28 object-contain rounded-xl border border-neutral-200 shadow-sm" />
          </div>
        )}
      </div>
    </div>
  )
}
