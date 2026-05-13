import { connectDB } from '../../lib/mongodb.js';

export default async function handler(req, res) {
  let client;
  try { client = await connectDB(); }
  catch (e) { return res.status(500).json({ error: e.message }); }

  const db = client.db('dorm_billing');
  const collection = db.collection('rooms');

  if (req.method === 'GET') {
    const rooms = await collection.find({}).toArray();
    return res.status(200).json(rooms);
  }
  if (req.method === 'POST') {
    const room = req.body;
    if (!room.id) room.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    await collection.insertOne(room);
    return res.status(200).json(room);
  }
  if (req.method === 'PUT') {
    const { id, ...data } = req.body;
    await collection.updateOne({ id }, { $set: data });
    return res.status(200).json(req.body);
  }
  if (req.method === 'DELETE') {
    await collection.deleteOne({ id: req.body.id });
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
