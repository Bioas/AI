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

app.use(cors())
app.use(express.json({ limit: '5mb' }))

app.use('/api/rooms', roomsRouter)
app.use('/api/meters', metersRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/invoice', invoiceRouter)
app.use('/api/line', lineRouter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use(express.static(path.join(__dirname, '..', 'dist')))
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
