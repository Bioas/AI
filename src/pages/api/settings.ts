import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../lib/mongodb';

const defaultSettings = {
  dormName: 'หอพักสุขใจ',
  address: '123 ถ.สุขุมวิท กรุงเทพฯ',
  phone: '081-234-5678',
  rateElec: 7,
  rateWater: 20,
  logo: ''
};

export interface Settings {
  dormName: string;
  address: string;
  phone: string;
  rateElec: number;
  rateWater: number;
  logo: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    let client;
    try { client = await connectDB(); }
    catch { return res.status(200).json(defaultSettings); }

    const db = client.db('dorm_billing');
    const settings = await db.collection<Settings>('settings').findOne({ _id: 'default' } as any);
    return res.status(200).json(settings || defaultSettings);
  }

  if (req.method === 'POST') {
    let client;
    try { client = await connectDB(); }
    catch (e: any) { return res.status(500).json({ error: e.message }); }

    const db = client.db('dorm_billing');
    await db.collection('settings').updateOne(
      { _id: 'default' } as any,
      { $set: req.body },
      { upsert: true }
    );
    return res.status(200).json(req.body);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
