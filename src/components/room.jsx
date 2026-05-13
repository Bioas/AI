import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import EmptyState from './ui/empty-state'
import Badge from './ui/badge'
import Button from './ui/button'

export default function Room() {
  const { rooms, setEditRoom, setModal, deleteRoom } = useApp()

  const handleDelete = (id, number) => {
    if (!window.confirm(`⚠️ ต้องการลบห้อง ${number} ใช่หรือไม่?`)) return
    deleteRoom(id)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader
        title="จัดการห้อง"
        description="เพิ่ม แก้ไข และจัดการห้องพักและผู้เช่า"
        action={
          <Button onClick={() => { setEditRoom(null); setModal('room') }}>
            ＋ เพิ่มห้อง
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          {rooms.length === 0 ? (
            <EmptyState
              icon="🚪"
              title="ยังไม่มีห้อง"
              description="เพิ่มห้องแรกของคุณเพื่อเริ่มจัดการผู้พักและค่าเช่า"
              action={<Button onClick={() => { setEditRoom(null); setModal('room') }}>เพิ่มห้อง</Button>}
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-zinc-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/50">
                    {['ห้อง', 'ค่าเช่า/เดือน', 'ชื่อผู้พัก', 'เบอร์โทร', 'LINE ID', 'จัดการ'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rooms.map(r => (
                    <tr key={r.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 text-xs font-bold text-zinc-700">{r.number}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900 whitespace-nowrap">{r.rent.toLocaleString()} บาท</td>
                      <td className="px-4 py-3 text-zinc-700">
                        {r.tenantName || <span className="text-zinc-300 italic">ว่าง</span>}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{r.tenantPhone || <span className="text-zinc-300 italic">—</span>}</td>
                      <td className="px-4 py-3">
                        {r.tenantUserId ? (
                          <Badge variant="info">{r.tenantUserId.slice(0, 12)}...</Badge>
                        ) : (
                          <span className="text-zinc-300 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => { setEditRoom(r); setModal('room') }}
                            className="h-8 px-3 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => handleDelete(r.id, r.number)}
                            className="h-8 px-3 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          >
                            ลบ
                          </button>
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
