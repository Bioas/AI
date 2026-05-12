import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let client;
  try { client = await connectDB(); }
  catch (e: any) { return res.status(500).json({ error: e.message }); }

  const db = client.db('dorm_billing');
  const data = req.body;
  const results: Record<string, number> = {};

  try {
    if (Array.isArray(data.rooms) && data.rooms.length) {
      await db.collection('rooms').deleteMany({});
      await db.collection('rooms').insertMany(data.rooms);
      results.rooms = data.rooms.length;
    }
    if (Array.isArray(data.utilities) && data.utilities.length) {
      await db.collection('utilities').deleteMany({});
      await db.collection('utilities').insertMany(data.utilities);
      results.utilities = data.utilities.length;
    }
    if (Array.isArray(data.invoices) && data.invoices.length) {
      await db.collection('invoices').deleteMany({});
      await db.collection('invoices').insertMany(data.invoices);
      results.invoices = data.invoices.length;
    }
    if (Array.isArray(data.pendingLines) && data.pendingLines.length) {
      await db.collection('pending_lines').deleteMany({});
      await db.collection('pending_lines').insertMany(data.pendingLines);
      results.pendingLines = data.pendingLines.length;
    }
    return res.status(200).json({ success: true, migrated: results });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
