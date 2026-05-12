import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../lib/mongodb';

const defaultSettings = {
  dormName: 'หอพักสุขใจ',
  address: '123 ถ.สุขุมวิท กรุงเทพฯ',
  phone: '081-234-5678',
  rateElec: 7,
  rateWater: 20,
  logo: ''
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db('dorm_billing');
    const collection = db.collection('settings');

    if (req.method === 'GET') {
      const settings = await collection.findOne({ _id: 'default' } as any);
      return res.status(200).json(settings || defaultSettings);
    }

    if (req.method === 'POST') {
      await collection.updateOne(
        { _id: 'default' } as any,
        { $set: req.body },
        { upsert: true }
      );
      return res.status(200).json(req.body);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Settings API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
