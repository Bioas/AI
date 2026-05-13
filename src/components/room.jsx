import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import EmptyState from './ui/empty-state'
import Badge from './ui/badge'
import Button from './ui/button'

export default function Room() {
  const { rooms, setEditRoom, setModal, deleteRoom } = useApp()
  const handleDelete = (id, number) => { if (!window.confirm(`⚠️ ต้องการลบห้อง ${number} ใช่หรือไม่?`)) return; deleteRoom(id) }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader title="จัดการห้อง" description="เพิ่ม แก้ไข และจัดการห้องพักและผู้เช่า"
        action={<Button onClick={() => { setEditRoom(null); setModal('room') }}>＋ เพิ่มห้อง</Button>} />

      <Card>
        <CardContent className="pt-6">
          {rooms.length === 0 ? (
            <EmptyState icon="🚪" title="ยังไม่มีห้อง" description="เพิ่มห้องแรกของคุณเพื่อเริ่มจัดการผู้พักและค่าเช่า" action={<Button onClick={() => { setEditRoom(null); setModal('room') }}>เพิ่มห้อง</Button>} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-neutral-100">
              <table className="w-full text-sm">
                <thead><tr className="bg-neutral-50/80">
                  {['ห้อง', 'ค่าเช่า/เดือน', 'ชื่อผู้พัก', 'เบอร์โทร', 'LINE ID', 'จัดการ'].map(h => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-neutral-500 tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-neutral-50">
                  {rooms.map(r => (
                    <tr key={r.id} className="hover:bg-lime-50/30 transition-colors">
                      <td className="px-4 py-3.5"><span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-lime-500 text-neutral-900 text-xs font-bold shadow-sm">{r.number}</span></td>
                      <td className="px-4 py-3.5 font-medium text-neutral-800 whitespace-nowrap">{r.rent.toLocaleString()} บาท</td>
                      <td className="px-4 py-3.5 text-neutral-700">{r.tenantName || <span className="text-neutral-300 italic">ว่าง</span>}</td>
                      <td className="px-4 py-3.5 text-neutral-600">{r.tenantPhone || <span className="text-neutral-300 italic">—</span>}</td>
                      <td className="px-4 py-3.5">{r.tenantUserId ? <Badge variant="info">{r.tenantUserId.slice(0, 12)}...</Badge> : <span className="text-neutral-300 italic">—</span>}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-1.5">
                          <button onClick={() => { setEditRoom(r); setModal('room') }}
                            className="h-8 px-3.5 rounded-lg text-xs font-medium bg-lime-50 text-lime-700 hover:bg-lime-100 transition-colors border border-lime-100">แก้ไข</button>
                          <button onClick={() => handleDelete(r.id, r.number)}
                            className="h-8 px-3.5 rounded-lg text-xs font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors border border-rose-100">ลบ</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
