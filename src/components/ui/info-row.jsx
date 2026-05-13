export default function InfoRow({ label, value, icon }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-zinc-50 last:border-0">
      {icon && <span className="text-base mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium text-zinc-400">{label}</dt>
        <dd className="text-sm font-medium text-zinc-900 mt-0.5 break-words">{value || <span className="text-zinc-300 italic">—</span>}</dd>
      </div>
    </div>
  )
}
