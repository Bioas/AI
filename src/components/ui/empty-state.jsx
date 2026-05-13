export default function EmptyState({ icon = '📋', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-2xl mb-4 animate-float">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-zinc-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-zinc-500 text-center max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
