import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { connectDB } from './lib/mongodb.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env.local before anything else
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim()
        const val = trimmed.substring(eqIdx + 1).trim()
        if (!process.env[key]) process.env[key] = val
      }
    }
  })
}

console.log(`USE_LOCAL_DB: ${process.env.USE_LOCAL_DB || 'false'}`)

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use('/api/line/webhook', express.raw({ type: '*/*' }))
app.use(express.json({ limit: '10mb' }))

// Dynamic import routes after env is loaded
let routersLoaded = false
async function loadRouters() {
  if (routersLoaded) return
  const [rooms, meters, settings, residents, line, upload, sendInvoice, lineWebhook, exportPdf, importData, invoices] = await Promise.all([
    import('./routes/rooms.js'),
    import('./routes/meters.js'),
    import('./routes/settings.js'),
    import('./routes/residents.js'),
    import('./routes/line.js'),
    import('./routes/upload.js'),
    import('./routes/send-invoice.js'),
    import('./routes/line-webhook.js'),
    import('./routes/export-pdf.js'),
    import('./routes/import.js'),
    import('./routes/invoices.js'),
  ])
  app.use('/api/rooms', rooms.default)
  app.use('/api/meters', meters.default)
  app.use('/api/settings', settings.default)
  app.use('/api/residents', residents.default)
  app.use('/api/line', line.default)
  app.use('/api/upload', upload.default)
  app.use('/api/send-invoice', sendInvoice.default)
  app.use('/api/line/webhook', lineWebhook.default)
  app.use('/api/export-pdf', exportPdf.default)
  app.use('/api/import', importData.default)
  app.use('/api/invoices', invoices.default)
  routersLoaded = true
}

// Load routers synchronously during startup
await loadRouters()

app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Auto-checkout job for daily rooms
async function runAutoCheckout() {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const isAfterNoon = now.getHours() >= 12

    if (!isAfterNoon) return

    const dailyRooms = await db.collection('rooms').find({ rentalType: { $in: ['daily', 'รายวัน'] }, status: 'มีผู้เช่า', residentId: { $ne: null } }).toArray()
    const residents = await db.collection('residents').find({}).toArray()

    for (const room of dailyRooms) {
      const resident = residents.find(r => r.id === room.residentId)
      if (!resident || !resident.moveOutDate) continue

      const moveOutDate = resident.moveOutDate.split('T')[0]
        if (moveOutDate < todayStr) {
        await db.collection('residents').updateOne(
          { id: resident.id },
          { $set: { roomId: '', roomNumber: '', updatedAt: now.toISOString() } }
        )
        await db.collection('rooms').updateOne(
          { id: room.id },
          { $set: { residentId: null, status: 'ว่าง', updatedAt: now.toISOString() } }
        )
        console.log(`Auto-checkout: Room ${room.roomNumber} resident ${resident.name} moved out`)
      }
    }
  } catch (e) {
    console.error('Auto-checkout job error:', e)
  }
}

// Run auto-checkout every hour
setInterval(runAutoCheckout, 60 * 60 * 1000)
runAutoCheckout()

// Data migration: Add rentalType to existing residents based on their room type
async function migrateRentalType() {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    
    // Find residents without rentalType
    const residentsWithoutType = await db.collection('residents').find({ 
      $or: [
        { rentalType: { $exists: false } },
        { rentalType: null }
      ]
    }).toArray()

    if (residentsWithoutType.length === 0) return

    console.log(`Migrating ${residentsWithoutType.length} residents...`)

    const rooms = await db.collection('rooms').find({}).toArray()

    for (const resident of residentsWithoutType) {
      let newRentalType = 'monthly' // Default
      
      if (resident.roomId) {
        const room = rooms.find(r => r.id === resident.roomId)
        if (room && (room.rentalType === 'daily' || room.rentalType === 'รายวัน')) {
          newRentalType = 'daily'
        }
      } else if (resident.roomNumber) {
        // Try to find by room number if roomId is missing
        const room = rooms.find(r => (r.roomNumber || r.number) === resident.roomNumber)
        if (room && (room.rentalType === 'daily' || room.rentalType === 'รายวัน')) {
          newRentalType = 'daily'
        }
      }

      await db.collection('residents').updateOne(
        { id: resident.id },
        { $set: { rentalType: newRentalType, updatedAt: new Date().toISOString() } }
      )
      console.log(`Updated resident ${resident.name} to rentalType: ${newRentalType}`)
    }
    console.log('Migration complete.')
  } catch (e) {
    console.error('Migration error:', e)
  }
}

// Run migration once on startup
migrateRentalType()

const distPath = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API route not found' })
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

if (!process.env.VERCEL) {
  app.listen(PORT, () => { console.log(`Server running on http://localhost:${PORT}`) })
}

export default app
