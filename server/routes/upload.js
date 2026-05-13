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
    const dataUriMatch = file.match(/^data:[^;]+;base64,(.+)$/)
    if (dataUriMatch) {
      base64 = dataUriMatch[1]
    }
})

export default router
