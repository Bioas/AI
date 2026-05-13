import { useApp } from '../context/AppContext'
import { formatMonth } from '../lib/constants'

export default function InvoicePreview({ inv }) {
  const { settings } = useApp()
  const commonFee = settings.commonFee || 0
  const internetFee = settings.internetFee || 0
  const grandTotal = inv.total + commonFee + internetFee

  return (
    <div id="invoicePdfContent" className="bg-white rounded-2xl p-8 md:p-10 max-w-lg mx-auto font-sans">
      <div className="text-center mb-6">
        {settings.logo && (
          <img src={settings.logo} alt="" className="h-14 object-contain mx-auto mb-2.5" />
        )}
        <h2 className="text-emerald-600 text-2xl font-extrabold mb-1">{settings.dormName}</h2>
        <p className="text-slate-400 text-sm">{settings.address}</p>
        <p className="text-slate-400 text-sm">โทร: {settings.phone}</p>
        <div className="h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-300 rounded mt-5" />
      </div>

      <div className="text-center mb-6">
        <h3 className="text-emerald-600 text-xl font-extrabold">ใบแจ้งหนี้ค่าเช่าประจำเดือน {formatMonth(inv.month)}</h3>
      </div>

      <div className="flex justify-between mb-6 p-4 bg-emerald-50 rounded-xl text-sm">
        <div>
          <div className="mb-1"><strong className="text-slate-700">ผู้พัก:</strong> <span className="text-slate-900">{inv.tenant}</span></div>
          <div><strong className="text-slate-700">ห้อง:</strong> <span className="text-slate-900">{inv.room}</span></div>
        </div>
        <div className="text-right">
          <div className="mb-1"><strong className="text-slate-700">วันที่:</strong> <span className="text-slate-900">{new Date().toLocaleDateString('th-TH')}</span></div>
          <div><strong className="text-slate-700">สถานะ:</strong> <span className="text-amber-500 font-semibold">รอชำระ</span></div>
        </div>
      </div>

      <table className="w-full text-sm mb-2">
        <thead>
          <tr className="border-b-2 border-emerald-500">
            <th className="text-left px-2 py-2.5 font-bold text-slate-900">รายการ</th>
            <th className="text-left px-2 py-2.5 font-bold text-slate-900">รายละเอียด</th>
            <th className="text-right px-2 py-2.5 font-bold text-slate-900">จำนวนเงิน (บาท)</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['ค่าเช่าห้อง', `ห้อง ${inv.room}`, inv.rent],
            ['ค่าไฟฟ้า', `${inv.elecUnits} หน่วย × ${inv.rateElec} บาท`, inv.elecCost],
            ['ค่าน้ำประปา', `${inv.waterUnits} หน่วย × ${inv.rateWater} บาท`, inv.waterCost],
            ...(commonFee > 0 ? [['ค่าส่วนกลาง', '-', commonFee]] : []),
            ...(internetFee > 0 ? [['ค่าอินเตอร์เน็ต', '-', internetFee]] : []),
          ].map(([label, detail, amount], i) => (
            <tr key={i} className="border-b border-slate-100">
              <td className="px-2 py-2.5 text-slate-700">{label}</td>
              <td className="px-2 py-2.5 text-slate-400">{detail}</td>
              <td className="px-2 py-2.5 text-right text-slate-900 font-semibold">{amount.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end items-baseline py-4 border-t-4 border-emerald-500 mb-6">
        <span className="text-xl font-extrabold text-emerald-600">ยอดรวม: {grandTotal.toLocaleString()} บาท</span>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
        <p className="text-xs text-amber-800 text-center leading-relaxed">
          <strong>กำหนดชำระภายในวันที่ 5 ของทุกเดือน</strong><br />
          หากชำระหลังกำหนด คิดค่าปรับวันละ 50 บาท
        </p>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <p className="text-xs text-emerald-800 text-center leading-relaxed">
          <strong>ชำระเงินที่ :</strong> สำนักงานหอพัก<br />
          <strong>หรือ โอนเข้าบัญชี</strong> พร้อมเพย์ <strong>090-243-9797</strong><br />
          นงลักษณ์ นิพรรัมย์ ธนาคารกรุงไทย
        </p>
      </div>
    </div>
  )
}
