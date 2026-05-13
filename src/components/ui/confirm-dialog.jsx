export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', variant = 'danger' }) {
  if (!open) return null
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-2">{title}</h3>
        <p className="text-sm text-zinc-500 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="h-10 px-4 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors">Cancel</button>
          <button onClick={() => { onConfirm(); onClose() }} className="h-10 px-4 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm">{confirmText}</button>
        </div>
      </div>
    </Modal>
  )
}
