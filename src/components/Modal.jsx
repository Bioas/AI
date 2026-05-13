export default function Modal({ onClose, children, maxWidth = 'max-w-lg' }) {
  return (
    <div className="fixed inset-0 bg-neutral-900/30 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-xl shadow-neutral-900/10 w-full ${maxWidth} max-h-[85vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
