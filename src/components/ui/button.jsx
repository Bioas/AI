import { forwardRef } from 'react'

const variants = {
  primary: 'bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600 active:from-blue-700 active:to-blue-800 shadow-md shadow-blue-200/50 hover:shadow-lg hover:shadow-blue-300/40',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 shadow-sm',
  ghost: 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/80',
  danger: 'bg-gradient-to-br from-rose-500 to-rose-600 text-white hover:from-rose-400 hover:to-rose-500 shadow-md shadow-rose-200/50',
  outline: 'border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 active:bg-blue-100',
}

const sizes = {
  sm: 'h-8 px-3.5 text-xs gap-1.5 rounded-xl',
  md: 'h-10 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-7 text-base gap-2.5 rounded-2xl',
}

const Button = forwardRef(({ variant = 'primary', size = 'md', className = '', children, icon, ...props }, ref) => (
  <button
    ref={ref}
    className={`inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
    {...props}
  >
    {icon && <span className="shrink-0 text-base">{icon}</span>}
    {children}
  </button>
))

Button.displayName = 'Button'
export default Button
