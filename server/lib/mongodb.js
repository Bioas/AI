import { MongoClient, ServerApiVersion } from 'mongodb'

let cachedClient = null
let cachedPromise = null

export async function connectDB() {
  const uri = process.env.MONGODB_URI || ''
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not configured. Go to Vercel Dashboard → your project → Settings → Environment Variables and add MONGODB_URI.'
    )
  }

  if (cachedPromise) return cachedPromise

  const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    maxPoolSize: 1,
  })

  cachedPromise = client.connect().catch(err => {
    cachedPromise = null
    cachedClient = null
    throw err
  })

  cachedClient = client
  return cachedPromise
}

export default connectDB
