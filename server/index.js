import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

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
