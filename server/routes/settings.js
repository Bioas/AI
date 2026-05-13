import { Router } from 'express'
import { connectDB } from '../lib/mongodb.js'

const router = Router()

const defaults = {
  dormName: 'หอพักสุขใจ', address: '123 ถ.สุขุมวิท กรุงเทพฯ', phone: '081-234-5678',
  rateElec: 7, rateWater: 20, commonFee: 0, internetFee: 0,
  channelToken: '', logo: '',
}

router.get('/', async (req, res) => {
  let client
  try { client = await connectDB() } catch (e) { return res.status(200).json(defaults) }
  const db = client.db('dorm_billing')
  const s = await db.collection('settings').findOne({ _id: 'default' })
  res.status(200).json(s || defaults)
})

router.post('/', async (req, res) => {
  let client
  try { client = await connectDB() } catch (e) { return res.status(500).json({ error: e.message }) }
  const db = client.db('dorm_billing')
  await db.collection('settings').updateOne({ _id: 'default' }, { $set: req.body }, { upsert: true })
  res.status(200).json(req.body)
})

export default router
