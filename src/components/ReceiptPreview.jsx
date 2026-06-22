import { useApp } from '../context/AppContext'
import { formatMonth } from '../lib/constants'

export default function ReceiptPreview({ inv }) {
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
  const y = now.getFullYear() + 543
  const m = now.toLocaleDateString('th-TH', { month: 'short' })
  const d = now.getDate()
  const receiptDate = `${d} ${m} ${y}`
  const receiptNo = inv.docNumber ? inv.docNumber.replace('INV-', 'REC-') : `REC-${inv.room}-${inv.month?.replace('-', '') || ''}`

  const bahtText = numberToBahtText(total)

  return (
    <div id="receiptPdfContent" className="bg-white mx-auto font-sans text-[13px] text-neutral-700 leading-relaxed" style={{ padding: 40 }}>
      <div className="h-1.5 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full mb-6" />

      {/* Header */}
      <div className="flex justify-between items-start pb-6 mb-6 border-b border-emerald-200/60">
        <div className="flex items-center gap-3">
          {settings.logo && <img src={settings.logo} alt="" className="h-16 w-16 object-contain shrink-0" />}
            <div>
              <div className="text-base font-bold text-emerald-800">{settings.dormName || 'หอพัก'}</div>
              <div className="text-[10px] text-neutral-800 mt-0.5">{settings.address}</div>
              <div className="text-[10px] text-neutral-800">โทร {settings.phone}</div>
              {settings.taxId && <div className="text-[10px] text-neutral-800">เลขประจำตัวผู้เสียภาษี {settings.taxId}</div>}
            </div>
        </div>
          <div className="text-right">
            <div className="text-base font-bold text-emerald-700">ใบเสร็จรับเงิน</div>
            <div className="text-[10px] text-emerald-600/80 mt-0.5 font-medium">{receiptNo}</div>
            <div className="text-[10px] text-neutral-800 mt-0.5">{receiptDate}</div>
          </div>
      </div>

      {/* Received From */}
      <div className="mb-6 px-4 py-3 bg-gradient-to-r from-emerald-50/80 to-emerald-50/30 rounded-lg border border-emerald-100/60">
        {inv.tenantType === 'company' ? (
          <div className="space-y-1.5 text-[12px]">
            <div><span className="text-emerald-500">เลขประจำตัวผู้เสียภาษี</span> <span className="font-medium text-neutral-800 ml-2">{inv.companyTaxId || '—'}</span></div>
            <div><span className="text-emerald-500">ผู้พัก</span> <span className="font-medium text-neutral-800 ml-2">{inv.companyName || inv.tenant}</span></div>
            <div className="flex items-start">
              <span className="text-emerald-500 shrink-0">ที่อยู่</span>
              <span className="font-medium text-neutral-800 ml-[13px] flex-1">{inv.companyAddress || '—'}</span>
            </div>
            <div className="flex gap-8 pt-2 border-t border-emerald-100/50 mt-2 text-[12px]">
              <div><span className="text-emerald-500">ห้อง</span> <span className="font-medium text-neutral-800 ml-2">{inv.room}</span></div>
              {isDaily ? (
                <>
                  <div><span className="text-emerald-500">เช็คอิน</span> <span className="font-medium text-neutral-800 ml-2">{inv.moveInDate ? new Date(inv.moveInDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span></div>
                  <div><span className="text-emerald-500">เช็คเอาท์</span> <span className="font-medium text-neutral-800 ml-2">{inv.moveOutDate ? new Date(inv.moveOutDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span></div>
                </>
              ) : (
                <>
                  <div><span className="text-emerald-500">เดือน</span> <span className="font-medium text-neutral-800 ml-2">{formatMonth(inv.month)}</span></div>
                  <div><span className="text-emerald-500">วันที่</span> <span className="font-medium text-neutral-800 ml-2">{receiptDate}</span></div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-y-1.5">
            <div className="flex items-center"><span className="text-emerald-500 shrink-0">ได้รับเงินจาก</span> <span className="font-medium text-neutral-800 ml-2 whitespace-nowrap">{inv.tenant}</span></div>
            <div className="text-right"><span className="text-emerald-500">ห้อง</span> <span className="font-medium text-neutral-800 ml-2">{inv.room}</span></div>
            {isDaily ? (
              <>
                <div><span className="text-emerald-500">เช็คอิน</span> <span className="font-medium text-neutral-800 ml-2">{inv.moveInDate ? new Date(inv.moveInDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span></div>
                <div className="text-right"><span className="text-emerald-500">เช็คเอาท์</span> <span className="font-medium text-neutral-800 ml-2">{inv.moveOutDate ? new Date(inv.moveOutDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span></div>
              </>
            ) : (
              <>
                <div><span className="text-emerald-500">เดือน</span> <span className="font-medium text-neutral-800 ml-2">{formatMonth(inv.month)}</span></div>
                <div className="text-right"><span className="text-emerald-500">วันที่</span> <span className="font-medium text-neutral-800 ml-2">{receiptDate}</span></div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <table className="w-full mb-6">
        <thead>
          <tr className="border-b-2 border-emerald-200/60">
            {isDaily ? (
              <>
                <th className="text-left pb-2 font-semibold text-[12px] text-emerald-700 uppercase tracking-wider">รายการ</th>
                <th className="text-left pb-2 font-semibold text-[12px] text-emerald-700 uppercase tracking-wider">รายละเอียด</th>
                <th className="text-center pb-2 font-semibold text-[12px] text-emerald-700 uppercase tracking-wider">ราคา/หน่วย</th>
                <th className="text-right pb-2 font-semibold text-[12px] text-emerald-700 uppercase tracking-wider">จำนวนเงิน</th>
              </>
            ) : (
              <>
                <th className="text-left pb-2 font-semibold text-[12px] text-emerald-700 uppercase tracking-wider">รายการ</th>
                <th className="text-left pb-2 font-semibold text-[12px] text-emerald-700 uppercase tracking-wider">รายละเอียด</th>
                <th className="text-right pb-2 font-semibold text-[12px] text-emerald-700 uppercase tracking-wider">จำนวนเงิน</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b border-emerald-50">
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
      <div className="flex justify-end pb-2 mb-2 border-b border-emerald-200/60">
        <div className="flex items-baseline gap-6">
          <span className="text-sm font-bold text-emerald-700">รวมทั้งสิ้น</span>
          <span className="text-base font-bold text-emerald-700">{total.toLocaleString()} บาท</span>
        </div>
      </div>

      {/* Baht Text */}
      <div className="mb-6 px-4 py-2 bg-emerald-50/50 rounded-lg border border-emerald-100/40">
        <span className="text-[11px] text-emerald-600 font-medium">จำนวนเงินเป็นตัวอักษร: </span>
        <span className="text-[11px] text-neutral-700">{bahtText}</span>
      </div>

      {/* Signature */}
      <div className="flex justify-between pt-8 mt-4">
        <div className="text-center flex flex-col justify-end min-h-[80px]">
          <div className="border-b border-dotted border-neutral-300 w-40 mb-0.5">&nbsp;</div>
          <div className="text-[12px] text-neutral-500">ผู้ชำระเงิน</div>
          <div className="text-[12px] text-neutral-400 mt-0.5">วันที่ {receiptDate}</div>
        </div>
        <div className="text-center flex flex-col justify-end min-h-[80px]">
          {settings.signature ? (
            <div className="relative inline-block">
              <img src={settings.signature} alt="ลายเซ็น" className="w-28 h-10 object-contain" />
              {settings.stamp && <img src={settings.stamp} alt="ตรายาง" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 object-contain opacity-70" />}
            </div>
          ) : settings.stamp ? (
            <img src={settings.stamp} alt="ตรายาง" className="w-28 h-28 object-contain mx-auto" />
          ) : (
            <div className="border-b border-dotted border-neutral-300 w-40 mb-0.5">&nbsp;</div>
          )}
          <div className="text-[12px] text-neutral-500">ผู้รับเงิน</div>
          <div className="text-[12px] text-neutral-400 mt-0.5">วันที่ {receiptDate}</div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-6 pt-4 border-t border-emerald-100">
        <p className="text-[11px] text-emerald-400">{settings.dormName || 'หอพัก'} • โทร {settings.phone}</p>
      </div>
    </div>
  )
}

function numberToBahtText(num) {
  if (num === 0) return 'ศูนย์บาทถ้วน'
  const digits = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
  const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน']
  
  function convert(n) {
    if (n === 0) return ''
    const s = n.toString()
    let result = ''
    const len = s.length
    for (let i = 0; i < len; i++) {
      const d = parseInt(s[i])
      const pos = len - i - 1
      const unit = units[pos % 6]
      if (d === 0) continue
      if (pos % 6 === 1 && d === 2) {
        result += 'ยี่' + unit
      } else if (pos % 6 === 1 && d === 1) {
        result += 'สิบ'
      } else if (pos % 6 === 0 && d === 1 && len > 1) {
        result += 'เอ็ด'
      } else {
        result += digits[d] + unit
      }
    }
    return result
  }
  
  const baht = Math.floor(num)
  const satang = Math.round((num - baht) * 100)
  
  let text = convert(baht) + 'บาท'
  if (satang === 0) text += 'ถ้วน'
  else text += convert(satang) + 'สตางค์'
  
  return text
}
