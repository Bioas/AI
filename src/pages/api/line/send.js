/**
 * LINE Messaging API Proxy
 * ใช้งาน: POST /api/line/send
 * Body: { to: string, text: string, token: string }
 * แก้ปัญหา CORS ที่เกิดจากการเรียก LINE API จาก browser โดยตรง
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, text, token } = req.body;

  if (!to || !text || !token) {
    return res.status(400).json({ error: 'Missing required fields: to, text, token' });
  }

  if (!to.startsWith('U')) {
    return res.status(400).json({ error: 'Invalid LINE User ID. Must start with U' });
  }

  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        to,
        messages: [{ type: 'text', text }]
      })
    });

    const data = await response.json();

    if (response.ok) {
      return res.status(200).json({ success: true, data });
    } else {
      return res.status(response.status).json({ error: data.message || 'LINE API error', details: data });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
