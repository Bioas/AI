import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const channelSecret = process.env.LINE_CHANNEL_SECRET || '';
  const signature = req.headers['x-line-signature'] as string;

  // Verify signature if configured
  if (channelSecret && signature) {
    const crypto = await import('crypto');
    const body = JSON.stringify(req.body);
    const hash = crypto
      .createHmac('SHA256', channelSecret)
      .update(body)
      .digest('base64');
    if (hash !== signature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  let client;
  try { client = await connectDB(); }
  catch (e: any) { return res.status(500).json({ error: e.message }); }

  const db = client.db('dorm_billing');
  const collection = db.collection('pending_lines');

  const events = req.body.events || [];

  for (const event of events) {
    if (event.type === 'follow') {
      const lineUserId = event.source?.userId;
      if (!lineUserId) continue;

      const existing = await collection.findOne({ lineUserId });
      if (!existing) {
        await collection.insertOne({
          id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
          lineUserId,
          lineDisplayName: '',
          linePictureUrl: '',
          status: 'pending',
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  return res.status(200).json({ success: true });
}
