import { connectDB } from '../lib/mongodb.js'

async function migrate() {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    
    // Find residents with roomId that references non-existent rooms
    const residents = await db.collection('residents').find({ roomId: { $ne: '', $ne: null } }).toArray()
    const roomIds = residents.map(r => r.roomId)
    const existingRooms = await db.collection('rooms').find({ id: { $in: roomIds } }).toArray()
    const existingRoomIds = new Set(existingRooms.map(r => r.id))
    
    let updated = 0
    for (const resident of residents) {
      if (!existingRoomIds.has(resident.roomId)) {
        await db.collection('residents').updateOne(
          { id: resident.id },
          { $set: { roomId: '', roomNumber: '', updatedAt: new Date().toISOString() } }
        )
        updated++
        console.log(`Cleared room data for resident: ${resident.name}`)
      }
    }
    
    console.log(`Migration complete. Updated ${updated} resident records.`)
    process.exit(0)
  } catch (e) {
    console.error('Migration failed:', e)
    process.exit(1)
  }
}

migrate()
