import { useState, useEffect } from 'react';

// Types
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

  // Fetch data on mount
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
    }
    setLoading(false);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <div><h1>Dashboard</h1><p>Rooms: {rooms.length}</p></div>;
      case 'rooms':
        return (
          <div>
            <h1>จัดการห้อง</h1>
            <button onClick={() => alert('Add room')}>➕ เพิ่มห้อง</button>
            <table>
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
                {rooms.map(room => (
                  <tr key={room.id}>
                    <td>{room.number}</td>
                    <td>{room.rent.toLocaleString()} ฿</td>
                    <td>{room.tenantName || '— ว่าง —'}</td>
                    <td>{room.tenantPhone || '—'}</td>
                    <td>
                      <button>✏️</button>
                      <button>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'settings':
        return (
          <div>
            <h1>ตั้งค่า</h1>
            {settings && (
              <div>
                <p>ชื่อหอ: {settings.dormName}</p>
                <p>ค่าไฟ: {settings.rateElec} บาท/หน่วย</p>
                <p>ค่าน้ำ: {settings.rateWater} บาท/หน่วย</p>
              </div>
            )}
          </div>
        );
      default:
        return <div>Select a page</div>;
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex' }}>
      <nav style={{ width: '200px', padding: '20px', background: '#10b981' }}>
        <div style={{ marginBottom: '20px', fontWeight: 'bold' }}>🏠 หอพัก Billing</div>
        <button onClick={() => setCurrentPage('dashboard')} style={{ display: 'block', width: '100%', marginBottom: '10px' }}>📊 แดชบอร์ด</button>
        <button onClick={() => setCurrentPage('rooms')} style={{ display: 'block', width: '100%', marginBottom: '10px' }}>🚪 จัดการห้อง</button>
        <button onClick={() => setCurrentPage('settings')} style={{ display: 'block', width: '100%' }}>⚙️ ตั้งค่า</button>
      </nav>
      <main style={{ flex: 1, padding: '20px' }}>
        {renderPage()}
      </main>
    </div>
  );
}
