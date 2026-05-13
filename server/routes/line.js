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
      body: JSON.stringify({ to, messages: [{ type: 'text', text }] }),
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

// ── Builder functions ──────────────────────────────────────────

function createHeroBlock(imageUrl) {
  return {
    type: 'image',
    url: imageUrl,
    size: 'full',
    aspectRatio: '20:13',
    aspectMode: 'cover',
    backgroundColor: '#FFFFFF'
  }
}

function createTitleBox() {
  return {
    type: 'text',
    text: 'ใบแจ้งหนี้ค่าเช่า',
    wrap: true,
    weight: 'bold',
    gravity: 'center',
    size: 'xl'
  }
}

function createDetailBlock(title, detail) {
  return {
    type: 'box',
    layout: 'baseline',
    spacing: 'sm',
    contents: [
      { type: 'text', text: title, color: '#aaaaaa', size: 'sm', flex: 1, wrap: true },
      { type: 'text', text: detail, wrap: true, color: '#666666', size: 'sm', flex: 4 }
    ]
  }
}

function createSeparator() {
  return { type: 'separator', color: '#e5e7eb', margin: 'xl' }
}

function createFeeRow(label, amount) {
  return createDetailBlock(label, amount + ' บาท')
}

function createDetailsBox(tenantName, roomNumber, billingMonth) {
  return {
    type: 'box',
    layout: 'vertical',
    margin: 'lg',
    spacing: 'sm',
    contents: [
      createDetailBlock('ผู้พัก', tenantName || ''),
      createDetailBlock('ห้อง', roomNumber || ''),
      createDetailBlock('เดือน', billingMonth || '')
    ]
  }
}

function createFeesBox(roomFee, electricBill, waterBill, totalAmount, dueDate) {
  return {
    type: 'box',
    layout: 'vertical',
    margin: 'lg',
    spacing: 'sm',
    contents: [
      createFeeRow('ค่าเช่าห้อง', roomFee || '0'),
      createFeeRow('ค่าไฟฟ้า', electricBill || '0'),
      createFeeRow('ค่าน้ำประปา', waterBill || '0'),
      createFeeRow('รวมทั้งสิ้น', totalAmount || ''),
      createDetailBlock('กำหนดชำระ', dueDate || '')
    ]
  }
}

function createQRCodeBox(qrUrl) {
  if (!qrUrl) return null

  return {
    type: 'box',
    layout: 'vertical',
    margin: 'xxl',
    contents: [
      { type: 'spacer' },
      { type: 'image', url: qrUrl, aspectMode: 'cover', size: 'xl' },
      { type: 'text', text: 'Scan QR code เพื่อชำระเงิน', color: '#aaaaaa', wrap: true, margin: 'xxl', size: 'xs' }
    ]
  }
}

function createBodyBlock({ tenantName, roomNumber, billingMonth, roomFee, electricBill, waterBill, totalAmount, dueDate, qrUrl }) {
  const contents = [
    createTitleBox(),
    createDetailsBox(tenantName, roomNumber, billingMonth),
    createSeparator(),
    createFeesBox(roomFee, electricBill, waterBill, totalAmount, dueDate)
  ]

  const qrBox = createQRCodeBox(qrUrl)
  if (qrBox) contents.push(qrBox)

  return {
    type: 'box',
    layout: 'vertical',
    spacing: 'md',
    paddingAll: 'xl',
    contents
  }
}

function createFooterBlock(invoiceImageUrl) {
  return {
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

// ── Send image endpoint ────────────────────────────────────────

router.post('/send-image', async (req, res) => {
  const { to, token, invoiceImageUrl, tenantName, roomNumber, billingMonth, totalAmount, dueDate, roomFee, waterBill, electricBill } = req.body

  if (!to || !token || !invoiceImageUrl) {
    return res.status(400).json({ error: 'Missing required fields: to, token, invoiceImageUrl' })
  }

  if (!to.startsWith('U')) {
    return res.status(400).json({ error: 'Invalid LINE User ID. Must start with U' })
  }

  const host = process.env.VERCEL_URL || req.get('host')
  const protocol = host?.includes('localhost') ? 'http' : 'https'
  const qrUrl = `${protocol}://${host}/api/upload/qr.png`

  const bubble = {
    type: 'bubble',
    hero: createHeroBlock(invoiceImageUrl),
    body: createBodyBlock({ tenantName, roomNumber, billingMonth, roomFee, electricBill, waterBill, totalAmount, dueDate, qrUrl }),
    footer: createFooterBlock(invoiceImageUrl)
  }

  const flex = {
    type: 'flex',
    altText: 'ใบแจ้งหนี้ค่าเช่า ห้อง ' + (roomNumber || ''),
    contents: bubble
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
