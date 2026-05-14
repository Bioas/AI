import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { api, getCurrentMonth } from '../lib/api'
import { formatMonth, calcWaterCost, getPrevMeter } from '../lib/constants'

const AppContext = createContext(null)

function removeSupports(doc) {
  try {
    for (const sheet of doc.styleSheets) {
      const rules = sheet.cssRules
      if (!rules) continue
      for (let i = rules.length - 1; i >= 0; i--) {
        if (rules[i] instanceof CSSSupportsRule || rules[i].cssText?.startsWith('@supports')) {
          sheet.deleteRule(i)
        }
      }
    }
  } catch (_) {}
}

export function AppProvider({ children }) {
  const [rooms, setRooms] = useState([])
  const [meters, setMeters] = useState([])
  const [settings, setSettings] = useState({
    dormName: '', address: '', phone: '', rateElec: 7, rateWater: 20,
    channelToken: '', channelSecret: '', logo: '', commonFee: 0, internetFee: 0,
  })
  const [toasts, setToasts] = useState([])
  const [modal, setModal] = useState(null)
  const [editRoom, setEditRoom] = useState(null)
  const [meterMonth, setMeterMonth] = useState(getCurrentMonth())
  const [invMonth, setInvMonth] = useState(getCurrentMonth())
  const [viewInv, setViewInv] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [residents, setResidents] = useState([])
  const [editResident, setEditResident] = useState(null)
  const [viewOnly, setViewOnly] = useState(false)
  const [lineUsers, setLineUsers] = useState([])
  const [meterLocal, setMeterLocal] = useState({})

  const toast = useCallback((msg, err = false) => {
    const id = Date.now().toString(36)
    setToasts(p => [...p, { id, msg, err }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }, [])

  function seedDemoData(setRooms, setMeters, setSettings, setResidents) {
    const rooms = [
      { id: '101', roomNumber: '101', roomType: 'มีทีวี', prevElecMeter: 1000, prevWaterMeter: 500, rentPrice: 3500, status: 'มีผู้เช่า', tenantName: 'สมชาย ใจดี' },
      { id: '102', roomNumber: '102', roomType: 'ไม่มีทีวี', prevElecMeter: 2000, prevWaterMeter: 800, rentPrice: 3000, status: 'มีผู้เช่า', tenantName: 'สมหญิง รักดี' },
      { id: '103', roomNumber: '103', roomType: 'มีทีวี', prevElecMeter: 1500, prevWaterMeter: 600, rentPrice: 3500, status: 'ว่าง' },
      { id: '201', roomNumber: '201', roomType: 'ไม่มีทีวี', prevElecMeter: 500, prevWaterMeter: 200, rentPrice: 2500, status: 'มีผู้เช่า', tenantName: 'มานะ ขยัน' },
    ]
    const residents = [
      { id: 'r1', name: 'สมชาย ใจดี', idCard: '1234567890123', phone: '0812345678', roomId: '101', moveInDate: '2025-01-01', moveOutDate: '2026-12-31', deposit: 3500 },
      { id: 'r2', name: 'สมหญิง รักดี', idCard: '9876543210123', phone: '0898765432', roomId: '102', moveInDate: '2025-03-01', moveOutDate: '2026-06-30', deposit: 3000 },
      { id: 'r3', name: 'มานะ ขยัน', idCard: '4567890123456', phone: '0654321987', roomId: '201', moveInDate: '2025-06-01', moveOutDate: '2026-09-30', deposit: 2500 },
    ]
    const meters = [
      { id: 'm1', roomId: '101', month: '2026-03', elec: 1100, water: 520 },
      { id: 'm2', roomId: '102', month: '2026-03', elec: 2100, water: 830 },
      { id: 'm3', roomId: '201', month: '2026-03', elec: 600, water: 220 },
      { id: 'm4', roomId: '101', month: '2026-04', elec: 1200, water: 540 },
      { id: 'm5', roomId: '102', month: '2026-04', elec: 2200, water: 860 },
      { id: 'm6', roomId: '201', month: '2026-04', elec: 700, water: 250 },
    ]
    const settings = { dormName: 'หอพักตัวอย่าง', address: '123 ถนนสุขใจ แขวงสนุก เขตบันเทิง กรุงเทพฯ 10100', phone: '021234567', rateElec: 7, rateWater: 20 }
    setRooms(rooms)
    setMeters(meters)
    setSettings(settings)
    setResidents(residents)
  }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [r, m, s, res, lu] = await Promise.all([
        api('/api/rooms', 'GET'),
        api('/api/meters', 'GET'),
        api('/api/settings', 'GET'),
        api('/api/residents', 'GET'),
        api('/api/line/users', 'GET').catch(() => []),
      ])
      const hasData = (r && r.length > 0)
      if (hasData) {
        setRooms(r)
        setMeters(m || [])
        setSettings(s || {})
        setResidents(res || [])
        setLineUsers(lu || [])
      } else {
        seedDemoData(setRooms, setMeters, setSettings, setResidents)
      }
    } catch (e) {
      console.error('fetchAll error:', e)
      seedDemoData(setRooms, setMeters, setSettings, setResidents)
    }
    setLoading(false)
  }, [toast])

  useEffect(() => { fetchAll() }, [fetchAll])

  const calcInv = useCallback((room, m) => {
    const cur = meters.find(x => x.roomId === room.id && x.month === m) || { elec: 0, water: 0 }
    const prev = getPrevMeter(room.id, m, meters, room.prevElecMeter || 0, room.prevWaterMeter || 0)
    const eu = Math.max(0, Number(cur.elec || 0) - Number(prev.elec || 0))
    const wu = Math.max(0, Number(cur.water || 0) - Number(prev.water || 0))
    const waterCost = calcWaterCost(wu, settings.rateWater)
    const resident = room.residentId ? residents.find(r => r.id === room.residentId) : null
    const roomNumber = room.roomNumber || room.number
    const rentPrice = room.rentPrice || room.rent
    return {
      room: roomNumber, tenant: resident?.name || room.tenantName || 'ไม่ระบุ',
      phone: resident?.phone || room.tenantPhone || '',
      userId: resident?.lineUserId || room.tenantUserId || '',
      month: m, rent: rentPrice,
      elecUnits: eu, elecCost: eu * settings.rateElec,
      waterUnits: wu, waterCost,
      prevElec: prev.elec || 0, curElec: cur.elec || 0,
      prevWater: prev.water || 0, curWater: cur.water || 0,
      total: rentPrice + eu * settings.rateElec + waterCost,
      rateElec: settings.rateElec, rateWater: settings.rateWater,
    }
  }, [meters, residents, settings.rateElec, settings.rateWater])

  const initMeterLocal = useCallback(() => {
    const local = {}
    rooms.filter(r => r.residentId || r.tenantName).forEach(r => {
      const cur = meters.find(x => x.roomId === r.id && x.month === meterMonth) || { elec: '', water: '' }
      const prev = getPrevMeter(r.id, meterMonth, meters, r.prevElecMeter ?? '', r.prevWaterMeter ?? '')
      local[r.id] = { cur: { ...cur }, prev }
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

  const fetchResidents = useCallback(async (search = '') => {
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : ''
      const res = await api(`/api/residents${query}`, 'GET')
      setResidents(res || [])
    } catch (e) {
      toast(`โหลดข้อมูลผู้พักไม่สำเร็จ: ${e.message}`, true)
    }
  }, [toast])

  const saveResident = useCallback(async (data) => {
    try {
      const method = data.id ? 'PUT' : 'POST'
      await api('/api/residents', method, data)
      await fetchResidents()
      setModal(null)
      setEditResident(null)
      toast(data.id ? 'แก้ไขข้อมูลผู้พักสำเร็จ' : 'เพิ่มผู้พักอาศัยสำเร็จ')
    } catch (e) {
      toast(`ไม่สำเร็จ: ${e.message}`, true)
    }
  }, [fetchResidents, toast])

  const deleteResident = useCallback(async (id) => {
    try {
      await api('/api/residents', 'DELETE', { id })
      await fetchResidents()
      toast('ลบข้อมูลผู้พักสำเร็จ')
    } catch (e) {
      toast(`ลบไม่สำเร็จ: ${e.message}`, true)
    }
  }, [fetchResidents, toast])

  const fetchLineUsers = useCallback(async (params = '') => {
    try {
      const res = await api(`/api/line/users${params}`, 'GET')
      setLineUsers(res || [])
    } catch (e) {
      console.error('fetchLineUsers error:', e)
    }
  }, [])

  const syncLineFollowers = useCallback(async () => {
    try {
      const res = await fetch('/api/line/sync-followers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        await fetchLineUsers()
        toast(`นำเข้าข้อมูลสำเร็จ: เพิ่มใหม่ ${data.imported} อัปเดต ${data.updated} รวม ${data.total} คน`)
        return true
      }
      toast(`ไม่สำเร็จ: ${data.error || 'Unknown error'}`, true)
      return false
    } catch (e) {
      toast(`ไม่สำเร็จ: ${e.message}`, true)
      return false
    }
  }, [fetchLineUsers, toast])

  const toggleLineUser = useCallback(async (userId) => {
    try {
      const res = await api(`/api/line/users/${userId}/toggle`, 'PUT')
      setLineUsers(prev => prev.map(u => u.userId === userId ? { ...u, isActive: res.isActive } : u))
      toast(res.isActive ? 'เปิดใช้งานผู้ใช้นี้แล้ว' : 'ปิดใช้งานผู้ใช้นี้แล้ว')
    } catch (e) {
      toast(`ไม่สำเร็จ: ${e.message}`, true)
    }
  }, [toast])

  const mapLineUser = useCallback(async (userId, residentId) => {
    try {
      await api(`/api/line/users/${userId}/map`, 'PUT', { residentId })
      await fetchLineUsers()
      toast('เชื่อมโยง LINE กับผู้พักสำเร็จ')
    } catch (e) {
      toast(`ไม่สำเร็จ: ${e.message}`, true)
    }
  }, [fetchLineUsers, toast])

  const unmapLineUser = useCallback(async (userId) => {
    try {
      await api(`/api/line/users/${userId}/unmap`, 'PUT')
      await fetchLineUsers()
      toast('ยกเลิกการเชื่อมโยง LINE สำเร็จ')
    } catch (e) {
      toast(`ไม่สำเร็จ: ${e.message}`, true)
    }
  }, [fetchLineUsers, toast])

  const downloadPdf = useCallback(async (inv) => {
    const el = document.getElementById('invoicePdfContent')
    if (!el) return
    try {
      const { jsPDF } = await import('jspdf')
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: '#ffffff', onclone: removeSupports })
      const doc = new jsPDF('p', 'mm', 'a4')
      const mg = 10
      const pw = 210 - mg * 2
      const ph = (canvas.height * pw) / canvas.width
      const maxH = 297 - mg * 2
      const finalH = Math.min(ph, maxH)
      const finalW = (canvas.width * finalH) / canvas.height
      const offsetX = mg + (pw - finalW) / 2
      doc.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', offsetX, mg, finalW, finalH)
      doc.save(`invoice_${inv.room}_${inv.month}.pdf`)
      toast('ดาวน์โหลด PDF สำเร็จ')
    } catch (e) {
      toast(`PDF error: ${e.message}`, true)
    }
  }, [toast])

  const downloadContractPdf = useCallback(async (resident) => {
    const el = document.getElementById('contractPdfContent')
    if (!el) return
    try {
      const { jsPDF } = await import('jspdf')
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', onclone: removeSupports })
      const doc = new jsPDF('p', 'mm', 'a4')
      const mg = 10
      const pw = 210 - mg * 2
      const ph = 297 - mg * 2
      const imgW = canvas.width
      const imgH = canvas.height
      const ratio = pw / imgW
      const pageH = ph / ratio
      const pages = Math.ceil(imgH / pageH)
      for (let i = 0; i < pages; i++) {
        if (i > 0) doc.addPage()
        const srcY = pageH * i
        const canvasCrop = document.createElement('canvas')
        canvasCrop.width = imgW
        canvasCrop.height = Math.min(pageH, imgH - srcY)
        const ctx = canvasCrop.getContext('2d')
        ctx.drawImage(canvas, 0, srcY, imgW, canvasCrop.height, 0, 0, imgW, canvasCrop.height)
        doc.addImage(canvasCrop.toDataURL('image/jpeg', 0.95), 'JPEG', mg, mg, pw, canvasCrop.height * ratio)
      }
      doc.save(`contract_${resident.name?.replace(/\s/g, '_')}.pdf`)
      toast('ดาวน์โหลดสัญญา PDF สำเร็จ')
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

  const sendPdfToLine = useCallback(async (inv) => {
    if (!inv.userId) { toast('ผู้พักห้องนี้ยังไม่ได้กรอก LINE User ID', true); return false }
    if (!settings.channelToken) { toast('กรุณาตั้งค่า Channel Access Token ก่อน', true); return false }

    try {
      toast('กำลังส่งใบแจ้งหนี้...')

      const items = [
        { desc: 'ค่าเช่าห้อง', detail: `ห้อง ${inv.room}`, amount: inv.rent },
        { desc: 'ค่าไฟฟ้า', detail: `${inv.elecUnits} หน่วย × ${inv.rateElec} บาท`, amount: inv.elecCost },
        { desc: 'ค่าน้ำประปา', detail: inv.waterUnits <= 4 && inv.waterUnits > 0 ? 'เหมาจ่าย' : `${inv.waterUnits} หน่วย × ${inv.rateWater} บาท`, amount: inv.waterCost },
      ]
      const cf = Number(settings.commonFee) || 0
      const inf = Number(settings.internetFee) || 0
      if (cf > 0) items.push({ desc: 'ค่าส่วนกลาง', detail: '', amount: cf })
      if (inf > 0) items.push({ desc: 'ค่าอินเทอร์เน็ต', detail: '', amount: inf })
      const total = items.reduce((s, i) => s + i.amount, 0)

      const res = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: inv.userId,
          token: settings.channelToken,
          items,
          total,
          tenantName: inv.tenant,
          roomNumber: inv.room,
          billingMonth: formatMonth(inv.month),
          dormName: settings.dormName,
          dormAddress: settings.address,
          dormPhone: settings.phone,
          logo: settings.logo || null,
          qrCode: settings.qrCode || null,
        }),
      })

      const data = await res.json()
      if (res.ok) { toast('ส่ง Invoice ทาง LINE สำเร็จ!'); return true }
      toast('ส่งไม่สำเร็จ: ' + (data.error || 'Unknown error'), true)
      return false
    } catch (e) {
      toast(`ส่ง Invoice ไม่สำเร็จ: ${e.message}`, true)
      return false
    }
  }, [settings, toast])

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
    reader.onload = async (ev) => {
      const base64 = ev.target?.result
      const s = { ...settings, qrCode: base64 }
      try {
        await api('/api/settings', 'POST', s)
        await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: base64, filename: 'qr.png' })
        })
        setSettings(s)
        toast('อัปโหลด QR Code สำเร็จ')
      } catch (e) { toast(`อัปโหลดไม่สำเร็จ: ${e.message}`, true) }
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
    rooms, meters, residents, lineUsers, settings, loading, error,
    modal, setModal, editRoom, setEditRoom,
    editResident, setEditResident, viewOnly, setViewOnly,
    meterMonth, setMeterMonth, invMonth, setInvMonth,
    viewInv, setViewInv, toasts,
    meterLocal, setMeterField,
    fetchAll, toast,
    calcInv, saveAllMeters, initMeterLocal,
    saveRoom, deleteRoom,
    fetchResidents, saveResident, deleteResident,
    fetchLineUsers, toggleLineUser, mapLineUser, unmapLineUser, syncLineFollowers,
    downloadPdf, downloadContractPdf, sendLineMsg, sendPdfToLine,
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
