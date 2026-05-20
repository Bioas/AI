import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { THAI_MONTHS, THAI_SHORT_MONTHS } from '../../lib/constants'

const DAYS_TH = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']
const MONTHS = THAI_MONTHS.slice(1)

function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate() }
function firstDow(y, m) { return new Date(y, m, 1).getDay() }
function isSameDay(a, b) { return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate() }
function isToday(d) { return isSameDay(d, new Date()) }
function pad(n) { return String(n).padStart(2, '0') }
function toDateStr(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

export default function DatePickerField({ selected, onChange, showMonthPicker, placeholder, error, minDate, maxDate }) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState('day')
  const today = new Date()
  const [viewDate, setViewDate] = useState(selected || today)
  const ref = useRef(null)
  const panelRef = useRef(null)
  const initRef = useRef(false)
  const [portalPos, setPortalPos] = useState({ top: 0, left: 0, width: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (initRef.current && selected) setViewDate(selected)
    initRef.current = true
  }, [selected])

  useEffect(() => {
    if (initRef.current && selected) setViewDate(selected)
    initRef.current = true
  }, [selected])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target) && panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
        setView(showMonthPicker ? 'month' : 'day')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMonthPicker])

  const vy = viewDate.getFullYear()
  const vm = viewDate.getMonth()

  const prevDisabled = view === 'year' ? false : minDate && new Date(vy, vm, 0) < minDate
  const nextDisabled = view === 'year' ? false : maxDate && new Date(vy, vm + 2, 0) > maxDate

  const goPrev = () => {
    if (view === 'month') setViewDate(new Date(vy - 1, vm, 1))
    else if (view === 'year') setViewDate(new Date(vy - 12, vm, 1))
    else setViewDate(new Date(vy, vm - 1, 1))
  }
  const goNext = () => {
    if (view === 'month') setViewDate(new Date(vy + 1, vm, 1))
    else if (view === 'year') setViewDate(new Date(vy + 12, vm, 1))
    else setViewDate(new Date(vy, vm + 1, 1))
  }

  const pickDate = (d) => {
    const nd = new Date(vy, vm, d)
    if (minDate && nd < minDate) return
    if (maxDate && nd > maxDate) return
    onChange(nd)
    setOpen(false)
  }
  const pickMonth = (m) => {
    setViewDate(new Date(vy, m, 1))
    if (showMonthPicker) { onChange(new Date(vy, m, 1)); setOpen(false); return }
    setView('day')
  }
  const pickYear = (y) => {
    setViewDate(new Date(y, vm, 1))
    setView(showMonthPicker ? 'month' : 'day')
  }

  const fmt = (date) => {
    if (!date) return ''
    const d = date.getDate(); const m = date.getMonth(); const y = date.getFullYear() + 543
    if (showMonthPicker) return `${THAI_MONTHS[m + 1]} ${y}`
    return `${d} ${THAI_SHORT_MONTHS[m + 1]} ${y}`
  }

  const selCls = 'bg-lime-500 text-white font-semibold hover:bg-lime-600'
  const btnCls = 'flex items-center justify-center rounded-lg transition-colors text-sm cursor-pointer'
  const cellCls = `w-9 h-9 leading-9 text-center text-neutral-700 rounded-lg transition-colors hover:bg-lime-100 ${btnCls}`

  const yearStart = Math.floor(vy / 12) * 12
  const yearRange = Array.from({ length: 12 }, (_, i) => yearStart + i)

  const firstDay = firstDow(vy, vm)
  const dim = daysInMonth(vy, vm)
  const prevDim = daysInMonth(vy, vm - 1)
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push({ d: prevDim - firstDay + 1 + i, other: true })
  for (let i = 1; i <= dim; i++) cells.push({ d: i, other: false })
  const rem = cells.length % 7
  if (rem) for (let i = 1; i <= 7 - rem; i++) cells.push({ d: i, other: true })

  const clearable = selected && !showMonthPicker

  const panel = (content) => (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect()
          const panelHeight = 320
          const spaceBelow = window.innerHeight - rect.bottom
          const flipUp = spaceBelow < panelHeight
          setPortalPos({
            top: flipUp ? rect.top - panelHeight - 4 : rect.bottom + 4,
            left: rect.left,
            width: rect.width
          })
        }
        setOpen(!open)
        setView(showMonthPicker ? 'month' : 'day')
      }}
        className={`w-full h-10 px-3.5 flex items-center justify-between bg-white border rounded-xl text-sm transition-all duration-200 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 ${error ? 'border-rose-300' : 'border-neutral-200'} ${selected ? 'text-neutral-800' : 'text-neutral-400'}`}>
        <span className="truncate">{fmt(selected) || placeholder}</span>
        <svg className={`w-4 h-4 text-neutral-400 shrink-0 ml-2 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      <AnimatePresence>{open && (
        <motion.div ref={panelRef} initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.12 }}
          className="fixed z-[9999] bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden origin-top min-w-[224px]"
          style={{ top: portalPos.top, left: portalPos.left, width: Math.max(portalPos.width, 224) }}>
          {content}
        </motion.div>
      )}</AnimatePresence>
      {clearable && selected && !open && (
        <button type="button" onClick={() => { onChange(null) }}
          className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-neutral-300 hover:text-neutral-500 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      )}
    </div>
  )

  if (showMonthPicker) return panel(
    <div className="p-3">
      <div className="flex items-center justify-between mb-3 px-1">
        <button type="button" onClick={goPrev} className={`w-7 h-7 ${btnCls} hover:bg-lime-100 text-neutral-600 text-sm`}>◀</button>
        <button type="button" onClick={() => setView(view === 'month' ? 'year' : 'month')} className="text-sm font-semibold text-neutral-800 hover:text-lime-700 transition-colors px-2">
          {vy + 543}
        </button>
        <button type="button" onClick={goNext} className={`w-7 h-7 ${btnCls} hover:bg-lime-100 text-neutral-600 text-sm`}>▶</button>
      </div>
      {view === 'year' ? (
        <div className="grid grid-cols-4 gap-1">
          {yearRange.map(y => (
            <button key={y} type="button" onClick={() => pickYear(y)}
              className={`h-10 text-center text-sm rounded-lg transition-colors hover:bg-lime-100 ${y === vy ? selCls : 'text-neutral-700'}`}>
              {y + 543}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-1">
          {MONTHS.map((name, i) => (
            <button key={name} type="button" onClick={() => pickMonth(i)}
              className={`h-10 text-center text-sm rounded-lg transition-colors hover:bg-lime-100 ${i === vm ? selCls : 'text-neutral-700'}`}>
              {name.slice(0, 3)}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return panel(
    <div className="p-3">
      <div className="flex items-center justify-between mb-1">
        <button type="button" onClick={goPrev} className={`w-7 h-7 ${btnCls} hover:bg-lime-100 text-neutral-600 text-sm`}>◀</button>
        <div className="flex gap-1">
          <button type="button" onClick={() => setView('month')} className="text-sm font-semibold text-neutral-800 hover:text-lime-700 transition-colors px-1">{MONTHS[vm]}</button>
          <button type="button" onClick={() => setView('year')} className="text-sm font-semibold text-neutral-800 hover:text-lime-700 transition-colors px-1">{vy + 543}</button>
        </div>
        <button type="button" onClick={goNext} className={`w-7 h-7 ${btnCls} hover:bg-lime-100 text-neutral-600 text-sm`}>▶</button>
      </div>

      {view === 'month' ? (
        <div className="grid grid-cols-4 gap-1 mt-2">
          {MONTHS.map((name, i) => (
            <button key={name} type="button" onClick={() => pickMonth(i)}
              className={`h-10 text-center text-sm rounded-lg transition-colors hover:bg-lime-100 ${i === vm ? selCls : 'text-neutral-700'}`}>
              {name.slice(0, 3)}
            </button>
          ))}
        </div>
      ) : view === 'year' ? (
        <div className="grid grid-cols-4 gap-1 mt-2">
          {yearRange.map(y => (
            <button key={y} type="button" onClick={() => pickYear(y)}
              className={`h-10 text-center text-sm rounded-lg transition-colors hover:bg-lime-100 ${y === vy ? selCls : 'text-neutral-700'}`}>
              {y + 543}
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 mt-2 mb-1">
            {DAYS_TH.map(d => <div key={d} className="h-7 text-center text-xs text-neutral-400">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((c, i) => {
              const d = new Date(vy, vm, c.d)
              const isSel = isSameDay(d, selected)
              const disabled = (minDate && d < minDate) || (maxDate && d > maxDate)
              return (
                <button key={i} type="button" disabled={disabled}
                  onClick={() => !c.other && pickDate(c.d)}
                  className={`h-9 text-center text-xs rounded-lg transition-colors hover:bg-lime-100 ${c.other ? 'text-neutral-200 cursor-default' : 'text-neutral-700'} ${isSel ? selCls : ''} ${isToday(d) && !isSel ? 'text-lime-600 font-semibold' : ''} ${disabled ? 'text-neutral-200 cursor-not-allowed hover:bg-transparent' : ''}`}>
                  {c.d}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
