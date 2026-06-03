const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbynLb8d7RplA8Sm1NGfUSDstj9sALufH8KxRyZj56dosVU8FnHf7pkU7BcjVb71zvSp/exec";
const PICKS_PUBLIC = false;
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

  groups.forEach(group => {
    const card = document.createElement("article");
    card.className = "group-card";
    const ordered = [group["1st"], group["2nd"], group["3rd"], group["4th"]].filter(Boolean);
    card.innerHTML = `
      <h4>${group.Group || group.group || "Group"}</h4>
      <ol>
        ${ordered.map(team => `<li>${team}</li>`).join("")}
      </ol>
    `;
    grid.appendChild(card);
  });
}

function normalizePlace(value) {
  const s = String(value || "").trim().toLowerCase();
  if (s === "1st") return 1;
  if (s === "2nd") return 2;
  if (s === "3rd") return 3;
  if (s === "4th") return 4;
  return null;
}

function renderPicks() {
  const grid = document.getElementById("picksGrid");
  const pill = document.getElementById("picksStatePill");
  if (!grid) return;

  if (pill) {
    pill.textContent = PICKS_PUBLIC ? "Public" : "Private";
    pill.classList.toggle("pill--locked", !PICKS_PUBLIC);
  }

  grid.innerHTML = "";

  if (!PICKS_PUBLIC) {
    grid.innerHTML = '<div class="notice-card"><p>Participant picks are private for now.</p></div>';
    return;
  }

  const rows = [...(state.picksRows || [])].filter(Boolean);
  if (!rows.length) {
    grid.innerHTML = '<div class="notice-card"><p>No participant picks received yet.</p></div>';
    return;
  }

  const sortedRows = rows.sort((a, b) => String(a["Leaderboard Name"] || a["Name"] || "").localeCompare(String(b["Leaderboard Name"] || b["Name"] || "")));

  sortedRows.forEach(row => {
    const name = String(row["Leaderboard Name"] || row["Name"] || "").trim() || "Unnamed entrant";
    const groupMap = new Map();

    Object.entries(row).forEach(([key, value]) => {
      const match = String(key || "").trim().match(/^Group\s+([A-L])\s*\[(.+?)\]\s*$/i);
      if (!match) return;

      const groupLetter = match[1].toUpperCase();
      const team = String(match[2] || "").trim();
      const place = normalizePlace(value);
      if (!groupMap.has(groupLetter)) groupMap.set(groupLetter, []);
      groupMap.get(groupLetter).push({ team, place });
    });

    const card = document.createElement("article");
    card.className = "pick-card";

    const groupHtml = [...groupMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([groupLetter, picks]) => {
        const lines = picks
          .sort((a, b) => (a.place || 99) - (b.place || 99) || a.team.localeCompare(b.team))
          .map(p => `<li>${p.place || "-"} — ${p.team}</li>`)
          .join("");

        return `
          <div class="pick-card__group">
            <strong>Group ${groupLetter}</strong>
            <ul>${lines}</ul>
          </div>
        `;
      })
      .join("");

    card.innerHTML = `
      <h4>${name}</h4>
      <div class="pick-card__meta">${groupMap.size} groups submitted</div>
      <div class="pick-card__groups">${groupHtml}</div>
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
