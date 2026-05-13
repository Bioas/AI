import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import roomsRouter from './routes/rooms.js'
import metersRouter from './routes/meters.js'
import settingsRouter from './routes/settings.js'
import invoiceRouter from './routes/invoice.js'
import lineRouter from './routes/line.js'
import uploadRouter from './routes/upload.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '5mb' }))

app.use('/api/rooms', roomsRouter)
app.use('/api/meters', metersRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/invoice', invoiceRouter)
app.use('/api/line', lineRouter)
app.use('/api/upload', uploadRouter)

app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

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
