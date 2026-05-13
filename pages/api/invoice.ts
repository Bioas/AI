import { NextApiRequest, NextApiResponse } from 'next';
import { generateInvoiceData } from '../utils/billing';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { data } = req.body;
  
  if (!data || !data.roomId || !data.roomId.toString().length > 0) {
    res.status(400).json({ error: 'roomId is required' });
    return;
  }

  try {
    const result = generateInvoiceData(req.body);
    res.status(200).json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
