import { useApp } from '../context/AppContext'
import { formatMonth } from '../lib/constants'

export default function InvoicePreview({ inv }) {
  const { settings, rooms } = useApp()
  const cf = settings.commonFee || 0
  const inf = settings.internetFee || 0
  const roomData = rooms.find(r => r.roomNumber === inv.room || r.number === inv.room)
  const isDaily = roomData?.rentalType === 'daily' || roomData?.rentalType === 'รายวัน'
  const items = isDaily ? [
    { 
      desc: inv.room, 
      detail: (
        <>
          <div>เช็คอิน: {inv.moveInDate ? new Date(inv.moveInDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</div>
          <div>เช็คเอาท์: {inv.moveOutDate ? new Date(inv.moveOutDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</div>
        </>
      ), 
      unit: `${inv.days || 1} คืน`, 
      pricePerUnit: inv.rent / (inv.days || 1),
      amount: inv.rent 
    },
    ...(inv.extraBed > 0 ? [{ desc: 'เตียงเสริม', detail: `${inv.extraBed} เตียง`, unit: `เตียง`, pricePerUnit: inv.extraBedCost / inv.extraBed, amount: inv.extraBedCost }] : []),
    ...(inv.discount > 0 ? [{ desc: 'ส่วนลด', detail: '', unit: '', pricePerUnit: 1, amount: -inv.discount }] : []),
  ] : [
    { desc: 'ค่าเช่าห้อง', detail: `ห้อง ${inv.room}`, amount: inv.rent },
    { desc: 'ค่าไฟฟ้า', detail: `${inv.elecUnits} หน่วย × ${inv.rateElec} บาท`, amount: inv.elecCost },
    { desc: 'ค่าน้ำประปา', detail: inv.waterUnits <= 4 && inv.waterUnits > 0 ? 'เหมาจ่าย' : `${inv.waterUnits} หน่วย × ${inv.rateWater} บาท`, amount: inv.waterCost },
    ...(cf > 0 ? [{ desc: 'ค่าส่วนกลาง', detail: '', amount: cf }] : []),
    ...(inf > 0 ? [{ desc: 'ค่าอินเทอร์เน็ต', detail: '', amount: inf }] : []),
  ]
  const total = items.reduce((s, i) => s + i.amount, 0)
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const y = now.getFullYear() + 543
  const m = now.toLocaleDateString('th-TH', { month: 'short' })
  const issueDate = `${lastDay} ${m} ${y}`
  const signatureDate = `${String(lastDay).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${y}`
  const invMonth = inv.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const invoiceNo = inv.docNumber || `INV-${roomData?.roomCode || inv.room}-${invMonth.replace('-', '')}`

  return (
    <div id="invoicePdfContent" className="bg-white mx-auto font-sans text-[13px] text-neutral-700 leading-relaxed" style={{ padding: 40 }}>
      {/* Top accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-amber-600 to-amber-400 rounded-full mb-6" />

      {/* Header */}
      <div className="flex justify-between items-start pb-6 mb-6 border-b border-amber-200/60">
        <div className="flex items-center gap-3">
          {settings.logo && <img src={settings.logo} alt="" className="h-16 w-16 object-contain shrink-0" />}
            <div>
              <div className="text-base font-bold text-amber-800">{settings.dormName || 'หอพัก'}</div>
              <div className="text-[10px] text-neutral-800 mt-0.5">{settings.address}</div>
              <div className="text-[10px] text-neutral-800">โทร {settings.phone}</div>
              {settings.taxId && <div className="text-[10px] text-neutral-800">เลขประจำตัวผู้เสียภาษี {settings.taxId}</div>}
            </div>
        </div>
          <div className="text-right">
            <div className="text-base font-bold text-amber-700">ใบแจ้งหนี้</div>
            <div className="text-[10px] text-amber-600/80 mt-0.5 font-medium">{invoiceNo}</div>
            <div className="text-[10px] text-neutral-800 mt-0.5">{issueDate}</div>
          </div>
      </div>

      {/* Bill To */}
      <div className="mb-6 px-4 py-3 bg-gradient-to-r from-amber-50/80 to-amber-50/30 rounded-lg border border-amber-100/60">
        {inv.tenantType === 'company' ? (
          <div className="space-y-1.5 text-[12px]">
            <div><span className="text-amber-500">เลขประจำตัวผู้เสียภาษี</span> <span className="font-medium text-neutral-800 ml-2">{inv.companyTaxId || '—'}</span></div>
            <div><span className="text-amber-500">ผู้พัก</span> <span className="font-medium text-neutral-800 ml-2">{inv.companyName || inv.tenant}</span></div>
            <div className="flex items-start">
              <span className="text-amber-500 shrink-0">ที่อยู่</span>
              <span className="font-medium text-neutral-800 ml-[13px] flex-1">{inv.companyAddress || '—'}</span>
            </div>
            <div className="flex gap-8 pt-2 border-t border-amber-100/50 mt-2 text-[12px]">
              <div><span className="text-amber-500">ห้อง</span> <span className="font-medium text-neutral-800 ml-2">{inv.room}</span></div>
              {isDaily ? (
                <>
                  <div><span className="text-amber-500">เช็คอิน</span> <span className="font-medium text-neutral-800 ml-2">{inv.moveInDate ? new Date(inv.moveInDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span></div>
                  <div><span className="text-amber-500">เช็คเอาท์</span> <span className="font-medium text-neutral-800 ml-2">{inv.moveOutDate ? new Date(inv.moveOutDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span></div>
                </>
              ) : (
                <>
                  <div><span className="text-amber-500">เดือน</span> <span className="font-medium text-neutral-800 ml-2">{formatMonth(inv.month)}</span></div>
                  <div><span className="text-amber-500">วันที่</span> <span className="font-medium text-neutral-800 ml-2">{issueDate}</span></div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-y-1.5">
            <div className="flex items-center"><span className="text-amber-500 shrink-0">ผู้พัก</span> <span className="font-medium text-neutral-800 ml-2 whitespace-nowrap">{inv.tenant}</span></div>
            <div className="text-right"><span className="text-amber-500">ห้อง</span> <span className="font-medium text-neutral-800 ml-2">{inv.room}</span></div>
            {isDaily ? (
              <>
                <div><span className="text-amber-500">เช็คอิน</span> <span className="font-medium text-neutral-800 ml-2">{inv.moveInDate ? new Date(inv.moveInDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span></div>
                <div className="text-right"><span className="text-amber-500">เช็คเอาท์</span> <span className="font-medium text-neutral-800 ml-2">{inv.moveOutDate ? new Date(inv.moveOutDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span></div>
              </>
            ) : (
              <>
                <div><span className="text-amber-500">เดือน</span> <span className="font-medium text-neutral-800 ml-2">{formatMonth(inv.month)}</span></div>
                <div className="text-right"><span className="text-amber-500">วันที่</span> <span className="font-medium text-neutral-800 ml-2">{issueDate}</span></div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <table className="w-full mb-6">
        <thead>
          <tr className="border-b-2 border-amber-200/60">
            {isDaily ? (
              <>
                <th className="text-left pb-2 font-semibold text-[12px] text-amber-700 uppercase tracking-wider">รายการ</th>
                <th className="text-left pb-2 font-semibold text-[12px] text-amber-700 uppercase tracking-wider">รายละเอียด</th>
                <th className="text-center pb-2 font-semibold text-[12px] text-amber-700 uppercase tracking-wider">ราคา/หน่วย</th>
                <th className="text-right pb-2 font-semibold text-[12px] text-amber-700 uppercase tracking-wider">จำนวนเงิน</th>
              </>
            ) : (
              <>
                <th className="text-left pb-2 font-semibold text-[12px] text-amber-700 uppercase tracking-wider">รายการ</th>
                <th className="text-left pb-2 font-semibold text-[12px] text-amber-700 uppercase tracking-wider">รายละเอียด</th>
                <th className="text-right pb-2 font-semibold text-[12px] text-amber-700 uppercase tracking-wider">จำนวนเงิน</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b border-amber-50">
              {isDaily ? (
                <>
                  <td className="py-2 pr-2 text-left text-neutral-800">{item.desc}</td>
                  <td className="py-2 pr-2 text-left text-[12px] text-neutral-800">{item.detail}</td>
                  <td className="py-2 text-center text-[12px] text-neutral-800">{item.pricePerUnit?.toLocaleString()}{item.unit ? '/' + item.unit : ''}</td>
                  <td className="py-2 text-right font-medium text-neutral-800">{item.amount.toLocaleString()}</td>
                </>
              ) : (
                <>
                  <td className="py-2 pr-2 text-neutral-800">{item.desc}</td>
                  <td className="py-2 pr-2 text-[12px] text-neutral-400">{item.detail}</td>
                  <td className="py-2 text-right font-medium text-neutral-800">{item.amount.toLocaleString()}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total */}
      <div className="flex justify-end pb-2 mb-2 border-b border-amber-200/60">
        <div className="flex items-baseline gap-6">
          <span className="text-sm font-bold text-amber-700">รวมทั้งสิ้น</span>
          <span className="text-base font-bold text-amber-700">{total.toLocaleString()} บาท</span>
        </div>
      </div>

      {/* Payment */}
      <div className="flex gap-6">
        <div className="flex-1 space-y-2">
          <div className="text-[12px] text-neutral-500 leading-snug">
            <div className="font-semibold text-amber-700 mb-0.5">ช่องทางการชำระเงิน</div>
            พร้อมเพย์ <span className="font-semibold text-neutral-700">0902439797</span><br />
            นงลักษณ์ นิพรรัมย์ — ธนาคารกรุงไทย
          </div>
          <div className="text-[12px] text-amber-600/70 leading-snug pt-2 border-t border-amber-100">
            กำหนดชำระภายในวันที่ 5 ของทุกเดือน<br />
            หากชำระหลังกำหนด คิดค่าปรับวันละ 50 บาท
          </div>
          {/* Signature */}
          <div className="flex justify-center pt-1 mt-1">
            <div className="text-center">
              {settings.signature ? (
                <img src={settings.signature} alt="ลายเซ็น" className="w-28 h-10 object-contain mx-auto mb-0.5" />
              ) : (
                <div className="border-b border-dotted border-neutral-300 w-40 mb-0.5">&nbsp;</div>
              )}
              <div className="text-[12px] text-neutral-500">ลงชื่อผู้แจ้งหนี้</div>
              <div className="text-[12px] text-neutral-400 mt-0.5">วันที่ {signatureDate}</div>
            </div>
          </div>
        </div>
        {settings.qrCode && (
          <div className="shrink-0 flex flex-col items-center justify-center">
            <div className="p-2 border-2 border-dashed border-amber-200 rounded-xl">
              <img src={settings.qrCode} alt="QR" className="w-32 h-32 object-contain" />
            </div>
            <span className="text-[12px] text-amber-400 mt-1">สแกนชำระเงิน</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-6 pt-4 border-t border-amber-100">
        <p className="text-[11px] text-amber-400">{settings.dormName || 'หอพัก'} • โทร {settings.phone}</p>
      </div>
    </div>
  )
}
