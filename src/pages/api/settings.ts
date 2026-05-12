import { kv } from '@vercel/kv';

const defaultSettings = {
  dormName: 'หอพักสุขใจ',
  address: '123 ถ.สุขุมวิท กรุงเทพฯ',
  phone: '081-234-5678',
  rateElec: 7,
  rateWater: 20,
  logo: ''
};

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    try {
      const settings = await kv.get('settings');
      return res.status(200).json(settings || defaultSettings);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to get settings' });
    }
  }

  if (req.method === 'POST') {
    try {
      await kv.set('settings', req.body);
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to save settings' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
