import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_DIR = path.join(__dirname, '..', 'data')
const DB_PATH = path.join(DB_DIR, 'local-db.json')

function ensureDbFile() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true })
  }
  if (!fs.existsSync(DB_PATH)) {
    const initial = {
      rooms: [],
      residents: [],
      meters: [],
      settings: [],
      lineUsers: [],
      invoices: [],
      uploads: [],
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf-8')
  }
}

function readDb() {
  ensureDbFile()
  const raw = fs.readFileSync(DB_PATH, 'utf-8')
  return JSON.parse(raw)
}

function writeDb(data) {
  ensureDbFile()
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
}

function matchesQuery(item, query) {
  for (const [key, condition] of Object.entries(query)) {
    if (key === '$or') {
      const orMatch = condition.some(cond => {
        const [k, op] = Object.entries(cond)[0]
        if (typeof op === 'object' && op !== null) {
          if (op.$regex) {
            const regex = new RegExp(op.$regex, op.$options || '')
            return regex.test(item[k] || '')
          }
          if (op.$lt !== undefined) return (item[k] || '') < op.$lt
          if (op.$gt !== undefined) return (item[k] || '') > op.$gt
          if (op.$lte !== undefined) return (item[k] || '') <= op.$lte
          if (op.$gte !== undefined) return (item[k] || '') >= op.$gte
        }
        return item[k] === op
      })
      if (!orMatch) return false
    } else if (typeof condition === 'object' && condition !== null) {
      if (condition.$lt !== undefined && !(item[key] < condition.$lt)) return false
      if (condition.$gt !== undefined && !(item[key] > condition.$gt)) return false
      if (condition.$lte !== undefined && !(item[key] <= condition.$lte)) return false
      if (condition.$gte !== undefined && !(item[key] >= condition.$gte)) return false
    } else if (condition !== undefined && condition !== null && item[key] !== condition) {
      return false
    }
  }
  return true
}

function collection(db, name) {
  if (!db[name]) db[name] = []

  return {
    find(query = {}) {
      const results = db[name].filter(item => matchesQuery(item, query))

      return {
        async toArray() {
          return results.map(item => ({ ...item, _id: item._id || item.id }))
        },
      }
    },

    async findOne(query = {}) {
      for (const item of db[name]) {
        if (matchesQuery(item, query)) {
          return { ...item, _id: item._id || item.id }
        }
      }
      return null
    },

    async insertOne(doc) {
      const newDoc = { ...doc }
      if (!newDoc._id && !newDoc.id) {
        newDoc._id = generateId()
      }
      db[name].push(newDoc)
      writeDb(db)
      return { insertedId: newDoc._id || newDoc.id }
    },

    async updateOne(query, update, options = {}) {
      let found = false
      let upsertedId = null
      for (let i = 0; i < db[name].length; i++) {
        if (matchesQuery(db[name][i], query)) {
          if (update.$set) {
            db[name][i] = { ...db[name][i], ...update.$set }
          } else {
            db[name][i] = { ...db[name][i], ...update }
          }
          found = true
          break
        }
      }

      if (!found && options.upsert) {
        const newDoc = { ...query }
        if (update.$set) {
          Object.assign(newDoc, update.$set)
        }
        if (!newDoc._id && !newDoc.id) {
          newDoc._id = generateId()
        }
        upsertedId = newDoc._id || newDoc.id
        db[name].push(newDoc)
        found = true
      }

      writeDb(db)
      return {
        matchedCount: found ? 1 : 0,
        modifiedCount: found ? 1 : 0,
        upsertedId: upsertedId ? { toString: () => upsertedId } : null,
      }
    },

    async deleteOne(query) {
      const idx = db[name].findIndex(item => matchesQuery(item, query))
      if (idx !== -1) {
        db[name].splice(idx, 1)
        writeDb(db)
        return { deletedCount: 1 }
      }
      return { deletedCount: 0 }
    },

    async deleteMany(query) {
      const before = db[name].length
      db[name] = db[name].filter(item => !matchesQuery(item, query))
      const deleted = before - db[name].length
      writeDb(db)
      return { deletedCount: deleted }
    },
  }
}

export async function connectDB() {
  return {
    db: (name) => {
      const db = readDb()
      return {
        collection: (colName) => collection(db, colName),
      }
    },
  }
}

export default connectDB
