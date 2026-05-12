import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../lib/mongodb';

export interface UtilityRecord {
  id: string;
  roomId: string;
  month: string;
  elecReading: number;
  waterReading: number;
  prevElecReading: number;
  prevWaterReading: number;
  elecUsed: number;
  waterUsed: number;
  note: string;
  createdAt: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let client;
  try { client = await connectDB(); }
  catch (e: any) { return res.status(500).json({ error: e.message }); }

  const db = client.db('dorm_billing');
  const collection = db.collection<UtilityRecord>('utilities');

  if (req.method === 'GET') {
    const records = await collection.find({}).toArray();
    return res.status(200).json(records);
  }

  if (req.method === 'POST') {
    const record = req.body as UtilityRecord;
    if (!record.id) record.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    await collection.insertOne(record);
    return res.status(200).json(record);
  }

  if (req.method === 'PUT') {
    const { id, ...data } = req.body as UtilityRecord;
    await collection.updateOne({ id }, { $set: data });
    return res.status(200).json(req.body);
  }

  if (req.method === 'DELETE') {
    await collection.deleteOne({ id: req.body.id });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
