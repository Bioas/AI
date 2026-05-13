import { Router } from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.join(__dirname, '..', 'uploads')

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const router = Router()

router.post('/', async (req, res) => {
  try {
    const { file, filename } = req.body
    if (!file || !filename) return res.status(400).json({ error: 'Missing file or filename' })

    let base64 = file
    const dataUriMatch = file.match(/^data:application\/pdf[^,]*;base64,(.+)$/)
    if (dataUriMatch) {
      base64 = dataUriMatch[1]
    }

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
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
