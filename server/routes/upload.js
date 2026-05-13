import { Router } from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isVercel = process.env.VERCEL === '1'
const uploadDir = isVercel ? '/tmp/uploads' : path.join(__dirname, '..', 'uploads')

let dirReady = false
function ensureDir() {
  if (!dirReady) {
    try {
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
      dirReady = true
    } catch (e) {
      console.warn('Upload dir error:', e.message)
    }
  }
}

const router = Router()

router.post('/', async (req, res) => {
  try {
    const { file, filename } = req.body
    if (!file || !filename) return res.status(400).json({ error: 'Missing file or filename' })

    let base64 = file
    const match = file.match(/^data:[^;]+;base64,(.+)$/)
    if (match) base64 = match[1]

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    ensureDir()
    const filePath = path.join(uploadDir, safeName)
    fs.writeFileSync(filePath, Buffer.from(base64, 'base64'))

    const host = process.env.VERCEL_URL || req.get('host')
    const protocol = host?.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${protocol}://${host}`
    res.json({ url: `${baseUrl}/uploads/${safeName}` })
  } catch (e) {
    console.error('Upload error:', e.message)
    res.status(500).json({ error: e.message })
  }
})

export default router
