import { motion } from 'framer-motion'

export default function Card({ className = '', children, hover = false, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`bg-white rounded-2xl shadow-card border border-blue-100/40 ${hover ? 'hover:shadow-card-hover hover:border-blue-200/60 transition-all duration-300 hover:-translate-y-0.5' : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}

export function CardHeader({ className = '', children }) {
  return <div className={`px-6 pt-6 pb-3 ${className}`}>{children}</div>
}

export function CardContent({ className = '', children }) {
  return <div className={`px-6 pb-6 ${className}`}>{children}</div>
}
