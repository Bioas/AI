export const THAI_MONTHS = [
  '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]

export const THAI_SHORT_MONTHS = [
  '', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

export function formatThaiDate(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${d} ${THAI_MONTHS[m]} ${y + 543}`
}

export function getContractStatus(moveOutDate) {
  if (!moveOutDate) return { label: 'ไม่ระบุ', variant: 'default' }
  const now = new Date()
  const out = new Date(moveOutDate)
  const diffDays = Math.ceil((out - now) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return { label: 'หมดสัญญา', variant: 'danger' }
  if (diffDays <= 30) return { label: 'ใกล้หมดสัญญา', variant: 'warning' }
  return { label: 'ปกติ', variant: 'success' }
}

export function formatMonth(ym) {
  const [y, m] = ym.split('-');
  return `${THAI_MONTHS[parseInt(m)]} ${parseInt(y) + 543}`;
}

export function getPrevMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function calcWaterCost(units, rate) {
  if (units === 0) return 0
  if (units <= 4) return 150
  return 150 + ((units - 4) * rate)
}
