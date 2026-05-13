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

router.post('/send-image', async (req, res) => {
  const { to, token, invoiceImageUrl, tenantName, roomNumber, billingMonth, totalAmount, dueDate } = req.body

  if (!to || !token || !invoiceImageUrl) {
    return res.status(400).json({ error: 'Missing required fields: to, token, invoiceImageUrl' })
  }

  if (!to.startsWith('U')) {
    return res.status(400).json({ error: 'Invalid LINE User ID. Must start with U' })
  }

  const flex = {
    type: 'flex',
    altText: `🧾 ใบแจ้งหนี้ค่าเช่า ห้อง ${roomNumber || ''} — ${totalAmount || ''} บาท`,
    contents: {
      type: 'bubble', size: 'mega', direction: 'ltr',
      header: {
        type: 'box', layout: 'vertical', paddingAll: '18px', paddingBottom: '14px', backgroundColor: '#FFFFFF',
        contents: [
          { type: 'box', layout: 'horizontal', alignItems: 'center',
            contents: [
              { type: 'box', layout: 'vertical', width: '4px', height: '20px', backgroundColor: '#22C55E', cornerRadius: '2px', flex: 'none' },
              { type: 'text', text: 'ใบแจ้งหนี้ค่าเช่า', weight: 'bold', size: '17px', color: '#1A1A2E', margin: '10px', flex: 0 },
              { type: 'text', text: 'INVOICE', size: '10px', color: '#22C55E', weight: 'bold', margin: '4px', gravity: 'center', flex: 0, offsetBottom: '1px' },
            ]
          },
          { type: 'separator', color: '#F0F0F0', margin: '12px' },
          { type: 'box', layout: 'horizontal', margin: '10px', alignItems: 'center',
            contents: [
              { type: 'box', layout: 'vertical', flex: 1,
                contents: [
                  { type: 'text', text: 'ผู้เช่า', size: '10px', color: '#9CA3AF', weight: 'medium' },
                  { type: 'text', text: tenantName || '', size: '14px', color: '#1A1A2E', weight: 'bold', margin: '2px' },
                ]
              },
              { type: 'box', layout: 'vertical',
                contents: [
                  { type: 'text', text: 'ห้อง', size: '10px', color: '#9CA3AF', weight: 'medium', align: 'right' },
                  { type: 'text', text: roomNumber || '', size: '20px', color: '#1A1A2E', weight: 'bold', align: 'right', margin: '2px' },
                ]
              },
            ]
          },
          { type: 'box', layout: 'horizontal', margin: '6px', alignItems: 'center',
            contents: [
              { type: 'text', text: billingMonth || '', size: '12px', color: '#6B7280', weight: 'medium', flex: 1 },
              { type: 'box', layout: 'horizontal', backgroundColor: '#FEF3C7', cornerRadius: '100px', paddingStart: '10px', paddingEnd: '10px', paddingTop: '4px', paddingBottom: '4px',
                contents: [{ type: 'text', text: '⏳ รอชำระ', size: '10px', color: '#D97706', weight: 'bold' }]
              },
            ]
          },
        ]
      },
      hero: {
        type: 'image', url: invoiceImageUrl, size: 'full', aspectRatio: '1.91:1', aspectMode: 'fit', backgroundColor: '#FFFFFF',
        action: { type: 'uri', label: 'ดูใบแจ้งหนี้', uri: invoiceImageUrl }
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: '18px', paddingTop: '14px', backgroundColor: '#FFFFFF',
        contents: [
          { type: 'box', layout: 'horizontal',
            contents: [
              { type: 'box', layout: 'vertical', flex: 1,
                contents: [
                  { type: 'text', text: 'จำนวนเงิน', size: '10px', color: '#9CA3AF', weight: 'medium' },
                  { type: 'text', text: totalAmount?.toString() || '', size: '32px', color: '#22C55E', weight: 'bold', margin: '2px' },
                  { type: 'text', text: 'บาท', size: '12px', color: '#22C55E', weight: 'bold' },
                ]
              },
              { type: 'box', layout: 'vertical',
                contents: [
                  { type: 'text', text: 'กำหนดชำระ', size: '10px', color: '#9CA3AF', weight: 'medium', align: 'right' },
                  { type: 'text', text: dueDate || '', size: '14px', color: '#EF4444', weight: 'bold', align: 'right', margin: '4px' },
                  { type: 'text', text: 'วันครบกำหนด', size: '9px', color: '#EF4444', align: 'right' },
                ]
              },
            ]
          },
          { type: 'separator', color: '#F0F0F0', margin: '12px' },
          { type: 'box', layout: 'horizontal', margin: '12px',
            contents: [
              { type: 'box', layout: 'horizontal', backgroundColor: '#F9FAFB', cornerRadius: '8px', paddingAll: '10px', flex: 1,
                contents: [{ type: 'text', text: '⚡ ค่าไฟ + 💧 ค่าน้ำ + 🏠 ค่าเช่า', size: '11px', color: '#6B7280', weight: 'regular', wrap: true }]
              },
            ]
          },
          { type: 'text', text: 'ขอบคุณที่ใช้บริการ', size: '10px', color: '#D1D5DB', weight: 'regular', align: 'center', margin: '6px' },
        ]
      },
      footer: {
        type: 'box', layout: 'vertical', paddingAll: '18px', paddingTop: '0px', backgroundColor: '#FFFFFF',
        contents: [
          { type: 'separator', color: '#F0F0F0' },
          { type: 'button', action: { type: 'uri', label: '👁️ ดูใบแจ้งหนี้', uri: invoiceImageUrl }, margin: '14px', height: '48px', style: 'primary', color: '#22C55E', cornerRadius: '12px' },
        ]
      },
    }
  }

  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ to, messages: [flex] }),
    })

    const data = await response.json()

    if (response.ok) {
      return res.status(200).json({ success: true, data })
    } else {
      return res.status(response.status).json({ error: data.message || 'LINE API error', details: data })
    }
  } catch (error) {
    console.error('LINE send image error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

export default router
