import { Router } from 'express'
import { put } from '@vercel/blob'

const router = Router()

const THAI_MONTHS = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']

function formatIssueDate() {
  const now = new Date()
  const m = THAI_MONTHS[now.getMonth() + 1]
  const y = now.getFullYear() + 543
  return `30 ${m} ${y}`
}

function formatNumber(n) {
  return Number(n).toLocaleString('th-TH')
}

function buildInvoiceHtml(data) {
  const { tenantName, roomNumber, billingMonth, items, total, dormName, dormAddress, dormPhone, logo, qrCode } = data
  const issueDate = formatIssueDate()

  const itemRows = items.map((item, i) => `
    <tr key="${i}" style="border-bottom:1px solid #fef3c7;">
      <td style="padding:6px 8px 6px 0;font-size:11px;color:#374151;">${item.desc}</td>
      <td style="padding:6px 8px 6px 0;font-size:10px;color:#9ca3af;">${item.detail}</td>
      <td style="padding:6px 0;text-align:right;font-size:11px;font-weight:500;color:#374151;">${formatNumber(item.amount)}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=720">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family:'Noto Sans Thai','Sarabun',Tahoma,sans-serif;
    background:#ffffff;
    font-size:11px;
    color:#374151;
    line-height:1.625;
    -webkit-font-smoothing:antialiased;
  }
  #invoice {
    width:680px;
    margin:0 auto;
    padding:40px;
    background:#ffffff;
  }
</style>
</head>
<body>
<div id="invoice">

  <div style="height:6px;background:linear-gradient(90deg,#b45309,#f59e0b);border-radius:999px;margin-bottom:24px;"></div>

  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;margin-bottom:24px;border-bottom:1px solid rgba(253,230,138,0.6);">
    <div style="display:flex;align-items:center;gap:12px;">
      ${logo ? `<img src="${logo}" alt="" style="height:64px;width:64px;object-fit:contain;flex-shrink:0;">` : ''}
      <div>
        <div style="font-size:16px;font-weight:700;color:#92400e;">${dormName || 'หอพัก'}</div>
        <div style="font-size:10px;color:#9ca3af;margin-top:2px;">${dormAddress || ''}</div>
        <div style="font-size:10px;color:#9ca3af;">${dormPhone ? 'โทร ' + dormPhone : ''}</div>
      </div>
    </div>
    <div style="text-align:right;padding-top:4px;">
      <div style="font-size:16px;font-weight:700;color:#b45309;">ใบแจ้งหนี้</div>
      <div style="font-size:10px;color:#9ca3af;margin-top:2px;">${issueDate}</div>
    </div>
  </div>

  <div style="margin-bottom:24px;padding:12px 16px;background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1px solid #fde68a;border-radius:8px;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">
      <div><span style="color:#d97706;">ผู้พัก</span><span style="font-weight:500;color:#1f2937;margin-left:8px;">${tenantName || ''}</span></div>
      <div style="text-align:right;"><span style="color:#d97706;">ห้อง</span><span style="font-weight:500;color:#1f2937;margin-left:8px;">${roomNumber || ''}</span></div>
      <div><span style="color:#d97706;">เดือน</span><span style="font-weight:500;color:#1f2937;margin-left:8px;">${billingMonth || ''}</span></div>
      <div style="text-align:right;"><span style="color:#d97706;">วันที่</span><span style="font-weight:500;color:#1f2937;margin-left:8px;">${issueDate}</span></div>
    </div>
  </div>

  <table style="width:100%;margin-bottom:24px;border-collapse:collapse;">
    <thead>
      <tr style="border-bottom:2px solid rgba(180,146,41,0.3);">
        <th style="text-align:left;padding-bottom:8px;font-size:10px;font-weight:600;color:#b45309;text-transform:uppercase;letter-spacing:1px;">รายการ</th>
        <th style="text-align:left;padding-bottom:8px;font-size:10px;font-weight:600;color:#b45309;text-transform:uppercase;letter-spacing:1px;">รายละเอียด</th>
        <th style="text-align:right;padding-bottom:8px;font-size:10px;font-weight:600;color:#b45309;text-transform:uppercase;letter-spacing:1px;">จำนวนเงิน</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div style="display:flex;justify-content:flex-end;padding-bottom:24px;margin-bottom:24px;border-bottom:1px solid rgba(180,146,41,0.3);">
    <div style="display:flex;align-items:baseline;gap:24px;">
      <span style="font-size:14px;font-weight:700;color:#b45309;">รวมทั้งสิ้น</span>
      <span style="font-size:16px;font-weight:700;color:#b45309;">${formatNumber(total)} บาท</span>
    </div>
  </div>

  <div style="display:flex;gap:24px;">
    <div style="flex:1;">
      <div style="font-size:10px;color:#6b7280;line-height:1.4;">
        <div style="font-weight:600;color:#b45309;margin-bottom:2px;">ช่องทางการชำระเงิน</div>
        พร้อมเพย์ <strong style="font-weight:600;color:#374151;">0902439797</strong><br>
        นงลักษณ์ นิพรรัมย์ — ธนาคารกรุงไทย
      </div>
      <div style="font-size:10px;color:rgba(180,146,41,0.7);line-height:1.4;padding-top:8px;margin-top:8px;border-top:1px solid #fef3c7;">
        กำหนดชำระภายในวันที่ 5 ของทุกเดือน<br>
        หากชำระหลังกำหนด คิดค่าปรับวันละ 50 บาท
      </div>
    </div>
    ${qrCode ? `
    <div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
      <div style="padding:8px;border:2px dashed rgba(180,146,41,0.4);border-radius:12px;">
        <img src="${qrCode}" alt="QR" style="width:80px;height:80px;object-fit:contain;">
      </div>
      <span style="font-size:8px;color:#f59e0b;margin-top:4px;">สแกนชำระเงิน</span>
    </div>` : ''}
  </div>

  <div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #fef3c7;">
    <p style="font-size:9px;color:#f59e0b;">${dormName || 'หอพัก'}${dormPhone ? ' • โทร ' + dormPhone : ''}</p>
  </div>

</div>
</body>
</html>`
}

function getFilename(roomNumber, billingMonth) {
  const safe = billingMonth.replace(/[/\\?%*:|"<>]/g, '-')
  return `invoices/${roomNumber}_${safe}.jpg`
}

async function launchBrowser() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = (await import('@sparticuz/chromium')).default
    const { launch } = await import('puppeteer-core')
    return launch({
      args: chromium.args,
      defaultViewport: { width: 720, height: 900 },
      executablePath: await chromium.executablePath(),
      headless: true,
    })
  }
  const { launch } = await import('puppeteer')
  return launch({
    defaultViewport: { width: 720, height: 900 },
    headless: true,
  })
}

router.post('/', async (req, res) => {
  try {
    const { to, token, items, total, tenantName, roomNumber, billingMonth, dormName, dormAddress, dormPhone, logo, qrCode } = req.body

    if (!to || !token) {
      return res.status(400).json({ error: 'Missing required fields: to, token' })
    }
    if (!to.startsWith('U')) {
      return res.status(400).json({ error: 'Invalid LINE User ID. Must start with U' })
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' })
    }

    const html = buildInvoiceHtml({
      tenantName, roomNumber, billingMonth, items, total,
      dormName, dormAddress, dormPhone, logo, qrCode,
    })

    let browser
    try {
      browser = await launchBrowser()
    } catch (err) {
      console.error('Browser launch failed:', err.message)
      return res.status(500).json({
        error: 'Server rendering unavailable',
        detail: process.env.VERCEL ? 'Chromium launch failed' : 'Install puppeteer for local dev: npm install puppeteer'
      })
    }

    let page
    try {
      page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })
      await page.waitForSelector('#invoice')

      const element = await page.$('#invoice')
      const buffer = await element.screenshot({
        type: 'jpeg',
        quality: 82,
        omitBackground: false,
      })
    } finally {
      if (page) await page.close().catch(() => {})
      if (browser) await browser.close().catch(() => {})
    }

    const filename = getFilename(roomNumber || 'unknown', billingMonth || 'unknown')
    let blob
    try {
      blob = await put(filename, buffer, {
        access: 'public',
        contentType: 'image/jpeg',
        addRandomSuffix: true,
      })
    } catch (err) {
      console.error('Blob upload failed:', err.message)
      return res.status(500).json({ error: 'Image upload failed: ' + err.message })
    }

    const imageUrl = blob.url

    try {
      const lineRes = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          to,
          messages: [{
            type: 'image',
            originalContentUrl: imageUrl,
            previewImageUrl: imageUrl,
          }],
        }),
      })

      const lineData = await lineRes.json()

      if (!lineRes.ok) {
        console.error('LINE API error:', JSON.stringify(lineData))
        return res.status(lineRes.status).json({ error: lineData.message || 'LINE API error', details: lineData })
      }
    } catch (err) {
      console.error('LINE send failed:', err.message)
      return res.status(500).json({ error: 'LINE send failed: ' + err.message })
    }

    res.json({ success: true, url: imageUrl })
  } catch (err) {
    console.error('send-invoice error:', err)
    res.status(500).json({ error: err.message || 'Internal server error' })
  }
})

export default router
