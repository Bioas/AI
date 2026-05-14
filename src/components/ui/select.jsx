import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Select({ value, onChange, options, placeholder = 'เลือก', error, searchable, className = '' }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setQ('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open && searchable && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open, searchable])

  const selected = options.find(o => o.value === value)
  const filtered = searchable
    ? options.filter(o => String(o.label).toLowerCase().includes(q.toLowerCase()))
    : options

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full h-10 px-3.5 flex items-center justify-between bg-white border rounded-xl text-sm transition-all duration-200 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 ${error ? 'border-rose-300' : 'border-neutral-200'} ${selected ? 'text-neutral-800' : 'text-neutral-400'}`}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <svg className={`w-4 h-4 text-neutral-400 shrink-0 ml-2 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 top-full mt-1 left-0 w-full min-w-[200px] bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden origin-top"
          >
            {searchable && (
              <div className="p-2 border-b border-neutral-100">
                <input
                  ref={inputRef}
                  type="text"
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="ค้นหา..."
                  className="w-full h-8 px-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:border-lime-400"
                />
              </div>
            )}
            <div className="max-h-60 overflow-y-auto py-1">
              {filtered.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setQ('') }}
                  className={`w-full px-3.5 py-2.5 text-sm text-left flex items-center justify-between transition-colors hover:bg-lime-50 ${opt.value === value ? 'text-lime-700 font-medium bg-lime-50/50' : 'text-neutral-700'}`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && (
                    <svg className="w-4 h-4 text-lime-500 shrink-0 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-3.5 py-3 text-xs text-neutral-400 text-center">ไม่พบตัวเลือก</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
