import { useApp } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import ToastContainer from '../components/Toast';
import Dashboard from '../components/dashboard';
import Room from '../components/room';
import Meters from '../components/meters';
import Invoice from '../components/invoice';
import Setting from '../components/setting';
import RoomModal from '../components/RoomModal';
import InvoicePreview from '../components/InvoicePreview';
import Modal from '../components/Modal';

export default function Home() {
  const { page, loading, modal, viewInv, downloadPdf, sendInvLine, setViewInv, setModal } = useApp();

  if (loading) {
    return (
      <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-5 bg-gradient-to-br from-slate-50 to-emerald-50">
        <div className="w-11 h-11 border-[5px] border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-slate-400 font-medium text-sm">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  const pages = { dashboard: Dashboard, room: Room, meters: Meters, invoice: Invoice, setting: Setting };
  const PageComponent = pages[page] || Dashboard;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
      <Sidebar />

      <main className="flex-1 ml-0 md:ml-[72px] lg:ml-64 p-4 md:p-7 lg:p-10 min-h-screen bg-white/70 backdrop-blur-xl">
        <PageComponent />
      </main>

      <ToastContainer />

      {modal === 'room' && <RoomModal />}

      {modal === 'invoice' && viewInv && (
        <Modal>
          <h3 className="text-2xl font-extrabold text-slate-900 mb-5">🧾 ใบแจ้งหนี้</h3>
          <InvoicePreview inv={viewInv} />
          <div className="flex gap-3.5 justify-end mt-6">
            <button onClick={() => setModal(null)}
              className="bg-slate-100 text-slate-500 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-all">ปิด</button>
            <button onClick={() => downloadPdf(viewInv)}
              className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all duration-300">📄 PDF</button>
            <button onClick={() => sendInvLine(viewInv)}
              className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all duration-300">📱 LINE</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
