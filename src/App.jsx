import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { SpeedInsights } from '@vercel/speed-insights/react'
import Sidebar from './components/Sidebar'
import ToastContainer from './components/Toast'
import { useApp } from './context/AppContext'
import Spinner from './components/ui/spinner'

const Dashboard = lazy(() => import('./components/dashboard'))
const Room = lazy(() => import('./components/room'))
const RoomDetail = lazy(() => import('./components/RoomDetail'))
const Meters = lazy(() => import('./components/meters'))
const Billing = lazy(() => import('./components/billing'))
const Documents = lazy(() => import('./components/documents'))
const Resident = lazy(() => import('./components/resident'))
const Setting = lazy(() => import('./components/setting'))
const Calendar = lazy(() => import('./components/calendar'))
const RoomModal = lazy(() => import('./components/RoomModal'))
const ResidentModal = lazy(() => import('./components/ResidentModal'))
const InvoicePreview = lazy(() => import('./components/InvoicePreview'))
const ReceiptPreview = lazy(() => import('./components/ReceiptPreview'))
const ModalOverlay = lazy(() => import('./components/ui/modal'))

export default function App() {
  const { modal, viewInv, downloadPdf, sendPdfToLine, setModal, settings } = useApp()

  useEffect(() => {
    document.title = settings.dormName || 'ระบบจัดการหอพัก'
  }, [settings.dormName])

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar dormName={settings.dormName} />

      <main className="flex-1 ml-0 md:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 md:px-8 lg:px-10 pt-16 md:pt-0 py-4 sm:py-6 md:py-8 lg:py-10">
          <Suspense fallback={<Spinner />}>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/rooms" element={<Room />} />
                <Route path="/rooms/:id" element={<RoomDetail />} />
                <Route path="/meters" element={<Meters />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/residents" element={<Resident />} />
                <Route path="/settings" element={<Setting />} />
                <Route path="/calendar" element={<Calendar />} />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </div>
      </main>

      <ToastContainer />

      <SpeedInsights />

      <Suspense fallback={null}>{modal === 'room' && <RoomModal />}</Suspense>
      <Suspense fallback={null}>{modal === 'resident' && <ResidentModal />}</Suspense>

      <Suspense fallback={null}>
        {modal === 'invoice' && viewInv && (
              <ModalOverlay open={true} onClose={() => setModal(null)} maxWidth="max-w-[550px]">
            <div className="p-6">
              <h3 className="text-base font-semibold text-neutral-800 mb-4">🧾 ใบแจ้งหนี้</h3>
              <InvoicePreview inv={viewInv} />
              <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-neutral-100">
                <button onClick={() => setModal(null)} className="h-9 px-4 rounded-xl text-sm font-medium text-neutral-500 hover:bg-neutral-100 transition-colors">ปิด</button>
                <button onClick={() => downloadPdf(viewInv)} className="h-9 px-4 rounded-xl text-sm font-medium bg-gradient-to-br from-lime-400 to-lime-500 text-neutral-900 hover:from-lime-300 hover:to-lime-400 transition-all shadow-md shadow-lime-200/50 font-semibold">📄 PDF</button>
                <button onClick={() => sendPdfToLine(viewInv)} className="h-9 px-4 rounded-xl text-sm font-medium bg-gradient-to-br from-teal-400 to-teal-500 text-white hover:from-teal-300 hover:to-teal-400 transition-all shadow-md shadow-teal-200/50">📱 LINE</button>
              </div>
            </div>
          </ModalOverlay>
        )}
        {modal === 'receipt' && viewInv && (
              <ModalOverlay open={true} onClose={() => setModal(null)} maxWidth="max-w-[550px]">
            <div className="p-6">
              <h3 className="text-base font-semibold text-neutral-800 mb-4"> ใบเสร็จรับเงิน</h3>
              <ReceiptPreview inv={viewInv} />
              <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-neutral-100">
                <button onClick={() => setModal(null)} className="h-9 px-4 rounded-xl text-sm font-medium text-neutral-500 hover:bg-neutral-100 transition-colors">ปิด</button>
                <button onClick={() => downloadPdf(viewInv)} className="h-9 px-4 rounded-xl text-sm font-medium bg-gradient-to-br from-emerald-400 to-emerald-500 text-white hover:from-emerald-300 hover:to-emerald-400 transition-all shadow-md shadow-emerald-200/50 font-semibold">📄 PDF</button>
                <button onClick={() => sendPdfToLine(viewInv)} className="h-9 px-4 rounded-xl text-sm font-medium bg-gradient-to-br from-teal-400 to-teal-500 text-white hover:from-teal-300 hover:to-teal-400 transition-all shadow-md shadow-teal-200/50">📱 LINE</button>
              </div>
            </div>
          </ModalOverlay>
        )}
      </Suspense>
    </div>
  )
}
