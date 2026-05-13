import { Router } from 'express'
import { connectDB } from '../lib/mongodb.js'

const router = Router()

const defaults = {
  dormName: 'หอพักสุขใจ', address: '123 ถ.สุขุมวิท กรุงเทพฯ', phone: '081-234-5678',
  rateElec: 7, rateWater: 20, commonFee: 0, internetFee: 0,
  channelToken: '', logo: '', promptpayNumber: '090-243-9797',
}

router.get('/', async (req, res) => {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    const s = await db.collection('settings').findOne({ _id: 'default' })
    res.status(200).json(s || defaults)
  } catch (e) {
    console.error('GET /api/settings error:', e)
    res.status(200).json(defaults)
  }
})

router.post('/', async (req, res) => {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    await db.collection('settings').updateOne({ _id: 'default' }, { $set: req.body }, { upsert: true })
    res.status(200).json(req.body)
  } catch (e) {
    console.error('POST /api/settings error:', e)
    res.status(500).json({ error: e.message })
  }
})

router.get('/qr', async (req, res) => {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    const s = await db.collection('settings').findOne({ _id: 'default' })
    if (s?.qrCode) {
      const match = s.qrCode.match(/^data:([^;]+);base64,(.+)$/)
      if (match) {
        res.set('Content-Type', match[1])
        res.send(Buffer.from(match[2], 'base64'))
        return
      }
    }
    res.status(404).json({ error: 'QR code not found' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
