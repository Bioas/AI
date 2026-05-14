import { Router } from 'express'
import { launchBrowser } from '../lib/puppeteer.js'

const router = Router()

const THAI_MONTHS = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']

const THAI_SHORT = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function fmt(n) {
  try { return Number(n).toLocaleString('th-TH') } catch { return String(Number(n) || 0) }
}

function formatThaiDate(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${d} ${THAI_MONTHS[m]} ${y + 543}`
}

function formatMonth(ym) {
  const [y, m] = ym.split('-')
  return `${THAI_MONTHS[parseInt(m)]} ${parseInt(y) + 543}`
}

function formatIssueDate() {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const m = THAI_MONTHS[now.getMonth() + 1]
  const y = now.getFullYear() + 543
  return `${lastDay} ${m} ${y}`
}

const PDF_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }

@page { size: A4; margin: 15mm 10mm 15mm 10mm; }

body {
  font-family: 'Noto Sans Thai', 'Sarabun', Tahoma, sans-serif;
  background: #ffffff;
  font-size: 13px;
  color: #374151;
  line-height: 1.7;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page-break { page-break-before: always; }
  .no-print { display: none !important; }
  table { page-break-inside: auto; }
  tr { page-break-inside: avoid; page-break-after: auto; }
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
}

.accent-bar {
  height: 6px;
  background: linear-gradient(90deg, #d97706, #f59e0b);
  border-radius: 999px;
  margin-bottom: 24px;
}

.accent-bar-green {
  height: 6px;
  background: linear-gradient(90deg, #059669, #34d399);
  border-radius: 999px;
  margin-bottom: 24px;
}

.section { margin-bottom: 24px; }
.flex { display: flex; }
.justify-between { justify-content: space-between; }
.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.gap-3 { gap: 12px; }
.gap-6 { gap: 24px; }
.shrink-0 { flex-shrink: 0; }
.flex-1 { flex: 1; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }

.w-full { width: 100%; }
.border-b { border-bottom: 1px solid; }
.border-t { border-top: 1px solid; }
.pb-16 { padding-bottom: 16px; }
.mb-24 { margin-bottom: 24px; }
.mt-24 { margin-top: 24px; }
.pt-16 { padding-top: 16px; }
.px-16 { padding-left: 16px; padding-right: 16px; }
.py-12 { padding-top: 12px; padding-bottom: 12px; }

.rounded-lg { border-radius: 8px; }
.rounded-full { border-radius: 999px; }

.logo { height: 60px; width: 60px; object-fit: contain; }

table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
th { text-align: left; padding-bottom: 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
td { padding: 8px 0; }
`

/* ---- Invoice Template ---- */
function buildInvoiceHtml(data) {
  const {
    room, tenant, month, rent, elecUnits, elecCost, waterUnits, waterCost,
    total, rateElec, rateWater, prevElec, curElec, prevWater, curWater,
    dormName, address, phone, logo, qrCode, commonFee, internetFee,
  } = data

  const issueDate = formatIssueDate()
  const monthLabel = formatMonth(month)
  const cf = Number(commonFee) || 0
  const inf = Number(internetFee) || 0

  const items = [
    { desc: 'ค่าเช่าห้อง', detail: `ห้อง ${room}`, amount: Number(rent) },
    { desc: 'ค่าไฟฟ้า', detail: `${fmt(elecUnits)} หน่วย × ${fmt(rateElec)} บาท`, amount: Number(elecCost) },
    { desc: 'ค่าน้ำประปา', detail: Number(waterUnits) <= 4 && Number(waterUnits) > 0 ? 'เหมาจ่าย' : `${fmt(waterUnits)} หน่วย × ${fmt(rateWater)} บาท`, amount: Number(waterCost) },
    ...(cf > 0 ? [{ desc: 'ค่าส่วนกลาง', detail: '', amount: cf }] : []),
    ...(inf > 0 ? [{ desc: 'ค่าอินเทอร์เน็ต', detail: '', amount: inf }] : []),
  ]

  const grandTotal = items.reduce((s, i) => s + i.amount, 0)

  const itemRows = items.map((item, i) => `
    <tr${i < items.length - 1 ? ' style="border-bottom:1px solid #fef3c7;"' : ''}>
      <td style="padding:10px 12px 10px 0;color:#374151;">${item.desc}</td>
      <td style="padding:10px 12px 10px 0;font-size:12px;color:#9ca3af;">${item.detail}</td>
      <td style="padding:10px 0;text-align:right;font-weight:500;color:#374151;">${fmt(item.amount)}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="th">
<head><meta charset="utf-8"><style>${PDF_STYLES}
.invoice { padding: 5mm 0; }
.header-title { font-size: 16px; font-weight: 700; color: #92400e; }
.header-sub { font-size: 10px; color: #9ca3af; margin-top: 1px; }
.doc-title { font-size: 16px; font-weight: 700; color: #b45309; }
.doc-date { font-size: 10px; color: #9ca3af; margin-top: 1px; }
.info-box {
  padding: 12px 16px;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  border: 1px solid #fde68a;
  border-radius: 8px;
  margin-bottom: 24px;
}
.info-label { color: #d97706; }
.info-value { font-weight: 500; color: #1f2937; margin-left: 8px; }
table.invoice-table th {
  color: #b45309;
  border-bottom: 2px solid rgba(180,130,41,0.3);
  padding-bottom: 8px;
}
.total-section {
  display: flex; justify-content: flex-end;
  padding-bottom: 16px; margin-bottom: 24px;
  border-bottom: 1px solid rgba(180,130,41,0.3);
}
.total-label { font-size: 14px; font-weight: 700; color: #b45309; }
.total-amount { font-size: 16px; font-weight: 700; color: #b45309; margin-left: 16px; }
.payment-info { font-size: 12px; color: #6b7280; line-height: 1.8; }
.payment-title { font-weight: 600; color: #b45309; margin-bottom: 2px; }
.terms { font-size: 12px; color: rgba(180,130,41,0.7); padding-top: 8px; margin-top: 8px; border-top: 1px solid #fef3c7; }
.qr-box {
  border: 2px dashed rgba(180,130,41,0.4);
  border-radius: 12px;
  padding: 8px;
}
.qr-img { width: 110px; height: 110px; object-fit: contain; }
.qr-label { font-size: 10px; color: #f59e0b; margin-top: 4px; text-align: center; }
.footer { text-align: center; margin-top: 20px; padding-top: 12px; border-top: 1px solid #fef3c7; font-size: 11px; color: #f59e0b; }
</style></head>
<body>
<div class="invoice">
  <div class="accent-bar"></div>

  <div class="flex justify-between items-start" style="padding-bottom:16px;margin-bottom:24px;border-bottom:1px solid rgba(253,230,138,0.6);">
    <div class="flex items-center gap-3">
      ${logo ? `<img src="${logo}" alt="" class="logo" />` : ''}
      <div>
        <div class="header-title">${dormName || 'หอพัก'}</div>
        <div class="header-sub">${address || ''}</div>
        <div class="header-sub">${phone ? 'โทร ' + phone : ''}</div>
      </div>
    </div>
    <div style="text-align:right;padding-top:2px;">
      <div class="doc-title">ใบแจ้งหนี้</div>
      <div class="doc-date">${issueDate}</div>
    </div>
  </div>

  <div class="info-box">
    <div class="grid-2">
      <div><span class="info-label">ผู้พัก</span><span class="info-value">${tenant || ''}</span></div>
      <div style="text-align:right;"><span class="info-label">ห้อง</span><span class="info-value">${room || ''}</span></div>
      <div><span class="info-label">เดือน</span><span class="info-value">${monthLabel}</span></div>
      <div style="text-align:right;"><span class="info-label">วันที่</span><span class="info-value">${issueDate}</span></div>
    </div>
  </div>

  <table class="invoice-table">
    <thead>
      <tr>
        <th style="width:35%;">รายการ</th>
        <th style="width:40%;">รายละเอียด</th>
        <th style="width:25%;text-align:right;">จำนวนเงิน</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="total-section">
    <span class="total-label">รวมทั้งสิ้น</span>
    <span class="total-amount">${fmt(grandTotal)} บาท</span>
  </div>

  <div class="flex" style="gap:48px;">
    <div class="flex-1">
      <div class="payment-info">
        <div class="payment-title">ช่องทางการชำระเงิน</div>
        พร้อมเพย์ <strong style="font-weight:600;color:#374151;">0902439797</strong><br />
        นงลักษณ์ นิพรรัมย์ — ธนาคารกรุงไทย
      </div>
      <div class="terms">
        กำหนดชำระภายในวันที่ 5 ของทุกเดือน<br />
        หากชำระหลังกำหนด คิดค่าปรับวันละ 50 บาท
      </div>
    </div>
    ${qrCode ? `
    <div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
      <div class="qr-box"><img src="${qrCode}" alt="QR" class="qr-img" /></div>
      <div class="qr-label">สแกนชำระเงิน</div>
    </div>` : ''}
  </div>

  <div class="footer">
    ${dormName || 'หอพัก'}${phone ? ' • โทร ' + phone : ''}
  </div>
</div>
</body></html>`
}

/* ---- Contract Template ---- */
function buildContractHtml(data) {
  const {
    residentName, residentId, idCard, phone, roomId, moveInDate, moveOutDate,
    deposit, emergencyContact, emergencyPhone,
    roomNumber, rentPrice, roomType,
    dormName, address, dormPhone, logo, rateElec, rateWater,
  } = data

  const now = new Date()
  const y = now.getFullYear() + 543
  const m = now.getMonth() + 1
  const d2 = now.getDate()

  const contractId = residentId ? `CT-${residentId.slice(-6).toUpperCase()}` : 'CT-—'

  return `<!DOCTYPE html>
<html lang="th">
<head><meta charset="utf-8"><style>${PDF_STYLES}
.contract { padding: 5mm 0; }
.header-title { font-size: 16px; font-weight: 700; color: #065f46; }
.header-sub { font-size: 10px; color: #9ca3af; margin-top: 1px; }
.doc-title { font-size: 18px; font-weight: 700; color: #065f46; }
.doc-sub { font-size: 11px; color: #9ca3af; margin-top: 2px; }
.contract-no { font-size: 10px; color: #9ca3af; }
.contract-no-value { font-size: 13px; font-weight: 600; color: #047857; font-family: 'Courier New', monospace; }
.info-box {
  padding: 12px 16px;
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  margin-bottom: 24px;
}
.info-label { color: #059669; }
.info-value { font-weight: 500; color: #1f2937; margin-left: 8px; }
table.contract-table th {
  color: #047857;
  border-bottom: 2px solid rgba(5,150,105,0.3);
  padding-bottom: 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: left;
}
table.contract-table td {
  padding: 8px 0;
  border-bottom: 1px solid #ecfdf5;
  color: #374151;
}
table.contract-table td:first-child {
  color: #059669;
  width: 140px;
  padding-right: 16px;
  white-space: nowrap;
}
.terms-title {
  font-size: 11px;
  font-weight: 600;
  color: #047857;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  border-bottom: 1px solid #d1fae5;
  padding-bottom: 4px;
}
.terms-list { font-size: 12px; color: #525252; line-height: 2.0; padding-left: 20px; }
.terms-list li { margin-bottom: 4px; }
.emergency-box {
  padding: 10px 16px;
  background: rgba(251,191,36,0.08);
  border: 1px solid rgba(251,191,36,0.3);
  border-radius: 8px;
  margin-bottom: 24px;
}
.emergency-title { font-size: 11px; font-weight: 600; color: #b45309; margin-bottom: 4px; }
.emergency-text { font-size: 12px; color: #525252; }
.signature-area {
  display: flex;
  justify-content: space-around;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #d1fae5;
}
.signature-block { text-align: center; }
.signature-line { font-size: 12px; color: #a3a3a3; margin-bottom: 32px; }
.signature-name { font-size: 12px; color: #a3a3a3; }
.signature-date { font-size: 11px; color: #d4d4d4; margin-top: 2px; }
.footer { text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #d1fae5; font-size: 11px; color: #10b981; }
.page-break { page-break-before: always; }
</style></head>
<body>
<div class="contract">
  <div class="accent-bar-green"></div>

  <div class="text-center" style="margin-bottom:24px;">
    <div class="doc-title">สัญญาเช่าหอพัก</div>
    <div class="doc-sub">CONTRACT AGREEMENT</div>
  </div>

  <div class="flex justify-between items-start" style="padding-bottom:16px;margin-bottom:24px;border-bottom:1px solid rgba(5,150,105,0.3);">
    <div class="flex items-center gap-3">
      ${logo ? `<img src="${logo}" alt="" class="logo" />` : ''}
      <div>
        <div class="header-title">${dormName || 'หอพัก'}</div>
        <div class="header-sub">${address || ''}</div>
        <div class="header-sub">${dormPhone ? 'โทร ' + dormPhone : ''}</div>
      </div>
    </div>
    <div style="text-align:right;padding-top:2px;">
      <div class="contract-no">เลขที่สัญญา</div>
      <div class="contract-no-value">${contractId}</div>
      <div class="contract-no" style="margin-top:2px;">วันที่ ${d2} ${m} ${y}</div>
    </div>
  </div>

  <div class="info-box">
    <div class="grid-2">
      <div><span class="info-label">ผู้เช่า</span><span class="info-value">${residentName || ''}</span></div>
      <div style="text-align:right;"><span class="info-label">ห้อง</span><span class="info-value">${roomNumber || '—'}</span></div>
      <div><span class="info-label">เลขบัตรฯ</span><span class="info-value">${idCard || '—'}</span></div>
      <div style="text-align:right;"><span class="info-label">เบอร์โทร</span><span class="info-value">${phone || ''}</span></div>
      <div><span class="info-label">วันที่เข้าพัก</span><span class="info-value">${formatThaiDate(moveInDate)}</span></div>
      <div style="text-align:right;"><span class="info-label">วันหมดสัญญา</span><span class="info-value">${formatThaiDate(moveOutDate)}</span></div>
    </div>
  </div>

  <table class="contract-table" style="margin-bottom:24px;">
    <thead>
      <tr><th colspan="2">รายละเอียดสัญญา</th></tr>
    </thead>
    <tbody>
      <tr><td>อัตราค่าเช่า</td><td style="font-weight:500;color:#1f2937;">${fmt(rentPrice || 0)} บาท/เดือน</td></tr>
      <tr><td>ค่ามัดจำ</td><td style="font-weight:500;color:#1f2937;">${fmt(deposit || 0)} บาท</td></tr>
      <tr><td>ค่าไฟฟ้า</td><td>หน่วยละ ${fmt(rateElec || 7)} บาท</td></tr>
      <tr><td>ค่าน้ำประปา</td><td>หน่วยละ ${fmt(rateWater || 20)} บาท (เหมาจ่าย 150 บาท สำหรับ 0-4 หน่วยแรก)</td></tr>
      <tr><td>ประเภทห้อง</td><td>${roomType || '—'}</td></tr>
    </tbody>
  </table>

  <div style="margin-bottom:24px;">
    <div class="terms-title">ข้อกำหนดและเงื่อนไข</div>
    <ol class="terms-list">
      <li>ผู้เช่าต้องชำระค่าเช่าตรงตามกำหนด ทุกวันที่ 5 ของเดือน หากชำระเกินกำหนดจะถูกปรับวันละ 50 บาท</li>
      <li>ผู้เช่าต้องชำระค่าสาธารณูปโภค (ค่าไฟฟ้า ค่าน้ำประปา) ตามจำนวนที่ใช้งานจริงในแต่ละเดือน</li>
      <li>ค่ามัดจำจะคืนให้แก่ผู้เช่าเมื่อสิ้นสุดสัญญา ในสภาพที่ห้องไม่มีความเสียหาย เว้นแต่ความสึกหรอตามปกติ และผู้เช่าได้ชำระค่าใช้จ่ายต่างๆ ครบถ้วนแล้ว</li>
      <li>หากผู้เช่าต้องการบอกเลิกสัญญาก่อนกำหนด ต้องแจ้งเป็นลายลักษณ์อักษรล่วงหน้าอย่างน้อย 30 วัน มิฉะนั้นจะไม่ได้รับเงินมัดจำคืน</li>
      <li>ห้ามนำสัตว์เลี้ยงทุกชนิดเข้ามาในห้องพัก</li>
      <li>ห้ามส่งเสียงดังหรือกระทำการใดๆ ที่รบกวนผู้เช่าห้องอื่น ระหว่างเวลา 22:00 - 07:00 น.</li>
      <li>ผู้เช่าต้องรักษาความสะอาดภายในห้องพักและบริเวณส่วนกลาง</li>
      <li>ผู้เช่าต้องรับผิดชอบต่อความเสียหายใดๆ ที่เกิดขึ้นแก่ทรัพย์สินของหอพักอันเกิดจากการกระทำของผู้เช่า</li>
      <li>ห้ามนำสารเสพติด อาวุธปืน หรือสิ่งผิดกฎหมายเข้ามาในบริเวณหอพัก</li>
      <li>หากพบว่าผู้เช่ากระทำผิดเงื่อนไขข้อใดข้อหนึ่ง ให้ผู้ให้เช่ามีสิทธิบอกเลิกสัญญาได้ทันที โดยไม่ต้องคืนเงินมัดจำ</li>
    </ol>
  </div>

  ${emergencyContact ? `
  <div class="emergency-box">
    <div class="emergency-title">ผู้ติดต่อฉุกเฉิน</div>
    <div class="emergency-text">${emergencyContact}${emergencyPhone ? ' — ' + emergencyPhone : ''}</div>
  </div>` : ''}

  <div class="signature-area">
    <div class="signature-block">
      <div class="signature-line">ลงชื่อ .............................................. ผู้ให้เช่า</div>
      <div class="signature-name">(${dormName || 'ผู้จัดการหอพัก'})</div>
      <div class="signature-date">วันที่ ......../......../........</div>
    </div>
    <div class="signature-block">
      <div class="signature-line">ลงชื่อ .............................................. ผู้เช่า</div>
      <div class="signature-name">(${residentName || ''})</div>
      <div class="signature-date">วันที่ ......../......../........</div>
    </div>
  </div>

  <div class="footer">
    ${dormName || 'หอพัก'}${dormPhone ? ' • โทร ' + dormPhone : ''}
  </div>
</div>
</body></html>`
}

router.post('/', async (req, res) => {
  try {
    const { type, data } = req.body
    if (!type || !data) {
      return res.status(400).json({ error: 'Missing required fields: type, data' })
    }

    const html = type === 'contract' ? buildContractHtml(data) : buildInvoiceHtml(data)
    const filename = data.filename || `document_${Date.now()}.pdf`

    let browser
    try {
      browser = await launchBrowser()
    } catch (err) {
      console.error('Browser launch failed:', err.message)
      return res.status(500).json({
        error: 'PDF generation unavailable',
        detail: process.env.VERCEL ? 'Chromium launch failed' : 'Install puppeteer for local dev: npm install puppeteer in server/',
      })
    }

    let page
    let pdfBuffer
    try {
      page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })

      pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '15mm', bottom: '15mm', left: '10mm', right: '10mm' },
      })
    } finally {
      if (page) await page.close().catch(() => {})
      if (browser) await browser.close().catch(() => {})
    }

    if (!pdfBuffer || pdfBuffer.length === 0) {
      return res.status(500).json({ error: 'PDF generation returned empty buffer' })
    }

    const safeFilename = filename.replace(/[^\x20-\x7E]/g, '_')
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Content-Length': pdfBuffer.length,
    })
    res.send(pdfBuffer)
  } catch (err) {
    console.error('export-pdf error:', err)
    res.status(500).json({ error: err.message || 'Internal server error' })
  }
})

export default router
