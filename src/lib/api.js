export async function api(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || `Request failed: ${method} ${path}`);
  return data;
}

export function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}
