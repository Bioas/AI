import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { api, getCurrentMonth } from '../lib/api'
import { getPrevMonth, formatMonth } from '../lib/constants'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [rooms, setRooms] = useState([])
  const [meters, setMeters] = useState([])
  const [settings, setSettings] = useState({
    dormName: '', address: '', phone: '', rateElec: 7, rateWater: 20,
    channelToken: '', logo: '', commonFee: 0, internetFee: 0,
  })
  const [toasts, setToasts] = useState([])
  const [modal, setModal] = useState(null)
  const [editRoom, setEditRoom] = useState(null)
  const [meterMonth, setMeterMonth] = useState(getCurrentMonth())
  const [invMonth, setInvMonth] = useState(getCurrentMonth())
  const [viewInv, setViewInv] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [meterLocal, setMeterLocal] = useState({})

  const toast = useCallback((msg, err = false) => {
    const id = Date.now().toString(36)
    setToasts(p => [...p, { id, msg, err }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [r, m, s] = await Promise.all([
        api('/api/rooms', 'GET'),
        api('/api/meters', 'GET'),
        api('/api/settings', 'GET'),
      ])
      setRooms(r || [])
      setMeters(m || [])
      setSettings(s || {})
    } catch (e) {
      console.error('fetchAll error:', e)
      setError(e.message)
      toast(`โหลดข้อมูลไม่สำเร็จ: ${e.message}`, true)
    }
    setLoading(false)
  }, [toast])

  useEffect(() => { fetchAll() }, [fetchAll])

  const calcInv = useCallback((room, m) => {
    const cur = meters.find(x => x.roomId === room.id && x.month === m) || { elec: 0, water: 0 }
    const pm = getPrevMonth(m)
    const prev = meters.find(x => x.roomId === room.id && x.month === pm) || { elec: 0, water: 0 }
    const eu = Math.max(0, Number(cur.elec || 0) - Number(prev.elec || 0))
    const wu = Math.max(0, Number(cur.water || 0) - Number(prev.water || 0))
    return {
      room: room.number, tenant: room.tenantName, phone: room.tenantPhone,
      userId: room.tenantUserId, month: m, rent: room.rent,
      elecUnits: eu, elecCost: eu * settings.rateElec,
      waterUnits: wu, waterCost: wu * settings.rateWater,
      prevElec: prev.elec || 0, curElec: cur.elec || 0,
      prevWater: prev.water || 0, curWater: cur.water || 0,
      total: room.rent + eu * settings.rateElec + wu * settings.rateWater,
      rateElec: settings.rateElec, rateWater: settings.rateWater,
    }
  }, [meters, settings.rateElec, settings.rateWater])

  const initMeterLocal = useCallback(() => {
    const local = {}
    rooms.filter(r => r.tenantName).forEach(r => {
      const pm = getPrevMonth(meterMonth)
      const cur = meters.find(x => x.roomId === r.id && x.month === meterMonth) || { elec: '', water: '' }
      const prev = meters.find(x => x.roomId === r.id && x.month === pm) || { elec: '', water: '' }
      local[r.id] = { cur: { ...cur }, prev: { ...prev } }
    })
    setMeterLocal(local)
  }, [rooms, meters, meterMonth])

  useEffect(() => { initMeterLocal() }, [initMeterLocal])

  const setMeterField = useCallback((rid, section, field, val) => {
    setMeterLocal(prev => ({
      ...prev,
      [rid]: {
        ...prev[rid],
        [section]: { ...prev[rid]?.[section], [field]: val },
      },
    }))
  }, [])

  const saveAllMeters = useCallback(async () => {
    let saved = 0
    let errors = 0
    for (const rid of Object.keys(meterLocal)) {
      const data = meterLocal[rid]
      if (data.cur.elec !== '' || data.cur.water !== '') {
        const existing = meters.find(x => x.roomId === rid && x.month === meterMonth)
        const body = { roomId: rid, month: meterMonth, elec: Number(data.cur.elec) || 0, water: Number(data.cur.water) || 0 }
        try {
          if (existing) {
            await api('/api/meters', 'PUT', { roomId: rid, month: meterMonth, elec: body.elec, water: body.water })
          } else {
            await api('/api/meters', 'POST', body)
          }
          saved++
        } catch (e) {
          console.error(`saveMeter error for room ${rid}:`, e)
          errors++
        }
      }
      if (data.prev.elec !== '' || data.prev.water !== '') {
        const pm = getPrevMonth(meterMonth)
        const existing = meters.find(x => x.roomId === rid && x.month === pm)
        const body = { roomId: rid, month: pm, elec: Number(data.prev.elec) || 0, water: Number(data.prev.water) || 0 }
        try {
          if (existing) {
            await api('/api/meters', 'PUT', { roomId: rid, month: pm, elec: body.elec, water: body.water })
          } else {
            await api('/api/meters', 'POST', body)
          }
          saved++
        } catch (e) {
          console.error(`saveMeter error for room ${rid} (prev):`, e)
          errors++
        }
      }
    }
    await fetchAll()
    if (errors > 0) {
      toast(`บันทึก ${saved} รายการสำเร็จ, ${errors} รายการผิดพลาด`, true)
    } else {
      toast(`บันทึก ${saved} รายการสำเร็จ`)
    }
  }, [meterLocal, meters, meterMonth, fetchAll, toast])

  const saveRoom = useCallback(async (data) => {
    try {
      const method = data.id ? 'PUT' : 'POST'
      await api('/api/rooms', method, data.id ? { ...data } : data)
      await fetchAll()
      setModal(null)
      setEditRoom(null)
      toast(data.id ? 'แก้ไขห้องสำเร็จ' : 'เพิ่มห้องสำเร็จ')
    } catch (e) {
      toast(`ไม่สำเร็จ: ${e.message}`, true)
    }
  }, [fetchAll, toast])

  const deleteRoom = useCallback(async (id) => {
    try {
      await api('/api/rooms', 'DELETE', { id })
      await fetchAll()
      toast('ลบห้องสำเร็จ')
    } catch (e) {
      toast(`ลบไม่สำเร็จ: ${e.message}`, true)
    }
  }, [fetchAll, toast])

  const downloadPdf = useCallback(async (inv) => {
    const el = document.getElementById('invoicePdfContent')
    if (!el) return
    try {
      const { jsPDF } = await import('jspdf')
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const doc = new jsPDF('p', 'mm', 'a4')
      const pw = 210 - 20
      const ph = (canvas.height * pw) / canvas.width
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, pw, ph)
      doc.save(`invoice_${inv.room}_${inv.month}.pdf`)
      toast('ดาวน์โหลด PDF สำเร็จ')
    } catch (e) {
      toast(`PDF error: ${e.message}`, true)
    }
  }, [toast])

  const sendLineMsg = useCallback(async (to, text) => {
    if (!settings.channelToken) {
      toast('กรุณาตั้งค่า Channel Access Token ก่อน', true)
      return false
    }
    try {
      const res = await fetch('/api/line/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, text, token: settings.channelToken }),
      })
      const data = await res.json()
      if (res.ok) { toast('ส่ง LINE สำเร็จ!'); return true }
      toast('ส่งไม่สำเร็จ: ' + (data.error || data.message || 'Unknown error'), true)
      return false
    } catch (err) { toast('ข้อผิดพลาด: ' + err.message, true); return false }
  }, [settings.channelToken, toast])

  const sendInvLine = useCallback((inv) => {
    if (!inv.userId) { toast('ผู้พักห้องนี้ยังไม่ได้กรอก LINE User ID', true); return }
    const md = formatMonth(inv.month)
    const text = [
      `🏠 ใบแจ้งหนี้ - ห้อง ${inv.room}`,
      `━━━━━━━━━━━━━━━`,
      `📅 เดือน ${md}`,
      `👤 ${inv.tenant}`,
      `━━━━━━━━━━━━━━━`,
      `🏠 ค่าเช่า: ${inv.rent.toLocaleString()} ฿`,
      `⚡ ค่าไฟ: ${inv.elecCost.toLocaleString()} ฿ (${inv.elecUnits} หน่วย)`,
      `💧 ค่าน้ำ: ${inv.waterCost.toLocaleString()} ฿ (${inv.waterUnits} หน่วย)`,
      `━━━━━━━━━━━━━━━`,
      `💰 รวมทั้งหมด: ${inv.total.toLocaleString()} ฿`,
      `━━━━━━━━━━━━━━━`,
      `กรุณาชำระเงินภายในวันที่ 5`,
      `ขอบคุณครับ 🙏`,
    ].join('\n')
    sendLineMsg(inv.userId, text)
  }, [sendLineMsg, toast])

  const saveSettingsDelayed = useCallback((() => {
    let timer
    return (key, value) => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const s = { ...settings, [key]: value }
        setSettings(s)
        api('/api/settings', 'POST', s).catch(e => console.error('saveSettings error:', e))
      }, 800)
    }
  })(), [settings])

  const uploadLogo = useCallback((e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 2 * 1024 * 1024) { toast('ไฟล์ใหญ่เกิน 2MB', true); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const s = { ...settings, logo: ev.target?.result }
      api('/api/settings', 'POST', s).then(() => { setSettings(s); toast('อัปโหลดโลโก้สำเร็จ') }).catch(e => toast(`อัปโหลดไม่สำเร็จ: ${e.message}`, true))
    }
    reader.readAsDataURL(f)
  }, [settings, toast])

  const removeLogo = useCallback(() => {
    const s = { ...settings, logo: '' }
    api('/api/settings', 'POST', s).then(() => { setSettings(s); toast('ลบโลโก้สำเร็จ') }).catch(e => toast(`ลบไม่สำเร็จ: ${e.message}`, true))
  }, [settings, toast])

  const uploadQr = useCallback((e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 2 * 1024 * 1024) { toast('ไฟล์ใหญ่เกิน 2MB', true); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const s = { ...settings, qrCode: ev.target?.result }
      api('/api/settings', 'POST', s).then(() => { setSettings(s); toast('อัปโหลด QR Code สำเร็จ') }).catch(e => toast(`อัปโหลดไม่สำเร็จ: ${e.message}`, true))
    }
    reader.readAsDataURL(f)
  }, [settings, toast])

  const removeQr = useCallback(() => {
    const s = { ...settings, qrCode: '' }
    api('/api/settings', 'POST', s).then(() => { setSettings(s); toast('ลบ QR Code สำเร็จ') }).catch(e => toast(`ลบไม่สำเร็จ: ${e.message}`, true))
  }, [settings, toast])

  const exportData = useCallback(() => {
    const data = { rooms, meters, settings, exportDate: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `dorm_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click(); URL.revokeObjectURL(url)
    toast('Export สำเร็จ')
  }, [rooms, meters, settings, toast])

  const importData = useCallback(async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const d = JSON.parse(ev.target?.result)
        if (!d.rooms || !d.settings) { toast('ไฟล์ JSON ไม่ถูกต้อง', true); return }
        for (const r of d.rooms) await api('/api/rooms', 'POST', r)
        if (d.meters) for (const m of d.meters) await api('/api/meters', 'POST', m)
        await api('/api/settings', 'POST', d.settings)
        await fetchAll()
        toast('Import สำเร็จ')
      } catch (err) { toast(err.message, true) }
    }
    reader.readAsText(f)
  }, [fetchAll, toast])

  const value = {
    rooms, meters, settings, loading, error,
    modal, setModal, editRoom, setEditRoom,
    meterMonth, setMeterMonth, invMonth, setInvMonth,
    viewInv, setViewInv, toasts,
    meterLocal, setMeterField,
    fetchAll, toast,
    calcInv, saveAllMeters, initMeterLocal,
    saveRoom, deleteRoom,
    downloadPdf, sendLineMsg, sendInvLine,
    saveSettingsDelayed, uploadLogo, removeLogo, uploadQr, removeQr,
    exportData, importData,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
