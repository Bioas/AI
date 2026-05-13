import { forwardRef } from 'react'

const variants = {
  primary: 'bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-900 shadow-sm shadow-zinc-900/10',
  secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 active:bg-zinc-100',
  ghost: 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-600 shadow-sm shadow-red-600/10',
  outline: 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 active:bg-zinc-100',
}

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
}

const Button = forwardRef(({ variant = 'primary', size = 'md', className = '', children, icon, ...props }, ref) => (
  <button
    ref={ref}
    className={`inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
    {...props}
  >
    {icon && <span className="shrink-0">{icon}</span>}
    {children}
  </button>
))

Button.displayName = 'Button'
export default Button
