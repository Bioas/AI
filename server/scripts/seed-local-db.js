import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_DIR = path.join(__dirname, '..', 'data')
const DB_PATH = path.join(DB_DIR, 'local-db.json')

const seedData = {
  rooms: [
    { id: 'room001', roomNumber: '101', roomCode: '', residentId: null, rentPrice: 3500, roomType: 'มีทีวี', prevElecMeter: 0, prevWaterMeter: 0, note: '', status: 'ว่าง', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'room002', roomNumber: '102', roomCode: '', residentId: null, rentPrice: 3500, roomType: 'ไม่มีทีวี', prevElecMeter: 0, prevWaterMeter: 0, note: '', status: 'ว่าง', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'room003', roomNumber: '201', roomCode: '', residentId: null, rentPrice: 4000, roomType: 'มีทีวี', prevElecMeter: 0, prevWaterMeter: 0, note: '', status: 'ว่าง', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'room004', roomNumber: '202', roomCode: '', residentId: null, rentPrice: 4000, roomType: 'มีทีวี', prevElecMeter: 0, prevWaterMeter: 0, note: '', status: 'ว่าง', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  residents: [],
  meters: [],
  settings: [
    {
      _id: 'default',
      dormName: 'หอพักสุขใจ',
      address: '123 ถ.สุขุมวิท กรุงเทพฯ',
      phone: '081-234-5678',
      rateElec: 7,
      rateWater: 20,
      commonFee: 0,
      internetFee: 0,
      channelToken: '',
      channelSecret: '',
      logo: '',
      signature: '',
    }
  ],
  lineUsers: [],
  invoices: [],
  uploads: [],
}

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

if (fs.existsSync(DB_PATH)) {
  console.log('Local database already exists. Skipping seed.')
  console.log(`Database location: ${DB_PATH}`)
} else {
  fs.writeFileSync(DB_PATH, JSON.stringify(seedData, null, 2), 'utf-8')
  console.log('Local database seeded successfully!')
  console.log(`Database location: ${DB_PATH}`)
  console.log(`Rooms: ${seedData.rooms.length}`)
  console.log(`Settings: ${seedData.settings[0].dormName}`)
}
