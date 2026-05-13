import { Router } from 'express'
import { connectDB } from '../lib/mongodb.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    const rooms = await db.collection('rooms').find({}).toArray()
    res.status(200).json(rooms)
  } catch (e) {
    console.error('GET /api/rooms error:', e)
    res.status(500).json({ error: e.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    const room = { ...req.body }
    if (!room.id) room.id = Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
    await db.collection('rooms').insertOne(room)
    res.status(200).json(room)
  } catch (e) {
    console.error('POST /api/rooms error:', e)
    res.status(500).json({ error: e.message })
  }
})

router.put('/', async (req, res) => {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    const { id, ...data } = req.body
    if (!id) return res.status(400).json({ error: 'id is required' })
    await db.collection('rooms').updateOne({ id }, { $set: data })
    res.status(200).json(req.body)
  } catch (e) {
    console.error('PUT /api/rooms error:', e)
    res.status(500).json({ error: e.message })
  }
})

router.delete('/', async (req, res) => {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    if (!req.body.id) return res.status(400).json({ error: 'id is required' })
    await db.collection('rooms').deleteOne({ id: req.body.id })
    res.status(200).json({ success: true })
  } catch (e) {
    console.error('DELETE /api/rooms error:', e)
    res.status(500).json({ error: e.message })
  }
})

export default router
