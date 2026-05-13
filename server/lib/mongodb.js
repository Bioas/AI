import { MongoClient, ServerApiVersion } from 'mongodb'

const uri = process.env.MONGODB_URI || ''
let client = null

export async function connectDB() {
  if (!uri) throw new Error('MONGODB_URI not configured')
  if (!client) {
    client = new MongoClient(uri, {
      serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
      maxPoolSize: 1,
    })
  }
  await client.connect()
  return client
}

export default connectDB
