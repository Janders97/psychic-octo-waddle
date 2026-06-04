const WEB_APP_URL = "https://script.google.com/macros/s/AKfycby8iTta0dA1HWIFttZhejQH39NQLdqMGs8xklSwqacCfGmg6hPVYd6rziKX6Pm-kac4/exec";
const PICKS_PUBLIC = true;
const ENTRY_SHEET_URL = "https://docs.google.com/forms/d/e/1FAIpQLSe6zAHK_tEozTJuD1ALQwpPjXFdB1jwwhkRT49sfI8YPoiqTw/viewform";

const state = {
  leaderboardRows: [],
  knockoutRows: [],
  actualGroups: [],
  picksRows: [],
  updatedAt: null,
  isLive: false
};

function initTabs() {
  const tabs = document.querySelectorAll(".tab");
  const panels = {
    leaderboard: document.getElementById("tab-leaderboard"),
    picks: document.getElementById("tab-picks"),
    groups: document.getElementById("tab-groups"),
    rules: document.getElementById("tab-rules"),
    payouts: document.getElementById("tab-payouts")
  };

  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      tabs.forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");

      Object.values(panels).forEach(panel => panel.classList.remove("is-visible"));
      panels[btn.dataset.tab].classList.add("is-visible");
    });
  });
}

function normalizeScore(row) {
  return Number(row["Points Won"] ?? row["Total Points"] ?? row["Score"] ?? 0);
}

function normalizePossible(row) {
  const possible = row["Total Pts Possible"] ?? row["Points Possible"] ?? row["Possible Points"];
  if (possible === null || possible === undefined || possible === "") return null;
  return Number(possible);
}

function topRowFrom(rows) {
  return rows.reduce((best, row) => {
    const bestWon = best ? normalizeScore(best) : -1;
    const rowWon = normalizeScore(row);
    return rowWon > bestWon ? row : best;
  }, null);
}

function renderSummary(rows) {
  const participants = rows.length;
  const topRow = rows.length ? topRowFrom(rows) : null;
  const topWon = topRow ? normalizeScore(topRow) : null;
  const topName = topRow ? String(topRow["Leaderboard Name"] || topRow["Name"] || "") : "";
  const updatedAt = state.updatedAt ? new Date(state.updatedAt) : null;

  const participantsEl = document.getElementById("statParticipants");
  const topScoreEl = document.getElementById("statTopScore");
  const updatedEl = document.getElementById("statUpdated");

  if (participantsEl) participantsEl.textContent = participants ? String(participants) : "-";
  if (topScoreEl) topScoreEl.textContent = topRow ? `${topName} — ${topWon}` : "-";
  if (updatedEl) {
    updatedEl.textContent = updatedAt && !Number.isNaN(updatedAt.getTime())
      ? updatedAt.toLocaleString()
      : "-";
  }
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function renderGroupLeaderboard(rows) {
  const tbody = document.getElementById("groupLeaderboardBody");
  if (!tbody) return;

  const sorted = [...rows].sort((a, b) => {
    const scoreA = normalizeScore(a);
    const scoreB = normalizeScore(b);
    const perfectA = Number(a["Perfect Groups"] ?? 0);
    const perfectB = Number(b["Perfect Groups"] ?? 0);
    const excellentA = Number(a["Excellent Groups"] ?? 0);
    const excellentB = Number(b["Excellent Groups"] ?? 0);
    const goodA = Number(a["Good Groups"] ?? 0);
    const goodB = Number(b["Good Groups"] ?? 0);
    return (scoreB - scoreA) || (perfectB - perfectA) || (excellentB - excellentA) || (goodB - goodA) || String(a["Leaderboard Name"] || "").localeCompare(String(b["Leaderboard Name"] || ""));
  });

  tbody.innerHTML = "";

  if (!sorted.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="muted-cell">Waiting for live group results.</td></tr>`;
    return;
  }

  sorted.forEach((row, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${row["Leaderboard Name"] || row["Name"] || ""}</td>
      <td>${normalizeScore(row)}</td>
      <td>${formatValue(normalizePossible(row))}</td>
      <td class="breakdown-cell">${formatValue(row["Group Breakdown"] ?? row["Breakdown"] ?? row["Group by Group"] ?? row["Group Breakdown "] ?? "")}</td>
      <td>${Number(row["Perfect Groups"] ?? 0)}</td>
      <td>${Number(row["Excellent Groups"] ?? 0)}</td>
      <td>${Number(row["Good Groups"] ?? 0)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderKnockoutLeaderboard(rows) {
  const tbody = document.getElementById("knockoutLeaderboardBody");
  if (!tbody) return;

  const sorted = [...rows].sort((a, b) => {
    const scoreA = normalizeScore(a);
    const scoreB = normalizeScore(b);
    const finalA = Number(a["Final"] ?? 0);
    const finalB = Number(b["Final"] ?? 0);
    const semiA = Number(a["Semi"] ?? a["Semis"] ?? 0);
    const semiB = Number(b["Semi"] ?? b["Semis"] ?? 0);
    const quarterA = Number(a["Quarter"] ?? a["Quarterfinal"] ?? 0);
    const quarterB = Number(b["Quarter"] ?? b["Quarterfinal"] ?? 0);
    const r16A = Number(a["Round of 16"] ?? a["R16"] ?? 0);
    const r16B = Number(b["Round of 16"] ?? b["R16"] ?? 0);
    const r32A = Number(a["Round of 32"] ?? a["R32"] ?? 0);
    const r32B = Number(b["Round of 32"] ?? b["R32"] ?? 0);
    return (scoreB - scoreA) || (finalB - finalA) || (semiB - semiA) || (quarterB - quarterA) || (r16B - r16A) || (r32B - r32A) || String(a["Leaderboard Name"] || "").localeCompare(String(b["Leaderboard Name"] || ""));
  });

  tbody.innerHTML = "";

  if (!sorted.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="muted-cell">Waiting for knockout scores.</td></tr>`;
    return;
  }

  sorted.forEach((row, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${row["Leaderboard Name"] || row["Name"] || ""}</td>
      <td>${normalizeScore(row)}</td>
      <td>${formatValue(normalizePossible(row))}</td>
      <td>${Number(row["Final"] ?? 0)}</td>
      <td>${Number(row["Semi"] ?? row["Semis"] ?? 0)}</td>
      <td>${Number(row["Quarter"] ?? row["Quarterfinal"] ?? 0)}</td>
      <td>${Number(row["Round of 16"] ?? row["R16"] ?? 0)}</td>
      <td>${Number(row["Round of 32"] ?? row["R32"] ?? 0)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderGroups(groups) {
  const grid = document.getElementById("groupsGrid");
  if (!grid) return;
  grid.innerHTML = "";

  if (!groups.length) {
    grid.innerHTML = '<div class="notice-card"><p>Live standings will appear here once results are available.</p></div>';
    return;
  }

  const grouped = {};
  groups.forEach(row => {
    const groupName = String(row.Group || row.group || "").trim();
    if (!groupName) return;
    if (!grouped[groupName]) grouped[groupName] = [];
    grouped[groupName].push(row);
  });

  Object.keys(grouped).sort().forEach(groupName => {
    const rows = grouped[groupName].slice().sort((a, b) => Number(a.Rank || 0) - Number(b.Rank || 0));
    const active = rows.every(r => String(r.Active || "").toLowerCase() === "yes" || Number(r.P || 0) > 0);

    const card = document.createElement("article");
    card.className = "group-card";

    const tableRows = rows.map(r => `
      <tr>
        <td>${Number(r.Rank || 0)}</td>
        <td>${r.Team || ""}</td>
        <td>${Number(r.P || 0)}</td>
        <td>${Number(r.W || 0)}</td>
        <td>${Number(r.D || 0)}</td>
        <td>${Number(r.L || 0)}</td>
        <td>${Number(r.GF || 0)}</td>
        <td>${Number(r.GA || 0)}</td>
        <td>${Number(r.GD || 0)}</td>
        <td>${Number(r.Pts || 0)}</td>
      </tr>
    `).join("");

    card.innerHTML = `
      <h4>${groupName} ${active ? '<span class="pill" style="margin-left:8px; padding:4px 10px;">Live</span>' : ''}</h4>
      <div class="table-wrap">
        <table class="leaderboard-table standings-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>P</th>
              <th>W</th>
              <th>D</th>
              <th>L</th>
              <th>GF</th>
              <th>GA</th>
              <th>GD</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    `;

    grid.appendChild(card);
  });
}

function placeRank(place) {
  const p = String(place || "").trim().toLowerCase();
  if (p === "1st") return 1;
  if (p === "2nd") return 2;
  if (p === "3rd") return 3;
  if (p === "4th") return 4;
  return 99;
}

function renderPicks() {
  const grid = document.getElementById("picksGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const pill = document.getElementById("picksStatePill");
  if (pill) {
    pill.textContent = PICKS_PUBLIC ? "Public" : "Private";
    pill.className = PICKS_PUBLIC ? "pill" : "pill pill--locked";
  }

  if (!PICKS_PUBLIC) {
    grid.innerHTML = '<div class="notice-card"><p>Participant predictions are currently private.</p></div>';
    return;
  }

  const entries = (state.picksRows || []).filter(row => String(row["Leaderboard Name"] || row["Name"] || "").trim());

  if (!entries.length) {
    grid.innerHTML = '<div class="notice-card"><p>No participant predictions have been submitted yet.</p></div>';
    return;
  }

  entries.sort((a, b) => String(a["Leaderboard Name"] || a["Name"] || "").localeCompare(String(b["Leaderboard Name"] || b["Name"] || "")));

  entries.forEach(entry => {
    const name = String(entry["Leaderboard Name"] || entry["Name"] || "Unknown").trim();
    const grouped = {};

    Object.keys(entry).forEach(key => {
      const match = key.match(/^Group\s+([A-L])\s*\[(.+?)\s*\]$/i);
      if (!match) return;
      const groupLetter = match[1].toUpperCase();
      const team = match[2].trim();
      const place = String(entry[key] || "").trim();
      if (!grouped[groupLetter]) grouped[groupLetter] = [];
      grouped[groupLetter].push({ team, place });
    });

    const groupCards = Object.keys(grouped).sort().map(groupLetter => {
      const picks = grouped[groupLetter]
        .sort((a, b) => placeRank(a.place) - placeRank(b.place))
        .map(item => `<li><strong>${item.place}</strong> — ${item.team}</li>`)
        .join("");

      return `
        <article class="group-card">
          <h4>Group ${groupLetter}</h4>
          <ol>${picks}</ol>
        </article>
      `;
    }).join("");

    const card = document.createElement("article");
    card.className = "rules-card";
    card.innerHTML = `
      <h3>${name}</h3>
      <div class="groups-grid">
        ${groupCards}
      </div>
    `;
    grid.appendChild(card);
  });
}

function applyData(payload, isLive) {
  const leaderboardRows = payload?.leaderboardRows || payload?.rows || [];
  const knockoutRows = payload?.knockoutRows || [];
  const actualGroups = payload?.actualGroups || [];
  const picksRows = payload?.picksRows || [];

  state.leaderboardRows = leaderboardRows;
  state.knockoutRows = knockoutRows;
  state.actualGroups = actualGroups;
  state.picksRows = picksRows;
  state.updatedAt = payload?.updatedAt || payload?.generatedAt || new Date().toISOString();
  state.isLive = !!isLive;

  const pill = document.getElementById("dataSourcePill");
  if (pill) {
    pill.textContent = state.isLive ? "live data" : "connecting";
    pill.style.background = state.isLive ? "rgba(141,245,199,0.14)" : "rgba(255,196,97,0.12)";
    pill.style.color = state.isLive ? "#8df5c7" : "#ffd59c";
    pill.style.borderColor = state.isLive ? "rgba(141,245,199,0.22)" : "rgba(255,196,97,0.18)";
  }

  renderGroupLeaderboard(state.leaderboardRows);
  renderKnockoutLeaderboard(state.knockoutRows);
  renderGroups(state.actualGroups);
  renderSummary(state.leaderboardRows.length ? state.leaderboardRows : state.knockoutRows);
  renderPicks();
}

function refreshLiveData() {
  if (!WEB_APP_URL || WEB_APP_URL.includes("PASTE_YOUR_DEPLOYED_WEB_APP_URL_HERE")) {
    applyData({ leaderboardRows: [], knockoutRows: [], actualGroups: [], picksRows: [], updatedAt: null }, false);
    return;
  }

  const script = document.createElement("script");
  script.src = `${WEB_APP_URL}?t=${Date.now()}`;
  script.onload = () => {
    if (window.POOL_DATA) {
      applyData(window.POOL_DATA, true);
    } else {
      applyData({ leaderboardRows: [], knockoutRows: [], actualGroups: [], picksRows: [], updatedAt: null }, false);
    }
    script.remove();
  };
  script.onerror = () => {
    applyData({ leaderboardRows: [], knockoutRows: [], actualGroups: [], picksRows: [], updatedAt: null }, false);
    script.remove();
  };
  document.body.appendChild(script);
}

function initEntryLink() {
  const link = document.getElementById("entrySheetLink");
  if (!link) return;
  if (ENTRY_SHEET_URL && !ENTRY_SHEET_URL.includes("PASTE_YOUR_GOOGLE_SHEET_URL_HERE")) {
    link.href = ENTRY_SHEET_URL;
  } else {
    link.href = "#";
    link.addEventListener("click", e => e.preventDefault());
  }
}

function init() {
  document.title = "World Cup 2026 Pool";
  initTabs();
  initEntryLink();
  refreshLiveData();
  setInterval(refreshLiveData, 60000);
}

document.addEventListener("DOMContentLoaded", init);
