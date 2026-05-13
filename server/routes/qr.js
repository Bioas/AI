import { Router } from 'express'
import qrcode from 'qrcode'
import promptpayqr from 'promptpay-qr'

const router = Router()

router.post('/generate', async (req, res) => {
  try {
    const { promptpayNumber, amount } = req.body

    if (!promptpayNumber) {
      return res.status(400).json({ error: 'Missing promptpayNumber' })
    }

    const payload = promptpayqr(promptpayNumber, { amount: Number(amount) || 0 })
    const qrImage = await qrcode.toDataURL(payload, {
      width: 400,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' }
    })

    res.json({ qrImage })
  } catch (e) {
    console.error('QR generate error:', e)
    res.status(500).json({ error: e.message })
  }
})

export default router
