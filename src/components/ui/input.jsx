import { forwardRef } from 'react'

const Input = forwardRef(({ label, error, className = '', ...props }, ref) => (
  <div className="space-y-1.5">
    {label && (
      <label className="block text-sm font-medium text-zinc-700">{label}</label>
    )}
    <input
      ref={ref}
      className={`w-full h-10 px-3.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 transition-all duration-200 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''} ${className}`}
      {...props}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
))

Input.displayName = 'Input'
export default Input
