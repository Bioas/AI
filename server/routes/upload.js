import { Router } from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.join(__dirname, '..', 'uploads')

let dirReady = false
function ensureDir() {
  if (!dirReady) {
    try {
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
      dirReady = true
    } catch (e) {
      console.warn('Upload dir not available, using /tmp:', e.message)
    }
  }
}

const router = Router()

router.post('/', async (req, res) => {
  try {
    const { file, filename } = req.body
    if (!file || !filename) return res.status(400).json({ error: 'Missing file or filename' })

    let base64 = file
    const match = file.match(/^data:application\/pdf[^,]*;base64,(.+)$/)
    if (match) base64 = match[1]

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    ensureDir()
    const filePath = path.join(uploadDir, safeName)
    fs.writeFileSync(filePath, Buffer.from(base64, 'base64'))

    const baseUrl = `${req.protocol}://${req.get('host')}`
    res.json({ url: `${baseUrl}/uploads/${safeName}` })
  } catch (e) {
    console.error('Upload error:', e.message)
    res.status(500).json({ error: e.message })
  }
})

export default router
