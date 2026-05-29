export default function EmptyState({ icon = <svg className="w-6 h-6 text-lime-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lime-100 to-lime-50 flex items-center justify-center text-lime-500 mb-5 shadow-sm border border-lime-200/50">
        <span className="animate-float">{icon}</span>
      </div>
      <h3 className="text-base font-semibold text-neutral-800 mb-1.5">{title}</h3>
      {description && <p className="text-sm text-neutral-500 text-center max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
