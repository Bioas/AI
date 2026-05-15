import ReloadButton from './reload-button'

export default function PageHeader({ title, description, action, onReload }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-5 mb-6 sm:mb-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 tracking-tight">{title}</h1>
        {description && <p className="text-sm text-neutral-500 mt-1.5">{description}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onReload && <ReloadButton onReload={onReload} />}
        {action && <div>{action}</div>}
      </div>
    </div>
  )
}
