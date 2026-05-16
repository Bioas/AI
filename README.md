# ระบบจัดการหอพัก (Dorm Billing System)

ระบบจัดการหอพักแบบครบวงจร สำหรับจัดการห้องพัก ผู้พักอาศัย บันทึกมิเตอร์ ออกใบแจ้งหนี้ และส่งใบแจ้งหนี้ผ่าน LINE

## ฟีเจอร์หลัก

- **จัดการห้องพัก** - เพิ่ม/แก้ไข/ลบห้องพัก กำหนดค่าเช่า ประเภทห้อง รหัสห้อง
- **จัดการผู้พักอาศัย** - บันทึกข้อมูลผู้พัก เชื่อมโยงกับห้องพัก
- **บันทึกมิเตอร์** - บันทึกเลขมิเตอร์ไฟฟ้าและน้ำประปารายเดือน
- **ใบแจ้งหนี้** - สร้างใบแจ้งหนี้อัตโนมัติ พร้อมลายเซ็นและ QR Code ชำระเงิน
- **LINE Messaging** - ส่งใบแจ้งหนี้ให้ผู้พักผ่าน LINE Official Account
- **ตั้งค่าระบบ** - จัดการโลโก้ ลายเซ็น QR Code อัตราค่าใช้จ่าย

## เทคโนโลยีที่ใช้

### Frontend
- React 18
- Vite
- Tailwind CSS
- Framer Motion

### Backend
- Express.js
- Node.js

### Database
- **Local Mode**: JSON File (สำหรับรันบนเครื่อง)
- **Cloud Mode**: MongoDB (สำหรับ deploy บน Vercel)

## การติดตั้ง

### 1. ติดตั้ง dependencies

```bash
npm install
npm --prefix server install
```

### 2. รันในโหมด Local (ใช้ JSON Database)

สร้างไฟล์ `.env.local` ที่ root directory:

```
USE_LOCAL_DB=true
```

Seed ข้อมูลเริ่มต้น:

```bash
npm run seed
```

รัน server และ frontend:

```bash
npm run dev:all
```

หรือรันแยก:

```bash
# Frontend (Vite)
npm run dev

# Backend (Express)
npm run dev:server
```

### 3. รันในโหมด Cloud (ใช้ MongoDB)

สร้างไฟล์ `.env` ที่ root directory:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dorm_billing
```

รัน server และ frontend:

```bash
npm run dev:all
```

## โครงสร้างโปรเจค

```
├── src/                    # Frontend (React)
│   ├── components/         # React components
│   ├── context/            # App context
│   ├── lib/                # Utility functions
│   └── styles/             # Global styles
├── server/                 # Backend (Express)
│   ├── routes/             # API routes
│   ├── lib/                # Database adapters
│   │   ├── mongodb.js      # MongoDB adapter
│   │   └── local-db.js     # Local JSON adapter
│   ├── data/               # Local database files (gitignore)
│   └── index.js            # Server entry point
├── api/                    # Vercel serverless functions
└── .env.local              # Local environment (gitignore)
```

## Environment Variables

| Variable | คำอธิบาย | จำเป็นสำหรับ |
|----------|----------|---------------|
| `USE_LOCAL_DB` | ใช้ `true` เพื่อเปิดโหมด Local JSON Database | Local development |
| `MONGODB_URI` | Connection string ของ MongoDB | Cloud/Vercel deployment |
| `PORT` | พอร์ตของ server (default: 3001) | ทั้งสองโหมด |

## การ Deploy บน Vercel

1. Push code ขึ้น GitHub
2. เชื่อมต่อโปรเจคกับ Vercel
3. ตั้งค่า Environment Variables ใน Vercel Dashboard:
   - `MONGODB_URI` - MongoDB connection string
4. Deploy

> **หมายเหตุ**: ไฟล์ `.env.local` และโฟลเดอร์ `data/` จะไม่ถูก deploy ขึ้น Vercel

## คำสั่งที่ใช้บ่อย

| คำสั่ง | คำอธิบาย |
|--------|----------|
| `npm run dev` | รัน frontend (Vite dev server) |
| `npm run dev:server` | รัน backend server |
| `npm run dev:all` | รันทั้ง frontend + backend พร้อมกัน |
| `npm run build` | Build frontend สำหรับ production |
| `npm run preview` | Preview build |
| `npm run seed` | Seed ข้อมูลเริ่มต้นสำหรับ Local DB |

## การสำรองข้อมูล

### Local Mode
ข้อมูลเก็บใน `server/data/local-db.json` สามารถ copy ไฟล์นี้เพื่อสำรองข้อมูลได้

### Export/Import
ใช้ฟีเจอร์ "ส่งออกข้อมูล" และ "นำเข้าข้อมูล" ในหน้าตั้งค่าระบบ

## License

MIT
