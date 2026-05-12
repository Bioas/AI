import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let client;
  try {
    client = await clientPromise;
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Database connection failed' });
  }

  try {
    const db = client.db('dorm_billing');
    const collection = db.collection('rooms');

    if (req.method === 'GET') {
      const rooms = await collection.find({}).toArray();
      return res.status(200).json(rooms);
    }

    if (req.method === 'POST') {
      const result = await collection.insertOne(req.body);
      return res.status(200).json({ ...req.body, _id: result.insertedId });
    }

    if (req.method === 'PUT') {
      const { id, ...updateData } = req.body;
      const result = await collection.updateOne({ id }, { $set: updateData });
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Room not found' });
      }
      return res.status(200).json(req.body);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      const result = await collection.deleteOne({ id });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Room not found' });
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Rooms API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
