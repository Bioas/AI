import { Router } from 'express'
import { connectDB } from '../lib/mongodb.js'

const router = Router()

router.get('/', async (req, res) => {
  let client
  try { client = await connectDB() } catch (e) { return res.status(500).json({ error: e.message }) }
  const db = client.db('dorm_billing')
  const rooms = await db.collection('rooms').find({}).toArray()
  res.status(200).json(rooms)
})

router.post('/', async (req, res) => {
  let client
  try { client = await connectDB() } catch (e) { return res.status(500).json({ error: e.message }) }
  const db = client.db('dorm_billing')
  const room = req.body
  if (!room.id) room.id = Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
  await db.collection('rooms').insertOne(room)
  res.status(200).json(room)
})

router.put('/', async (req, res) => {
  let client
  try { client = await connectDB() } catch (e) { return res.status(500).json({ error: e.message }) }
  const db = client.db('dorm_billing')
  const { id, ...data } = req.body
  await db.collection('rooms').updateOne({ id }, { $set: data })
  res.status(200).json(req.body)
})

router.delete('/', async (req, res) => {
  let client
  try { client = await connectDB() } catch (e) { return res.status(500).json({ error: e.message }) }
  const db = client.db('dorm_billing')
  await db.collection('rooms').deleteOne({ id: req.body.id })
  res.status(200).json({ success: true })
})

export default router
