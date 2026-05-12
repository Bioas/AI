import { useState, useEffect, useCallback, useRef } from 'react';
import styles from '../styles/Home.module.css';

// ─── Interfaces ───────────────────────────────────────────────

interface Tenant {
  id: string;
  name: string;
  nickname?: string;
  idCard?: string;
  phone: string;
  lineId?: string;
  email?: string;
  address?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  deposit: number;
  checkInDate: string;
  checkOutDate?: string;
  note?: string;
}

interface Room {
  id: string;
  number: string;
  rent: number;
  tenantId?: string;
  note?: string;
}

interface Settings {
  dormName: string;
  address: string;
  phone: string;
  rateElec: number;
  rateWater: number;
  logo?: string;
}

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

type SortField = 'number' | 'rent' | 'tenantName';
type SortOrder = 'asc' | 'desc';
type FilterStatus = 'all' | 'occupied' | 'vacant';
type TenantSortField = 'name' | 'phone' | 'checkInDate' | 'deposit';

// ─── Main Component ───────────────────────────────────────────

export default function Home() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'rooms' | 'tenants' | 'settings'>('dashboard');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Room modal
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Tenant modal
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  // Settings modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Room search & filter & sort
  const [roomSearch, setRoomSearch] = useState('');
  const [roomFilter, setRoomFilter] = useState<FilterStatus>('all');
  const [roomSortField, setRoomSortField] = useState<SortField>('number');
  const [roomSortOrder, setRoomSortOrder] = useState<SortOrder>('asc');

  // Tenant search & sort
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantSortField, setTenantSortField] = useState<TenantSortField>('name');
  const [tenantSortOrder, setTenantSortOrder] = useState<SortOrder>('asc');

  // Toast
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'room' | 'tenant'; id: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Toast ───────────────────────────────────────────────────

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    setToasts(prev => [...prev, { id, message, type }]);
    toastTimeoutRef.current[id] = setTimeout(() => removeToast(id), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    if (toastTimeoutRef.current[id]) {
      clearTimeout(toastTimeoutRef.current[id]);
      delete toastTimeoutRef.current[id];
    }
  }, []);

  useEffect(() => {
    return () => { Object.values(toastTimeoutRef.current).forEach(clearTimeout); };
  }, []);

  // ─── Fetch Data ──────────────────────────────────────────────

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, tenantsRes, settingsRes] = await Promise.all([
        fetch('/api/rooms'),
        fetch('/api/tenants'),
        fetch('/api/settings')
      ]);
      setRooms(await roomsRes.json().catch(() => []));
      setTenants(await tenantsRes.json().catch(() => []));
      setSettings(await settingsRes.json().catch(() => null));
    } catch (e) {
      console.error('Fetch error:', e);
      addToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // ─── Room CRUD ───────────────────────────────────────────────

  const handleSaveRoom = async (room: Room) => {
    const isEdit = !!room.id && rooms.some(r => r.id === room.id);
    try {
      const res = await fetch('/api/rooms', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(room)
      });
      if (res.ok) {
        await fetchData();
        setShowRoomModal(false);
        setEditingRoom(null);
        addToast(isEdit ? `แก้ไขห้อง ${room.number} สำเร็จ` : `เพิ่มห้อง ${room.number} สำเร็จ`, 'success');
      } else {
        addToast('เกิดข้อผิดพลาด', 'error');
      }
    } catch { addToast('เกิดข้อผิดพลาด', 'error'); }
  };

  const handleDeleteRoom = async (id: string) => {
    const room = rooms.find(r => r.id === id);
    setDeleting(true);
    try {
      const res = await fetch('/api/rooms', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        await fetchData();
        addToast(`ลบห้อง ${room?.number} สำเร็จ`, 'success');
      } else {
        addToast('เกิดข้อผิดพลาด', 'error');
      }
    } catch { addToast('เกิดข้อผิดพลาด', 'error'); }
    setDeleting(false);
    setDeleteConfirm(null);
  };

  // ─── Tenant CRUD ─────────────────────────────────────────────

  const handleSaveTenant = async (tenant: Tenant) => {
    const isEdit = !!tenant.id && tenants.some(t => t.id === tenant.id);
    try {
      const res = await fetch('/api/tenants', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tenant)
      });
      if (res.ok) {
        await fetchData();
        setShowTenantModal(false);
        setEditingTenant(null);
        addToast(isEdit ? `แก้ไขข้อมูล ${tenant.name} สำเร็จ` : `เพิ่มผู้พัก ${tenant.name} สำเร็จ`, 'success');
      } else {
        addToast('เกิดข้อผิดพลาด', 'error');
      }
    } catch { addToast('เกิดข้อผิดพลาด', 'error'); }
  };

  const handleDeleteTenant = async (id: string) => {
    const tenant = tenants.find(t => t.id === id);
    const isOccupying = rooms.some(r => r.tenantId === id);
    if (isOccupying) {
      addToast('ผู้พักนี้กำลังพักอยู่ในห้อง ไม่สามารถลบได้', 'warning');
      setDeleteConfirm(null);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch('/api/tenants', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        await fetchData();
        addToast(`ลบผู้พัก ${tenant?.name} สำเร็จ`, 'success');
      } else {
        addToast('เกิดข้อผิดพลาด', 'error');
      }
    } catch { addToast('เกิดข้อผิดพลาด', 'error'); }
    setDeleting(false);
    setDeleteConfirm(null);
  };

  // ─── Settings ────────────────────────────────────────────────

  const handleSaveSettings = async (s: Settings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s)
      });
      if (res.ok) {
        setSettings(s);
        setShowSettingsModal(false);
        addToast('บันทึกการตั้งค่าสำเร็จ', 'success');
      } else { addToast('เกิดข้อผิดพลาด', 'error'); }
    } catch { addToast('เกิดข้อผิดพลาด', 'error'); }
  };

  // ─── Helpers ─────────────────────────────────────────────────

  const getTenantById = (id?: string) => tenants.find(t => t.id === id);

  const occupiedRooms = rooms.filter(r => r.tenantId).length;
  const vacantRooms = rooms.length - occupiedRooms;
  const totalRent = rooms.filter(r => r.tenantId).reduce((sum, r) => sum + r.rent, 0);
  const totalDeposit = tenants.reduce((sum, t) => sum + t.deposit, 0);
  const occupancyRate = rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 100) : 0;

  // Room filter & sort
  const filteredRooms = rooms
    .filter(r => {
      if (roomFilter === 'occupied') return !!r.tenantId;
      if (roomFilter === 'vacant') return !r.tenantId;
      return true;
    })
    .filter(r => {
      if (!roomSearch.trim()) return true;
      const q = roomSearch.toLowerCase();
      const tenant = getTenantById(r.tenantId);
      return (
        r.number.toLowerCase().includes(q) ||
        (tenant?.name.toLowerCase().includes(q)) ||
        (tenant?.phone.includes(q)) ||
        (r.note?.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      let c = 0;
      if (roomSortField === 'number') c = a.number.localeCompare(b.number, undefined, { numeric: true });
      else if (roomSortField === 'rent') c = a.rent - b.rent;
      else if (roomSortField === 'tenantName') c = (getTenantById(a.tenantId)?.name || '').localeCompare(getTenantById(b.tenantId)?.name || '');
      return roomSortOrder === 'asc' ? c : -c;
    });

  // Tenant filter & sort
  const filteredTenants = tenants
    .filter(t => {
      if (!tenantSearch.trim()) return true;
      const q = tenantSearch.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.phone.includes(q) ||
        (t.idCard?.includes(q)) ||
        (t.email?.toLowerCase().includes(q)) ||
        (t.note?.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      let c = 0;
      if (tenantSortField === 'name') c = a.name.localeCompare(b.name);
      else if (tenantSortField === 'phone') c = a.phone.localeCompare(b.phone);
      else if (tenantSortField === 'checkInDate') c = a.checkInDate.localeCompare(b.checkInDate);
      else if (tenantSortField === 'deposit') c = a.deposit - b.deposit;
      return tenantSortOrder === 'asc' ? c : -c;
    });

  const toggleRoomSort = (field: SortField) => {
    if (roomSortField === field) setRoomSortOrder(p => p === 'asc' ? 'desc' : 'asc');
    else { setRoomSortField(field); setRoomSortOrder('asc'); }
  };

  const toggleTenantSort = (field: TenantSortField) => {
    if (tenantSortField === field) setTenantSortOrder(p => p === 'asc' ? 'desc' : 'asc');
    else { setTenantSortField(field); setTenantSortOrder('asc'); }
  };

  // ─── Loading Screen ──────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div className={styles.container}>
      {sidebarOpen && <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <nav className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <button className={styles.sidebarClose} onClick={() => setSidebarOpen(false)}>✕</button>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🏠</span>
          <div>
            <h1>{settings?.dormName || 'หอพัก Billing'}</h1>
            <p className={styles.logoSubtitle}>ระบบจัดการหอพัก</p>
          </div>
        </div>
        <div className={styles.navSection}>เมนูหลัก</div>
        {([
          ['dashboard', '📊', 'แดชบอร์ด'],
          ['rooms', '🚪', 'จัดการห้อง'],
          ['tenants', '👥', 'จัดการผู้พัก'],
          ['settings', '⚙️', 'ตั้งค่า']
        ] as const).map(([page, icon, label]) => (
          <button
            key={page}
            className={`${styles.navItem} ${currentPage === page ? styles.active : ''}`}
            onClick={() => { setCurrentPage(page); setSidebarOpen(false); }}
          >
            <span className={styles.navIcon}>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
        <div className={styles.sidebarFooter}>
          <div className={styles.quickStats}>
            <div className={styles.quickStat}>
              <span className={styles.quickStatValue}>{rooms.length}</span>
              <span className={styles.quickStatLabel}>ห้องทั้งหมด</span>
            </div>
            <div className={styles.quickStat}>
              <span className={styles.quickStatValue}>{occupiedRooms}</span>
              <span className={styles.quickStatLabel}>มีผู้พัก</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.menuToggle} onClick={() => setSidebarOpen(true)}>☰</button>
            <div>
              <h2 className={styles.pageTitle}>
                {currentPage === 'dashboard' && '📊 ภาพรวม'}
                {currentPage === 'rooms' && '🚪 จัดการห้อง'}
                {currentPage === 'tenants' && '👥 จัดการผู้พัก'}
                {currentPage === 'settings' && '⚙️ ตั้งค่า'}
              </h2>
              <p className={styles.pageSubtitle}>
                {currentPage === 'dashboard' && 'ติดตามสถานะหอพักของคุณ'}
                {currentPage === 'rooms' && 'จัดการข้อมูลห้องและผู้พัก'}
                {currentPage === 'tenants' && 'จัดการข้อมูลผู้เข้าพักทั้งหมด'}
                {currentPage === 'settings' && 'ตั้งค่าระบบและข้อมูลหอพัก'}
              </p>
            </div>
          </div>
          <div className={styles.headerDate}>
            {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        {/* ═══════════ DASHBOARD ═══════════ */}
        {currentPage === 'dashboard' && (
          <div className={styles.dashboardContent}>
            <div className={styles.statsGrid}>
              <div className={`${styles.statCard} ${styles.statBlue}`}>
                <div className={styles.statIcon}>🏢</div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{rooms.length}</div>
                  <div className={styles.statLabel}>ห้องทั้งหมด</div>
                </div>
              </div>
              <div className={`${styles.statCard} ${styles.statGreen}`}>
                <div className={styles.statIcon}>✅</div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{occupiedRooms}</div>
                  <div className={styles.statLabel}>มีผู้พักอาศัย</div>
                </div>
              </div>
              <div className={`${styles.statCard} ${styles.statOrange}`}>
                <div className={styles.statIcon}>🔑</div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{vacantRooms}</div>
                  <div className={styles.statLabel}>ห้องว่าง</div>
                </div>
              </div>
              <div className={`${styles.statCard} ${styles.statPurple}`}>
                <div className={styles.statIcon}>💰</div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{totalRent.toLocaleString()}</div>
                  <div className={styles.statLabel}>ค่าเช่ารวม (บาท)</div>
                </div>
              </div>
              <div className={`${styles.statCard} ${styles.statTeal}`}>
                <div className={styles.statIcon}>👥</div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{tenants.length}</div>
                  <div className={styles.statLabel}>ผู้พักทั้งหมด</div>
                </div>
              </div>
              <div className={`${styles.statCard} ${styles.statPink}`}>
                <div className={styles.statIcon}>🏦</div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{totalDeposit.toLocaleString()}</div>
                  <div className={styles.statLabel}>เงินมัดจำรวม (บาท)</div>
                </div>
              </div>
            </div>

            {/* Occupancy Rate */}
            <div className={styles.occupancyCard}>
              <div className={styles.occupancyHeader}>
                <h3 className={styles.occupancyTitle}>อัตราการเข้าพัก</h3>
                <span className={styles.occupancyPercent}>{occupancyRate}%</span>
              </div>
              <div className={styles.occupancyBar}>
                <div className={styles.occupancyFill} style={{ width: `${occupancyRate}%` }} />
              </div>
              <div className={styles.occupancyLabels}>
                <span className={styles.occupancyLabel}>ว่าง {vacantRooms} ห้อง</span>
                <span className={styles.occupancyLabel}>มีผู้พัก {occupiedRooms} ห้อง</span>
              </div>
            </div>

            {/* Recent Rooms */}
            <div className={styles.recentRooms}>
              <h3 className={styles.sectionTitle}>ห้องล่าสุด</h3>
              <div className={styles.roomsList}>
                {rooms.length === 0 ? (
                  <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>📭</span>
                    <p>ยังไม่มีข้อมูลห้อง</p>
                    <button onClick={() => setCurrentPage('rooms')} className={styles.primaryBtn}>➕ เพิ่มห้องแรก</button>
                  </div>
                ) : (
                  rooms.slice(0, 6).map((room, idx) => {
                    const tenant = getTenantById(room.tenantId);
                    return (
                      <div key={room.id} className={styles.roomCard} style={{ animationDelay: `${idx * 0.1}s` }}>
                        <div className={styles.roomCardHeader}>
                          <span className={styles.roomBadge}>{room.number}</span>
                          <span className={tenant ? styles.statusOccupied : styles.statusVacant}>
                            {tenant ? 'มีผู้พัก' : 'ว่าง'}
                          </span>
                        </div>
                        <div className={styles.roomCardInfo}>
                          {tenant ? (
                            <>
                              <div className={styles.tenantName}>{tenant.name}</div>
                              <div className={styles.tenantPhone}>{tenant.phone}</div>
                              {tenant.checkInDate && (
                                <div className={styles.tenantCheckIn}>
                                  เข้าพัก: {new Date(tenant.checkInDate).toLocaleDateString('th-TH')}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className={styles.vacantHint}>พร้อมให้ผู้พักใหม่</div>
                          )}
                        </div>
                        <div className={styles.roomCardFooter}>
                          <span className={styles.rentAmount}>{room.rent.toLocaleString()} ฿</span>
                          {room.note && <span className={styles.roomNote} title={room.note}>📝</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ ROOMS ═══════════ */}
        {currentPage === 'rooms' && (
          <div className={styles.roomsContent}>
            <div className={styles.actionBar}>
              <div className={styles.searchBox}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  type="text" value={roomSearch} onChange={e => setRoomSearch(e.target.value)}
                  placeholder="ค้นหาห้อง, ผู้พัก, เบอร์โทร..."
                  className={styles.searchInput}
                />
                {roomSearch && <button className={styles.searchClear} onClick={() => setRoomSearch('')}>✕</button>}
              </div>
              <button onClick={() => { setEditingRoom(null); setShowRoomModal(true); }} className={styles.primaryBtn}>
                <span>➕</span> เพิ่มห้อง
              </button>
            </div>

            <div className={styles.filterTabs}>
              {([['all', `ทั้งหมด ${rooms.length}`], ['occupied', `มีผู้พัก ${occupiedRooms}`], ['vacant', `ว่าง ${vacantRooms}`]] as const).map(([val, label]) => (
                <button
                  key={val}
                  className={`${styles.filterTab} ${roomFilter === val ? styles.filterTabActive : ''}`}
                  onClick={() => setRoomFilter(val)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className={styles.sortControls}>
              <span className={styles.sortLabel}>เรียงตาม:</span>
              {([['number', 'ห้อง'], ['rent', 'ค่าเช่า'], ['tenantName', 'ชื่อ']] as const).map(([field, label]) => (
                <button
                  key={field}
                  className={`${styles.sortBtn} ${roomSortField === field ? styles.sortBtnActive : ''}`}
                  onClick={() => toggleRoomSort(field)}
                >
                  {label} {roomSortField === field && (roomSortOrder === 'asc' ? '↑' : '↓')}
                </button>
              ))}
            </div>

            {(roomSearch || roomFilter !== 'all') && (
              <div className={styles.resultsInfo}>พบ {filteredRooms.length} ห้อง จากทั้งหมด {rooms.length} ห้อง</div>
            )}

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ห้อง</th>
                    <th>ค่าเช่า</th>
                    <th>ผู้พัก</th>
                    <th>เบอร์โทร</th>
                    <th>สถานะ</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRooms.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className={styles.emptyState}>
                          <span className={styles.emptyIcon}>🔍</span>
                          <p>ไม่พบข้อมูลที่ค้นหา</p>
                          <button onClick={() => { setRoomSearch(''); setRoomFilter('all'); }} className={styles.secondaryBtn}>ล้างการค้นหา</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRooms.map((room, idx) => {
                      const tenant = getTenantById(room.tenantId);
                      return (
                        <tr key={room.id} style={{ animationDelay: `${idx * 0.05}s` }}>
                          <td><span className={styles.roomNumber}>{room.number}</span></td>
                          <td><span className={styles.rentCell}>{room.rent.toLocaleString()} ฿</span></td>
                          <td>{tenant ? <span className={styles.tenantCell}>{tenant.name}</span> : <span className={styles.vacantCell}>— ว่าง —</span>}</td>
                          <td>{tenant?.phone || <span className={styles.emptyText}>—</span>}</td>
                          <td><span className={tenant ? styles.statusBadgeOccupied : styles.statusBadgeVacant}>{tenant ? 'มีผู้พัก' : 'ว่าง'}</span></td>
                          <td>
                            <div className={styles.actionButtons}>
                              <button onClick={() => { setEditingRoom(room); setShowRoomModal(true); }} className={styles.editBtn} title="แก้ไข">✏️</button>
                              {deleteConfirm?.type === 'room' && deleteConfirm.id === room.id ? (
                                <div className={styles.deleteConfirm}>
                                  <span>ยืนยันลบ?</span>
                                  <button onClick={() => handleDeleteRoom(room.id)} className={styles.confirmYes} disabled={deleting}>{deleting ? '⏳' : '✓'}</button>
                                  <button onClick={() => setDeleteConfirm(null)} className={styles.confirmNo} disabled={deleting}>✕</button>
                                </div>
                              ) : (
                                <button onClick={() => setDeleteConfirm({ type: 'room', id: room.id })} className={styles.deleteBtn} title="ลบ">🗑️</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════ TENANTS ═══════════ */}
        {currentPage === 'tenants' && (
          <div className={styles.tenantsContent}>
            <div className={styles.actionBar}>
              <div className={styles.searchBox}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  type="text" value={tenantSearch} onChange={e => setTenantSearch(e.target.value)}
                  placeholder="ค้นหาชื่อ, เบอร์โทร, บัตร ปชช., อีเมล..."
                  className={styles.searchInput}
                />
                {tenantSearch && <button className={styles.searchClear} onClick={() => setTenantSearch('')}>✕</button>}
              </div>
              <button onClick={() => { setEditingTenant(null); setShowTenantModal(true); }} className={styles.primaryBtn}>
                <span>➕</span> เพิ่มผู้พัก
              </button>
            </div>

            <div className={styles.sortControls}>
              <span className={styles.sortLabel}>เรียงตาม:</span>
              {([['name', 'ชื่อ'], ['phone', 'เบอร์โทร'], ['checkInDate', 'วันที่เข้าพัก'], ['deposit', 'เงินมัดจำ']] as const).map(([field, label]) => (
                <button
                  key={field}
                  className={`${styles.sortBtn} ${tenantSortField === field ? styles.sortBtnActive : ''}`}
                  onClick={() => toggleTenantSort(field)}
                >
                  {label} {tenantSortField === field && (tenantSortOrder === 'asc' ? '↑' : '↓')}
                </button>
              ))}
            </div>

            {tenantSearch && <div className={styles.resultsInfo}>พบ {filteredTenants.length} คน จากทั้งหมด {tenants.length} คน</div>}

            {/* Tenant Cards Grid */}
            <div className={styles.tenantGrid}>
              {filteredTenants.length === 0 ? (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon}>👤</span>
                  <p>{tenantSearch ? 'ไม่พบข้อมูลที่ค้นหา' : 'ยังไม่มีข้อมูลผู้พัก'}</p>
                  {!tenantSearch && (
                    <button onClick={() => setShowTenantModal(true)} className={styles.primaryBtn}>➕ เพิ่มผู้พักแรก</button>
                  )}
                </div>
              ) : (
                filteredTenants.map((tenant, idx) => {
                  const occupyingRoom = rooms.find(r => r.tenantId === tenant.id);
                  return (
                    <div key={tenant.id} className={styles.tenantCard} style={{ animationDelay: `${idx * 0.08}s` }}>
                      <div className={styles.tenantCardHeader}>
                        <div>
                          <div className={styles.tenantCardName}>{tenant.name}</div>
                          {tenant.nickname && <div className={styles.tenantCardNickname}>"{tenant.nickname}"</div>}
                        </div>
                        <span className={occupyingRoom ? styles.tenantStatusIn : styles.tenantStatusOut}>
                          {occupyingRoom ? `ห้อง ${occupyingRoom.number}` : 'ไม่มีห้อง'}
                        </span>
                      </div>
                      <div className={styles.tenantCardInfo}>
                        <div className={styles.tenantInfoRow}>
                          <span className={styles.tenantInfoIcon}>📱</span>
                          <span>{tenant.phone}</span>
                        </div>
                        {tenant.idCard && (
                          <div className={styles.tenantInfoRow}>
                            <span className={styles.tenantInfoIcon}>🪪</span>
                            <span>{tenant.idCard.replace(/(\d{1})(\d{4})(\d{5})(\d{2})/, '$1-XXXX-XXXXX-$4')}</span>
                          </div>
                        )}
                        {tenant.email && (
                          <div className={styles.tenantInfoRow}>
                            <span className={styles.tenantInfoIcon}>📧</span>
                            <span>{tenant.email}</span>
                          </div>
                        )}
                        <div className={styles.tenantInfoRow}>
                          <span className={styles.tenantInfoIcon}>📅</span>
                          <span>เข้าพัก: {new Date(tenant.checkInDate).toLocaleDateString('th-TH')}</span>
                        </div>
                        {tenant.checkOutDate && (
                          <div className={styles.tenantInfoRow}>
                            <span className={styles.tenantInfoIcon}>🚪</span>
                            <span>ออก: {new Date(tenant.checkOutDate).toLocaleDateString('th-TH')}</span>
                          </div>
                        )}
                        <div className={styles.tenantInfoRow}>
                          <span className={styles.tenantInfoIcon}>🏦</span>
                          <span>มัดจำ: {tenant.deposit.toLocaleString()} ฿</span>
                        </div>
                        {tenant.emergencyName && (
                          <div className={styles.tenantInfoRow}>
                            <span className={styles.tenantInfoIcon}>🆘</span>
                            <span>{tenant.emergencyName} ({tenant.emergencyRelation}) - {tenant.emergencyPhone}</span>
                          </div>
                        )}
                      </div>
                      <div className={styles.tenantCardFooter}>
                        {tenant.note && <span className={styles.tenantNote} title={tenant.note}>📝 {tenant.note}</span>}
                        <div className={styles.actionButtons}>
                          <button onClick={() => { setEditingTenant(tenant); setShowTenantModal(true); }} className={styles.editBtn} title="แก้ไข">✏️</button>
                          {deleteConfirm?.type === 'tenant' && deleteConfirm.id === tenant.id ? (
                            <div className={styles.deleteConfirm}>
                              <button onClick={() => handleDeleteTenant(tenant.id)} className={styles.confirmYes} disabled={deleting}>{deleting ? '⏳' : '✓'}</button>
                              <button onClick={() => setDeleteConfirm(null)} className={styles.confirmNo} disabled={deleting}>✕</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm({ type: 'tenant', id: tenant.id })} className={styles.deleteBtn} title="ลบ">🗑️</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ═══════════ SETTINGS ═══════════ */}
        {currentPage === 'settings' && settings && (
          <div className={styles.settingsContent}>
            <div className={styles.settingsCard}>
              <div className={styles.settingsHeader}>
                <div>
                  <h3 className={styles.settingsTitle}>ข้อมูลหอพัก</h3>
                  <p className={styles.settingsSubtitle}>ข้อมูลพื้นฐานของหอพัก</p>
                </div>
                <button onClick={() => setShowSettingsModal(true)} className={styles.primaryBtn}>✏️ แก้ไข</button>
              </div>
              <div className={styles.settingsGrid}>
                {([
                  ['🏠', 'ชื่อหอพัก', settings.dormName],
                  ['📍', 'ที่อยู่', settings.address],
                  ['📞', 'เบอร์โทรศัพท์', settings.phone],
                  ['⚡', 'ค่าไฟฟ้า', `${settings.rateElec} บาท/หน่วย`],
                  ['💧', 'ค่าน้ำประปา', `${settings.rateWater} บาท/หน่วย`]
                ]).map(([icon, label, value]) => (
                  <div key={label} className={styles.settingItem}>
                    <div className={styles.settingIcon}>{icon}</div>
                    <div className={styles.settingInfo}>
                      <div className={styles.settingLabel}>{label}</div>
                      <div className={styles.settingValue}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.infoCard}>
              <h4 className={styles.infoTitle}>💡 เคล็ดลับ</h4>
              <p>การตั้งค่าค่าไฟฟ้าและค่าน้ำประปาจะถูกใช้ในการคำนวณบิลรายเดือนของผู้พักอาศัยแต่ละห้อง</p>
            </div>
          </div>
        )}
      </main>

      {/* ═══════════ MODALS ═══════════ */}

      {showRoomModal && (
        <RoomModal
          room={editingRoom}
          tenants={tenants}
          onClose={() => { setShowRoomModal(false); setEditingRoom(null); }}
          onSave={handleSaveRoom}
        />
      )}

      {showTenantModal && (
        <TenantModal
          tenant={editingTenant}
          onClose={() => { setShowTenantModal(false); setEditingTenant(null); }}
          onSave={handleSaveTenant}
        />
      )}

      {showSettingsModal && settings && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettingsModal(false)}
          onSave={handleSaveSettings}
        />
      )}

      {/* Toast */}
      <div className={styles.toastContainer}>
        {toasts.map((toast, idx) => (
          <div
            key={toast.id}
            className={`${styles.toast} ${styles[`toast${toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}`]}`}
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <span className={styles.toastIcon}>
              {toast.type === 'success' && '✅'}{toast.type === 'error' && '❌'}{toast.type === 'info' && 'ℹ️'}{toast.type === 'warning' && '⚠️'}
            </span>
            <span className={styles.toastMessage}>{toast.message}</span>
            <button className={styles.toastClose} onClick={() => removeToast(toast.id)}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Room Modal ─────────────────────────────────────────────────

function RoomModal({ room, tenants, onClose, onSave }: {
  room: Room | null;
  tenants: Tenant[];
  onClose: () => void;
  onSave: (room: Room) => void;
}) {
  const [number, setNumber] = useState(room?.number || '');
  const [rent, setRent] = useState(room?.rent.toString() || '');
  const [tenantId, setTenantId] = useState(room?.tenantId || '');
  const [note, setNote] = useState(room?.note || '');

  // Available tenants (not already in another room)
  const currentTenant = room?.tenantId ? tenants.find(t => t.id === room.tenantId) : null;
  const availableTenants = tenants.filter(t => {
    if (t.id === room?.tenantId) return true;
    return true; // show all, will handle in save
  });

  const handleSubmit = () => {
    if (!number.trim()) { alert('กรุณาระบุหมายเลขห้อง'); return; }
    onSave({
      id: room?.id || Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      number: number.trim(),
      rent: parseFloat(rent) || 0,
      tenantId: tenantId || undefined,
      note: note.trim()
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{room ? '✏️ แก้ไขห้อง' : '➕ เพิ่มห้องใหม่'}</h3>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}><span className={styles.labelIcon}>🏷️</span> หมายเลขห้อง</label>
              <input type="text" value={number} onChange={e => setNumber(e.target.value)} placeholder="เช่น 101, A201" className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}><span className={styles.labelIcon}>💰</span> ค่าเช่าต่อเดือน (บาท)</label>
              <input type="number" value={rent} onChange={e => setRent(e.target.value)} placeholder="3500" className={styles.input} />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}><span className={styles.labelIcon}>👤</span> ผู้พักอาศัย</label>
            <select
              value={tenantId}
              onChange={e => setTenantId(e.target.value)}
              className={styles.input}
            >
              <option value="">— ว่าง —</option>
              {availableTenants.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.phone})</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}><span className={styles.labelIcon}>📝</span> หมายเหตุ</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="เช่น รวมค่าเน็ต, มีแอร์" className={styles.input} />
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.btnCancel}>ยกเลิก</button>
          <button onClick={handleSubmit} className={styles.btnSave}>💾 บันทึก</button>
        </div>
      </div>
    </div>
  );
}

// ─── Tenant Modal ───────────────────────────────────────────────

function TenantModal({ tenant, onClose, onSave }: {
  tenant: Tenant | null;
  onClose: () => void;
  onSave: (tenant: Tenant) => void;
}) {
  const [name, setName] = useState(tenant?.name || '');
  const [nickname, setNickname] = useState(tenant?.nickname || '');
  const [idCard, setIdCard] = useState(tenant?.idCard || '');
  const [phone, setPhone] = useState(tenant?.phone || '');
  const [lineId, setLineId] = useState(tenant?.lineId || '');
  const [email, setEmail] = useState(tenant?.email || '');
  const [address, setAddress] = useState(tenant?.address || '');
  const [emergencyName, setEmergencyName] = useState(tenant?.emergencyName || '');
  const [emergencyPhone, setEmergencyPhone] = useState(tenant?.emergencyPhone || '');
  const [emergencyRelation, setEmergencyRelation] = useState(tenant?.emergencyRelation || '');
  const [deposit, setDeposit] = useState(tenant?.deposit.toString() || '0');
  const [checkInDate, setCheckInDate] = useState(tenant?.checkInDate || new Date().toISOString().split('T')[0]);
  const [checkOutDate, setCheckOutDate] = useState(tenant?.checkOutDate || '');
  const [note, setNote] = useState(tenant?.note || '');

  const handleSubmit = () => {
    if (!name.trim()) { alert('กรุณาระบุชื่อ-นามสกุล'); return; }
    if (!phone.trim()) { alert('กรุณาระบุเบอร์โทรศัพท์'); return; }
    onSave({
      id: tenant?.id || Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      name: name.trim(),
      nickname: nickname.trim() || undefined,
      idCard: idCard.trim() || undefined,
      phone: phone.trim(),
      lineId: lineId.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      emergencyName: emergencyName.trim() || undefined,
      emergencyPhone: emergencyPhone.trim() || undefined,
      emergencyRelation: emergencyRelation.trim() || undefined,
      deposit: parseFloat(deposit) || 0,
      checkInDate: checkInDate || new Date().toISOString().split('T')[0],
      checkOutDate: checkOutDate || undefined,
      note: note.trim() || undefined
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.modalLarge}`} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{tenant ? '✏️ แก้ไขข้อมูลผู้พัก' : '➕ เพิ่มผู้พักใหม่'}</h3>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </div>
        <div className={styles.modalBody}>
          {/* Section: ข้อมูลส่วนตัว */}
          <div className={styles.formSection}>
            <h4 className={styles.formSectionTitle}>👤 ข้อมูลส่วนตัว</h4>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>ชื่อ-นามสกุล <span className={styles.required}>*</span></label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="สมชาย ใจดี" className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>ชื่อเล่น</label>
                <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="ชาย" className={styles.input} />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>เลขบัตรประชาชน</label>
                <input type="text" value={idCard} onChange={e => setIdCard(e.target.value.replace(/\D/g, '').slice(0, 13))} placeholder="13 หลัก" maxLength={13} className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>เบอร์โทรศัพท์ <span className={styles.required}>*</span></label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="081-234-5678" className={styles.input} />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>LINE ID</label>
                <input type="text" value={lineId} onChange={e => setLineId(e.target.value)} placeholder="line_user_id" className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>อีเมล</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className={styles.input} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>ที่อยู่ตามทะเบียน</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="บ้านเลขที่... หมู่... ตำบล... อำเภอ... จังหวัด..." className={`${styles.input} ${styles.textarea}`} rows={2} />
            </div>
          </div>

          {/* Section: ข้อมูลฉุกเฉิน */}
          <div className={styles.formSection}>
            <h4 className={styles.formSectionTitle}>🆘 ข้อมูลผู้ติดต่อฉุกเฉิน</h4>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>ชื่อ-นามสกุล</label>
                <input type="text" value={emergencyName} onChange={e => setEmergencyName(e.target.value)} placeholder="สมหญิง ใจดี" className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>ความสัมพันธ์</label>
                <input type="text" value={emergencyRelation} onChange={e => setEmergencyRelation(e.target.value)} placeholder="เช่น พี่สาว, ภรรยา" className={styles.input} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>เบอร์โทรศัพท์ฉุกเฉิน</label>
              <input type="text" value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} placeholder="089-876-5432" className={styles.input} />
            </div>
          </div>

          {/* Section: ข้อมูลการเข้าพัก */}
          <div className={styles.formSection}>
            <h4 className={styles.formSectionTitle}>🏠 ข้อมูลการเข้าพัก</h4>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>วันที่เข้าพัก <span className={styles.required}>*</span></label>
                <input type="date" value={checkInDate} onChange={e => setCheckInDate(e.target.value)} className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>วันที่ออกจากห้อง</label>
                <input type="date" value={checkOutDate} onChange={e => setCheckOutDate(e.target.value)} className={styles.input} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>เงินมัดจำ (บาท)</label>
              <input type="number" value={deposit} onChange={e => setDeposit(e.target.value)} placeholder="0" className={styles.input} />
            </div>
          </div>

          {/* Section: หมายเหตุ */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>📝 หมายเหตุ</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="เช่น แพ้อาหาร, ชอบ安静, ต้องการห้องชั้นล่าง" className={`${styles.input} ${styles.textarea}`} rows={2} />
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.btnCancel}>ยกเลิก</button>
          <button onClick={handleSubmit} className={styles.btnSave}>💾 บันทึก</button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Modal ─────────────────────────────────────────────

function SettingsModal({ settings, onClose, onSave }: {
  settings: Settings;
  onClose: () => void;
  onSave: (s: Settings) => void;
}) {
  const [dormName, setDormName] = useState(settings.dormName);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [rateElec, setRateElec] = useState(settings.rateElec.toString());
  const [rateWater, setRateWater] = useState(settings.rateWater.toString());

  const handleSubmit = () => {
    onSave({ ...settings, dormName, address, phone, rateElec: parseFloat(rateElec) || 0, rateWater: parseFloat(rateWater) || 0 });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>⚙️ แก้ไขตั้งค่า</h3>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}><span className={styles.labelIcon}>🏠</span> ชื่อหอพัก</label>
            <input type="text" value={dormName} onChange={e => setDormName(e.target.value)} className={styles.input} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}><span className={styles.labelIcon}>📍</span> ที่อยู่</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} className={styles.input} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}><span className={styles.labelIcon}>📞</span> เบอร์โทรศัพท์</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className={styles.input} />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}><span className={styles.labelIcon}>⚡</span> ค่าไฟฟ้า (บาท/หน่วย)</label>
              <input type="number" value={rateElec} onChange={e => setRateElec(e.target.value)} className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}><span className={styles.labelIcon}>💧</span> ค่าน้ำประปา (บาท/หน่วย)</label>
              <input type="number" value={rateWater} onChange={e => setRateWater(e.target.value)} className={styles.input} />
            </div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.btnCancel}>ยกเลิก</button>
          <button onClick={handleSubmit} className={styles.btnSave}>💾 บันทึก</button>
        </div>
      </div>
    </div>
  );
}
