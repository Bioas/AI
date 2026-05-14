import { Router } from 'express'
import { connectDB } from '../lib/mongodb.js'

const router = Router()

router.post('/send', async (req, res) => {
  const { to, text, token } = req.body

  if (!to || !text || !token) {
    return res.status(400).json({ error: 'Missing required fields: to, text, token' })
  }

  if (!to.startsWith('U')) {
    return res.status(400).json({ error: 'Invalid LINE User ID. Must start with U' })
  }

  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ to, messages: [{ type: 'text', text }] }),
    })

    const data = await response.json()

    if (response.ok) {
      return res.status(200).json({ success: true, data })
    } else {
      return res.status(response.status).json({ error: data.message || 'LINE API error', details: data })
    }
  } catch (error) {
    console.error('LINE send error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

router.get('/users', async (req, res) => {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    const { search, status, mapped } = req.query
    let query = {}

    if (search?.trim()) {
      const s = search.trim()
      query.$or = [
        { displayName: { $regex: s, $options: 'i' } },
        { userId: { $regex: s, $options: 'i' } },
      ]
    }
    if (status === 'active') query.isActive = true
    if (status === 'inactive') query.isActive = false
    if (status === 'following') query.isFollowing = true
    if (status === 'unfollowed') query.isFollowing = false
    if (mapped === 'yes') query.residentId = { $ne: null }
    if (mapped === 'no') query.residentId = null

    const users = await db.collection('lineUsers').find(query).sort({ followedAt: -1 }).toArray()
    res.status(200).json(users)
  } catch (e) {
    console.error('GET /api/line/users error:', e)
    res.status(500).json({ error: e.message })
  }
})

router.get('/users/:userId', async (req, res) => {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    const user = await db.collection('lineUsers').findOne({ userId: req.params.userId })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.status(200).json(user)
  } catch (e) {
    console.error('GET /api/line/users/:userId error:', e)
    res.status(500).json({ error: e.message })
  }
})

router.put('/users/:userId/toggle', async (req, res) => {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    const user = await db.collection('lineUsers').findOne({ userId: req.params.userId })
    if (!user) return res.status(404).json({ error: 'User not found' })
    const newStatus = !user.isActive
    await db.collection('lineUsers').updateOne(
      { userId: req.params.userId },
      { $set: { isActive: newStatus, updatedAt: new Date().toISOString() } }
    )
    res.status(200).json({ success: true, isActive: newStatus })
  } catch (e) {
    console.error('PUT /api/line/users/:userId/toggle error:', e)
    res.status(500).json({ error: e.message })
  }
})

router.put('/users/:userId/map', async (req, res) => {
  try {
    const { residentId } = req.body
    if (!residentId) return res.status(400).json({ error: 'residentId is required' })

    const client = await connectDB()
    const db = client.db('dorm_billing')

    const existing = await db.collection('lineUsers').findOne({ residentId, userId: { $ne: req.params.userId } })
    if (existing) return res.status(400).json({ error: 'LINE user นี้ถูกเชื่อมโยงกับผู้พักอื่นแล้ว' })

    await db.collection('lineUsers').updateOne(
      { userId: req.params.userId },
      { $set: { residentId, updatedAt: new Date().toISOString() } }
    )
    await db.collection('residents').updateOne(
      { id: residentId },
      { $set: { lineUserId: req.params.userId, updatedAt: new Date().toISOString() } }
    )
    res.status(200).json({ success: true })
  } catch (e) {
    console.error('PUT /api/line/users/:userId/map error:', e)
    res.status(500).json({ error: e.message })
  }
})

router.put('/users/:userId/unmap', async (req, res) => {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    const user = await db.collection('lineUsers').findOne({ userId: req.params.userId })
    if (!user) return res.status(404).json({ error: 'User not found' })

    if (user.residentId) {
      await db.collection('residents').updateOne(
        { id: user.residentId },
        { $set: { lineUserId: '', updatedAt: new Date().toISOString() } }
      )
    }

    await db.collection('lineUsers').updateOne(
      { userId: req.params.userId },
      { $set: { residentId: null, updatedAt: new Date().toISOString() } }
    )
    res.status(200).json({ success: true })
  } catch (e) {
    console.error('PUT /api/line/users/:userId/unmap error:', e)
    res.status(500).json({ error: e.message })
  }
})

router.post('/sync-followers', async (req, res) => {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    const settings = await db.collection('settings').findOne({ _id: 'default' })
    const token = settings?.channelToken
    if (!token) return res.status(400).json({ error: 'ไม่ได้ตั้งค่า Channel Access Token' })

    let allUserIds = []
    let nextCursor

    do {
      const url = nextCursor
        ? `https://api.line.me/v2/bot/followers/ids?start=${nextCursor}`
        : 'https://api.line.me/v2/bot/followers/ids'
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (!resp.ok) {
        const err = await resp.json()
        return res.status(resp.status).json({ error: err.message || 'LINE API error' })
      }
      const data = await resp.json()
      allUserIds = allUserIds.concat(data.userIds || [])
      nextCursor = data.next
    } while (nextCursor)

    let imported = 0
    let updated = 0

    for (const userId of allUserIds) {
      const existing = await db.collection('lineUsers').findOne({ userId })
      if (existing) {
        await db.collection('lineUsers').updateOne(
          { userId },
          { $set: { isFollowing: true, unfollowedAt: null, updatedAt: new Date().toISOString() } }
        )
        updated++
      } else {
        let displayName = userId
        let pictureUrl = ''
        try {
          const profileResp = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (profileResp.ok) {
            const profile = await profileResp.json()
            displayName = profile.displayName || userId
            pictureUrl = profile.pictureUrl || ''
          }
        } catch {}

        await db.collection('lineUsers').insertOne({
          userId,
          displayName,
          pictureUrl,
          statusMessage: '',
          isActive: true,
          isFollowing: true,
          residentId: null,
          followedAt: new Date().toISOString(),
          unfollowedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        imported++
      }
    }

    res.json({ success: true, total: allUserIds.length, imported, updated })
  } catch (e) {
    console.error('POST /api/line/sync-followers error:', e)
    res.status(500).json({ error: e.message })
  }
})

export default router
