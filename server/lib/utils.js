export function naturalSortRoomNumber(a, b) {
  const getRoomNum = (item) => {
    if (typeof item === 'string') return item
    return item?.roomNumber || item?.number || item?.room || ''
  }
  const strA = getRoomNum(a)
  const strB = getRoomNum(b)
  const re = /(\d+)|(\D+)/g
  const partsA = strA.match(re) || []
  const partsB = strB.match(re) || []
  const len = Math.max(partsA.length, partsB.length)
  for (let i = 0; i < len; i++) {
    const pA = partsA[i] || ''
    const pB = partsB[i] || ''
    const isNumA = /^\d+$/.test(pA)
    const isNumB = /^\d+$/.test(pB)
    if (isNumA && isNumB) {
      const diff = Number(pA) - Number(pB)
      if (diff !== 0) return diff
    } else if (isNumA) {
      return -1
    } else if (isNumB) {
      return 1
    } else {
      const cmp = pA.localeCompare(pB, 'en', { sensitivity: 'base' })
      if (cmp !== 0) return cmp
    }
  }
  return 0
}
