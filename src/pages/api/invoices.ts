import type { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../../lib/mongodb';

export interface Invoice {
  id: string;
  roomId: string;
  roomNumber: string;
  tenantName: string;
  month: string;
  rent: number;
  elecUnits: number;
  elecRate: number;
  elecAmount: number;
  waterUnits: number;
  waterRate: number;
  waterAmount: number;
  total: number;
  status: 'pending' | 'paid' | 'overdue';
  paidDate?: string;
  note: string;
  createdAt: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let client;
  try { client = await connectDB(); }
  catch (e: any) { return res.status(500).json({ error: e.message }); }

  const db = client.db('dorm_billing');
  const collection = db.collection<Invoice>('invoices');

  if (req.method === 'GET') {
    const invoices = await collection.find({}).toArray();
    return res.status(200).json(invoices);
  }

  if (req.method === 'POST') {
    const invoice = req.body as Invoice;
    if (!invoice.id) invoice.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    await collection.insertOne(invoice);
    return res.status(200).json(invoice);
  }

  if (req.method === 'PUT') {
    const { id, ...data } = req.body as Invoice;
    await collection.updateOne({ id }, { $set: data });
    return res.status(200).json(req.body);
  }

  if (req.method === 'DELETE') {
    await collection.deleteOne({ id: req.body.id });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
