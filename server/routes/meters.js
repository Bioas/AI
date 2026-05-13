import { Router } from 'express'
import { connectDB } from '../lib/mongodb.js'

const router = Router()

router.get('/', async (req, res) => {
  let client
  try { client = await connectDB() } catch (e) { return res.status(500).json({ error: e.message }) }
  const db = client.db('dorm_billing')
  const meters = await db.collection('meters').find({}).toArray()
  res.status(200).json(meters)
})

router.post('/', async (req, res) => {
  let client
  try { client = await connectDB() } catch (e) { return res.status(500).json({ error: e.message }) }
  const db = client.db('dorm_billing')
  const record = req.body
  if (!record.id) record.id = Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
  await db.collection('meters').insertOne(record)
  res.status(200).json(record)
})

router.put('/', async (req, res) => {
  let client
  try { client = await connectDB() } catch (e) { return res.status(500).json({ error: e.message }) }
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
})

router.delete('/', async (req, res) => {
  let client
  try { client = await connectDB() } catch (e) { return res.status(500).json({ error: e.message }) }
  const db = client.db('dorm_billing')
  await db.collection('meters').deleteOne({ id: req.body.id })
  res.status(200).json({ success: true })
})

export default router
