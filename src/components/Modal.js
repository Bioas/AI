import { useApp } from '../context/AppContext';

export default function Modal({ id, onClose, children, maxWidth = 'max-w-xl' }) {
  const { setModal } = useApp();

  const handleClose = () => {
    setModal(null);
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className={`
          bg-white rounded-3xl p-8 md:p-10 w-full ${maxWidth}
          max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn
          border border-white/40
        `}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
