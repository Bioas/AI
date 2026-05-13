import { Router } from 'express'

const router = Router()

function generateInvoiceData(input) {
  if (!input) throw new Error('No input data provided')
  const room = input.room
  const tenant = input.tenant
  const roomNumber = room?.number
  const rent = input.rent
  const waterCost = input.waterCost
  const elecCost = input.elecCost
  const date = input.date
  const total = (rent || 0) + (waterCost || 0) + (elecCost || 0)
  return {
    roomNumber, tenant,
    rent: rent || 0,
    waterCost: waterCost || 0,
    elecCost: elecCost || 0,
    total,
    date: date || new Date().toISOString(),
  }
}

router.post('/', (req, res) => {
  try {
    const { data } = req.body
    if (!data || !data.roomId || !data.roomId.toString().trim()) {
      return res.status(400).json({ error: 'roomId is required' })
    }
    const result = generateInvoiceData(req.body)
    res.status(200).json(result)
  } catch (e) {
    console.error('POST /api/invoice error:', e)
    res.status(500).json({ error: e.message })
  }
})

export default router
