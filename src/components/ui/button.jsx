import { forwardRef } from 'react'

const variants = {
  primary: 'bg-gradient-to-br from-lime-400 to-lime-500 text-neutral-900 hover:from-lime-300 hover:to-lime-400 active:from-lime-500 active:to-lime-600 shadow-md shadow-lime-200/50 hover:shadow-lg hover:shadow-lime-300/40 font-semibold',
  secondary: 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 active:bg-neutral-100 shadow-sm',
  ghost: 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100/80',
  danger: 'bg-gradient-to-br from-rose-400 to-rose-500 text-white hover:from-rose-300 hover:to-rose-400 shadow-md shadow-rose-200/50',
  outline: 'border-2 border-lime-300 text-lime-700 hover:bg-lime-50 hover:border-lime-400 active:bg-lime-100 font-semibold',
}

const sizes = {
  sm: 'h-8 px-3.5 text-xs gap-1.5 rounded-xl',
  md: 'h-10 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-7 text-base gap-2.5 rounded-2xl',
}

const Button = forwardRef(({ variant = 'primary', size = 'md', className = '', children, icon, ...props }, ref) => (
  <button
    ref={ref}
    className={`inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lime-300 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
    {...props}
  >
    {icon && <span className="shrink-0 text-base">{icon}</span>}
    {children}
  </button>
))

Button.displayName = 'Button'
export default Button
