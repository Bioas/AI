import { Router } from 'express'
import { connectDB } from '../lib/mongodb.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    const meters = await db.collection('meters').find({}).toArray()
    res.status(200).json(meters)
  } catch (e) {
    console.error('GET /api/meters error:', e)
    res.status(500).json({ error: e.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    const record = { ...req.body }
    if (!record.id) record.id = Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
    await db.collection('meters').insertOne(record)
    res.status(200).json(record)
  } catch (e) {
    console.error('POST /api/meters error:', e)
    res.status(500).json({ error: e.message })
  }
})

router.put('/', async (req, res) => {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    const { roomId, month, ...data } = req.body
    if (!roomId || !month) {
      return res.status(400).json({ error: 'Missing roomId or month' })
    }
    const result = await db.collection('meters').updateOne(
      { roomId, month },
      { $set: data },
      { upsert: true }
    )
    res.status(200).json({ success: true, upsertedId: result.upsertedId, modifiedCount: result.modifiedCount })
  } catch (e) {
    console.error('PUT /api/meters error:', e)
    res.status(500).json({ error: e.message })
  }
})

router.delete('/', async (req, res) => {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    if (!req.body.id) return res.status(400).json({ error: 'id is required' })
    await db.collection('meters').deleteOne({ id: req.body.id })
    res.status(200).json({ success: true })
  } catch (e) {
    console.error('DELETE /api/meters error:', e)
    res.status(500).json({ error: e.message })
  }
})

export default router
