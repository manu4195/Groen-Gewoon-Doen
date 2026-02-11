// js/functions.js
function storageKey(entity) {
  return `gng_admin_${entity}`
}

export function readCache(entity, fallback = []) {
  try {
    const raw = localStorage.getItem(storageKey(entity))
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeCache(entity, data) {
  try {
    localStorage.setItem(storageKey(entity), JSON.stringify(data))
  } catch {}
}

async function safeJson(res) {
  const data = await res.json().catch(() => null)
  return data
}

export async function apiList(entity) {
  try {
    const res = await fetch(`/api/${entity}`, { cache: "no-store" })
    if (!res.ok) throw new Error("list failed")
    const data = await safeJson(res)
    if (!Array.isArray(data)) throw new Error("bad data")
    writeCache(entity, data)
    return data
  } catch {
    return readCache(entity, [])
  }
}

export async function apiCreate(entity, payload) {
  const res = await fetch(`/api/${entity}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  })
  const data = await safeJson(res)
  if (!res.ok) throw new Error(data?.message || "create failed")

  // update cache
  const current = readCache(entity, [])
  const next = [data, ...current]
  writeCache(entity, next)
  return data
}

export async function apiUpdate(entity, id, payload) {
  const res = await fetch(`/api/${entity}/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  })
  const data = await safeJson(res)
  if (!res.ok) throw new Error(data?.message || "update failed")

  const current = readCache(entity, [])
  const next = current.map((x) => (x.id === id ? data : x))
  writeCache(entity, next)
  return data
}

export async function apiDelete(entity, id) {
  const res = await fetch(`/api/${entity}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
  const data = await safeJson(res)
  if (!res.ok) throw new Error(data?.message || "delete failed")

  const current = readCache(entity, [])
  const next = current.filter((x) => x.id !== id)
  writeCache(entity, next)
  return data
}
