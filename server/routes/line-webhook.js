import { Router } from 'express'
import crypto from 'crypto'
import { connectDB } from '../lib/mongodb.js'

const router = Router()

function validateSignature(body, signature, secret) {
  if (!secret) return true
  const sig = crypto.createHmac('SHA256', secret).update(body).digest('base64')
  return sig === signature
}

router.post('/', async (req, res) => {
  try {
    const client = await connectDB()
    const db = client.db('dorm_billing')
    const settings = await db.collection('settings').findOne({ _id: 'default' })
    const channelSecret = settings?.channelSecret || ''

    const signature = req.headers['x-line-signature']
    const rawBody = JSON.stringify(req.body)

    if (!validateSignature(rawBody, signature, channelSecret)) {
      return res.status(401).json({ error: 'Invalid signature' })
    }

    const events = req.body.events || []

    for (const event of events) {
      const { type, source, timestamp } = event
      const userId = source?.userId
      if (!userId) continue

      if (type === 'follow') {
        const existing = await db.collection('lineUsers').findOne({ userId })
        if (existing) {
          await db.collection('lineUsers').updateOne(
            { userId },
            { $set: { isFollowing: true, unfollowedAt: null, updatedAt: new Date().toISOString() } }
          )
        } else {
          let displayName = userId
          let pictureUrl = ''
          try {
            const s = await db.collection('settings').findOne({ _id: 'default' })
            const token = s?.channelToken
            if (token) {
              const resp = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              if (resp.ok) {
                const profile = await resp.json()
                displayName = profile.displayName || userId
                pictureUrl = profile.pictureUrl || ''
              }
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
            followedAt: new Date(timestamp).toISOString(),
            unfollowedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        }
      }

      if (type === 'unfollow') {
        await db.collection('lineUsers').updateOne(
          { userId },
          {
            $set: {
              isFollowing: false,
              unfollowedAt: new Date(timestamp).toISOString(),
              updatedAt: new Date().toISOString(),
            },
          }
        )
      }
    }

    res.status(200).json({ success: true })
  } catch (e) {
    console.error('Webhook error:', e)
    res.status(500).json({ error: e.message })
  }
})

export default router
