// server.js
const express = require("express")
const path = require("path")
const fs = require("fs/promises")

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json({ limit: "1mb" }))

// Static files (jouw HTML/CSS/JS)
app.use(express.static(path.join(__dirname)))

// JSON DB map
const DATA_DIR = path.join(__dirname, "data")

const FILES = {
  orders: path.join(DATA_DIR, "orders.json"),
  pakketten: path.join(DATA_DIR, "pakketten.json"),
  tarieven: path.join(DATA_DIR, "tarieven.json"),
  instellingen: path.join(DATA_DIR, "instellingen.json"),
}

function nowISO() {
  return new Date().toISOString()
}

function makeId(prefix = "id") {
  // simpel en stabiel genoeg voor schoolproject
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

async function ensureFile(filePath, fallback = []) {
  try {
    await fs.access(filePath)
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), "utf-8")
  }
}

async function readJSON(filePath, fallback) {
  await ensureFile(filePath, fallback)
  const raw = await fs.readFile(filePath, "utf-8")
  try {
    return JSON.parse(raw)
  } catch {
    // als file corrupt is, reset
    await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), "utf-8")
    return fallback
  }
}

async function writeJSON(filePath, data) {
  await ensureFile(filePath, Array.isArray(data) ? [] : {})
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8")
}

// --------- GENERIEKE CRUD ROUTES (list, get, create, update, delete) ---------
function registerCollectionRoutes(name) {
  const filePath = FILES[name]
  if (!filePath) throw new Error(`Unknown collection: ${name}`)

  // LIST
  app.get(`/api/${name}`, async (req, res) => {
    const items = await readJSON(filePath, [])
    res.json(items)
  })

  // GET ONE
  app.get(`/api/${name}/:id`, async (req, res) => {
    const items = await readJSON(filePath, [])
    const item = items.find((x) => x.id === req.params.id)
    if (!item) return res.status(404).json({ message: "Not found" })
    res.json(item)
  })

  // CREATE
  app.post(`/api/${name}`, async (req, res) => {
    const items = await readJSON(filePath, [])
    const payload = req.body || {}

    const newItem = {
      id: makeId(name),
      created_at: nowISO(),
      updated_at: nowISO(),
      ...payload,
    }

    items.unshift(newItem)
    await writeJSON(filePath, items)
    res.status(201).json(newItem)
  })

  // UPDATE
  app.put(`/api/${name}/:id`, async (req, res) => {
    const items = await readJSON(filePath, [])
    const idx = items.findIndex((x) => x.id === req.params.id)
    if (idx === -1) return res.status(404).json({ message: "Not found" })

    items[idx] = {
      ...items[idx],
      ...req.body,
      updated_at: nowISO(),
    }

    await writeJSON(filePath, items)
    res.json(items[idx])
  })

  // DELETE
  app.delete(`/api/${name}/:id`, async (req, res) => {
    const items = await readJSON(filePath, [])
    const idx = items.findIndex((x) => x.id === req.params.id)
    if (idx === -1) return res.status(404).json({ message: "Not found" })

    const removed = items.splice(idx, 1)[0]
    await writeJSON(filePath, items)
    res.json({ ok: true, removed })
  })
}

// Collections
registerCollectionRoutes("orders")
registerCollectionRoutes("pakketten")
registerCollectionRoutes("tarieven")

// Instellingen (object i.p.v. array)
app.get("/api/instellingen", async (req, res) => {
  const obj = await readJSON(FILES.instellingen, {})
  res.json(obj)
})
app.put("/api/instellingen", async (req, res) => {
  const current = await readJSON(FILES.instellingen, {})
  const next = { ...current, ...(req.body || {}), updated_at: nowISO() }
  await writeJSON(FILES.instellingen, next)
  res.json(next)
})

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
})
