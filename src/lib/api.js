const API_BASE = import.meta.env.VITE_API_URL || ''

export async function api(path, method = 'GET', body = null) {
  const url = `${API_BASE}${path}`
  const opts = { method, headers: { 'Content-Type': 'application/json' } }
  if (body) opts.body = JSON.stringify(body)

  let res
  try {
    res = await fetch(url, opts)
  } catch (err) {
    console.error(`[API] Network error: ${method} ${url}`, err)
    throw new Error(`Network error: ${err.message}. Check that the server is running.`)
  }

  let data
  try {
    data = await res.json()
  } catch {
    const text = await res.text().catch(() => '')
    console.error(`[API] Parse error: ${method} ${url}`, { status: res.status, body: text })
    throw new Error(`Invalid response (${res.status}) from ${method} ${path}`)
  }

  if (!res.ok) {
    console.error(`[API] Error: ${method} ${url}`, data)
    throw new Error(data.error || data.message || `Request failed: ${method} ${path} (${res.status})`)
  }

  return data
}

export function getCurrentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
