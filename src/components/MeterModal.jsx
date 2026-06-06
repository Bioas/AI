import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { calcWaterCost, getPrevMeter } from '../lib/constants'
import Modal from './ui/modal'
import Button from './ui/button'
import Input from './ui/input'

export default function MeterModal({ room, onClose }) {
  const { meters, meterMonth, fetchAll, toast, settings } = useApp()
  const existingCur = meters.find(x => x.roomId === room.id && x.month === meterMonth) || {}

  const [curElec, setCurElec] = useState(existingCur.elec?.toString() || '')
  const [curWater, setCurWater] = useState(existingCur.water?.toString() || '')
  const [saving, setSaving] = useState(false)

  const prev = useMemo(() => getPrevMeter(room.id, meterMonth, meters, room.prevElecMeter ?? '', room.prevWaterMeter ?? ''), [room.id, meterMonth, meters, room.prevElecMeter, room.prevWaterMeter])
  const prevElec = prev.elec?.toString() || ''
  const prevWater = prev.water?.toString() || ''

  const eu = (curElec && prevElec) ? Math.max(0, Number(curElec) - Number(prevElec)) : null
  const wu = (curWater && prevWater) ? Math.max(0, Number(curWater) - Number(prevWater)) : null
  const re = settings.rateElec || 7, rw = settings.rateWater || 20

  const handleSave = async () => {
    setSaving(true)
    try {
      const { api } = await import('../lib/api')
      const bc = { roomId: room.id, month: meterMonth, elec: Number(curElec) || 0, water: Number(curWater) || 0 }
      if (existingCur._id || curElec || curWater) existingCur._id ? await api('/api/meters', 'PUT', bc) : await api('/api/meters', 'POST', bc)
      await fetchAll(); toast('บันทึกหน่วยมิเตอร์เรียบร้อย'); onClose()
    } catch (e) { toast(`บันทึกไม่สำเร็จ: ${e.message}`, true) }
    setSaving(false)
  }

  return (
    <Modal open={true} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-100">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 text-xs font-bold shadow-sm">{room.roomCode || room.roomNumber || room.number}</span>
          <div>
            <h3 className="text-base font-semibold text-neutral-800">บันทึกหน่วยมิเตอร์</h3>
            <p className="text-xs text-neutral-400">{room.tenantName || 'ไม่มีผู้พัก'}</p>
            {room.roomType && <p className="text-xs text-lime-600 mt-0.5">{room.roomType}</p>}
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center text-xs"><svg className="w-3 h-3 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>
              <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">มิเตอร์ไฟฟ้า</h4>
            </div>
            <Input label="เลขปัจจุบัน" type="number" value={curElec} onChange={e => setCurElec(e.target.value.replace(/\D/g, ''))} inputMode="numeric" />
            {eu !== null && <p className="text-xs text-teal-600 font-medium mt-2">ใช้ไป {eu} หน่วย = {(eu * re).toLocaleString()} บาท</p>}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-cyan-50 border border-cyan-100 flex items-center justify-center text-xs"><svg className="w-3 h-3 text-cyan-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg></div>
              <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">มิเตอร์น้ำ</h4>
            </div>
            <Input label="เลขปัจจุบัน" type="number" value={curWater} onChange={e => setCurWater(e.target.value.replace(/\D/g, ''))} inputMode="numeric" />
            {wu !== null && <p className="text-xs text-teal-600 font-medium mt-2">ใช้ไป {wu} หน่วย = {calcWaterCost(wu, rw).toLocaleString()} บาท{wu > 0 && wu <= 4 ? ' (เหมาจ่าย)' : ''}</p>}
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-neutral-100">
          <Button variant="ghost" onClick={onClose} disabled={saving}>ยกเลิก</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
        </div>
      </div>
    </Modal>
  )
}
