import { useState, useEffect, useCallback, useRef } from 'react';
import styles from '../styles/Home.module.css';

interface Room {
  id: string;
  number: string;
  rent: number;
  tenantName?: string;
  tenantPhone?: string;
  tenantUserId?: string;
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

export default function Home() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Search & Filter & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('number');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Toast
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const toastTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Toast management
  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    setToasts(prev => [...prev, { id, message, type }]);
    toastTimeoutRef.current[id] = setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    if (toastTimeoutRef.current[id]) {
      clearTimeout(toastTimeoutRef.current[id]);
      delete toastTimeoutRef.current[id];
    }
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(toastTimeoutRef.current).forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, settingsRes] = await Promise.all([
        fetch('/api/rooms'),
        fetch('/api/settings')
      ]);
      const roomsData = await roomsRes.json();
      const settingsData = await settingsRes.json();
      setRooms(roomsData || []);
      setSettings(settingsData || null);
    } catch (error) {
      console.error('Error fetching data:', error);
      addToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
    }
    setLoading(false);
  };

  const handleAddRoom = async (room: Room) => {
    setActionLoading({ add: true });
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(room)
      });
      if (res.ok) {
        await fetchData();
        setShowModal(false);
        addToast(`เพิ่มห้อง ${room.number} สำเร็จ`, 'success');
      } else {
        addToast('เกิดข้อผิดพลาดในการเพิ่มห้อง', 'error');
      }
    } catch (error) {
      addToast('เกิดข้อผิดพลาดในการเพิ่มห้อง', 'error');
    }
    setActionLoading({ add: false });
  };

  const handleEditRoom = async (room: Room) => {
    setActionLoading({ edit: true });
    try {
      const res = await fetch('/api/rooms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(room)
      });
      if (res.ok) {
        await fetchData();
        setShowModal(false);
        setEditingRoom(null);
        addToast(`แก้ไขห้อง ${room.number} สำเร็จ`, 'success');
      } else {
        addToast('เกิดข้อผิดพลาดในการแก้ไขห้อง', 'error');
      }
    } catch (error) {
      addToast('เกิดข้อผิดพลาดในการแก้ไขห้อง', 'error');
    }
    setActionLoading({ edit: false });
  };

  const handleDeleteRoom = async (id: string) => {
    const room = rooms.find(r => r.id === id);
    setActionLoading({ delete: id });
    try {
      const res = await fetch('/api/rooms', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        await fetchData();
        addToast(`ลบห้อง ${room?.number || ''} สำเร็จ`, 'success');
      } else {
        addToast('เกิดข้อผิดพลาดในการลบห้อง', 'error');
      }
    } catch (error) {
      addToast('เกิดข้อผิดพลาดในการลบห้อง', 'error');
    }
    setShowDeleteConfirm(null);
    setActionLoading({});
  };

  const handleSaveSettings = async (newSettings: Settings) => {
    setActionLoading({ settings: true });
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        setSettings(newSettings);
        setShowSettingsModal(false);
        addToast('บันทึกการตั้งค่าสำเร็จ', 'success');
      } else {
        addToast('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า', 'error');
      }
    } catch (error) {
      addToast('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า', 'error');
    }
    setActionLoading({ settings: false });
  };

  const openAddModal = () => {
    setEditingRoom(null);
    setShowModal(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setShowModal(true);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtered & sorted rooms
  const filteredRooms = rooms
    .filter(room => {
      if (filterStatus === 'occupied') return !!room.tenantName;
      if (filterStatus === 'vacant') return !room.tenantName;
      return true;
    })
    .filter(room => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        room.number.toLowerCase().includes(query) ||
        (room.tenantName?.toLowerCase().includes(query)) ||
        (room.tenantPhone?.toLowerCase().includes(query)) ||
        (room.note?.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'number') {
        comparison = a.number.localeCompare(b.number, undefined, { numeric: true });
      } else if (sortField === 'rent') {
        comparison = a.rent - b.rent;
      } else if (sortField === 'tenantName') {
        comparison = (a.tenantName || '').localeCompare(b.tenantName || '');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const occupiedRooms = rooms.filter(r => r.tenantName).length;
  const vacantRooms = rooms.length - occupiedRooms;
  const totalRent = rooms.filter(r => r.tenantName).reduce((sum, r) => sum + r.rent, 0);
  const occupancyRate = rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 100) : 0;

  // Clear search
  const clearSearch = () => setSearchQuery('');

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />
      )}

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
        <button
          className={`${styles.navItem} ${currentPage === 'dashboard' ? styles.active : ''}`}
          onClick={() => { setCurrentPage('dashboard'); setSidebarOpen(false); }}
        >
          <span className={styles.navIcon}>📊</span>
          <span>แดชบอร์ด</span>
        </button>
        <button
          className={`${styles.navItem} ${currentPage === 'rooms' ? styles.active : ''}`}
          onClick={() => { setCurrentPage('rooms'); setSidebarOpen(false); }}
        >
          <span className={styles.navIcon}>🚪</span>
          <span>จัดการห้อง</span>
        </button>
        <button
          className={`${styles.navItem} ${currentPage === 'settings' ? styles.active : ''}`}
          onClick={() => { setCurrentPage('settings'); setSidebarOpen(false); }}
        >
          <span className={styles.navIcon}>⚙️</span>
          <span>ตั้งค่า</span>
        </button>

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

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.menuToggle} onClick={() => setSidebarOpen(true)}>☰</button>
            <div>
              <h2 className={styles.pageTitle}>
                {currentPage === 'dashboard' && '📊 ภาพรวม'}
                {currentPage === 'rooms' && '🚪 จัดการห้อง'}
                {currentPage === 'settings' && '⚙️ ตั้งค่า'}
              </h2>
              <p className={styles.pageSubtitle}>
                {currentPage === 'dashboard' && 'ติดตามสถานะหอพักของคุณ'}
                {currentPage === 'rooms' && 'จัดการข้อมูลห้องและผู้พัก'}
                {currentPage === 'settings' && 'ตั้งค่าระบบและข้อมูลหอพัก'}
              </p>
            </div>
          </div>
          <div className={styles.headerDate}>
            {new Date().toLocaleDateString('th-TH', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </header>

        {currentPage === 'dashboard' && (
          <div className={styles.dashboardContent}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard + ' ' + styles.statBlue}>
                <div className={styles.statIcon}>🏢</div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{rooms.length}</div>
                  <div className={styles.statLabel}>ห้องทั้งหมด</div>
                </div>
              </div>
              <div className={styles.statCard + ' ' + styles.statGreen}>
                <div className={styles.statIcon}>✅</div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{occupiedRooms}</div>
                  <div className={styles.statLabel}>มีผู้พักอาศัย</div>
                </div>
              </div>
              <div className={styles.statCard + ' ' + styles.statOrange}>
                <div className={styles.statIcon}>🔑</div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{vacantRooms}</div>
                  <div className={styles.statLabel}>ห้องว่าง</div>
                </div>
              </div>
              <div className={styles.statCard + ' ' + styles.statPurple}>
                <div className={styles.statIcon}>💰</div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{totalRent.toLocaleString()}</div>
                  <div className={styles.statLabel}>ค่าเช่ารวม (บาท)</div>
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
                <div
                  className={styles.occupancyFill}
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
              <div className={styles.occupancyLabels}>
                <span className={styles.occupancyLabel}>ว่าง {vacantRooms} ห้อง</span>
                <span className={styles.occupancyLabel}>มีผู้พัก {occupiedRooms} ห้อง</span>
              </div>
            </div>

            <div className={styles.recentRooms}>
              <h3 className={styles.sectionTitle}>ห้องล่าสุด</h3>
              <div className={styles.roomsList}>
                {rooms.length === 0 ? (
                  <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>📭</span>
                    <p>ยังไม่มีข้อมูลห้อง</p>
                    <button onClick={() => setCurrentPage('rooms')} className={styles.primaryBtn}>
                      ➕ เพิ่มห้องแรก
                    </button>
                  </div>
                ) : (
                  rooms.slice(0, 6).map((room, idx) => (
                    <div key={room.id} className={styles.roomCard} style={{ animationDelay: `${idx * 0.1}s` }}>
                      <div className={styles.roomCardHeader}>
                        <span className={styles.roomBadge}>{room.number}</span>
                        <span className={room.tenantName ? styles.statusOccupied : styles.statusVacant}>
                          {room.tenantName ? 'มีผู้พัก' : 'ว่าง'}
                        </span>
                      </div>
                      <div className={styles.roomCardInfo}>
                        {room.tenantName ? (
                          <>
                            <div className={styles.tenantName}>{room.tenantName}</div>
                            <div className={styles.tenantPhone}>{room.tenantPhone}</div>
                          </>
                        ) : (
                          <div className={styles.vacantHint}>พร้อมให้ผู้พักใหม่</div>
                        )}
                      </div>
                      <div className={styles.roomCardFooter}>
                        <span className={styles.rentAmount}>{room.rent.toLocaleString()} ฿</span>
                        {room.note && <span className={styles.roomNote} title={room.note}>📝 {room.note}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {currentPage === 'rooms' && (
          <div className={styles.roomsContent}>
            <div className={styles.actionBar}>
              <div className={styles.searchBox}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาห้อง, ผู้พัก, เบอร์โทร, หมายเหตุ..."
                  className={styles.searchInput}
                />
                {searchQuery && (
                  <button className={styles.searchClear} onClick={clearSearch}>✕</button>
                )}
              </div>
              <button onClick={openAddModal} className={styles.primaryBtn}>
                <span>➕</span> เพิ่มห้อง
              </button>
            </div>

            {/* Filter Tabs */}
            <div className={styles.filterTabs}>
              <button
                className={`${styles.filterTab} ${filterStatus === 'all' ? styles.filterTabActive : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                ทั้งหมด <span className={styles.filterCount}>{rooms.length}</span>
              </button>
              <button
                className={`${styles.filterTab} ${filterStatus === 'occupied' ? styles.filterTabActive : ''}`}
                onClick={() => setFilterStatus('occupied')}
              >
                มีผู้พัก <span className={styles.filterCount}>{occupiedRooms}</span>
              </button>
              <button
                className={`${styles.filterTab} ${filterStatus === 'vacant' ? styles.filterTabActive : ''}`}
                onClick={() => setFilterStatus('vacant')}
              >
                ว่าง <span className={styles.filterCount}>{vacantRooms}</span>
              </button>
            </div>

            {/* Sort Controls */}
            <div className={styles.sortControls}>
              <span className={styles.sortLabel}>เรียงตาม:</span>
              <button
                className={`${styles.sortBtn} ${sortField === 'number' ? styles.sortBtnActive : ''}`}
                onClick={() => toggleSort('number')}
              >
                ห้อง {sortField === 'number' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                className={`${styles.sortBtn} ${sortField === 'rent' ? styles.sortBtnActive : ''}`}
                onClick={() => toggleSort('rent')}
              >
                ค่าเช่า {sortField === 'rent' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                className={`${styles.sortBtn} ${sortField === 'tenantName' ? styles.sortBtnActive : ''}`}
                onClick={() => toggleSort('tenantName')}
              >
                ชื่อ {sortField === 'tenantName' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            </div>

            {/* Results count */}
            {(searchQuery || filterStatus !== 'all') && (
              <div className={styles.resultsInfo}>
                พบ {filteredRooms.length} ห้อง จากทั้งหมด {rooms.length} ห้อง
              </div>
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
                      <td colSpan={6} style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <div className={styles.emptyState}>
                          <span className={styles.emptyIcon}>🔍</span>
                          <p>ไม่พบข้อมูลที่ค้นหา</p>
                          <button onClick={clearSearch} className={styles.secondaryBtn}>
                            ล้างการค้นหา
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRooms.map((room, idx) => (
                      <tr key={room.id} style={{ animationDelay: `${idx * 0.05}s` }}>
                        <td>
                          <span className={styles.roomNumber}>{room.number}</span>
                        </td>
                        <td>
                          <span className={styles.rentCell}>{room.rent.toLocaleString()} ฿</span>
                        </td>
                        <td>
                          {room.tenantName ? (
                            <span className={styles.tenantCell}>{room.tenantName}</span>
                          ) : (
                            <span className={styles.vacantCell}>— ว่าง —</span>
                          )}
                        </td>
                        <td>{room.tenantPhone || <span className={styles.emptyText}>—</span>}</td>
                        <td>
                          <span className={room.tenantName ? styles.statusBadgeOccupied : styles.statusBadgeVacant}>
                            {room.tenantName ? 'มีผู้พัก' : 'ว่าง'}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button
                              onClick={() => openEditModal(room)}
                              className={styles.editBtn}
                              title="แก้ไข"
                            >
                              ✏️
                            </button>
                            {showDeleteConfirm === room.id ? (
                              <div className={styles.deleteConfirm}>
                                <span>ยืนยันลบ?</span>
                                <button
                                  onClick={() => handleDeleteRoom(room.id)}
                                  className={styles.confirmYes}
                                  disabled={actionLoading.delete === room.id}
                                >
                                  {actionLoading.delete === room.id ? '⏳' : '✓'}
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(null)}
                                  className={styles.confirmNo}
                                  disabled={actionLoading.delete === room.id}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowDeleteConfirm(room.id)}
                                className={styles.deleteBtn}
                                title="ลบ"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentPage === 'settings' && (
          <div className={styles.settingsContent}>
            {settings && (
              <>
                <div className={styles.settingsCard}>
                  <div className={styles.settingsHeader}>
                    <div>
                      <h3 className={styles.settingsTitle}>ข้อมูลหอพัก</h3>
                      <p className={styles.settingsSubtitle}>ข้อมูลพื้นฐานของหอพัก</p>
                    </div>
                    <button onClick={() => setShowSettingsModal(true)} className={styles.primaryBtn}>
                      ✏️ แก้ไข
                    </button>
                  </div>

                  <div className={styles.settingsGrid}>
                    <div className={styles.settingItem}>
                      <div className={styles.settingIcon}>🏠</div>
                      <div className={styles.settingInfo}>
                        <div className={styles.settingLabel}>ชื่อหอพัก</div>
                        <div className={styles.settingValue}>{settings.dormName}</div>
                      </div>
                    </div>
                    <div className={styles.settingItem}>
                      <div className={styles.settingIcon}>📍</div>
                      <div className={styles.settingInfo}>
                        <div className={styles.settingLabel}>ที่อยู่</div>
                        <div className={styles.settingValue}>{settings.address}</div>
                      </div>
                    </div>
                    <div className={styles.settingItem}>
                      <div className={styles.settingIcon}>📞</div>
                      <div className={styles.settingInfo}>
                        <div className={styles.settingLabel}>เบอร์โทรศัพท์</div>
                        <div className={styles.settingValue}>{settings.phone}</div>
                      </div>
                    </div>
                    <div className={styles.settingItem}>
                      <div className={styles.settingIcon}>⚡</div>
                      <div className={styles.settingInfo}>
                        <div className={styles.settingLabel}>ค่าไฟฟ้า</div>
                        <div className={styles.settingValue}>{settings.rateElec} บาท/หน่วย</div>
                      </div>
                    </div>
                    <div className={styles.settingItem}>
                      <div className={styles.settingIcon}>💧</div>
                      <div className={styles.settingInfo}>
                        <div className={styles.settingLabel}>ค่าน้ำประปา</div>
                        <div className={styles.settingValue}>{settings.rateWater} บาท/หน่วย</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.infoCard}>
                  <h4 className={styles.infoTitle}>💡 เคล็ดลับ</h4>
                  <p>การตั้งค่าค่าไฟฟ้าและค่าน้ำประปาจะถูกใช้ในการคำนวณบิลรายเดือนของผู้พักอาศัยแต่ละห้อง</p>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {showModal && (
        <RoomModal
          room={editingRoom}
          onClose={() => setShowModal(false)}
          onSave={editingRoom ? handleEditRoom : handleAddRoom}
          isSaving={!!actionLoading.add || !!actionLoading.edit}
        />
      )}

      {showSettingsModal && settings && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettingsModal(false)}
          onSave={handleSaveSettings}
          isSaving={!!actionLoading.settings}
        />
      )}

      {/* Toast Notifications */}
      <div className={styles.toastContainer}>
        {toasts.map((toast, idx) => (
          <div
            key={toast.id}
            className={`${styles.toast} ${styles[`toast${toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}`]}`}
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <span className={styles.toastIcon}>
              {toast.type === 'success' && '✅'}
              {toast.type === 'error' && '❌'}
              {toast.type === 'info' && 'ℹ️'}
              {toast.type === 'warning' && '⚠️'}
            </span>
            <span className={styles.toastMessage}>{toast.message}</span>
            <button className={styles.toastClose} onClick={() => removeToast(toast.id)}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoomModal({ room, onClose, onSave, isSaving }: {
  room: Room | null;
  onClose: () => void;
  onSave: (room: Room) => void;
  isSaving: boolean;
}) {
  const [number, setNumber] = useState(room?.number || '');
  const [rent, setRent] = useState(room?.rent.toString() || '');
  const [tenantName, setTenantName] = useState(room?.tenantName || '');
  const [tenantPhone, setTenantPhone] = useState(room?.tenantPhone || '');
  const [tenantUserId, setTenantUserId] = useState(room?.tenantUserId || '');
  const [note, setNote] = useState(room?.note || '');

  const handleSubmit = () => {
    if (!number) {
      alert('กรุณาระบุหมายเลขห้อง');
      return;
    }
    const roomData: Room = {
      id: room?.id || Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      number,
      rent: parseFloat(rent) || 0,
      tenantName,
      tenantPhone,
      tenantUserId,
      note
    };
    onSave(roomData);
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
              <label className={styles.formLabel}>
                <span className={styles.labelIcon}>🏷️</span>
                หมายเลขห้อง
              </label>
              <input
                type="text"
                value={number}
                onChange={e => setNumber(e.target.value)}
                placeholder="เช่น 101, A201"
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <span className={styles.labelIcon}>💰</span>
                ค่าเช่าต่อเดือน (บาท)
              </label>
              <input
                type="number"
                value={rent}
                onChange={e => setRent(e.target.value)}
                placeholder="3500"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <span className={styles.labelIcon}>👤</span>
              ชื่อผู้พักอาศัย
            </label>
            <input
              type="text"
              value={tenantName}
              onChange={e => setTenantName(e.target.value)}
              placeholder="ชื่อ-นามสกุล"
              className={styles.input}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <span className={styles.labelIcon}>📱</span>
                เบอร์โทรศัพท์
              </label>
              <input
                type="text"
                value={tenantPhone}
                onChange={e => setTenantPhone(e.target.value)}
                placeholder="081-234-5678"
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <span className={styles.labelIcon}>💬</span>
                LINE User ID
              </label>
              <input
                type="text"
                value={tenantUserId}
                onChange={e => setTenantUserId(e.target.value)}
                placeholder="Uxxxxxxxx..."
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <span className={styles.labelIcon}>📝</span>
              หมายเหตุ
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="เช่น รวมค่าเน็ต, มีแอร์"
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.btnCancel} disabled={isSaving}>ยกเลิก</button>
          <button onClick={handleSubmit} className={styles.btnSave} disabled={isSaving}>
            {isSaving ? '⏳ กำลังบันทึก...' : '💾 บันทึกข้อมูล'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsModal({
  settings,
  onClose,
  onSave,
  isSaving
}: {
  settings: Settings;
  onClose: () => void;
  onSave: (settings: Settings) => void;
  isSaving: boolean;
}) {
  const [dormName, setDormName] = useState(settings.dormName);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [rateElec, setRateElec] = useState(settings.rateElec.toString());
  const [rateWater, setRateWater] = useState(settings.rateWater.toString());

  const handleSubmit = () => {
    const newSettings: Settings = {
      ...settings,
      dormName,
      address,
      phone,
      rateElec: parseFloat(rateElec) || 0,
      rateWater: parseFloat(rateWater) || 0
    };
    onSave(newSettings);
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
            <label className={styles.formLabel}>
              <span className={styles.labelIcon}>🏠</span>
              ชื่อหอพัก
            </label>
            <input
              type="text"
              value={dormName}
              onChange={e => setDormName(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <span className={styles.labelIcon}>📍</span>
              ที่อยู่
            </label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <span className={styles.labelIcon}>📞</span>
              เบอร์โทรศัพท์
            </label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <span className={styles.labelIcon}>⚡</span>
                ค่าไฟฟ้า (บาท/หน่วย)
              </label>
              <input
                type="number"
                value={rateElec}
                onChange={e => setRateElec(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <span className={styles.labelIcon}>💧</span>
                ค่าน้ำประปา (บาท/หน่วย)
              </label>
              <input
                type="number"
                value={rateWater}
                onChange={e => setRateWater(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.btnCancel} disabled={isSaving}>ยกเลิก</button>
          <button onClick={handleSubmit} className={styles.btnSave} disabled={isSaving}>
            {isSaving ? '⏳ กำลังบันทึก...' : '💾 บันทึกการตั้งค่า'}
          </button>
        </div>
      </div>
    </div>
  );
}
