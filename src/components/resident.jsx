import { motion } from 'framer-motion'
import { useState, useMemo, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { formatThaiDate, getContractStatus } from '../lib/constants'
import Card, { CardContent } from './ui/card'
import PageHeader from './ui/page-header'
import EmptyState from './ui/empty-state'
import Badge from './ui/badge'
import Button from './ui/button'
import Modal from './ui/modal'
import Select from './ui/select'
import ReloadButton from './ui/reload-button'

const LINE_FILTER_OPTIONS = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'active', label: 'เปิดใช้งาน' },
  { value: 'inactive', label: 'ปิดใช้งาน' },
  { value: 'following', label: 'กำลังติดตาม' },
  { value: 'unfollowed', label: 'เลิกติดตาม' },
]

const LINE_MAPPED_OPTIONS = [
  { value: 'all', label: 'เชื่อมโยงทั้งหมด' },
  { value: 'yes', label: 'เชื่อมโยงแล้ว' },
  { value: 'no', label: 'ยังไม่เชื่อมโยง' },
]

function formatLineDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Resident() {
  const { residents, rooms, lineUsers, setEditResident, setModal, setViewOnly, deleteResident, fetchResidents, fetchLineUsers, toggleLineUser, syncLineFollowers, toast } = useApp()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('monthly')

  const [lineSearch, setLineSearch] = useState('')
  const [lineFilter, setLineFilter] = useState('all')
  const [lineMappedFilter, setLineMappedFilter] = useState('all')
  const [lineDetailUser, setLineDetailUser] = useState(null)
  const [lineReloading, setLineReloading] = useState(false)

  const handleReload = async () => {
    await fetchResidents(search.trim())
  }

  const filtered = useMemo(() => {
    let result = residents
    if (activeTab === 'daily') {
      result = result.filter(r => r.rentalType === 'รายวัน' || r.rentalType === 'daily')
    } else {
      result = result.filter(r => r.rentalType !== 'รายวัน' && r.rentalType !== 'daily')
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.roomNumber?.includes(q) ||
        r.idCard?.includes(q)
      )
    }
    return result
  }, [residents, search, activeTab])

  const monthlyCount = useMemo(() => residents.filter(r => r.rentalType !== 'รายวัน' && r.rentalType !== 'daily').length, [residents])

  const dailyCount = useMemo(() => residents.filter(r => r.rentalType === 'รายวัน' || r.rentalType === 'daily').length, [residents])

  const filteredLineUsers = useMemo(() => {
    let result = lineUsers
    if (lineFilter === 'active') result = result.filter(u => u.isActive)
    if (lineFilter === 'inactive') result = result.filter(u => !u.isActive)
    if (lineFilter === 'following') result = result.filter(u => u.isFollowing)
    if (lineFilter === 'unfollowed') result = result.filter(u => !u.isFollowing)
    if (lineMappedFilter === 'yes') result = result.filter(u => u.residentId)
    if (lineMappedFilter === 'no') result = result.filter(u => !u.residentId)
    if (lineSearch.trim()) {
      const q = lineSearch.trim().toLowerCase()
      result = result.filter(u =>
        u.displayName.toLowerCase().includes(q) ||
        u.userId.toLowerCase().includes(q)
      )
    }
    return result
  }, [lineUsers, lineSearch, lineFilter, lineMappedFilter])

  useEffect(() => {
    fetchLineUsers()
  }, [fetchLineUsers])

  const getLineName = (lineUserId) => {
    if (!lineUserId) return null
    const u = lineUsers.find(x => x.userId === lineUserId)
    return u ? u.displayName : null
  }
  const getLineActive = (lineUserId) => {
    if (!lineUserId) return null
    const u = lineUsers.find(x => x.userId === lineUserId)
    return u ? u.isActive : null
  }

  const handleDelete = (resident) => {
    if (!window.confirm(`⚠️ ต้องการลบข้อมูลผู้พัก "${resident.name}" ใช่หรือไม่?`)) return
    deleteResident(resident.id)
  }

  const handleLineToggle = (user) => {
    const msg = user.isActive ? `ปิดการใช้งาน "${user.displayName}"?` : `เปิดการใช้งาน "${user.displayName}"?`
    if (!window.confirm(msg)) return
    toggleLineUser(user.userId)
  }

  const getResidentName = (residentId) => {
    if (!residentId) return null
    const r = residents.find(x => x.id === residentId)
    return r ? r.name : null
  }

  const getResidentRoomType = (resident) => {
    if (resident.rentalType) return resident.rentalType
    if (!resident.roomId) return 'รายเดือน'
    const room = rooms.find(r => r.id === resident.roomId)
    return room?.rentalType || 'monthly'
  }

  const getDailyStatus = (resident) => {
    if (!resident.moveOutDate) return { label: 'เช็คอิน', variant: 'success' }
    const now = new Date()
    const out = new Date(resident.moveOutDate)
    if (out >= now) return { label: 'เช็คอิน', variant: 'success' }
    return { label: 'เช็คเอาท์แล้ว', variant: 'default' }
  }

  const renderResidentTab = () => (
    <>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="relative flex-1 min-w-0">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ ห้อง เบอร์โทร..."
            className="w-full h-10 pl-10 pr-4 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 transition-all" />
        </div>
        <ReloadButton onReload={handleReload} />
        <div className="text-xs text-neutral-400 text-center sm:text-left">{filtered.length} รายการ</div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {filtered.length === 0 ? (
            <EmptyState icon="👥" title={search ? 'ไม่พบข้อมูลที่ค้นหา' : activeTab === 'monthly' ? 'ยังไม่มีผู้พักรายเดือน' : 'ยังไม่มีผู้พักรายวัน'}
              description={search ? 'ลองเปลี่ยนคำค้นหาหรือตรวจสอบการสะกด' : activeTab === 'monthly' ? 'เพิ่มผู้พักรายเดือนคนแรกเพื่อเริ่มต้นจัดการ' : 'ยังไม่มีผู้เช่าห้องรายวัน'}
              action={!search && activeTab === 'monthly' ? <Button onClick={() => { setEditResident(null); setViewOnly(false); setModal('resident') }}>เพิ่มผู้พัก</Button> : undefined} />
          ) : (
            <div className="border border-neutral-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="hidden md:table-header-group">
                  <tr className="bg-neutral-50/80">
                    {['ชื่อผู้พักอาศัย', 'หมายเลขห้อง', 'เบอร์โทร', 'LINE', activeTab === 'daily' ? 'เช็คอิน' : 'วันที่เข้าพัก', activeTab === 'daily' ? 'เช็คเอาท์' : 'วันหมดสัญญา', activeTab === 'daily' ? 'สถานะ' : 'สถานะสัญญา', 'จัดการ'].map(h => (
                      <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-neutral-500 tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {filtered.map(r => {
                    const isDaily = getResidentRoomType(r) === 'รายวัน'
                    const status = isDaily ? getDailyStatus(r) : getContractStatus(r.moveOutDate)
                    return (
                      <tr key={r.id} className="block md:table-row p-4 md:p-0 bg-white md:bg-transparent border-b md:border-b-0 border-neutral-100 last:border-b-0 hover:bg-lime-50/30 transition-colors">
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">ชื่อ</span>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center text-neutral-900 text-xs font-bold shadow-sm shrink-0">
                              {r.name?.charAt(0) || '?'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-neutral-800 truncate max-w-[200px]">{r.name}</div>
                              {r.email && <div className="text-[11px] text-neutral-400 truncate max-w-[200px]">{r.email}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">ห้อง</span>
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">{r.roomNumber || '—'}</span>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">เบอร์โทร</span>
                          <span className="text-neutral-700 whitespace-nowrap">{r.phone}</span>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">LINE</span>
                          {r.lineUserId ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-neutral-600 truncate max-w-[100px]">{getLineName(r.lineUserId) || r.lineUserId.slice(0, 12)}</span>
                              {getLineActive(r.lineUserId) === false && <Badge variant="danger">ปิด</Badge>}
                            </div>
                          ) : (
                            <span className="text-neutral-300 italic">—</span>
                          )}
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">{isDaily ? 'เช็คอิน' : 'วันที่เข้าพัก'}</span>
                          <span className="text-neutral-600 whitespace-nowrap text-xs">{formatThaiDate(r.moveInDate)}</span>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">{isDaily ? 'เช็คเอาท์' : 'วันหมดสัญญา'}</span>
                          <span className="text-neutral-600 whitespace-nowrap text-xs">{formatThaiDate(r.moveOutDate)}</span>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">สถานะ</span>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </td>
                        <td className="px-0 md:px-4 py-2 md:py-3.5 flex items-center justify-between md:table-cell">
                          <span className="text-xs font-medium text-neutral-500 md:hidden">จัดการ</span>
                          <div className="flex gap-1.5">
                            <button onClick={() => { setEditResident({ ...r, rentalType: isDaily ? 'daily' : 'monthly' }); setViewOnly(true); setModal('resident') }}
                              className="h-8 px-3.5 rounded-lg text-xs font-medium bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors border border-sky-100">ดู</button>
                            <button onClick={() => handleDelete(r)}
                              className="h-8 px-3.5 rounded-lg text-xs font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors border border-rose-100">ลบ</button>
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
    </>
  )

  const renderLineUsersTab = () => (
    <>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="relative flex-1 min-w-0">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" value={lineSearch} onChange={e => setLineSearch(e.target.value)}
            placeholder="ค้นหาชื่อ LINE หรือ User ID..."
            className="w-full h-10 pl-10 pr-4 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-100 transition-all" />
        </div>
        <div className="w-full sm:w-40">
          <Select value={lineFilter} onChange={setLineFilter} options={LINE_FILTER_OPTIONS} placeholder="ทั้งหมด" />
        </div>
        <div className="w-full sm:w-44">
          <Select value={lineMappedFilter} onChange={setLineMappedFilter} options={LINE_MAPPED_OPTIONS} placeholder="เชื่อมโยงทั้งหมด" />
        </div>
        <ReloadButton onReload={async () => {
          setLineReloading(true)
          try { await fetchLineUsers() } finally { setLineReloading(false) }
        }} />
        <button
          onClick={() => {
            if (window.confirm('ดึงรายชื่อผู้ติดตาม LINE ล่าสุด?\nระบบจะนำเข้าผู้ติดตามที่มีอยู่แล้วทั้งหมด')) syncLineFollowers()
          }}
          title="ซิงค์ผู้ติดตาม LINE"
          className="inline-flex items-center justify-center h-10 px-3.5 rounded-xl text-sm font-medium bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 active:bg-neutral-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lime-300 focus:ring-offset-2 shadow-sm gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
          <span>ซิงค์ผู้พัก</span>
        </button>
        <div className="text-xs text-neutral-400 text-center sm:text-left">{filteredLineUsers.length} รายการ</div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {filteredLineUsers.length === 0 ? (
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
                  {filteredLineUsers.map(u => {
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
                          <span className="text-xs text-neutral-500 whitespace-nowrap">{formatLineDate(u.followedAt)}</span>
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
                            <button onClick={() => setLineDetailUser(u)}
                              className="h-8 px-3 rounded-lg text-xs font-medium bg-neutral-50 text-neutral-600 hover:bg-neutral-100 transition-colors border border-neutral-200">ดู</button>
                            <button onClick={() => handleLineToggle(u)}
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

      <Modal open={!!lineDetailUser} onClose={() => setLineDetailUser(null)} maxWidth="max-w-md">
        {lineDetailUser && (
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-neutral-100">
              {lineDetailUser.pictureUrl ? (
                <img src={lineDetailUser.pictureUrl} alt="" className="w-14 h-14 rounded-full object-cover border border-neutral-200" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-white text-xl font-bold">
                  {lineDetailUser.displayName?.charAt(0) || '?'}
                </div>
              )}
              <div>
                <h3 className="text-base font-semibold text-neutral-800">{lineDetailUser.displayName}</h3>
                <p className="text-xs text-neutral-400 font-mono">{lineDetailUser.userId}</p>
              </div>
            </div>
            <dl className="space-y-3">
              <div className="flex justify-between py-2 border-b border-neutral-50">
                <dt className="text-xs text-neutral-400">สถานะ</dt>
                <dd><Badge variant={lineDetailUser.isActive ? 'success' : 'danger'}>{lineDetailUser.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</Badge></dd>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-50">
                <dt className="text-xs text-neutral-400">การติดตาม</dt>
                <dd><Badge variant={lineDetailUser.isFollowing ? 'success' : 'default'}>{lineDetailUser.isFollowing ? 'กำลังติดตาม' : 'เลิกติดตาม'}</Badge></dd>
              </div>
              {lineDetailUser.residentId && (
                <div className="flex justify-between py-2 border-b border-neutral-50">
                  <dt className="text-xs text-neutral-400">ผู้พักที่เชื่อมโยง</dt>
                  <dd className="text-sm text-neutral-700">{getResidentName(lineDetailUser.residentId)}</dd>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-neutral-50">
                <dt className="text-xs text-neutral-400">วันที่ Add Friend</dt>
                <dd className="text-xs text-neutral-600">{formatLineDate(lineDetailUser.followedAt)}</dd>
              </div>
              {lineDetailUser.unfollowedAt && (
                <div className="flex justify-between py-2 border-b border-neutral-50">
                  <dt className="text-xs text-neutral-400">วันที่เลิกติดตาม</dt>
                  <dd className="text-xs text-neutral-600">{formatLineDate(lineDetailUser.unfollowedAt)}</dd>
                </div>
              )}
            </dl>
            <div className="flex justify-end mt-6 pt-4 border-t border-neutral-100">
              <Button variant="ghost" onClick={() => setLineDetailUser(null)}>ปิด</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageHeader title="ผู้พักอาศัย" description="จัดการข้อมูลผู้เช่าห้องพักทั้งหมด"
        action={<Button onClick={() => { setEditResident(null); setViewOnly(false); setModal('resident') }}>＋ เพิ่มผู้พัก</Button>} />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-2xl p-1.5 shadow-sm border border-neutral-100 w-fit">
        <button onClick={() => setActiveTab('monthly')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'monthly'
              ? 'bg-lime-500 text-white shadow-sm'
              : 'text-neutral-500 hover:bg-neutral-50'
          }`}>
          <span>📅 รายเดือน</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-md ${activeTab === 'monthly' ? 'bg-white/20' : 'bg-neutral-100'}`}>{monthlyCount}</span>
        </button>
        <button onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'daily'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-neutral-500 hover:bg-neutral-50'
          }`}>
          <span>🌙 รายวัน</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-md ${activeTab === 'daily' ? 'bg-white/20' : 'bg-neutral-100'}`}>{dailyCount}</span>
        </button>
        <button onClick={() => setActiveTab('line')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'line'
              ? 'bg-teal-500 text-white shadow-sm'
              : 'text-neutral-500 hover:bg-neutral-50'
          }`}>
          <span>📱 ผู้ใช้ LINE</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-md ${activeTab === 'line' ? 'bg-white/20' : 'bg-neutral-100'}`}>{lineUsers.length}</span>
        </button>
      </div>

      {activeTab === 'line' ? renderLineUsersTab() : renderResidentTab()}
    </motion.div>
  )
}
