import { forwardRef } from 'react'

const Input = forwardRef(({ label, error, className = '', ...props }, ref) => (
  <div className="space-y-1.5">
    {label && <label className="block text-sm font-medium text-neutral-700">{label}</label>}
    <input
      ref={ref}
      className={`w-full h-10 px-3.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 ${error ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : ''} ${className}`}
      {...props}
    />
    {error && <p className="text-xs text-rose-500">{error}</p>}
  </div>
))

Input.displayName = 'Input'
export default Input
