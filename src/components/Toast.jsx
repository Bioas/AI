import { useApp } from '../context/AppContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function ToastContainer() {
  const { toasts } = useApp()

  return (
    <div className="fixed top-4 right-4 z-[300] flex flex-col gap-2.5 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg shadow-neutral-900/5 border text-sm font-medium ${
              t.err ? 'bg-white border-rose-200 text-rose-700' : 'bg-white border-lime-200 text-lime-800'
            }`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center ${
              t.err ? 'bg-rose-50 text-rose-500' : 'bg-lime-50 text-lime-600'
            }`}>{t.err
              ? <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
              : <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
            }</span>
            <span>{t.msg}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
