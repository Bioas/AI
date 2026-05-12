export default async function handler(req: any, res: any) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return res.status(500).json({ error: 'Upstash not configured' });
  }

  const redisUrl = `${url}/pipeline`;

  if (req.method === 'GET') {
    try {
      const fetchRes = await fetch(redisUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify([['GET', 'tenants']])
      });

      if (!fetchRes.ok) {
        throw new Error(`HTTP ${fetchRes.status}`);
      }

      const result = await fetchRes.json();

      let tenants: any[] = [];
      if (result.result) {
        try {
          const parsed = JSON.parse(result.result);
          if (Array.isArray(parsed) && parsed[0]?.[1]) {
            tenants = JSON.parse(parsed[0][1]);
          }
        } catch (e) {
          console.error('Failed to parse tenants:', result.result);
          tenants = [];
        }
      }

      return res.status(200).json(tenants);
    } catch (error: any) {
      console.error('Error getting tenants:', error);
      return res.status(500).json({ error: 'Failed to get tenants', details: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const getRes = await fetch(redisUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify([['GET', 'tenants']])
      });
      const getResult = await getRes.json();

      let tenants: any[] = [];
      if (getResult.result) {
        try {
          const parsed = JSON.parse(getResult.result);
          if (Array.isArray(parsed) && parsed[0]?.[1]) {
            tenants = JSON.parse(parsed[0][1]);
          }
        } catch (e) {
          tenants = [];
        }
      }

      tenants.push(req.body);

      await fetch(redisUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify([['SET', 'tenants', JSON.stringify(tenants)]])
      });

      return res.status(200).json(req.body);
    } catch (error: any) {
      console.error('Error saving tenant:', error);
      return res.status(500).json({ error: 'Failed to save tenant', details: error.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const getRes = await fetch(redisUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify([['GET', 'tenants']])
      });
      const getResult = await getRes.json();

      let tenants: any[] = [];
      if (getResult.result) {
        try {
          const parsed = JSON.parse(getResult.result);
          if (Array.isArray(parsed) && parsed[0]?.[1]) {
            tenants = JSON.parse(parsed[0][1]);
          }
        } catch (e) {
          tenants = [];
        }
      }

      const index = tenants.findIndex((t: any) => t.id === req.body.id);
      if (index === -1) {
        return res.status(404).json({ error: 'Tenant not found' });
      }
      tenants[index] = req.body;

      await fetch(redisUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify([['SET', 'tenants', JSON.stringify(tenants)]])
      });

      return res.status(200).json(req.body);
    } catch (error: any) {
      console.error('Error updating tenant:', error);
      return res.status(500).json({ error: 'Failed to update tenant', details: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const getRes = await fetch(redisUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify([['GET', 'tenants']])
      });
      const getResult = await getRes.json();

      let tenants: any[] = [];
      if (getResult.result) {
        try {
          const parsed = JSON.parse(getResult.result);
          if (Array.isArray(parsed) && parsed[0]?.[1]) {
            tenants = JSON.parse(parsed[0][1]);
          }
        } catch (e) {
          tenants = [];
        }
      }

      tenants = tenants.filter((t: any) => t.id !== req.body.id);

      await fetch(redisUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify([['SET', 'tenants', JSON.stringify(tenants)]])
      });

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error deleting tenant:', error);
      return res.status(500).json({ error: 'Failed to delete tenant', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
