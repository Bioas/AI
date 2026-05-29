import { motion } from 'framer-motion'
import { useState, useMemo, memo } from 'react'
import { useApp } from '../context/AppContext'
import { formatMonth, naturalSortRoomNumber } from '../lib/constants'
import DatePickerField from './ui/datepicker'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import EmptyState from './ui/empty-state'
import MeterModal from './MeterModal'
import ReloadButton from './ui/reload-button'

function ElecIcon({ className = 'w-3.5 h-3.5 inline' }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
}
function WaterIcon({ className = 'w-3.5 h-3.5 inline' }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
}
const METER_HEADERS = ['ห้อง', 'ผู้พัก', 'elec_before', 'elec_current', 'elec_usage', 'water_before', 'water_current', 'water_usage', 'จัดการ']

const RATE_CARDS = [
  { key: 'elec', label: 'ค่าไฟ', field: 'rateElec', default: 7, bg: 'amber' },
  { key: 'water', label: 'ค่าน้ำ', field: 'rateWater', default: 20, bg: 'cyan' },
]

const RATE_STYLES = {
  amber: {
    card: 'from-amber-50 to-amber-50/60 border-amber-200/60',
    circle1: 'bg-amber-200/20', circle2: 'bg-amber-300/10',
    icon: 'from-amber-400 to-amber-500', text: 'text-amber-700',
  },
  cyan: {
    card: 'from-cyan-50 to-cyan-50/60 border-cyan-200/60',
    circle1: 'bg-cyan-200/20', circle2: 'bg-cyan-300/10',
    icon: 'from-cyan-400 to-cyan-500', text: 'text-cyan-700',
  },
}

const MOBILE_CARD_META = {
  elec: { container: 'bg-amber-50/60 rounded-xl px-3.5 py-2.5 border border-amber-100/50', icon: 'elec', label: 'ไฟ' },
  water: { container: 'bg-cyan-50/60 rounded-xl px-3.5 py-2.5 border border-cyan-100/50', icon: 'water', label: 'น้ำ' },
}

function getMeterUsage(cur, prev) {
  if (cur === '' || prev === '') return null
  return Math.max(0, Number(cur) - Number(prev))
}

const HEADER_ICONS = {
  elec_before: <><ElecIcon className="w-3.5 h-3.5 inline text-amber-500" /> ไฟก่อน</>,
  elec_current: <><ElecIcon className="w-3.5 h-3.5 inline text-amber-500" /> ปัจจุบัน</>,
  elec_usage: <><ElecIcon className="w-3.5 h-3.5 inline text-amber-500" /> ใช้จริง</>,
  water_before: <><WaterIcon className="w-3.5 h-3.5 inline text-cyan-500" /> น้ำก่อน</>,
  water_current: <><WaterIcon className="w-3.5 h-3.5 inline text-cyan-500" /> ปัจจุบัน</>,
  water_usage: <><WaterIcon className="w-3.5 h-3.5 inline text-cyan-500" /> ใช้จริง</>,
}

function MeterValue({ val }) {
  return val !== '' && val !== undefined && val !== null
    ? <span>{val}</span>
    : <span className="text-neutral-300">—</span>
}

function UsageBadge({ val }) {
  if (val === null) return <span className="text-neutral-300">—</span>
  return <span className="inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700 text-xs font-bold">{val}</span>
}

function MeterCellGroup({ prev, cur, usage }) {
  return (
    <>
      <td className="px-3 py-3.5 text-neutral-600 font-mono text-xs align-middle"><MeterValue val={prev} /></td>
      <td className="px-3 py-3.5 text-neutral-800 font-mono text-sm font-semibold align-middle"><MeterValue val={cur} /></td>
      <td className="px-3 py-3.5 align-middle"><UsageBadge val={usage} /></td>
    </>
  )
}

const DesktopRow = memo(function DesktopRow({ room, ml, eu, wu, onEdit }) {
  const number = room.roomNumber || room.number
  const name = room.tenantName || '—'
  return (
    <tr onClick={() => onEdit(room)} className="cursor-pointer hover:bg-lime-50/30 transition-colors">
      <td className="px-3 py-3.5 align-middle">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-lime-500 text-neutral-900 text-xs font-bold shadow-sm">{number}</span>
      </td>
      <td className="px-3 py-3.5 text-neutral-700 align-middle">{name}</td>
      <MeterCellGroup prev={ml.prev.elec} cur={ml.cur.elec} usage={eu} />
      <MeterCellGroup prev={ml.prev.water} cur={ml.cur.water} usage={wu} />
      <td className="px-3 py-3.5 align-middle text-center">
        <button onClick={(e) => { e.stopPropagation(); onEdit(room) }} className="h-8 px-3.5 rounded-lg text-xs font-medium bg-lime-50 text-lime-700 hover:bg-lime-100 transition-colors border border-lime-100">แก้ไข</button>
      </td>
    </tr>
  )
})

function MobileMeterCard({ ml, type, usage }) {
  const m = MOBILE_CARD_META[type]
  const prev = ml.prev[type]
  const cur = ml.cur[type]
  return (
    <div className={m.container}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 mb-1.5">
        <span>{m.icon === 'elec' ? <ElecIcon className="w-3.5 h-3.5 inline text-amber-500" /> : <WaterIcon className="w-3.5 h-3.5 inline text-cyan-500" />}</span>
        <span>{m.label}</span>
      </div>
      <div className="flex items-center gap-1.5 text-sm">
        <span className="font-mono text-neutral-700"><MeterValue val={prev} /></span>
        <span className="text-neutral-400">→</span>
        <span className="font-mono text-neutral-800 font-semibold"><MeterValue val={cur} /></span>
        {usage !== null && (
          <span className="ml-auto text-xs font-semibold text-teal-600">+{usage}</span>
        )}
      </div>
    </div>
  )
}

const MobileCard = memo(function MobileCard({ room, ml, eu, wu, onEdit }) {
  const number = room.roomNumber || room.number
  const name = room.tenantName || '—'
  return (
    <div onClick={() => onEdit(room)} className="px-4 py-4 space-y-3 cursor-pointer active:bg-lime-50/40 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-lime-500 text-neutral-900 text-xs font-bold shadow-sm">{number}</span>
          <span className="text-sm font-medium text-neutral-700">{name}</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onEdit(room) }} className="h-8 px-3.5 rounded-lg text-xs font-medium bg-lime-50 text-lime-700 hover:bg-lime-100 transition-colors border border-lime-100">แก้ไข</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <MobileMeterCard ml={ml} type="elec" usage={eu} />
        <MobileMeterCard ml={ml} type="water" usage={wu} />
      </div>
    </div>
  )
})

export default function Meters() {
  const { rooms: allRooms, settings, meterMonth, setMeterMonth, meterLocal, fetchAll } = useApp()
  const [editRoom, setEditRoom] = useState(null)

  const meterDate = useMemo(() => {
    if (!meterMonth) return null
    const [y, m] = meterMonth.split('-').map(Number)
    return new Date(y, m - 1, 1)
  }, [meterMonth])

  const occRooms = useMemo(() => {
    const filtered = allRooms.filter(r => (r.residentId || r.tenantName) && r.rentalType !== 'daily' && r.rentalType !== 'รายวัน')
    filtered.sort(naturalSortRoomNumber)
    return filtered
  }, [allRooms])

  const roomMetersData = useMemo(() => {
    return occRooms.map(r => {
      const ml = meterLocal[r.id] || { cur: { elec: '', water: '' }, prev: { elec: '', water: '' } }
      return { room: r, ml, eu: getMeterUsage(ml.cur.elec, ml.prev.elec), wu: getMeterUsage(ml.cur.water, ml.prev.water) }
    })
  }, [occRooms, meterLocal])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader title="บันทึกมิเตอร์" description="บันทึกเลขมาตรไฟฟ้าและน้ำประปารายเดือน" />

      <div className="flex flex-row items-center gap-3 mb-6 sm:mb-8 bg-white rounded-2xl shadow-card border border-lime-100/40 px-4 sm:px-6 py-4">
        <label className="text-sm font-medium text-neutral-600 shrink-0">เดือน:</label>
        <div className="flex-1 sm:flex-none sm:w-44">
          <DatePickerField selected={meterDate} onChange={(date) => { if (date) setMeterMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`) }} showMonthPicker placeholder="เลือกเดือน" />
        </div>
        <ReloadButton onReload={fetchAll} className="ml-auto" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-2 h-2 rounded-full bg-lime-400" />
            <h3 className="text-sm font-semibold text-neutral-800">ข้อมูลมิเตอร์ — {formatMonth(meterMonth)}</h3>
          </div>
          <p className="text-xs text-neutral-400 mb-6 ml-5">กดปุ่มแก้ไขเพื่อบันทึกเลขมาตรแต่ละห้อง</p>

          {occRooms.length === 0 ? (
            <EmptyState icon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>} title="ไม่มีห้องที่มีผู้พัก" description="เพิ่มผู้พักในห้องก่อนจึงจะบันทึกเลขมิเตอร์ได้" />
          ) : (
            <div className="border border-neutral-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm hidden md:table">
                <colgroup>
                  <col className="w-16" />
                  <col />
                  {Array.from({ length: 6 }, (_, i) => (
                    <col key={i} className={i < 3 ? 'bg-amber-50/40' : 'bg-cyan-50/40'} />
                  ))}
                  <col className="w-20" />
                </colgroup>
                <thead>
                  <tr className="bg-neutral-50/80">
                    {METER_HEADERS.map((h, i) => (
                      <th key={h} scope="col" className={`text-left px-3 py-3.5 text-xs font-semibold text-neutral-500 tracking-wider whitespace-nowrap ${i === 8 ? 'text-center' : ''}`}>{HEADER_ICONS[h] || h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {roomMetersData.map(d => (
                    <DesktopRow key={d.room.id} {...d} onEdit={setEditRoom} />
                  ))}
                </tbody>
              </table>

              <div className="divide-y divide-neutral-100 md:hidden">
                {roomMetersData.map(d => (
                  <MobileCard key={d.room.id} {...d} onEdit={setEditRoom} />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6">
        {RATE_CARDS.map(c => {
          const s = RATE_STYLES[c.bg]
          return (
            <div key={c.key} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${s.card} border shadow-sm`}>
              <div className={`absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full ${s.circle1}`} />
              <div className={`absolute bottom-0 left-0 w-16 h-16 -ml-4 -mb-4 rounded-full ${s.circle2}`} />
              <div className="relative px-5 py-4 sm:px-6 sm:py-5">
                <div className="flex items-center gap-2.5 mb-3">
                   <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br ${s.icon} text-white text-base shadow-sm`}>{c.key === 'elec' ? <ElecIcon className="w-4 h-4" /> : <WaterIcon className="w-4 h-4" />}</span>
                  <span className={`text-xs font-semibold tracking-wide ${s.text} uppercase`}>{c.label}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-bold text-neutral-800 tracking-tight">{settings?.[c.field] || c.default}</span>
                  <span className="text-sm font-medium text-neutral-400">บาท/หน่วย</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {editRoom && <MeterModal room={editRoom} onClose={() => setEditRoom(null)} />}
    </motion.div>
  )
}
