import { Router } from 'express'
import { connectDB } from '../lib/mongodb.js'

const router = Router()

async function ensureIndex() {
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
    const client = await connectDB()
    const db = client.db('dorm_billing')
    const files = await db.collection('uploads').find({}, { projection: { filename: 1, contentType: 1, createdAt: 1 } }).toArray()
    res.json({ files: files.map(f => ({ name: f.filename, type: f.contentType, created: f.createdAt })) })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
