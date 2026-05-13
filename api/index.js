import express from 'express'

let app

try {
  const mod = await import('../server/index.js')
  app = mod.default
} catch (err) {
  console.error('Failed to initialize server:', err)
  const fallback = express()
  fallback.all('*', (req, res) => {
    res.status(500).json({ error: 'Server failed to initialize', message: err.message })
  })
  app = fallback
}

export default app
