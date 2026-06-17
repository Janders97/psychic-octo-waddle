// ─── CONFIG ──────────────────────────────────────────────────────────────────
// Paste your deployed Apps Script web-app /exec URL here.
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw3JpiDW5CPq9VxcUcGPkx0_2vUy75bkr2qjb7sXo-YI07MZ_KI8uBokKuvge9_il6N/exec";

// ─── TABS ────────────────────────────────────────────────────────────────────
function initTabs() {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach(btn => btn.addEventListener("click", () => {
    tabs.forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("is-visible"));
    document.getElementById("tab-" + btn.dataset.tab).classList.add("is-visible");
  }));
}

// ─── RENDER ──────────────────────────────────────────────────────────────────
function render(data, live) {
  setStatus(live);

  // Summary strip
  const lb = data.leaderboard || [];
  setText("mParticipants", (data.predictions || []).length || "—");
  setText("mLeader", lb.length ? `${lb[0].name} — ${lb[0].points}` : "—");
  setText("mUpdated", data.updatedAt ? new Date(data.updatedAt).toLocaleString() : "—");

  renderLeaderboard(lb);
  renderGroups(data.groups || []);
  renderPredictions(data.predictions || [], data.picksPublic !== false);
}

function renderLeaderboard(rows) {
  const body = document.querySelector("#leaderboard tbody");
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="8" class="empty">Waiting for live group results.</td></tr>`;
    return;
  }
  body.innerHTML = rows.map((r, i) => `
    <tr class="rank-${i + 1}">
      <td>${i + 1}</td>
      <td>${esc(r.name)}</td>
      <td><strong>${r.points}</strong></td>
      <td>${r.possible || "—"}</td>
      <td class="breakdown">${esc(r.breakdown) || "—"}</td>
      <td>${r.perfect || 0}</td>
      <td>${r.excellent || 0}</td>
      <td>${r.good || 0}</td>
    </tr>`).join("");
}

function renderGroups(groups) {
  const grid = document.getElementById("groupsGrid");
  if (!groups.length) {
    grid.innerHTML = `<p class="empty">Standings will appear here shortly.</p>`;
    return;
  }
  grid.innerHTML = groups.map(g => {
    const rows = (g.rows || []).map(r => `
      <tr class="${r.p > 0 ? "" : "dim"}">
        <td>${r.rank}</td>
        <td class="team">${esc(r.team)}</td>
        <td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td>
        <td>${r.gd > 0 ? "+" + r.gd : r.gd}</td>
        <td class="pts">${r.pts}</td>
      </tr>`).join("");
    return `
      <article class="gcard">
        <h4>Group ${g.letter}${g.active ? '<span class="live-tag">LIVE</span>' : ""}</h4>
        <table class="gtable">
          <thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </article>`;
  }).join("");
}

function renderPredictions(list, isPublic) {
  const pill = document.getElementById("picksPill");
  pill.textContent = isPublic ? "Public" : "Private";
  pill.className = isPublic ? "pill" : "pill private";

  const wrap = document.getElementById("predictionsList");
  if (!isPublic) {
    wrap.innerHTML = `<p class="empty">Predictions are private right now.</p>`;
    return;
  }
  if (!list.length) {
    wrap.innerHTML = `<p class="empty">No predictions submitted yet.</p>`;
    return;
  }
  wrap.innerHTML = list.map(p => {
    const groups = (p.groups || []).map(g => {
      const items = g.picks.map(pk => `<li>${esc(pk.team)}</li>`).join("");
      return `<div class="pgroup"><h5>Group ${g.letter}</h5><ol>${items}</ol></div>`;
    }).join("");
    return `<article class="pcard"><h3>${esc(p.name)}</h3><div class="pgroups">${groups}</div></article>`;
  }).join("");
}

// ─── DATA LOADING (JSONP via <script>, same as before) ───────────────────────
function load() {
  if (!WEB_APP_URL || WEB_APP_URL.includes("PASTE")) { render({}, false); return; }
  const s = document.createElement("script");
  s.src = WEB_APP_URL + "?t=" + Date.now();
  s.onload = () => { render(window.POOL_DATA || {}, !!window.POOL_DATA); s.remove(); };
  s.onerror = () => { render({}, false); s.remove(); };
  document.body.appendChild(s);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function setStatus(live) {
  document.getElementById("statusDot").className = "dot" + (live ? " live" : "");
  setText("statusText", live ? "Live" : "Connecting…");
}
function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ─── INIT ────────────────────────────────────────────────────────────────────
initTabs();
load();
setInterval(load, 60000);
