const variants = {
  default: 'bg-slate-100 text-slate-600',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200/50',
  danger: 'bg-rose-50 text-rose-700 border border-rose-200/50',
  info: 'bg-blue-50 text-blue-700 border border-blue-200/50',
  paid: 'bg-teal-50 text-teal-700 border border-teal-200/50',
}

export default function Badge({ variant = 'default', className = '', children }) {
  return (
    <span className={`badge-status ${variants[variant]} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        variant === 'success' || variant === 'paid' ? 'bg-emerald-500' :
        variant === 'warning' ? 'bg-amber-500' :
        variant === 'danger' ? 'bg-rose-500' :
        variant === 'info' ? 'bg-blue-500' : 'bg-slate-400'
      }`} />
      {children}
    </span>
  )
}
