// js/admin.js
import { apiList } from "./functions.js"

function setText(id, value) {
  const el = document.getElementById(id)
  if (el) el.textContent = String(value)
}

function countByStatus(orders, status) {
  return orders.filter((o) => (o.status || "").toLowerCase() === status).length
}

export async function initDashboard() {
  const orders = await apiList("orders")

  const open = countByStatus(orders, "open")
  const gepland = countByStatus(orders, "ingepland")
  const afgerond = countByStatus(orders, "afgerond")
  const offertes = countByStatus(orders, "offerte")

  setText("stat-open", open)
  setText("stat-ingepland", gepland)
  setText("stat-afgerond", afgerond)
  setText("stat-offertes", offertes)

  // mini “laatste update”
  setText("last-update", "zojuist")
}
