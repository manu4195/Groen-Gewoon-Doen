// js/main.js
import { initDashboard } from "./admin.js"

document.addEventListener("DOMContentLoaded", async () => {
  const page = document.body?.dataset?.page || ""

  if (page === "dashboard") {
    await initDashboard()
  }
})
