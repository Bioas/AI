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

router.post('/send-image', async (req, res) => {
  const { to, token, invoiceImageUrl, tenantName, roomNumber, billingMonth, totalAmount, dueDate, roomFee, waterBill, electricBill } = req.body

  if (!to || !token || !invoiceImageUrl) {
    return res.status(400).json({ error: 'Missing required fields: to, token, invoiceImageUrl' })
  }

  if (!to.startsWith('U')) {
    return res.status(400).json({ error: 'Invalid LINE User ID. Must start with U' })
  }

  const bodyContents = [
    { type: 'text', text: 'ใบแจ้งหนี้ค่าเช่า', weight: 'bold', size: 'xl', color: '#1a1a2e', wrap: true },
    { type: 'box', layout: 'baseline', spacing: 'sm',
      contents: [
        { type: 'text', text: 'ผู้พัก', color: '#aaaaaa', size: 'sm', flex: 2, wrap: true },
        { type: 'text', text: tenantName || '', wrap: true, color: '#666666', size: 'sm', flex: 3, align: 'end' }
      ]
    },
    { type: 'box', layout: 'baseline', spacing: 'sm',
      contents: [
        { type: 'text', text: 'ห้อง', color: '#aaaaaa', size: 'sm', flex: 2, wrap: true },
        { type: 'text', text: roomNumber || '', wrap: true, color: '#1a1a2e', size: 'sm', flex: 3, align: 'end' }
      ]
    },
    { type: 'box', layout: 'baseline', spacing: 'sm',
      contents: [
        { type: 'text', text: 'เดือน', color: '#aaaaaa', size: 'sm', flex: 2, wrap: true },
        { type: 'text', text: billingMonth || '', wrap: true, color: '#666666', size: 'sm', flex: 3, align: 'end' }
      ]
    },
    { type: 'separator', color: '#e5e7eb', margin: 'xl' },
    { type: 'box', layout: 'baseline', spacing: 'sm',
      contents: [
        { type: 'text', text: 'ค่าเช่าห้อง', color: '#aaaaaa', size: 'sm', flex: 2, wrap: true },
        { type: 'text', text: (roomFee || '0') + ' บาท', wrap: true, color: '#666666', size: 'sm', flex: 3, align: 'end' }
      ]
    },
    { type: 'box', layout: 'baseline', spacing: 'sm',
      contents: [
        { type: 'text', text: 'ค่าไฟฟ้า', color: '#aaaaaa', size: 'sm', flex: 2, wrap: true },
        { type: 'text', text: (electricBill || '0') + ' บาท', wrap: true, color: '#666666', size: 'sm', flex: 3, align: 'end' }
      ]
    },
    { type: 'box', layout: 'baseline', spacing: 'sm',
      contents: [
        { type: 'text', text: 'ค่าน้ำประปา', color: '#aaaaaa', size: 'sm', flex: 2, wrap: true },
        { type: 'text', text: (waterBill || '0') + ' บาท', wrap: true, color: '#666666', size: 'sm', flex: 3, align: 'end' }
      ]
    },
    { type: 'box', layout: 'baseline', spacing: 'sm',
      contents: [
        { type: 'text', text: 'รวมทั้งสิ้น', color: '#aaaaaa', size: 'sm', flex: 2, wrap: true },
        { type: 'text', text: (totalAmount || '') + ' บาท', wrap: true, color: '#22c55e', size: 'sm', flex: 3, align: 'end' }
      ]
    },
    { type: 'box', layout: 'baseline', spacing: 'sm',
      contents: [
        { type: 'text', text: 'กำหนดชำระ', color: '#aaaaaa', size: 'sm', flex: 2, wrap: true },
        { type: 'text', text: dueDate || '', wrap: true, color: '#ef4444', size: 'sm', flex: 3, align: 'end' }
      ]
    }
  ]

  if (qrCodeUrl && qrCodeUrl.length > 0) {
    bodyContents.push({
      type: 'box', layout: 'vertical', margin: 'xxl',
      contents: [
        { type: 'text', text: 'QR CODE', color: '#aaaaaa', size: 'xs' },
        { type: 'image', url: qrCodeUrl || invoiceImageUrl, size: 'xl', aspectMode: 'fit' },
        { type: 'text', text: 'Scan QR code เพื่อชำระเงิน', color: '#aaaaaa', size: 'xs', wrap: true, margin: 'md' }
      ]
    })
  }

  const host = process.env.VERCEL_URL || req.get('host')
  const protocol = host?.includes('localhost') ? 'http' : 'https'
  const qrCodeUrl = `${protocol}://${host}/api/settings/qr`

  bodyContents.push({
    type: 'box', layout: 'vertical', margin: 'xxl',
    contents: [
      { type: 'text', text: 'QR CODE', color: '#aaaaaa', size: 'xs' },
      { type: 'image', url: qrCodeUrl, size: 'xl', aspectMode: 'fit' },
      { type: 'text', text: 'Scan QR code เพื่อชำระเงิน', color: '#aaaaaa', size: 'xs', wrap: true, margin: 'md' }
    ]
  })

  const flex = {
    type: 'flex',
    altText: 'ใบแจ้งหนี้ค่าเช่า ห้อง ' + (roomNumber || ''),
    contents: {
      type: 'bubble',
      hero: {
        type: 'image',
        url: invoiceImageUrl,
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'fit',
        backgroundColor: '#FFFFFF'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        paddingAll: 'xl',
        contents: bodyContents
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        paddingAll: 'xl',
        paddingTop: 'none',
        contents: [
          { type: 'separator', color: '#e5e7eb' },
          { type: 'button', action: { type: 'uri', label: 'ดูใบแจ้งหนี้', uri: invoiceImageUrl }, style: 'link', height: 'sm' }
        ]
      }
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
      console.error('LINE API 400:', JSON.stringify(data))
      return res.status(response.status).json({ error: data.message || 'LINE API error', details: data })
    }
  } catch (error) {
    console.error('LINE send error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

export default router
