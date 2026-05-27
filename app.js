// Paste your deployed Apps Script web app /exec URL here.
const APPS_SCRIPT_WEB_APP_URL = "PASTE_YOUR_WEB_APP_URL_HERE";
const REFRESH_MS = 60000;

function renderLeaderboard(rows) {
  const tbody = document.querySelector("#leaderboard tbody");
  if (!tbody) return;

  const sorted = [...rows].sort((a, b) => {
    const totalDiff = Number(b["Total Points"] || 0) - Number(a["Total Points"] || 0);
    if (totalDiff !== 0) return totalDiff;
    const perfectDiff = Number(b["Perfect Groups"] || 0) - Number(a["Perfect Groups"] || 0);
    if (perfectDiff !== 0) return perfectDiff;
    const excellentDiff = Number(b["Excellent Groups"] || 0) - Number(a["Excellent Groups"] || 0);
    if (excellentDiff !== 0) return excellentDiff;
    const goodDiff = Number(b["Good Groups"] || 0) - Number(a["Good Groups"] || 0);
    if (goodDiff !== 0) return goodDiff;
    return String(a["Leaderboard Name"] || "").localeCompare(String(b["Leaderboard Name"] || ""));
  });

  tbody.innerHTML = "";
  sorted.forEach((row, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${escapeHtml(row["Leaderboard Name"] || "")}</td>
      <td>${Number(row["Total Points"] || 0)}</td>
      <td>${Number(row["Perfect Groups"] || 0)}</td>
      <td>${Number(row["Excellent Groups"] || 0)}</td>
      <td>${Number(row["Good Groups"] || 0)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderActualGroups(groups) {
  const container = document.querySelector("#groups");
  if (!container) return;

  const order = ["A","B","C","D","E","F","G","H","I","J","K","L"];
  const byGroup = new Map();

  groups.forEach(row => {
    const groupName = String(row.Group || row["Group"] || "").trim();
    const letter = groupName.match(/([A-L])/i);
    if (!letter) return;
    byGroup.set(letter[1].toUpperCase(), row);
  });

  container.innerHTML = "";
  order.forEach(letter => {
    const row = byGroup.get(letter);
    if (!row) return;

    const card = document.createElement("div");
    card.className = "group-card";
    card.innerHTML = `
      <div class="group-title">
        <h3>Group ${letter}</h3>
        <span class="muted">Updated live</span>
      </div>
      <ol>
        <li>${escapeHtml(row["1st"] || "")}</li>
        <li>${escapeHtml(row["2nd"] || "")}</li>
        <li>${escapeHtml(row["3rd"] || "")}</li>
        <li>${escapeHtml(row["4th"] || "")}</li>
      </ol>
    `;
    container.appendChild(card);
  });
}

function refreshSite() {
  if (!APPS_SCRIPT_WEB_APP_URL || APPS_SCRIPT_WEB_APP_URL.includes("PASTE_YOUR_WEB_APP_URL_HERE")) {
    console.warn("Paste your Apps Script web app URL into site/app.js first.");
    return;
  }

  const s = document.createElement("script");
  s.src = `${APPS_SCRIPT_WEB_APP_URL}?t=${Date.now()}`;
  s.onload = () => {
    if (window.POOL_DATA) {
      const data = window.POOL_DATA;
      renderLeaderboard(data.leaderboard || []);
      renderActualGroups(data.actualGroups || []);
      const updated = document.querySelector("#updatedAt");
      if (updated) updated.textContent = new Date(data.generatedAt).toLocaleString();
    }
    s.remove();
  };
  s.onerror = () => s.remove();
  document.body.appendChild(s);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

document.addEventListener("DOMContentLoaded", () => {
  refreshSite();
  setInterval(refreshSite, REFRESH_MS);
});
