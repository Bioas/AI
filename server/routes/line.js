import { Router } from 'express'

const router = Router()

router.post('/send', async (req, res) => {
  const { to, text, token } = req.body

  if (!to || !text || !token) {
    return res.status(400).json({ error: 'Missing required fields: to, text, token' })
  }

  if (!to.startsWith('U')) {
    return res.status(400).json({ error: 'Invalid LINE User ID. Must start with U' })
  }

  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        to,
        messages: [{ type: 'text', text }],
      }),
    })

    const data = await response.json()

    if (response.ok) {
      return res.status(200).json({ success: true, data })
    } else {
      return res.status(response.status).json({ error: data.message || 'LINE API error', details: data })
    }
  } catch (error) {
    console.error('LINE send error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

router.post('/send-file', async (req, res) => {
  const { to, token, displayName, fileUrl } = req.body

  if (!to || !token || !displayName || !fileUrl) {
    return res.status(400).json({ error: 'Missing required fields: to, token, displayName, fileUrl' })
  }

  if (!to.startsWith('U')) {
    return res.status(400).json({ error: 'Invalid LINE User ID. Must start with U' })
  }

  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        to,
        messages: [{
          type: 'flex',
          altText: `📄 ใบแจ้งหนี้ ${displayName}`,
          contents: {
            type: 'bubble',
            header: {
              type: 'box', layout: 'vertical', paddingAll: '18px', paddingBottom: '14px', backgroundColor: '#FFFFFF',
              contents: [{
                type: 'box', layout: 'horizontal', alignItems: 'center',
                contents: [
                  { type: 'box', layout: 'vertical', width: '4px', height: '18px', backgroundColor: '#22C55E', cornerRadius: '2px', flex: 'none' },
                  { type: 'text', text: 'ใบแจ้งหนี้ค่าเช่า', weight: 'bold', size: '16px', color: '#1A1A2E', margin: '10px', flex: 0 },
                  { type: 'text', text: 'INVOICE', size: '10px', color: '#22C55E', weight: 'bold', margin: '4px', gravity: 'center', align: 'center', flex: 0, offsetBottom: '1px' },
                ]
              }]
            },
            body: {
              type: 'box', layout: 'vertical', paddingAll: '18px', paddingTop: '0px', backgroundColor: '#FFFFFF',
              contents: [
                { type: 'separator', color: '#F0F0F0', margin: 'none' },
                { type: 'box', layout: 'horizontal', margin: '16px', alignItems: 'flex-end',
                  contents: [
                    { type: 'box', layout: 'vertical', flex: 1,
                      contents: [
                        { type: 'text', text: 'ห้อง', size: '11px', color: '#8E8E93', weight: 'medium' },
                        { type: 'text', text: displayName.replace('invoice_', '').replace('.pdf', '').split('_')[0], size: '32px', color: '#1A1A2E', weight: 'bold', margin: '4px', lineSpacing: '0px' },
                      ]
                    },
                  ]
                },
                { type: 'separator', color: '#F0F0F0' },
                { type: 'box', layout: 'horizontal', margin: '14px',
                  contents: [
                    { type: 'text', text: '📄 ใบแจ้งหนี้พร้อมให้ดาวน์โหลด', size: '12px', color: '#1A1A2E', weight: 'bold' },
                  ]
                },
                { type: 'separator', color: '#F0F0F0' },
              ]
            },
            footer: {
              type: 'box', layout: 'vertical', paddingAll: '18px', paddingTop: '0px', backgroundColor: '#FFFFFF',
              contents: [
                { type: 'separator', color: '#F0F0F0' },
                { type: 'button', action: { type: 'uri', label: '📄 เปิดไฟล์ PDF', uri: fileUrl }, margin: '16px', height: '48px', style: 'primary', color: '#22C55E', cornerRadius: '12px' },
              ]
            }
          }
        }],
      }),
    })

    const data = await response.json()

    if (response.ok) {
      return res.status(200).json({ success: true, data })
    } else {
      return res.status(response.status).json({ error: data.message || 'LINE API error', details: data })
    }
  } catch (error) {
    console.error('LINE send file error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

export default router
