export default function PageHeader({ title, description, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-5 mb-6 sm:mb-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 tracking-tight">{title}</h1>
        {description && <p className="text-sm text-neutral-500 mt-1.5">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
