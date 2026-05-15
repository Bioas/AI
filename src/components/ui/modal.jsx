import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Modal({ open, onClose, children, maxWidth = 'max-w-lg' }) {
  const handleKey = useCallback(e => { if (e.key === 'Escape') onClose?.() }, [onClose])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, handleKey])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-neutral-900/30 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }} transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={`relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl shadow-neutral-900/10 w-full ${maxWidth} max-h-[85vh] sm:max-h-[85vh] overflow-y-auto`}
            onClick={e => e.stopPropagation()}>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
