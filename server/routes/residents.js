import { Router } from 'express'
import { connectDB } from '../lib/mongodb.js'
import { naturalSortRoomNumber } from '../lib/utils.js'

const router = Router()

function validateResident(data) {
  const errors = []
  if (!data.name?.trim()) errors.push('กรุณากรอกชื่อ-นามสกุล')
  const isDaily = data.rentalType === 'daily'
  if (!isDaily) {
    if (!data.idCard?.trim()) errors.push('กรุณากรอกเลขบัตรประชาชน')
    else if (!/^\d{13}$/.test(data.idCard.replace(/\D/g, ''))) errors.push('เลขบัตรประชาชนต้องมี 13 หลัก')
    if (!data.phone?.trim()) errors.push('กรุณากรอกเบอร์โทร')
    else if (!/^\d{9,10}$/.test(data.phone.replace(/\D/g, ''))) errors.push('เบอร์โทรไม่ถูกต้อง')
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('รูปแบบอีเมลไม่ถูกต้อง')
  if (!data.moveInDate) errors.push('กรุณาเลือกวันที่เข้าพัก')
  if (!data.moveOutDate) errors.push('กรุณาเลือกวันหมดสัญญา')
  if (!isDaily && (data.deposit === undefined || data.deposit === '' || isNaN(Number(data.deposit)))) errors.push('กรุณากรอกค่ามัดจำ')
  return errors
}

router.get('/', async (req, res) => {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    const { search } = req.query
    let query = {}
    if (search?.trim()) {
      const s = search.trim()
      query = {
        $or: [
          { name: { $regex: s, $options: 'i' } },
          { phone: { $regex: s, $options: 'i' } },
          { idCard: { $regex: s, $options: 'i' } },
          { roomNumber: { $regex: s, $options: 'i' } },
        ],
      }
    }
    const residents = await db.collection('residents').find(query).toArray()
    residents.sort((a, b) => {
      if (!a.roomNumber && !b.roomNumber) return 0
      if (!a.roomNumber) return 1
      if (!b.roomNumber) return -1
      return naturalSortRoomNumber(a.roomNumber, b.roomNumber)
    })
    res.status(200).json(residents)
  } catch (e) {
    console.error('GET /api/residents error:', e)
    res.status(500).json({ error: e.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    const resident = await db.collection('residents').findOne({ id: req.params.id })
    if (!resident) return res.status(404).json({ error: 'ไม่พบข้อมูลผู้พัก' })
    res.status(200).json(resident)
  } catch (e) {
    console.error('GET /api/residents/:id error:', e)
    res.status(500).json({ error: e.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const errors = validateResident(req.body)
    if (errors.length > 0) return res.status(400).json({ error: errors.join('; ') })

    const client = await connectDB()
    const db = client.db('dorm_billing')

    const roomId = req.body.roomId || ''
    let roomNumber = ''
    if (roomId) {
      const room = await db.collection('rooms').findOne({ id: roomId })
      if (!room) return res.status(400).json({ error: 'ไม่พบหมายเลขห้องในระบบ' })
      roomNumber = room.roomNumber || room.number
      const isDaily = req.body.rentalType === 'daily'
      if (!isDaily) {
        const existingResident = await db.collection('residents').findOne({ roomId })
        if (existingResident) return res.status(400).json({ error: 'ห้องนี้มีผู้พักอาศัยอยู่แล้ว' })
      }
    }

    const resident = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
      name: req.body.name.trim(),
      idCard: (req.body.idCard || '').replace(/\D/g, ''),
      phone: (req.body.phone || '').replace(/\D/g, ''),
      email: req.body.email?.trim() || '',
      roomId,
      roomNumber,
      moveInDate: req.body.moveInDate,
      moveOutDate: req.body.moveOutDate,
      deposit: Number(req.body.deposit) || 0,
      emergencyContact: req.body.emergencyContact?.trim() || '',
      emergencyPhone: req.body.emergencyPhone?.replace(/\D/g, '') || '',
      lineUserId: req.body.lineUserId || '',
      rentalType: req.body.rentalType || 'monthly',
      licensePlate: req.body.licensePlate || '',
      tenantType: req.body.tenantType || 'individual',
      companyName: req.body.companyName?.trim() || '',
      companyAddress: req.body.companyAddress?.trim() || '',
      companyTaxId: req.body.companyTaxId || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (resident.lineUserId) {
      await db.collection('lineUsers').updateOne(
        { userId: resident.lineUserId },
        { $set: { residentId: resident.id, updatedAt: new Date().toISOString() } }
      )
    }

    await db.collection('residents').insertOne(resident)
    if (roomId) {
      await db.collection('rooms').updateOne(
        { id: roomId },
        { $set: { residentId: resident.id, status: 'มีผู้เช่า', updatedAt: new Date().toISOString() } }
      )
    }
    res.status(200).json(resident)
  } catch (e) {
    console.error('POST /api/residents error:', e)
    res.status(500).json({ error: e.message })
  }
})

router.put('/', async (req, res) => {
  try {
    const { id, ...data } = req.body
    if (!id) return res.status(400).json({ error: 'id is required' })

    const errors = validateResident(data)
    if (errors.length > 0) return res.status(400).json({ error: errors.join('; ') })

    const client = await connectDB()
    const db = client.db('dorm_billing')

    const newRoomId = data.roomId || ''
    const oldResident = await db.collection('residents').findOne({ id })
    let roomNumber = oldResident?.roomNumber || ''
    if (newRoomId) {
      const room = await db.collection('rooms').findOne({ id: newRoomId })
      if (!room) return res.status(400).json({ error: 'ไม่พบหมายเลขห้องในระบบ' })
      roomNumber = room.roomNumber || room.number
      const isDaily = data.rentalType === 'daily'
      if (!isDaily) {
        const duplicate = await db.collection('residents').findOne({ roomId: newRoomId, id: { $ne: id } })
        if (duplicate) return res.status(400).json({ error: 'ห้องนี้มีผู้พักอาศัยอยู่แล้ว' })
      }
    }

    const update = {
      name: data.name.trim(),
      idCard: (data.idCard || '').replace(/\D/g, ''),
      phone: (data.phone || '').replace(/\D/g, ''),
      email: data.email?.trim() || '',
      roomId: newRoomId,
      roomNumber,
      moveInDate: data.moveInDate,
      moveOutDate: data.moveOutDate,
      deposit: Number(data.deposit) || 0,
      emergencyContact: data.emergencyContact?.trim() || '',
      emergencyPhone: data.emergencyPhone?.replace(/\D/g, '') || '',
      lineUserId: data.lineUserId || '',
      rentalType: data.rentalType || 'monthly',
      licensePlate: data.licensePlate || '',
      tenantType: data.tenantType !== undefined ? data.tenantType : 'individual',
      companyName: (data.companyName || '').trim(),
      companyAddress: (data.companyAddress || '').trim(),
      companyTaxId: data.companyTaxId || '',
      updatedAt: new Date().toISOString(),
    }

    if (oldResident?.roomId && oldResident.roomId !== newRoomId) {
      await db.collection('rooms').updateOne(
        { id: oldResident.roomId },
        { $set: { residentId: null, status: 'ว่าง', extraBed: 0, discount: 0, updatedAt: new Date().toISOString() } }
      )
    }
    if (newRoomId && oldResident?.roomId !== newRoomId) {
      await db.collection('rooms').updateOne(
        { id: newRoomId },
        { $set: { residentId: id, status: 'มีผู้เช่า', updatedAt: new Date().toISOString() } }
      )
    }

    if (oldResident?.lineUserId && oldResident.lineUserId !== update.lineUserId) {
      await db.collection('lineUsers').updateOne(
        { userId: oldResident.lineUserId },
        { $set: { residentId: null, updatedAt: new Date().toISOString() } }
      )
    }
    if (update.lineUserId) {
      await db.collection('lineUsers').updateOne(
        { userId: update.lineUserId },
        { $set: { residentId: id, updatedAt: new Date().toISOString() } }
      )
    }

    await db.collection('residents').updateOne({ id }, { $set: update })
    res.status(200).json({ ...update, id })
  } catch (e) {
    console.error('PUT /api/residents error:', e)
    res.status(500).json({ error: e.message })
  }
})

router.delete('/', async (req, res) => {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    if (!req.body.id) return res.status(400).json({ error: 'id is required' })
    const resident = await db.collection('residents').findOne({ id: req.body.id })
    if (resident?.roomId) {
      await db.collection('rooms').updateOne(
        { id: resident.roomId },
        { $set: { residentId: null, status: 'ว่าง', extraBed: 0, discount: 0, updatedAt: new Date().toISOString() } }
      )
    }
    await db.collection('residents').deleteOne({ id: req.body.id })
    res.status(200).json({ success: true })
  } catch (e) {
    console.error('DELETE /api/residents error:', e)
    res.status(500).json({ error: e.message })
  }
})

export default router
