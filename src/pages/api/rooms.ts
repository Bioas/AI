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
        body: JSON.stringify([['GET', 'rooms']])
      });

      if (!fetchRes.ok) {
        throw new Error(`HTTP ${fetchRes.status}`);
      }

      const result = await fetchRes.json();
      
      let rooms: any[] = [];
      if (result.result) {
        try {
          const parsed = JSON.parse(result.result);
          if (Array.isArray(parsed) && parsed[0]?.[1]) {
            rooms = JSON.parse(parsed[0][1]);
          }
        } catch (e) {
          console.error('Failed to parse rooms:', result.result);
          rooms = [];
        }
      }
      
      return res.status(200).json(rooms);
    } catch (error) {
      console.error('Error getting rooms:', error);
      return res.status(500).json({ error: 'Failed to get rooms', details: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const getRes = await fetch(redisUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify([['GET', 'rooms']])
      });
      const getResult = await getRes.json();
      
      let rooms: any[] = [];
      if (getResult.result) {
        try {
          const parsed = JSON.parse(getResult.result);
          if (Array.isArray(parsed) && parsed[0]?.[1]) {
            rooms = JSON.parse(parsed[0][1]);
          }
        } catch (e) {
          rooms = [];
        }
      }

      rooms.push(req.body);

      await fetch(redisUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify([['SET', 'rooms', JSON.stringify(rooms)]])
      });

      return res.status(200).json(req.body);
    } catch (error) {
      console.error('Error saving room:', error);
      return res.status(500).json({ error: 'Failed to save room', details: error.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const getRes = await fetch(redisUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify([['GET', 'rooms']])
      });
      const getResult = await getRes.json();
      
      let rooms: any[] = [];
      if (getResult.result) {
        try {
          const parsed = JSON.parse(getResult.result);
          if (Array.isArray(parsed) && parsed[0]?.[1]) {
            rooms = JSON.parse(parsed[0][1]);
          }
        } catch (e) {
          rooms = [];
        }
      }

      const index = rooms.findIndex((r: any) => r.id === req.body.id);
      if (index === -1) {
        return res.status(404).json({ error: 'Room not found' });
      }
      rooms[index] = req.body;

      await fetch(redisUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify([['SET', 'rooms', JSON.stringify(rooms)]])
      });

      return res.status(200).json(req.body);
    } catch (error) {
      console.error('Error updating room:', error);
      return res.status(500).json({ error: 'Failed to update room', details: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const getRes = await fetch(redisUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify([['GET', 'rooms']])
      });
      const getResult = await getRes.json();
      
      let rooms: any[] = [];
      if (getResult.result) {
        try {
          const parsed = JSON.parse(getResult.result);
          if (Array.isArray(parsed) && parsed[0]?.[1]) {
            rooms = JSON.parse(parsed[0][1]);
          }
        } catch (e) {
          rooms = [];
        }
      }

      rooms = rooms.filter((r: any) => r.id !== req.body.id);

      await fetch(redisUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify([['SET', 'rooms', JSON.stringify(rooms)]])
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting room:', error);
      return res.status(500).json({ error: 'Failed to delete room', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
