import { MongoClient, ServerApiVersion } from 'mongodb'

const uri = process.env.MONGODB_URI || ''

let client
let clientPromise

if (!uri) {
  throw new Error('MONGODB_URI environment variable is not configured')
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, {
      serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    })
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
    maxPoolSize: 1,
    minPoolSize: 0,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  })
  clientPromise = client.connect()
}

export async function connectDB() {
  return clientPromise
}

export default connectDB
