import { Router } from 'express'
import { connectDB } from '../lib/mongodb.js'
import { naturalSortRoomNumber } from '../lib/utils.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    const { month, roomId } = req.query
    let query = {}
    if (month) query.month = month
    if (roomId) query.roomId = roomId

    const invoices = await db.collection('invoices').find(query).toArray()
    invoices.sort((a, b) => {
      if (a.month !== b.month) return b.month.localeCompare(a.month)
      return naturalSortRoomNumber(a.roomNumber, b.roomNumber)
    })
    res.status(200).json(invoices)
  } catch (e) {
    console.error('GET /api/invoices error:', e)
    res.status(500).json({ error: e.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')

    const { roomId, month } = req.body
    if (!roomId || !month) {
      return res.status(400).json({ error: 'ต้องมี roomId และ month' })
    }

    const existing = await db.collection('invoices').findOne({ roomId, month })
    if (existing) {
      await db.collection('invoices').updateOne(
        { roomId, month },
        { $set: { ...req.body, updatedAt: new Date().toISOString() } }
      )
      return res.status(200).json({ ...req.body, id: existing.id })
    }

    const invoice = {
      ...req.body,
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.collection('invoices').insertOne(invoice)
    res.status(200).json(invoice)
  } catch (e) {
    console.error('POST /api/invoices error:', e)
    res.status(500).json({ error: e.message })
  }
})

router.put('/', async (req, res) => {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    const { id, ...data } = req.body
    if (!id) return res.status(400).json({ error: 'id is required' })

    await db.collection('invoices').updateOne(
      { id },
      { $set: { ...data, updatedAt: new Date().toISOString() } }
    )
    res.status(200).json({ id, ...data })
  } catch (e) {
    console.error('PUT /api/invoices error:', e)
    res.status(500).json({ error: e.message })
  }
})

router.delete('/', async (req, res) => {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    if (!req.body.id) return res.status(400).json({ error: 'id is required' })
    await db.collection('invoices').deleteOne({ id: req.body.id })
    res.status(200).json({ success: true })
  } catch (e) {
    console.error('DELETE /api/invoices error:', e)
    res.status(500).json({ error: e.message })
  }
})

export default router
