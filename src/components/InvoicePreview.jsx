import { useApp } from '../context/AppContext'
import { formatMonth } from '../lib/constants'

export default function InvoicePreview({ inv, qrImage }) {
  const { settings } = useApp()
  const cf = settings.commonFee || 0
  const inf = settings.internetFee || 0
  const promptpay = settings.promptpayNumber || '090-243-9797'
  const items = [
    ...(inv.rent > 0 ? [{ desc: 'ค่าเช่าห้อง', amount: inv.rent }] : []),
    ...(inv.elecCost > 0 ? [{ desc: 'ค่าไฟฟ้า', amount: inv.elecCost, unit: `${inv.elecUnits} หน่วย` }] : []),
    ...(inv.waterCost > 0 ? [{ desc: 'ค่าน้ำประปา', amount: inv.waterCost, unit: `${inv.waterUnits} หน่วย` }] : []),
    ...(cf > 0 ? [{ desc: 'ค่าส่วนกลาง', amount: cf }] : []),
    ...(inf > 0 ? [{ desc: 'ค่าอินเทอร์เน็ต', amount: inf }] : []),
  ]
  const total = items.reduce((s, i) => s + i.amount, 0)

  const now = new Date()
  const dueD = new Date(now.getFullYear(), now.getMonth(), 5)
  if (dueD < now) dueD.setMonth(dueD.getMonth() + 1)
  const dueStr = dueD.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div id="invoicePdfContent" style={{
      width: 720,
      padding: 0,
      fontFamily: "'Sarabun', 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: '#f5f7fa',
    }}>
      {/* Outer card container */}
      <div style={{
        width: 640,
        margin: '40px auto',
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
        background: '#ffffff',
      }}>
        {/* ── Gradient Header ── */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '32px 36px 28px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'absolute', bottom: -20, left: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, letterSpacing: 1, marginBottom: 4 }}>INVOICE</div>
                <div style={{ color: '#ffffff', fontSize: 24, fontWeight: 700, lineHeight: 1.2 }}>ใบแจ้งหนี้</div>
              </div>
              {settings.logo && (
                <img src={settings.logo} alt="" style={{ height: 40, width: 40, borderRadius: 12, objectFit: 'contain', background: 'rgba(255,255,255,0.2)', padding: 4 }} />
              )}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 16, lineHeight: 1.6 }}>
              {settings.dormName || 'หอพัก'} • {settings.phone}
            </div>
          </div>
        </div>

        {/* ── Customer Info ── */}
        <div style={{ padding: '24px 36px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ color: '#9ca3af', fontSize: 11, marginBottom: 2 }}>ผู้เช่า</div>
              <div style={{ color: '#1f2937', fontSize: 15, fontWeight: 600 }}>{inv.tenant}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#9ca3af', fontSize: 11, marginBottom: 2 }}>ห้อง</div>
              <div style={{ color: '#1f2937', fontSize: 15, fontWeight: 600 }}>{inv.room}</div>
            </div>
            <div>
              <div style={{ color: '#9ca3af', fontSize: 11, marginBottom: 2 }}>เดือน</div>
              <div style={{ color: '#1f2937', fontSize: 15, fontWeight: 600 }}>{formatMonth(inv.month)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#9ca3af', fontSize: 11, marginBottom: 2 }}>กำหนดชำระ</div>
              <div style={{ color: '#ef4444', fontSize: 15, fontWeight: 600 }}>{dueStr}</div>
            </div>
          </div>
        </div>

        {/* ── Fee Items ── */}
        <div style={{ padding: '20px 36px 12px' }}>
          {items.map((item, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0',
              borderBottom: i < items.length - 1 ? '1px solid #f5f5f5' : 'none',
            }}>
              <div>
                <div style={{ color: '#374151', fontSize: 14, fontWeight: 500 }}>{item.desc}</div>
                {item.unit && <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 1 }}>{item.unit}</div>}
              </div>
              <div style={{ color: '#1f2937', fontSize: 14, fontWeight: 600 }}>
                {item.amount.toLocaleString()} <span style={{ fontSize: 11, color: '#9ca3af' }}>฿</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Total ── */}
        <div style={{
          margin: '16px 36px',
          padding: '16px 20px',
          borderRadius: 16,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500 }}>รวมทั้งสิ้น</div>
          <div style={{ color: '#ffffff', fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>
            {total.toLocaleString()} <span style={{ fontSize: 13, fontWeight: 500 }}>บาท</span>
          </div>
        </div>

        {/* ── QR Payment Section ── */}
        <div style={{
          margin: '20px 36px',
          padding: '24px',
          borderRadius: 16,
          background: '#fafbff',
          border: '1px solid #e8eaff',
          textAlign: 'center',
        }}>
          <div style={{ color: '#4b5563', fontSize: 12, fontWeight: 600, marginBottom: 16, letterSpacing: 0.5 }}>
            ชำระเงินด้วย PromptPay
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            {qrImage ? (
              <img src={qrImage} alt="QR PromptPay" style={{ width: 180, height: 180, borderRadius: 12 }} />
            ) : (
              <div style={{ width: 180, height: 180, borderRadius: 12, background: '#f0f0f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 12 }}>
                กำลังโหลด QR...
              </div>
            )}
          </div>
          <div style={{ color: '#6b7280', fontSize: 12 }}>
            พร้อมเพย์ • <span style={{ fontWeight: 600, color: '#374151' }}>{promptpay}</span>
          </div>
          <div style={{ color: '#ef4444', fontSize: 11, marginTop: 8, opacity: 0.7 }}>
            หลังจากชำระแล้ว กรุณาแจ้งผู้ดูแลหอพัก
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '20px 36px 28px', borderTop: '1px solid #f0f0f0' }}>
          <div style={{ color: '#9ca3af', fontSize: 10, textAlign: 'center', lineHeight: 1.6 }}>
            {settings.dormName || 'หอพัก'} • โทร {settings.phone}<br />
            ใบแจ้งหนี้ฉบับนี้จัดทำโดยระบบอัตโนมัติ
          </div>
        </div>
      </div>
    </div>
  )
}
