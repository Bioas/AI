import { Router } from 'express'
import { put } from '@vercel/blob'
import { launchBrowser } from '../lib/puppeteer.js'

const router = Router()

const THAI_MONTHS = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']

function formatIssueDate() {
  const now = new Date()
  const d = now.getDate()
  const m = THAI_MONTHS[now.getMonth() + 1]
  const y = now.getFullYear() + 543
  return `${d} ${m} ${y}`
}

function formatShortDate() {
  const now = new Date()
  const d = String(now.getDate()).padStart(2, '0')
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const y = now.getFullYear() + 543
  return `${d}/${m}/${y}`
}

function numberToBahtText(num) {
  if (num === 0) return 'ศูนย์บาทถ้วน'
  const digits = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
  const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน']
  function convert(n) {
    if (n === 0) return ''
    const s = n.toString()
    let result = ''
    const len = s.length
    for (let i = 0; i < len; i++) {
      const d = parseInt(s[i])
      const pos = len - i - 1
      const unit = units[pos % 6]
      if (d === 0) continue
      if (pos % 6 === 1 && d === 2) { result += 'ยี่' + unit }
      else if (pos % 6 === 1 && d === 1) { result += 'สิบ' }
      else if (pos % 6 === 0 && d === 1 && len > 1) { result += 'เอ็ด' }
      else { result += digits[d] + unit }
    }
    return result
  }
  const baht = Math.floor(num)
  const satang = Math.round((num - baht) * 100)
  let text = convert(baht) + 'บาท'
  if (satang === 0) text += 'ถ้วน'
  else text += convert(satang) + 'สตางค์'
  return text
}

function formatNumber(n) {
  try {
    return Number(n).toLocaleString('th-TH')
  } catch {
    return String(Number(n) || 0)
  }
}

function buildInvoiceHtml(data) {
  const { tenantName, roomNumber, billingMonth, items, total, dormName, dormAddress, dormPhone, logo, qrCode, signature, taxId, docNumber } = data
  const issueDate = formatIssueDate()
  const sigDate = formatShortDate()

  const itemRows = items.map((item, i) => `
    <tr${i < items.length - 1 ? ' style="border-bottom:1px solid #fef3c7;"' : ''}>
      <td style="padding:8px 12px 8px 0;color:#374151;">${item.desc}</td>
      <td style="padding:8px 12px 8px 0;font-size:12px;color:#9ca3af;">${item.detail}</td>
      <td style="padding:8px 0;text-align:right;font-weight:500;color:#374151;">${formatNumber(item.amount)}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=595">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family:'Noto Sans Thai','Sarabun',Tahoma,sans-serif;
    background:#ffffff;
    font-size:13px;
    color:#374151;
    line-height:1.7;
    -webkit-font-smoothing:antialiased;
  }
  #invoice {
    width:595px;
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
        <div style="font-size:10px;color:#525252;margin-top:2px;">${dormAddress || ''}</div>
        <div style="font-size:10px;color:#525252;">${dormPhone ? 'โทร ' + dormPhone : ''}</div>
        ${taxId ? `<div style="font-size:10px;color:#525252;">เลขประจำตัวผู้เสียภาษี ${taxId}</div>` : ''}
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:16px;font-weight:700;color:#b45309;">ใบแจ้งหนี้</div>
      ${docNumber ? `<div style="font-size:12px;color:#d97706;margin-top:2px;font-weight:500;">${docNumber}</div>` : ''}
      <div style="font-size:10px;color:#525252;margin-top:2px;">${issueDate}</div>
    </div>
  </div>

  <div style="margin-bottom:24px;padding:12px 16px;background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1px solid #fde68a;border-radius:8px;font-size:12px;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
      <div><span style="color:#d97706;">ผู้พัก</span><span style="font-weight:500;color:#1f2937;margin-left:8px;">${tenantName || ''}</span></div>
      <div style="text-align:right;"><span style="color:#d97706;">ห้อง</span><span style="font-weight:500;color:#1f2937;margin-left:8px;">${roomNumber || ''}</span></div>
      <div><span style="color:#d97706;">เดือน</span><span style="font-weight:500;color:#1f2937;margin-left:8px;">${billingMonth || ''}</span></div>
      <div style="text-align:right;"><span style="color:#d97706;">วันที่</span><span style="font-weight:500;color:#1f2937;margin-left:8px;">${issueDate}</span></div>
    </div>
  </div>

  <table style="width:100%;margin-bottom:24px;border-collapse:collapse;font-size:13px;">
    <thead>
      <tr style="border-bottom:2px solid rgba(180,146,41,0.3);">
        <th style="text-align:left;padding-bottom:8px;font-size:12px;font-weight:600;color:#b45309;text-transform:uppercase;letter-spacing:0.5px;">รายการ</th>
        <th style="text-align:left;padding-bottom:8px;font-size:12px;font-weight:600;color:#b45309;text-transform:uppercase;letter-spacing:0.5px;">รายละเอียด</th>
        <th style="text-align:right;padding-bottom:8px;font-size:12px;font-weight:600;color:#b45309;text-transform:uppercase;letter-spacing:0.5px;">จำนวนเงิน</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div style="display:flex;justify-content:flex-end;padding-bottom:8px;margin-bottom:24px;border-bottom:1px solid rgba(180,146,41,0.3);">
    <div style="display:flex;align-items:baseline;gap:24px;">
      <span style="font-size:14px;font-weight:700;color:#b45309;">รวมทั้งสิ้น</span>
      <span style="font-size:16px;font-weight:700;color:#b45309;">${formatNumber(total)} บาท</span>
    </div>
  </div>

  <div style="display:flex;gap:24px;">
    <div style="flex:1;">
      <div style="font-size:12px;color:#6b7280;">
        <div style="font-weight:600;color:#b45309;margin-bottom:2px;">ช่องทางการชำระเงิน</div>
        พร้อมเพย์ <strong style="font-weight:600;color:#374151;">0902439797</strong><br />
        นงลักษณ์ นิพรรัมย์ — ธนาคารกรุงไทย
      </div>
      <div style="font-size:12px;color:rgba(180,146,41,0.7);padding-top:8px;margin-top:8px;border-top:1px solid #fef3c7;">
        กำหนดชำระภายในวันที่ 5 ของทุกเดือน<br />
        หากชำระหลังกำหนด คิดค่าปรับวันละ 50 บาท
      </div>
      <div style="text-align:center;padding-top:12px;margin-top:12px;border-top:1px solid #fef3c7;">
        ${signature ? `<img src="${signature}" alt="ลายเซ็น" style="height:40px;width:112px;object-fit:contain;display:block;margin:0 auto 4px;" />` : '<div style="border-bottom:1px dashed #d1d5db;width:160px;margin:0 auto 8px;">&nbsp;</div>'}
        <div style="font-size:12px;color:#6b7280;">ลงชื่อผู้แจ้งหนี้</div>
        <div style="font-size:12px;color:#9ca3af;margin-top:2px;">วันที่ ${sigDate}</div>
      </div>
    </div>
    ${qrCode ? `
    <div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
      <div style="padding:8px;border:2px dashed rgba(180,146,41,0.4);border-radius:12px;">
        <img src="${qrCode}" alt="QR" style="width:128px;height:128px;object-fit:contain;">
      </div>
      <span style="font-size:12px;color:#f59e0b;margin-top:4px;">สแกนชำระเงิน</span>
    </div>` : ''}
  </div>

  <div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #fef3c7;">
    <p style="font-size:11px;color:#f59e0b;">${dormName || 'หอพัก'}${dormPhone ? ' • โทร ' + dormPhone : ''}</p>
  </div>

</div>
</body>
</html>`
}

function buildReceiptHtml(data) {
  const { tenantName, roomNumber, billingMonth, items, total, dormName, dormAddress, dormPhone, logo, qrCode, signature, stamp, taxId, docNumber } = data
  const issueDate = formatIssueDate()
  const receiptNo = docNumber ? docNumber.replace('INV-', 'REC-') : ''
  const bahtText = numberToBahtText(total)

  const itemRows = items.map((item, i) => `
    <tr${i < items.length - 1 ? ' style="border-bottom:1px solid #d1fae5;"' : ''}>
      <td style="padding:8px 12px 8px 0;color:#374151;">${item.desc}</td>
      <td style="padding:8px 12px 8px 0;font-size:12px;color:#9ca3af;">${item.detail}</td>
      <td style="padding:8px 0;text-align:right;font-weight:500;color:#374151;">${formatNumber(item.amount)}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=595">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family:'Noto Sans Thai','Sarabun',Tahoma,sans-serif;
    background:#ffffff;
    font-size:13px;
    color:#374151;
    line-height:1.7;
    -webkit-font-smoothing:antialiased;
  }
  #receipt {
    width:595px;
    margin:0 auto;
    padding:40px;
    background:#ffffff;
  }
</style>
</head>
<body>
<div id="receipt">

  <div style="height:6px;background:linear-gradient(90deg,#059669,#34d399);border-radius:999px;margin-bottom:24px;"></div>

  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;margin-bottom:24px;border-bottom:1px solid rgba(167,243,208,0.6);">
    <div style="display:flex;align-items:center;gap:12px;">
      ${logo ? `<img src="${logo}" alt="" style="height:64px;width:64px;object-fit:contain;flex-shrink:0;">` : ''}
      <div>
        <div style="font-size:16px;font-weight:700;color:#065f46;">${dormName || 'หอพัก'}</div>
        <div style="font-size:10px;color:#525252;margin-top:2px;">${dormAddress || ''}</div>
        <div style="font-size:10px;color:#525252;">${dormPhone ? 'โทร ' + dormPhone : ''}</div>
        ${taxId ? `<div style="font-size:10px;color:#525252;">เลขประจำตัวผู้เสียภาษี ${taxId}</div>` : ''}
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:16px;font-weight:700;color:#059669;">ใบเสร็จรับเงิน</div>
      ${receiptNo ? `<div style="font-size:12px;color:#059669;margin-top:2px;font-weight:500;">${receiptNo}</div>` : ''}
      <div style="font-size:10px;color:#525252;margin-top:2px;">${issueDate}</div>
    </div>
  </div>

  <div style="margin-bottom:24px;padding:12px 16px;background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:1px solid #a7f3d0;border-radius:8px;font-size:12px;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
      <div><span style="color:#059669;">ได้รับเงินจาก</span><span style="font-weight:500;color:#1f2937;margin-left:8px;">${tenantName || ''}</span></div>
      <div style="text-align:right;"><span style="color:#059669;">ห้อง</span><span style="font-weight:500;color:#1f2937;margin-left:8px;">${roomNumber || ''}</span></div>
      <div><span style="color:#059669;">เดือน</span><span style="font-weight:500;color:#1f2937;margin-left:8px;">${billingMonth || ''}</span></div>
      <div style="text-align:right;"><span style="color:#059669;">วันที่</span><span style="font-weight:500;color:#1f2937;margin-left:8px;">${issueDate}</span></div>
    </div>
  </div>

  <table style="width:100%;margin-bottom:24px;border-collapse:collapse;font-size:13px;">
    <thead>
      <tr style="border-bottom:2px solid rgba(5,150,105,0.3);">
        <th style="text-align:left;padding-bottom:8px;font-size:12px;font-weight:600;color:#059669;text-transform:uppercase;letter-spacing:0.5px;">รายการ</th>
        <th style="text-align:left;padding-bottom:8px;font-size:12px;font-weight:600;color:#059669;text-transform:uppercase;letter-spacing:0.5px;">รายละเอียด</th>
        <th style="text-align:right;padding-bottom:8px;font-size:12px;font-weight:600;color:#059669;text-transform:uppercase;letter-spacing:0.5px;">จำนวนเงิน</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div style="display:flex;justify-content:flex-end;padding-bottom:8px;margin-bottom:24px;border-bottom:1px solid rgba(5,150,105,0.3);">
    <div style="display:flex;align-items:baseline;gap:24px;">
      <span style="font-size:14px;font-weight:700;color:#059669;">รวมทั้งสิ้น</span>
      <span style="font-size:16px;font-weight:700;color:#059669;">${formatNumber(total)} บาท</span>
    </div>
  </div>

  <div style="margin-bottom:24px;padding:10px 16px;background:rgba(209,250,229,0.5);border:1px solid rgba(167,243,208,0.4);border-radius:8px;">
    <span style="font-size:12px;color:#059669;font-weight:500;">จำนวนเงินเป็นตัวอักษร: </span>
    <span style="font-size:12px;color:#374151;">${bahtText}</span>
  </div>

  <div style="display:flex;justify-content:space-between;padding-top:32px;margin-top:16px;">
    <div style="text-align:center;display:flex;flex-direction:column;justify-content:flex-end;min-height:80px;">
      <div style="border-bottom:1px dashed #d1d5db;width:160px;margin:0 auto 2px;">&nbsp;</div>
      <div style="font-size:12px;color:#6b7280;">ผู้ชำระเงิน</div>
      <div style="font-size:12px;color:#9ca3af;margin-top:2px;">วันที่ ${issueDate}</div>
    </div>
    <div style="text-align:center;display:flex;flex-direction:column;justify-content:flex-end;min-height:80px;">
      ${signature ? `
      <div style="position:relative;display:inline-block;">
        <img src="${signature}" alt="ลายเซ็น" style="height:40px;width:112px;object-fit:contain;display:block;" />
        ${stamp ? `<img src="${stamp}" alt="ตรายาง" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:130px;height:130px;object-fit:contain;opacity:0.7;" />` : ''}
      </div>` : stamp ? `
      <div><img src="${stamp}" alt="ตรายาง" style="width:130px;height:130px;object-fit:contain;display:block;margin:0 auto;" /></div>` : `
      <div style="border-bottom:1px dashed #d1d5db;width:160px;margin:0 auto 2px;">&nbsp;</div>`}
      <div style="font-size:12px;color:#6b7280;">ผู้รับเงิน</div>
      <div style="font-size:12px;color:#9ca3af;margin-top:2px;">วันที่ ${issueDate}</div>
    </div>
  </div>

  <div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #d1fae5;">
    <p style="font-size:11px;color:#10b981;">${dormName || 'หอพัก'}${dormPhone ? ' • โทร ' + dormPhone : ''}</p>
  </div>

</div>
</body>
</html>`
}

function getFilename(roomNumber, billingMonth, type) {
  const safe = billingMonth.replace(/[/\\?%*:|"<>]/g, '-')
  return `${type}s/${roomNumber}_${safe}.jpg`
}

router.post('/', async (req, res) => {
  try {
    const { to, token, items, total, tenantName, roomNumber, billingMonth, dormName, dormAddress, dormPhone, logo, qrCode, signature, stamp, taxId, docNumber, type } = req.body

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({ error: 'Vercel Blob token not configured. Set BLOB_READ_WRITE_TOKEN in environment.' })
    }
    if (!to || !token) {
      return res.status(400).json({ error: 'Missing required fields: to, token' })
    }
    if (!to.startsWith('U')) {
      return res.status(400).json({ error: 'Invalid LINE User ID. Must start with U' })
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' })
    }

    const isReceipt = type === 'receipt'
    const buildHtml = isReceipt ? buildReceiptHtml : buildInvoiceHtml
    const selector = isReceipt ? '#receipt' : '#invoice'

    const html = buildHtml({
      tenantName, roomNumber, billingMonth, items, total,
      dormName, dormAddress, dormPhone, logo, qrCode,
      signature, stamp, taxId, docNumber,
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
    let buffer
    try {
      page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })
      await page.waitForSelector(selector)

      const element = await page.$(selector)
      buffer = await element.screenshot({
        type: 'jpeg',
        quality: 90,
        omitBackground: false,
      })
    } finally {
      if (page) await page.close().catch(() => {})
      if (browser) await browser.close().catch(() => {})
    }

    if (!buffer) {
      return res.status(500).json({ error: 'Screenshot returned empty buffer' })
    }

    const filename = getFilename(roomNumber || 'unknown', billingMonth || 'unknown', type || 'invoice')
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
