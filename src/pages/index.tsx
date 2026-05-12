import { useState, useEffect } from 'react';
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

export default function Home() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

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
      console.log('Rooms loaded:', roomsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const handleAddRoom = async (room: Room) => {
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(room)
    });
    if (res.ok) {
      await fetchData();
      setShowModal(false);
    }
  };

  const handleEditRoom = async (room: Room) => {
    const res = await fetch('/api/rooms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(room)
    });
    if (res.ok) {
      await fetchData();
      setShowModal(false);
      setEditingRoom(null);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('ต้องการลบห้องนี้?')) return;
    const res = await fetch('/api/rooms', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      await fetchData();
    }
  };

  const openAddModal = () => {
    setEditingRoom(null);
    setShowModal(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <nav className={styles.sidebar}>
        <div className={styles.logo}>
          <span>🏠</span>
          <h1>หอพัก Billing</h1>
        </div>
        <button className={currentPage === 'dashboard' ? styles.active : ''} onClick={() => setCurrentPage('dashboard')}>
          📊 แดชบอร์ด
        </button>
        <button className={currentPage === 'rooms' ? styles.active : ''} onClick={() => setCurrentPage('rooms')}>
          🚪 จัดการห้อง
        </button>
        <button className={currentPage === 'settings' ? styles.active : ''} onClick={() => setCurrentPage('settings')}>
          ⚙️ ตั้งค่า
        </button>
      </nav>

      <main className={styles.main}>
        {currentPage === 'dashboard' && (
          <div>
            <h1>📊 แดชบอร์ด</h1>
            <div className={styles.stats}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>ห้องทั้งหมด</div>
                <div className={styles.statValue}>{rooms.length}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>ผู้พักอาศัย</div>
                <div className={styles.statValue}>{rooms.filter(r => r.tenantName).length}</div>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'rooms' && (
          <div>
            <div className={styles.pageHeader}>
              <h1>🚪 จัดการห้อง</h1>
              <button onClick={openAddModal}>➕ เพิ่มห้อง</button>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ห้อง</th>
                  <th>ค่าเช่า</th>
                  <th>ผู้พัก</th>
                  <th>เบอร์โทร</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {rooms.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>ยังไม่มีห้อง</td>
                  </tr>
                ) : (
                  rooms.map(room => (
                    <tr key={room.id}>
                      <td><span className={styles.roomNumber}>{room.number}</span></td>
                      <td>{room.rent.toLocaleString()} ฿</td>
                      <td>{room.tenantName || <span style={{ color: '#ccc' }}>— ว่าง —</span>}</td>
                      <td>{room.tenantPhone || '—'}</td>
                      <td>
                        <button onClick={() => openEditModal(room)} style={{ marginRight: '8px' }}>✏️</button>
                        <button onClick={() => handleDeleteRoom(room.id)}>🗑️</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {currentPage === 'settings' && (
          <div>
            <h1>⚙️ ตั้งค่า</h1>
            {settings && (
              <div className={styles.settingsCard}>
                <p><strong>ชื่อหอ:</strong> {settings.dormName}</p>
                <p><strong>ที่อยู่:</strong> {settings.address}</p>
                <p><strong>เบอร์โทร:</strong> {settings.phone}</p>
                <p><strong>ค่าไฟ:</strong> {settings.rateElec} บาท/หน่วย</p>
                <p><strong>ค่าน้ำ:</strong> {settings.rateWater} บาท/หน่วย</p>
              </div>
            )}
          </div>
        )}
      </main>

      {showModal && (
        <RoomModal
          room={editingRoom}
          onClose={() => setShowModal(false)}
          onSave={editingRoom ? handleEditRoom : handleAddRoom}
        />
      )}
    </div>
  );
}

function RoomModal({ room, onClose, onSave }: { room: Room | null; onClose: () => void; onSave: (room: Room) => void }) {
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
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3>{room ? '✏️ แก้ไขห้อง' : '➕ เพิ่มห้อง'}</h3>
        <div className={styles.formGroup}>
          <label>หมายเลขห้อง</label>
          <input type="text" value={number} onChange={e => setNumber(e.target.value)} placeholder="เช่น 101" />
        </div>
        <div className={styles.formGroup}>
          <label>ค่าเช่าต่อเดือน (บาท)</label>
          <input type="number" value={rent} onChange={e => setRent(e.target.value)} placeholder="3500" />
        </div>
        <div className={styles.formGroup}>
          <label>ชื่อผู้พัก</label>
          <input type="text" value={tenantName} onChange={e => setTenantName(e.target.value)} placeholder="ชื่อ-นามสกุล" />
        </div>
        <div className={styles.formGroup}>
          <label>เบอร์โทรศัพท์</label>
          <input type="text" value={tenantPhone} onChange={e => setTenantPhone(e.target.value)} placeholder="081-234-5678" />
        </div>
        <div className={styles.formGroup}>
          <label>LINE User ID</label>
          <input type="text" value={tenantUserId} onChange={e => setTenantUserId(e.target.value)} placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
        </div>
        <div className={styles.formGroup}>
          <label>หมายเหตุ</label>
          <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="เช่น รวมค่าเน็ต" />
        </div>
        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.btnCancel}>ยกเลิก</button>
          <button onClick={handleSubmit} className={styles.btnSave}>💾 บันทึก</button>
        </div>
      </div>
    </div>
  );
}
