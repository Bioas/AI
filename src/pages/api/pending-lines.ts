import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../lib/mongodb';

export interface PendingLineUser {
  id: string;
  lineUserId: string;
  lineDisplayName?: string;
  linePictureUrl?: string;
  roomId?: string;
  status: 'pending' | 'matched' | 'ignored';
  createdAt: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let client;
  try { client = await connectDB(); }
  catch (e: any) { return res.status(500).json({ error: e.message }); }

  const db = client.db('dorm_billing');
  const collection = db.collection<PendingLineUser>('pending_lines');

  if (req.method === 'GET') {
    const users = await collection.find({}).toArray();
    return res.status(200).json(users);
  }

  if (req.method === 'POST') {
    const user = req.body as PendingLineUser;
    if (!user.id) user.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    await collection.insertOne(user);
    return res.status(200).json(user);
  }

  if (req.method === 'PUT') {
    const { id, ...data } = req.body as PendingLineUser;
    await collection.updateOne({ id }, { $set: data });
    return res.status(200).json(req.body);
  }

  if (req.method === 'DELETE') {
    await collection.deleteOne({ id: req.body.id });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
