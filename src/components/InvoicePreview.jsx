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
        {settings.logo && <img src={settings.logo} alt="" className="h-10 object-contain mx-auto mb-2" />}
        <h2 className="text-emerald-700 text-lg font-bold mb-0.5">{settings.dormName}</h2>
        <p className="text-zinc-400 text-xs">{settings.address}</p>
        <p className="text-zinc-400 text-xs">Tel: {settings.phone}</p>
      </div>

      <div className="text-center mb-4">
        <h3 className="text-emerald-700 font-bold">Invoice — {formatMonth(inv.month)}</h3>
      </div>

      <div className="flex justify-between mb-4 p-3 bg-zinc-50 rounded-lg text-xs">
        <div>
          <p><span className="text-zinc-500">Tenant:</span> <span className="font-medium">{inv.tenant}</span></p>
          <p><span className="text-zinc-500">Room:</span> <span className="font-medium">{inv.room}</span></p>
        </div>
        <div className="text-right">
          <p><span className="text-zinc-500">Date:</span> {new Date().toLocaleDateString('th-TH')}</p>
          <p><span className="text-amber-600 font-medium">Pending</span></p>
        </div>
      </div>

      <table className="w-full text-xs mb-4">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="text-left py-2 font-medium text-zinc-600">Item</th>
            <th className="text-left py-2 font-medium text-zinc-600">Detail</th>
            <th className="text-right py-2 font-medium text-zinc-600">THB</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Rent', `Room ${inv.room}`, inv.rent],
            ['Electricity', `${inv.elecUnits} units × ${inv.rateElec}`, inv.elecCost],
            ['Water', `${inv.waterUnits} units × ${inv.rateWater}`, inv.waterCost],
            ...(commonFee > 0 ? [['Common Fee', '', commonFee]] : []),
            ...(internetFee > 0 ? [['Internet', '', internetFee]] : []),
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
        <span className="text-base font-bold text-emerald-700">Total: {grandTotal.toLocaleString()} THB</span>
      </div>

      <div className="bg-amber-50 rounded-lg p-3 mb-2">
        <p className="text-xs text-amber-800 text-center">Payment due by the 5th of each month</p>
      </div>
      <div className="bg-zinc-50 rounded-lg p-3">
        <p className="text-xs text-zinc-600 text-center">Pay at the dormitory office or bank transfer</p>
      </div>
    </div>
  )
}
