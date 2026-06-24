import { connectDB } from '../lib/mongodb.js'

async function migrateNoteToResidents() {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')

    const rooms = await db.collection('rooms').find({}).toArray()
    const residents = await db.collection('residents').find({}).toArray()

    let migrated = 0
    let warnings = []

    for (const room of rooms) {
      if (!room.note) continue

      if (room.residentId) {
        const resident = residents.find(r => r.id === room.residentId)
        if (resident) {
          if (!resident.note) {
            await db.collection('residents').updateOne(
              { id: resident.id },
              { $set: { note: room.note, updatedAt: new Date().toISOString() } }
            )
            console.log(`Migrated: Room ${room.roomNumber} -> Resident ${resident.name}: "${room.note}"`)
            migrated++
          } else {
            console.log(`Skipped: Resident ${resident.name} already has a note: "${resident.note}" (room had: "${room.note}")`)
          }
        } else {
          warnings.push(`Room ${room.roomNumber} has residentId ${room.residentId} but no matching resident`)
        }
      } else {
        warnings.push(`Room ${room.roomNumber} has note "${room.note}" but no residentId — note will be lost`)
      }
    }

    if (warnings.length > 0) {
      console.log('\n=== WARNINGS ===')
      warnings.forEach(w => console.log(`WARN: ${w}`))
    }

    console.log(`\nMigration complete. Migrated: ${migrated}, Warnings: ${warnings.length}`)
    await client.close()
    process.exit(0)
  } catch (e) {
    console.error('Migration error:', e)
    process.exit(1)
  }
}

migrateNoteToResidents()
