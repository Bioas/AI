import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Sidebar from './components/Sidebar'
import ToastContainer from './components/Toast'
import { useApp } from './context/AppContext'
import Spinner from './components/ui/spinner'

const Dashboard = lazy(() => import('./components/dashboard'))
const Room = lazy(() => import('./components/room'))
const Meters = lazy(() => import('./components/meters'))
const Invoice = lazy(() => import('./components/invoice'))
const Setting = lazy(() => import('./components/setting'))
const RoomModal = lazy(() => import('./components/RoomModal'))
const InvoicePreview = lazy(() => import('./components/InvoicePreview'))
const ModalOverlay = lazy(() => import('./components/Modal'))

export default function App() {
  const { modal, viewInv, downloadPdf, sendInvLine, setModal, settings } = useApp()

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar dormName={settings.dormName} />

      <main className="flex-1 ml-0 md:ml-60 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <Suspense fallback={<Spinner />}>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/rooms" element={<Room />} />
                <Route path="/meters" element={<Meters />} />
                <Route path="/invoices" element={<Invoice />} />
                <Route path="/settings" element={<Setting />} />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </div>
      </main>

      <ToastContainer />

      <Suspense fallback={null}>
        {modal === 'room' && <RoomModal />}
      </Suspense>

      <Suspense fallback={null}>
        {modal === 'invoice' && viewInv && (
          <ModalOverlay onClose={() => setModal(null)}>
            <div className="p-6">
              <h3 className="text-base font-semibold text-zinc-900 mb-4">🧾 ใบแจ้งหนี้</h3>
              <InvoicePreview inv={viewInv} />
              <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-zinc-100">
                <button onClick={() => setModal(null)} className="h-9 px-4 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors">ปิด</button>
                <button onClick={() => downloadPdf(viewInv)} className="h-9 px-4 rounded-xl text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-sm">📄 PDF</button>
                <button onClick={() => sendInvLine(viewInv)} className="h-9 px-4 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm">📱 LINE</button>
              </div>
            </div>
          </ModalOverlay>
        )}
      </Suspense>
    </div>
  )
}
