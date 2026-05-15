import { motion } from 'framer-motion'
import { useState, useMemo, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import EmptyState from './ui/empty-state'
import Badge from './ui/badge'
import Modal from './ui/modal'
import Button from './ui/button'
import Select from './ui/select'

const FILTER_OPTIONS = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'active', label: 'เปิดใช้งาน' },
  { value: 'inactive', label: 'ปิดใช้งาน' },
  { value: 'following', label: 'กำลังติดตาม' },
  { value: 'unfollowed', label: 'เลิกติดตาม' },
]

const MAPPED_OPTIONS = [
  { value: 'all', label: 'เชื่อมโยงทั้งหมด' },
  { value: 'yes', label: 'เชื่อมโยงแล้ว' },
  { value: 'no', label: 'ยังไม่เชื่อมโยง' },
]

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function LineUsers() {
  const { lineUsers, residents, fetchLineUsers, toggleLineUser, syncLineFollowers, toast } = useApp()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [mappedFilter, setMappedFilter] = useState('all')
  const [detailUser, setDetailUser] = useState(null)
  const [reloading, setReloading] = useState(false)

  const doFetch = (q) => {
    fetchLineUsers(q ? `?${q}` : '')
  }

  useEffect(() => {
    const p = new URLSearchParams()
    if (search.trim()) p.set('search', search.trim())
    if (filter === 'active') p.set('status', 'active')
    if (filter === 'inactive') p.set('status', 'inactive')
    if (filter === 'following') p.set('status', 'following')
    if (filter === 'unfollowed') p.set('status', 'unfollowed')
    if (mappedFilter === 'yes') p.set('mapped', 'yes')
    if (mappedFilter === 'no') p.set('mapped', 'no')
    const q = p.toString()
    doFetch(q)
  }, [search, filter, mappedFilter, fetchLineUsers])

  const handleReload = async () => {
    setReloading(true)
    try {
      const p = new URLSearchParams()
      if (search.trim()) p.set('search', search.trim())
      if (filter === 'active') p.set('status', 'active')
      if (filter === 'inactive') p.set('status', 'inactive')
      if (filter === 'following') p.set('status', 'following')
      if (filter === 'unfollowed') p.set('status', 'unfollowed')
      if (mappedFilter === 'yes') p.set('mapped', 'yes')
      if (mappedFilter === 'no') p.set('mapped', 'no')
      const q = p.toString()
      await fetchLineUsers(q ? `?${q}` : '')
    } finally {
      setReloading(false)
    }
  }

  const handleToggle = (user) => {
    const msg = user.isActive ? `ปิดการใช้งาน "${user.displayName}"?` : `เปิดการใช้งาน "${user.displayName}"?`
    if (!window.confirm(msg)) return
    toggleLineUser(user.userId)
  }

  const getResidentName = (residentId) => {
    if (!residentId) return null
    const r = residents.find(x => x.id === residentId)
    return r ? r.name : null
  }

  const getLineUserName = (lineUserId) => {
    if (!lineUserId) return null
    const u = lineUsers.find(x => x.userId === lineUserId)
    return u ? u.displayName : null
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader title="จัดการผู้ใช้ LINE" description="จัดการผู้ที่ Add Friend LINE Official Account"
        onReload={handleReload}
        action={<Button onClick={() => {
          if (window.confirm('ดึงรายชื่อผู้ติดตาม LINE ล่าสุด?\nระบบจะนำเข้าผู้ติดตามที่มีอยู่แล้วทั้งหมด')) syncLineFollowers()
        }}>🔁 ซิงค์ผู้ติดตาม</Button>} />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="relative flex-1 min-w-0">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ LINE หรือ User ID..."
            className="w-full h-10 pl-10 pr-4 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 transition-all" />
        </div>
        <div className="w-full sm:w-40">
          <Select value={filter} onChange={setFilter} options={FILTER_OPTIONS} placeholder="ทั้งหมด" />
        </div>
        <div className="w-full sm:w-44">
          <Select value={mappedFilter} onChange={setMappedFilter} options={MAPPED_OPTIONS} placeholder="เชื่อมโยงทั้งหมด" />
        </div>
        <div className="text-xs text-neutral-400 text-center sm:text-left">{lineUsers.length} รายการ</div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {lineUsers.length === 0 ? (
            <EmptyState icon="📱" title="ยังไม่มีผู้ใช้ LINE" description="เมื่อมีผู้ใช้ Add Friend LINE OA ของคุณ ระบบจะบันทึกข้อมูลโดยอัตโนมัติ" />
          ) : (
            <div className="border border-neutral-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="hidden md:table-header-group">
                  <tr className="bg-neutral-50/80">
                    {['รูปโปรไฟล์', 'ชื่อ LINE', 'LINE User ID', 'ผู้พักอาศัยที่เชื่อมโยง', 'วันที่ Add Friend', 'สถานะ', 'จัดการ'].map(h => (
                      <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-neutral-500 tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {lineUsers.map(u => {
                    const residentName = getResidentName(u.residentId)
                    return (
                      <tr key={u.userId} className="block md:table-row p-4 md:p-0 bg-white md:bg-transparent border-b md:border-b-0 border-neutral-100 last:border-b-0 hover:bg-lime-50/30 transition-colors">
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">รูปโปรไฟล์</span>
                          {u.pictureUrl ? (
                            <img src={u.pictureUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-neutral-200 shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                              {u.displayName?.charAt(0) || '?'}
                            </div>
                          )}
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">ชื่อ LINE</span>
                          <div>
                            <div className="font-medium text-neutral-800">{u.displayName}</div>
                            {!u.isFollowing && <Badge variant="default">เลิกติดตาม</Badge>}
                          </div>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">User ID</span>
                          <code className="text-xs bg-neutral-100 px-2 py-1 rounded-lg text-neutral-600 font-mono">{u.userId}</code>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">ผู้พัก</span>
                          {residentName ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="info">{residentName}</Badge>
                            </div>
                          ) : (
                            <span className="text-neutral-300 italic">—</span>
                          )}
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">วันที่ Add</span>
                          <span className="text-xs text-neutral-500 whitespace-nowrap">{formatDate(u.followedAt)}</span>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">สถานะ</span>
                          <Badge variant={u.isActive ? 'success' : 'danger'}>
                            {u.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                          </Badge>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">จัดการ</span>
                          <div className="flex gap-1.5">
                            <button onClick={() => setDetailUser(u)}
                              className="h-8 px-3 rounded-lg text-xs font-medium bg-neutral-50 text-neutral-600 hover:bg-neutral-100 transition-colors border border-neutral-200">ดู</button>
                            <button onClick={() => handleToggle(u)}
                              className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors border ${u.isActive ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'}`}>
                              {u.isActive ? 'ปิด' : 'เปิด'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={!!detailUser} onClose={() => setDetailUser(null)} maxWidth="max-w-md">
        {detailUser && (
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-neutral-100">
              {detailUser.pictureUrl ? (
                <img src={detailUser.pictureUrl} alt="" className="w-14 h-14 rounded-full object-cover border border-neutral-200" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white text-xl font-bold">
                  {detailUser.displayName?.charAt(0) || '?'}
                </div>
              )}
              <div>
                <h3 className="text-base font-semibold text-neutral-800">{detailUser.displayName}</h3>
                <p className="text-xs text-neutral-400 font-mono">{detailUser.userId}</p>
              </div>
            </div>
            <dl className="space-y-3">
              <div className="flex justify-between py-2 border-b border-neutral-50">
                <dt className="text-xs text-neutral-400">สถานะ</dt>
                <dd><Badge variant={detailUser.isActive ? 'success' : 'danger'}>{detailUser.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</Badge></dd>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-50">
                <dt className="text-xs text-neutral-400">การติดตาม</dt>
                <dd><Badge variant={detailUser.isFollowing ? 'success' : 'default'}>{detailUser.isFollowing ? 'กำลังติดตาม' : 'เลิกติดตาม'}</Badge></dd>
              </div>
              {detailUser.residentId && (
                <div className="flex justify-between py-2 border-b border-neutral-50">
                  <dt className="text-xs text-neutral-400">ผู้พักที่เชื่อมโยง</dt>
                  <dd className="text-sm text-neutral-700">{getResidentName(detailUser.residentId)}</dd>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-neutral-50">
                <dt className="text-xs text-neutral-400">วันที่ Add Friend</dt>
                <dd className="text-xs text-neutral-600">{formatDate(detailUser.followedAt)}</dd>
              </div>
              {detailUser.unfollowedAt && (
                <div className="flex justify-between py-2 border-b border-neutral-50">
                  <dt className="text-xs text-neutral-400">วันที่เลิกติดตาม</dt>
                  <dd className="text-xs text-neutral-600">{formatDate(detailUser.unfollowedAt)}</dd>
                </div>
              )}
            </dl>
            <div className="flex justify-end mt-6 pt-4 border-t border-neutral-100">
              <Button variant="ghost" onClick={() => setDetailUser(null)}>ปิด</Button>
            </div>
          </div>
        )}
      </Modal>

    </motion.div>
  )
}
