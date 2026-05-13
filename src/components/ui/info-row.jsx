export default function InfoRow({ label, value, icon }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-neutral-50 last:border-0">
      {icon && <span className="text-lg mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium text-neutral-400">{label}</dt>
        <dd className="text-sm font-medium text-neutral-800 mt-0.5 break-words">{value || <span className="text-neutral-300 italic">—</span>}</dd>
      </div>
    </div>
  )
}
