import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectDB } from '../lib/mongodb.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim()
        const val = trimmed.substring(eqIdx + 1).trim()
        if (!process.env[key]) process.env[key] = val
      }
    }
  })
}

async function main() {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    const residents = await db.collection('residents').find({}).toArray()
    console.log(JSON.stringify(residents, null, 2))
    process.exit(0)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}
main()
