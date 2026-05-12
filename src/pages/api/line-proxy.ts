import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * LINE Messaging API Proxy — แก้ปัญหา CORS
 * ใช้งาน: POST /api/line-proxy
 * Body: { url: string, headers?: object, body?: any }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, headers = {}, body } = req.body;

  if (!url || !url.startsWith('https://api.line.me/')) {
    return res.status(400).json({ error: 'Invalid LINE API URL' });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
