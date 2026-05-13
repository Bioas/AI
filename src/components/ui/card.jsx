export default function Card({ className = '', children, hover = false, ...props }) {
  const base = 'bg-white rounded-2xl border border-zinc-100 shadow-sm shadow-zinc-200/50'
  const hoverStyles = 'hover:shadow-md hover:shadow-zinc-200/60 hover:border-zinc-200 transition-all duration-300'
  return (
    <div className={`${base} ${hover ? hoverStyles : ''} ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children }) {
  return <div className={`px-6 pt-6 pb-4 ${className}`}>{children}</div>
}

export function CardContent({ className = '', children }) {
  return <div className={`px-6 pb-6 ${className}`}>{children}</div>
}
