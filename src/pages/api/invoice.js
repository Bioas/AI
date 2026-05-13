import { generateInvoiceData } from '../../../utils/billing';

export default function handler(req, res) {
  const { data } = req.body;

  if (!data || !data.roomId || !data.roomId.toString().trim()) {
    res.status(400).json({ error: 'roomId is required' });
    return;
  }

  try {
    const result = generateInvoiceData(req.body);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
