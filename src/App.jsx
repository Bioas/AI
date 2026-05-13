import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import ToastContainer from './components/Toast'
import { useApp } from './context/AppContext'

const Dashboard = lazy(() => import('./components/dashboard'))
const Room = lazy(() => import('./components/room'))
const Meters = lazy(() => import('./components/meters'))
const Invoice = lazy(() => import('./components/invoice'))
const Setting = lazy(() => import('./components/setting'))
const RoomModal = lazy(() => import('./components/RoomModal'))
const InvoicePreview = lazy(() => import('./components/InvoicePreview'))
const Modal = lazy(() => import('./components/Modal'))

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-[4px] border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  const { modal, viewInv, downloadPdf, sendInvLine, setModal } = useApp()

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
      <Sidebar />

      <main className="flex-1 ml-0 md:ml-[72px] lg:ml-64 p-4 md:p-7 lg:p-10 min-h-screen bg-white/70 backdrop-blur-xl">
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rooms" element={<Room />} />
            <Route path="/meters" element={<Meters />} />
            <Route path="/invoices" element={<Invoice />} />
            <Route path="/settings" element={<Setting />} />
          </Routes>
        </Suspense>
      </main>

      <ToastContainer />

      {modal === 'room' && (
        <Suspense fallback={null}>
          <RoomModal />
        </Suspense>
      )}

      {modal === 'invoice' && viewInv && (
        <Suspense fallback={null}>
          <Modal>
            <h3 className="text-2xl font-extrabold text-slate-900 mb-5">🧾 ใบแจ้งหนี้</h3>
            <InvoicePreview inv={viewInv} />
            <div className="flex gap-3.5 justify-end mt-6">
              <button
                onClick={() => setModal(null)}
                className="bg-slate-100 text-slate-500 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-all"
              >
                ปิด
              </button>
              <button
                onClick={() => downloadPdf(viewInv)}
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all duration-300"
              >
                📄 PDF
              </button>
              <button
                onClick={() => sendInvLine(viewInv)}
                className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all duration-300"
              >
                📱 LINE
              </button>
            </div>
          </Modal>
        </Suspense>
      )}
    </div>
  )
}
