// Paste your deployed Apps Script web app /exec URL here.
const WEB_APP_URL = "https://script.google.com/a/macros/colorado.edu/s/AKfycbxaAxhKUIFgEDNw5hj7BY6--u3_eBc94mEhddaHCfdktHgcSOy259OZhqUg_pxn3xhD/exec";

function renderLeaderboard(rows) {
  const tbody = document.querySelector("#leaderboard tbody");
  if (!tbody) return;

  const sorted = [...rows].sort((a, b) =>
    (Number(b["Total Points"] || 0) - Number(a["Total Points"] || 0)) ||
    (Number(b["Perfect Groups"] || 0) - Number(a["Perfect Groups"] || 0)) ||
    (Number(b["Excellent Groups"] || 0) - Number(a["Excellent Groups"] || 0)) ||
    (Number(b["Good Groups"] || 0) - Number(a["Good Groups"] || 0)) ||
    String(a["Leaderboard Name"] || "").localeCompare(String(b["Leaderboard Name"] || ""))
  );

  tbody.innerHTML = "";

  sorted.forEach((row, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${row["Leaderboard Name"] || ""}</td>
      <td>${row["Total Points"] || 0}</td>
      <td>${row["Perfect Groups"] || 0}</td>
      <td>${row["Excellent Groups"] || 0}</td>
      <td>${row["Good Groups"] || 0}</td>
    `;
    tbody.appendChild(tr);
  });
}

function refreshLeaderboard() {
  if (!WEB_APP_URL || WEB_APP_URL.includes("PASTE_YOUR_DEPLOYED_WEB_APP_URL_HERE")) {
    console.warn("Set WEB_APP_URL in app.js first.");
    return;
  }

  const script = document.createElement("script");
  script.src = WEB_APP_URL + "?t=" + Date.now();
  script.onload = () => {
    if (window.POOL_DATA && window.POOL_DATA.rows) {
      renderLeaderboard(window.POOL_DATA.rows);
    }
    script.remove();
  };
  script.onerror = () => script.remove();
  document.body.appendChild(script);
}

document.addEventListener("DOMContentLoaded", () => {
  refreshLeaderboard();
  setInterval(refreshLeaderboard, 60000);
});