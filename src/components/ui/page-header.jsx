export default function PageHeader({ title, description, action }) {
  return (
    <div className="flex flex-row items-center justify-between gap-3 mb-6 sm:mb-10">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold text-neutral-800 tracking-tight">{title}</h1>
        {description && <p className="text-xs sm:text-sm text-neutral-500 mt-0.5 sm:mt-1.5">{description}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {action && <div>{action}</div>}
      </div>
    </div>
  )
}
