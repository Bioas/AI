import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

let toastId = 0
const listeners = new Set()

export function toast(msg, err = false) {
  const id = ++toastId
  listeners.forEach(fn => fn({ id, msg, err }))
  setTimeout(() => listeners.forEach(fn => fn({ id, remove: true })), 3500)
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const handler = ({ id, msg, err, remove }) => {
      if (remove) {
        setToasts(prev => prev.filter(t => t.id !== id))
      } else {
        setToasts(prev => [...prev, { id, msg, err }])
      }
    }
    listeners.add(handler)
    return () => listeners.delete(handler)
  }, [])

  return (
    <div className="fixed top-4 right-4 z-[300] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg shadow-black/5 backdrop-blur-xl text-sm font-medium border ${
              t.err
                ? 'bg-white border-red-200 text-red-800'
                : 'bg-white border-emerald-200 text-emerald-800'
            }`}
          >
            <span className="shrink-0 text-base">{t.err ? '⚠️' : '✓'}</span>
            <span>{t.msg}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
