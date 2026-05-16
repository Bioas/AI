import { Router } from 'express'
import { connectDB } from '../lib/mongodb.js'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const { residents, rooms, meters, settings, invoices } = req.body
    if (!rooms || !settings) {
      return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน (ต้องมี rooms และ settings)' })
    }

    const client = await connectDB()
    const db = client.db('dorm_billing')

    // 1. Import residents first (preserve original IDs)
    if (residents && residents.length > 0) {
      for (const r of residents) {
        await db.collection('residents').updateOne(
          { id: r.id },
          { $set: { ...r, updatedAt: new Date().toISOString() } },
          { upsert: true }
        )
      }
    }

    // 2. Import rooms (preserve original IDs, residentId will match imported residents)
    if (rooms && rooms.length > 0) {
      for (const r of rooms) {
        await db.collection('rooms').updateOne(
          { id: r.id },
          { $set: { ...r, updatedAt: new Date().toISOString() } },
          { upsert: true }
        )
      }
    }

    // 3. Import meters
    if (meters && meters.length > 0) {
      for (const m of meters) {
        await db.collection('meters').updateOne(
          { id: m.id },
          { $set: { ...m, updatedAt: new Date().toISOString() } },
          { upsert: true }
        )
      }
    }

    // 4. Import settings
    if (settings) {
      await db.collection('settings').updateOne(
        {},
        { $set: { ...settings, updatedAt: new Date().toISOString() } },
        { upsert: true }
      )
    }

    // 5. Import invoices (preserve original IDs)
    if (invoices && invoices.length > 0) {
      for (const inv of invoices) {
        await db.collection('invoices').updateOne(
          { id: inv.id },
          { $set: { ...inv, updatedAt: new Date().toISOString() } },
          { upsert: true }
        )
      }
    }

    res.status(200).json({ success: true, message: 'Import สำเร็จ' })
  } catch (e) {
    console.error('POST /api/import error:', e)
    res.status(500).json({ error: e.message })
  }
})

export default router
