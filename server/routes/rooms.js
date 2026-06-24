import { Router } from 'express'
import { connectDB } from '../lib/mongodb.js'
import { naturalSortRoomNumber } from '../lib/utils.js'

const router = Router()

function validate(data) {
  const errors = []
  if (!data.roomNumber?.trim()) errors.push('กรุณากรอกหมายเลขห้อง')
  // roomCode is optional (can be empty)
  if (!data.rentPrice && data.rentPrice !== 0) errors.push('กรุณากรอกค่าเช่า')
  else if (isNaN(Number(data.rentPrice))) errors.push('ค่าเช่าต้องเป็นตัวเลขเท่านั้น')
  if (data.roomType && !['มีทีวี', 'ไม่มีทีวี'].includes(data.roomType)) errors.push('ประเภทห้องไม่ถูกต้อง')
  if (data.rentalType && !['daily', 'monthly'].includes(data.rentalType)) errors.push('ประเภทการเช่าไม่ถูกต้อง')
  return errors
}

router.get('/', async (req, res) => {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    const { search, status } = req.query
    let query = {}
    if (search?.trim()) {
      const s = search.trim()
      query.$or = [
        { roomNumber: { $regex: s, $options: 'i' } },
        { roomCode: { $regex: s, $options: 'i' } },
      ]
    }
    if (status === 'ว่าง') query.status = 'ว่าง'
    if (status === 'มีผู้เช่า') query.status = 'มีผู้เช่า'

    let rooms = await db.collection('rooms').find(query).toArray()
    rooms.sort(naturalSortRoomNumber)

    const residents = await db.collection('residents').find({}).toArray()

    rooms = rooms.map(room => {
      const resident = room.residentId ? residents.find(r => r.id === room.residentId) : null
      return {
        ...room,
        number: room.roomNumber,
        rent: room.rentPrice,
        tenantName: resident?.name || '',
        tenantPhone: resident?.phone || '',
        tenantUserId: resident?.lineUserId || '',
        note: resident?.note || room.note || '',
      }
    })

    if (search?.trim()) {
      const s = search.trim().toLowerCase()
      rooms = rooms.filter(r =>
        (r.roomNumber || '').toLowerCase().includes(s) ||
        (r.roomCode || '').toLowerCase().includes(s) ||
        (r.note || '').toLowerCase().includes(s)
      )
    }

    res.status(200).json(rooms)
  } catch (e) {
    console.error('GET /api/rooms error:', e)
    res.status(500).json({ error: e.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const errors = validate(req.body)
    if (errors.length > 0) return res.status(400).json({ error: errors.join('; ') })

    const client = await connectDB()
    const db = client.db('dorm_billing')

    const existing = await db.collection('rooms').findOne({ roomNumber: req.body.roomNumber.trim() })
    if (existing) return res.status(400).json({ error: 'หมายเลขห้องนี้มีอยู่ในระบบแล้ว' })

    let residentId = req.body.residentId || null
    if (residentId) {
      const resCheck = await db.collection('residents').findOne({ id: residentId })
      if (!resCheck) return res.status(400).json({ error: 'ไม่พบผู้พักอาศัยที่เลือก' })
    }

    const room = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
      roomNumber: req.body.roomNumber.trim(),
      roomCode: req.body.roomCode?.trim() || '',
      residentId,
      rentPrice: Number(req.body.rentPrice) || 0,
      rentalType: req.body.rentalType || 'monthly',
      roomType: req.body.roomType || 'ไม่มีทีวี',
      prevElecMeter: Number(req.body.prevElecMeter) || 0,
      prevWaterMeter: Number(req.body.prevWaterMeter) || 0,
      extraBed: Number(req.body.extraBed) || 0,
      discount: Number(req.body.discount) || 0,
      status: residentId ? 'มีผู้เช่า' : 'ว่าง',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.collection('rooms').insertOne(room)
    res.status(200).json({ ...room, number: room.roomNumber, rent: room.rentPrice })
  } catch (e) {
    console.error('POST /api/rooms error:', e)
    res.status(500).json({ error: e.message })
  }
})

router.put('/', async (req, res) => {
  try {
    const { id, ...data } = req.body
    if (!id) return res.status(400).json({ error: 'id is required' })

    const errors = validate(data)
    if (errors.length > 0) return res.status(400).json({ error: errors.join('; ') })

    const client = await connectDB()
    const db = client.db('dorm_billing')

    const dup = await db.collection('rooms').findOne({ roomNumber: data.roomNumber.trim(), id: { $ne: id } })
    if (dup) return res.status(400).json({ error: 'หมายเลขห้องนี้มีอยู่ในระบบแล้ว' })

    const oldRoom = await db.collection('rooms').findOne({ id })

    // Preserve existing residentId if not explicitly provided
    let residentId = 'residentId' in data ? data.residentId : oldRoom?.residentId || null
    if (residentId) {
      const resCheck = await db.collection('residents').findOne({ id: residentId })
      if (!resCheck) return res.status(400).json({ error: 'ไม่พบผู้พักอาศัยที่เลือก' })
    }

    const update = {
      roomNumber: data.roomNumber.trim(),
      roomCode: data.roomCode?.trim() || oldRoom?.roomCode || '',
      residentId,
      rentPrice: Number(data.rentPrice) || 0,
      rentalType: data.rentalType || oldRoom?.rentalType || 'monthly',
      roomType: data.roomType || 'ไม่มีทีวี',
      prevElecMeter: Number(data.prevElecMeter) || 0,
      prevWaterMeter: Number(data.prevWaterMeter) || 0,
      extraBed: Number(data.extraBed) || 0,
      discount: Number(data.discount) || 0,
      status: residentId ? 'มีผู้เช่า' : 'ว่าง',
      updatedAt: new Date().toISOString(),
    }

    if (oldRoom?.residentId && !residentId) {
      await db.collection('residents').updateOne(
        { id: oldRoom.residentId },
        { $set: { roomId: '', roomNumber: '', updatedAt: new Date().toISOString() } }
      )
    }

    await db.collection('rooms').updateOne({ id }, { $set: update })
    res.status(200).json({ ...update, id, number: update.roomNumber, rent: update.rentPrice })
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
    const room = await db.collection('rooms').findOne({ id: req.body.id })
    if (room?.residentId) {
      await db.collection('residents').updateOne(
        { id: room.residentId },
        { $set: { roomId: '', roomNumber: '', updatedAt: new Date().toISOString() } }
      )
    }
    await db.collection('rooms').deleteOne({ id: req.body.id })
    res.status(200).json({ success: true })
  } catch (e) {
    console.error('DELETE /api/rooms error:', e)
    res.status(500).json({ error: e.message })
  }
})

export default router
