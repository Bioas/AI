import { useApp } from '../context/AppContext'
import { formatThaiDate } from '../lib/constants'

export default function ContractPreview({ resident }) {
  const { rooms, settings } = useApp()
  const room = rooms.find(x => x.id === resident.roomId)
  const roomNumber = room?.roomNumber || room?.number || '—'
  const rentPrice = room?.rentPrice || room?.rent || 0

  const now = new Date()
  const y = now.getFullYear() + 543
  const m = now.getMonth() + 1
  const d = now.getDate()

  return (
    <div id="contractPdfContent" className="bg-white mx-auto font-sans text-[13px] text-neutral-700 leading-relaxed" style={{ padding: 40, minHeight: 1200 }}>
      <div className="h-1.5 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full mb-6" />

      <div className="text-center mb-6">
        <div className="text-lg font-bold text-emerald-800">สัญญาเช่าหอพัก</div>
        <div className="text-[11px] text-neutral-400 mt-0.5">CONTRACT AGREEMENT</div>
      </div>

      <div className="flex justify-between items-start pb-4 mb-4 border-b border-emerald-200/60">
        <div className="flex items-center gap-3">
          {settings.logo && <img src={settings.logo} alt="" className="h-14 w-14 object-contain shrink-0" />}
          <div>
            <div className="text-sm font-bold text-emerald-800">{settings.dormName || 'หอพัก'}</div>
            <div className="text-[10px] text-neutral-400 mt-0.5">{settings.address}</div>
            <div className="text-[10px] text-neutral-400">โทร {settings.phone}</div>
          </div>
        </div>
        <div className="text-right pt-1">
          <div className="text-xs text-neutral-400">เลขที่สัญญา</div>
          <div className="text-sm font-semibold text-emerald-700 font-mono">CT-{resident.id?.slice(-6).toUpperCase() || '—'}</div>
          <div className="text-[10px] text-neutral-400 mt-0.5">วันที่ {d} {m} {y}</div>
        </div>
      </div>

      <div className="mb-5 px-4 py-3 bg-gradient-to-r from-emerald-50/80 to-emerald-50/30 rounded-lg border border-emerald-100/60">
        <div className="grid grid-cols-2 gap-y-1.5">
          <div><span className="text-emerald-500">ผู้เช่า</span> <span className="font-medium text-neutral-800 ml-2">{resident.name}</span></div>
          <div className="text-right"><span className="text-emerald-500">ห้อง</span> <span className="font-medium text-neutral-800 ml-2">{roomNumber}</span></div>
          <div><span className="text-emerald-500">เลขบัตรฯ</span> <span className="font-medium text-neutral-800 ml-2">{resident.idCard || '—'}</span></div>
          <div className="text-right"><span className="text-emerald-500">เบอร์โทร</span> <span className="font-medium text-neutral-800 ml-2">{resident.phone}</span></div>
          <div><span className="text-emerald-500">วันที่เข้าพัก</span> <span className="font-medium text-neutral-800 ml-2">{formatThaiDate(resident.moveInDate)}</span></div>
          <div className="text-right"><span className="text-emerald-500">วันหมดสัญญา</span> <span className="font-medium text-neutral-800 ml-2">{formatThaiDate(resident.moveOutDate)}</span></div>
        </div>
      </div>

      <table className="w-full mb-5">
        <thead>
          <tr className="border-b-2 border-emerald-200/60">
            <th className="text-left pb-2 font-semibold text-[12px] text-emerald-700 uppercase tracking-wider" colSpan="2">รายละเอียดสัญญา</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-emerald-50">
            <td className="py-2 pr-4 text-emerald-600 w-36 whitespace-nowrap">อัตราค่าเช่า</td>
            <td className="py-2 font-medium text-neutral-800">{rentPrice.toLocaleString()} บาท/เดือน</td>
          </tr>
          <tr className="border-b border-emerald-50">
            <td className="py-2 pr-4 text-emerald-600 whitespace-nowrap">ค่ามัดจำ</td>
            <td className="py-2 font-medium text-neutral-800">{(resident.deposit || 0).toLocaleString()} บาท</td>
          </tr>
          <tr className="border-b border-emerald-50">
            <td className="py-2 pr-4 text-emerald-600 whitespace-nowrap">ค่าไฟฟ้า</td>
            <td className="py-2 text-neutral-700">หน่วยละ {settings.rateElec || 7} บาท</td>
          </tr>
          <tr className="border-b border-emerald-50">
            <td className="py-2 pr-4 text-emerald-600 whitespace-nowrap">ค่าน้ำประปา</td>
            <td className="py-2 text-neutral-700">หน่วยละ {settings.rateWater || 20} บาท (เหมาจ่าย 150 บาท สำหรับ 0-4 หน่วยแรก)</td>
          </tr>
          <tr className="border-b border-emerald-50">
            <td className="py-2 pr-4 text-emerald-600 whitespace-nowrap">ประเภทห้อง</td>
            <td className="py-2 text-neutral-700">{room?.roomType || '—'}</td>
          </tr>
        </tbody>
      </table>

      <div className="mb-5">
        <div className="text-[12px] font-semibold text-emerald-700 uppercase tracking-wider mb-2 border-b border-emerald-100 pb-1">ข้อกำหนดและเงื่อนไข</div>
        <ol className="text-[12px] text-neutral-600 space-y-2 pl-4" style={{ listStyle: 'decimal' }}>
          <li>ผู้เช่าต้องชำระค่าเช่าตรงตามกำหนด ทุกวันที่ 5 ของเดือน หากชำระเกินกำหนดจะถูกปรับวันละ 50 บาท</li>
          <li>ผู้เช่าต้องชำระค่าสาธารณูปโภค (ค่าไฟฟ้า ค่าน้ำประปา) ตามจำนวนที่ใช้งานจริงในแต่ละเดือน</li>
          <li>ค่ามัดจำจะคืนให้แก่ผู้เช่าเมื่อสิ้นสุดสัญญา ในสภาพที่ห้องไม่มีความเสียหาย เว้นแต่ความสึกหรอตามปกติ และผู้เช่าได้ชำระค่าใช้จ่ายต่างๆ ครบถ้วนแล้ว</li>
          <li>หากผู้เช่าต้องการบอกเลิกสัญญาก่อนกำหนด ต้องแจ้งเป็นลายลักษณ์อักษรล่วงหน้าอย่างน้อย 30 วัน มิฉะนั้นจะไม่ได้รับเงินมัดจำคืน</li>
          <li>ห้ามนำสัตว์เลี้ยงทุกชนิดเข้ามาในห้องพัก</li>
          <li>ห้ามส่งเสียงดังหรือกระทำการใดๆ ที่รบกวนผู้เช่าห้องอื่น ระหว่างเวลา 22:00 - 07:00 น.</li>
          <li>ผู้เช่าต้องรักษาความสะอาดภายในห้องพักและบริเวณส่วนกลาง</li>
          <li>ผู้เช่าต้องรับผิดชอบต่อความเสียหายใดๆ ที่เกิดขึ้นแก่ทรัพย์สินของหอพักอันเกิดจากการกระทำของผู้เช่า</li>
          <li>ห้ามนำสารเสพติด อาวุธปืน หรือสิ่งผิดกฎหมายเข้ามาในบริเวณหอพัก</li>
          <li>หากพบว่าผู้เช่ากระทำผิดเงื่อนไขข้อใดข้อหนึ่ง ให้ผู้ให้เช่ามีสิทธิบอกเลิกสัญญาได้ทันที โดยไม่ต้องคืนเงินมัดจำ</li>
        </ol>
      </div>

      {resident.emergencyContact && (
        <div className="mb-5 px-4 py-2.5 bg-amber-50/50 rounded-lg border border-amber-100/60">
          <div className="text-[12px] font-semibold text-amber-700 mb-1">ผู้ติดต่อฉุกเฉิน</div>
          <div className="text-[12px] text-neutral-600">
            {resident.emergencyContact} {resident.emergencyPhone ? `— ${resident.emergencyPhone}` : ''}
          </div>
        </div>
      )}

      <div className="flex justify-around mt-8 pt-6 border-t border-emerald-100">
        <div className="text-center">
          <div className="text-[12px] text-neutral-400 mb-8">ลงชื่อ .............................................. ผู้ให้เช่า</div>
          <div className="text-[12px] text-neutral-400">({settings.dormName || 'ผู้จัดการหอพัก'})</div>
          <div className="text-[11px] text-neutral-300 mt-0.5">วันที่ ......../......../........</div>
        </div>
        <div className="text-center">
          <div className="text-[12px] text-neutral-400 mb-8">ลงชื่อ .............................................. ผู้เช่า</div>
          <div className="text-[12px] text-neutral-400">({resident.name})</div>
          <div className="text-[11px] text-neutral-300 mt-0.5">วันที่ ......../......../........</div>
        </div>
      </div>

      <div className="text-center mt-6 pt-4 border-t border-emerald-100">
        <p className="text-[11px] text-emerald-400">{settings.dormName || 'หอพัก'} • โทร {settings.phone}</p>
      </div>
    </div>
  )
}
