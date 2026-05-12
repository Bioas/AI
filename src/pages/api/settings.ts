export default async function handler(req: any, res: any) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return res.status(500).json({ error: 'Upstash not configured' });
  }

  const redisUrl = `${url}/pipeline`;
  
  const defaultSettings = {
    dormName: 'หอพักสุขใจ',
    address: '123 ถ.สุขุมวิท กรุงเทพฯ',
    phone: '081-234-5678',
    rateElec: 7,
    rateWater: 20,
    logo: ''
  };

  if (req.method === 'GET') {
    try {
      const fetchRes = await fetch(redisUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify([['GET', 'settings']])
      });
      
      if (!fetchRes.ok) {
        throw new Error(`HTTP ${fetchRes.status}`);
      }
      
      const result = await fetchRes.json();
      
      let settings = defaultSettings;
      if (result.result) {
        try {
          const parsed = JSON.parse(result.result);
          if (Array.isArray(parsed) && parsed[0]?.[1]) {
            settings = JSON.parse(parsed[0][1]);
          }
        } catch (e) {
          console.error('Failed to parse settings:', result.result);
        }
      }
      
      return res.status(200).json(settings);
    } catch (error) {
      console.error('Error getting settings:', error);
      return res.status(500).json({ error: 'Failed to get settings', details: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      await fetch(redisUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify([['SET', 'settings', JSON.stringify(req.body)]])
      });
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error saving settings:', error);
      return res.status(500).json({ error: 'Failed to save settings', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
