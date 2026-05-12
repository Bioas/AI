import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../lib/mongodb';

const defaults = {
  dormName: 'หอพักสุขใจ', address: '123 ถ.สุขุมวิท กรุงเทพฯ', phone: '081-234-5678',
  rateElec: 7, rateWater: 20, channelToken: '', logo: ''
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let client;
  try { client = await connectDB(); }
  catch (e: any) { return res.status(200).json(defaults); }

  const db = client.db('dorm_billing');
  const collection = db.collection('settings');

  if (req.method === 'GET') {
    const s = await collection.findOne({ _id: 'default' } as any);
    return res.status(200).json(s || defaults);
  }
  if (req.method === 'POST') {
    await collection.updateOne({ _id: 'default' } as any, { $set: req.body }, { upsert: true });
    return res.status(200).json(req.body);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
