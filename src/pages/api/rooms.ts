import { kv } from '@vercel/kv';

export default async function handler(req: any, res: any) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return res.status(500).json({ error: 'Upstash not configured' });
  }

  if (req.method === 'GET') {
    try {
      const rooms = await kv.get<Room[]>('rooms');
      return res.status(200).json(rooms || []);
    } catch (error) {
      console.error('Error getting rooms:', error);
      return res.status(500).json({ error: 'Failed to get rooms' });
    }
  }

  if (req.method === 'POST') {
    try {
      const rooms = await kv.get<Room[]>('rooms') || [];
      const newRoom = req.body;
      rooms.push(newRoom);
      await kv.set('rooms', rooms);
      return res.status(200).json(newRoom);
    } catch (error) {
      console.error('Error saving room:', error);
      return res.status(500).json({ error: 'Failed to save room' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const rooms = await kv.get<Room[]>('rooms') || [];
      const index = rooms.findIndex((r: Room) => r.id === req.body.id);
      if (index === -1) {
        return res.status(404).json({ error: 'Room not found' });
      }
      rooms[index] = req.body;
      await kv.set('rooms', rooms);
      return res.status(200).json(req.body);
    } catch (error) {
      console.error('Error updating room:', error);
      return res.status(500).json({ error: 'Failed to update room' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const rooms = await kv.get<Room[]>('rooms') || [];
      const filtered = rooms.filter((r: Room) => r.id !== req.body.id);
      await kv.set('rooms', filtered);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting room:', error);
      return res.status(500).json({ error: 'Failed to delete room' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

interface Room {
  id: string;
  number: string;
  rent: number;
  tenantName?: string;
  tenantPhone?: string;
  tenantUserId?: string;
  note?: string;
}
