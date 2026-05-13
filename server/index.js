import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import roomsRouter from './routes/rooms.js'
import metersRouter from './routes/meters.js'
import settingsRouter from './routes/settings.js'
import invoiceRouter from './routes/invoice.js'
import lineRouter from './routes/line.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3001',
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
  process.env.VITE_API_URL || '',
].filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return cb(null, true)
    cb(null, true)
  },
  credentials: true,
}))

app.use(express.json({ limit: '5mb' }))

app.use('/api/rooms', roomsRouter)
app.use('/api/meters', metersRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/invoice', invoiceRouter)
app.use('/api/line', lineRouter)

app.get('/api/health', async (req, res) => {
  try {
    const { connectDB } = await import('./lib/mongodb.js')
    await connectDB()
    res.json({ status: 'ok', mongodb: 'connected', timestamp: new Date().toISOString() })
  } catch (e) {
    res.status(503).json({ status: 'error', mongodb: e.message, timestamp: new Date().toISOString() })
  }
})

const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API route not found' })
  res.sendFile(path.join(distPath, 'index.html'))
})

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message })
})

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

export default app
