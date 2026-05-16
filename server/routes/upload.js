import { Router } from 'express'
import { connectDB } from '../lib/mongodb.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOAD_DIR = path.join(__dirname, '..', 'data', 'uploads')

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  }
}

const router = Router()

async function ensureIndex() {
  if (process.env.USE_LOCAL_DB === 'true') return

  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    await db.collection('uploads').createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 3600, background: true }
    )
  } catch (e) {
    console.warn('TTL index may already exist:', e.message)
  }
}
ensureIndex()

router.post('/', async (req, res) => {
  try {
    const { file, filename } = req.body
    if (!file || !filename) return res.status(400).json({ error: 'Missing file or filename' })

    if (process.env.USE_LOCAL_DB === 'true') {
      ensureUploadDir()
      let base64 = file
      const match = file.match(/^data:[^;]+;base64,(.+)$/)
      if (match) base64 = match[1]

      const buffer = Buffer.from(base64, 'base64')
      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filePath = path.join(UPLOAD_DIR, safeName)
      fs.writeFileSync(filePath, buffer)

      const host = req.get('host')
      res.json({ url: `http://${host}/api/upload/${safeName}` })
      return
    }

    let base64 = file
    const match = file.match(/^data:[^;]+;base64,(.+)$/)
    if (match) base64 = match[1]

    const buffer = Buffer.from(base64, 'base64')
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const contentType = filename.endsWith('.jpg') || filename.endsWith('.jpeg') ? 'image/jpeg' : filename.endsWith('.png') ? 'image/png' : 'application/octet-stream'

    const client = await connectDB()
    const db = client.db('dorm_billing')

    await db.collection('uploads').deleteMany({ createdAt: { $lt: new Date(Date.now() - 3600000) } })

    await db.collection('uploads').updateOne(
      { filename: safeName },
      { $set: { filename: safeName, data: buffer, contentType, createdAt: new Date() } },
      { upsert: true }
    )

    const host = process.env.VERCEL_URL || req.get('host')
    const protocol = host?.includes('localhost') ? 'http' : 'https'
    res.json({ url: `${protocol}://${host}/api/upload/${safeName}` })
  } catch (e) {
    console.error('Upload error:', e.message)
    res.status(500).json({ error: e.message })
  }
})

router.get('/:name', async (req, res) => {
  try {
    if (process.env.USE_LOCAL_DB === 'true') {
      ensureUploadDir()
      const safeName = req.params.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filePath = path.join(UPLOAD_DIR, safeName)
      if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' })

      const ext = path.extname(safeName).toLowerCase()
      const contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.png' ? 'image/png' : 'application/octet-stream'
      res.set('Content-Type', contentType)
      res.set('Cache-Control', 'public, max-age=86400')
      res.sendFile(filePath)
      return
    }

    const client = await connectDB()
    const db = client.db('dorm_billing')
    const doc = await db.collection('uploads').findOne({ filename: req.params.name })
    if (!doc) return res.status(404).json({ error: 'File not found' })

    const imgData = Buffer.isBuffer(doc.data) ? doc.data : doc.data.buffer
    res.set('Content-Type', doc.contentType)
    res.set('Cache-Control', 'public, max-age=86400')
    res.send(imgData)
  } catch (e) {
    console.error('File serve error:', e.message)
    res.status(500).json({ error: e.message })
  }
})

router.get('/', async (req, res) => {
  try {
    if (process.env.USE_LOCAL_DB === 'true') {
      ensureUploadDir()
      const files = fs.readdirSync(UPLOAD_DIR).map(name => {
        const ext = path.extname(name).toLowerCase()
        const contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.png' ? 'image/png' : 'application/octet-stream'
        const stat = fs.statSync(path.join(UPLOAD_DIR, name))
        return { name, type: contentType, created: stat.mtime }
      })
      return res.json({ files })
    }

    const client = await connectDB()
    const db = client.db('dorm_billing')
    const files = await db.collection('uploads').find({}, { projection: { filename: 1, contentType: 1, createdAt: 1 } }).toArray()
    res.json({ files: files.map(f => ({ name: f.filename, type: f.contentType, created: f.createdAt })) })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
