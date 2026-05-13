export default function Spinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center py-20 ${className}`}>
      <div className="w-6 h-6 border-[3px] border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-zinc-200 rounded-lg" />
      <div className="h-4 w-72 bg-zinc-100 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-white rounded-2xl border border-zinc-100 p-6">
            <div className="h-3 w-20 bg-zinc-100 rounded mb-3" />
            <div className="h-8 w-24 bg-zinc-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
