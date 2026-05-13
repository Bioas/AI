export default function EmptyState({ icon = '📋', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lime-100 to-lime-50 flex items-center justify-center text-2xl mb-5 shadow-sm border border-lime-200/50">
        <span className="animate-float">{icon}</span>
      </div>
      <h3 className="text-base font-semibold text-neutral-800 mb-1.5">{title}</h3>
      {description && <p className="text-sm text-neutral-500 text-center max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
