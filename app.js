// ─── CONFIG ──────────────────────────────────────────────────────────────────

const WEB_APP_URL    = "https://script.google.com/macros/s/AKfycbw3JpiDW5CPq9VxcUcGPkx0_2vUy75bkr2qjb7sXo-YI07MZ_KI8uBokKuvge9_il6N/exec";
const ENTRY_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSe6zAHK_tEozTJuD1ALQwpPjXFdB1jwwhkRT49sfI8YPoiqTw/viewform";

// ─── STATE ───────────────────────────────────────────────────────────────────

const state = {
  leaderboardRows : [],
  knockoutRows    : [],
  actualGroups    : [],
  picksRows       : [],
  picksPublic     : true,
  updatedAt       : null,
  isLive          : false
};

// ─── TABS ────────────────────────────────────────────────────────────────────

function initTabs() {
  const tabs = document.querySelectorAll(".tab");
  const panelIds = ["leaderboard", "picks", "groups", "rules", "payouts"];
  const panels = {};
  panelIds.forEach(id => { panels[id] = document.getElementById("tab-" + id); });

  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      tabs.forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      Object.values(panels).forEach(p => p && p.classList.remove("is-visible"));
      const target = panels[btn.dataset.tab];
      if (target) target.classList.add("is-visible");
    });
  });
}

// ─── SUMMARY BAR ─────────────────────────────────────────────────────────────

function renderSummary() {
  const rows = state.leaderboardRows.length ? state.leaderboardRows : state.knockoutRows;

  const participantCount = (state.picksRows || []).filter(r =>
    String(r["Leaderboard Name"] || r["Name"] || "").trim()
  ).length;

  // Sort the same way as the leaderboard to guarantee we pick the true #1
  let topName = "-", topScore = "-";
  if (rows.length) {
    const sorted = [...rows].sort((a, b) =>
      (normalizeScore(b) - normalizeScore(a)) ||
      (num(b, "Perfect Groups")   - num(a, "Perfect Groups"))   ||
      (num(b, "Excellent Groups") - num(a, "Excellent Groups")) ||
      (num(b, "Good Groups")      - num(a, "Good Groups"))      ||
      String(a["Leaderboard Name"] || "").localeCompare(String(b["Leaderboard Name"] || ""))
    );
    const top = sorted[0];
    topName  = String(top["Leaderboard Name"] || top["Name"] || "");
    topScore = String(normalizeScore(top));
  }

  const updatedAt = state.updatedAt ? new Date(state.updatedAt) : null;

  setText("statParticipants", participantCount || "-");
  setText("statTopScore",     rows.length ? topName + " — " + topScore : "-");
  setText("statUpdated",      updatedAt && !isNaN(updatedAt) ? updatedAt.toLocaleString() : "-");
}

// ─── GROUP LEADERBOARD ───────────────────────────────────────────────────────

// Payout position CSS classes — top 5 get coloured rows matching prize places
const POSITION_CLASSES = ["pos-1st", "pos-2nd", "pos-3rd", "pos-4th", "pos-5th"];

function renderGroupLeaderboard() {
  const tbody = document.getElementById("groupLeaderboardBody");
  if (!tbody) return;

  const rows = [...state.leaderboardRows].sort((a, b) =>
    (normalizeScore(b) - normalizeScore(a)) ||
    (num(b, "Perfect Groups")   - num(a, "Perfect Groups"))   ||
    (num(b, "Excellent Groups") - num(a, "Excellent Groups")) ||
    (num(b, "Good Groups")      - num(a, "Good Groups"))      ||
    String(a["Leaderboard Name"] || "").localeCompare(String(b["Leaderboard Name"] || ""))
  );

  tbody.innerHTML = "";
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="muted-cell">Waiting for live group results.</td></tr>`;
    return;
  }

  rows.forEach((row, idx) => {
    const tr = document.createElement("tr");

    // Colour top 5 rows to reflect payout positions
    if (idx < POSITION_CLASSES.length) {
      tr.classList.add(POSITION_CLASSES[idx]);
    }

    const rawBreakdown = row["Group Breakdown"] || row["Breakdown"] || row["Group by Group"] || row["Group Breakdown "] || "";
    // Strip any legacy adjective labels e.g. "A:Perfect(20)" → "Group A: 20/20"
    const breakdown = rawBreakdown
      .replace(/\bGroup\s+/gi, 'Group ')
      .replace(/([A-L]):\s*(?:Perfect|Excellent|Good|Poor)?\s*\(?(\d+)\)?/gi, 'Group $1: $2/20')
      .trim();

    tr.innerHTML =
      `<td>${idx + 1}</td>` +
      `<td>${esc(row["Leaderboard Name"] || row["Name"] || "")}</td>` +
      `<td>${normalizeScore(row)}</td>` +
      `<td>${fmtPossible(row)}</td>` +
      `<td class="breakdown-cell">${esc(breakdown) || "-"}</td>` +
      `<td>${num(row, "Perfect Groups")}</td>` +
      `<td>${num(row, "Excellent Groups")}</td>` +
      `<td>${num(row, "Good Groups")}</td>`;
    tbody.appendChild(tr);
  });
}

// ─── KNOCKOUT LEADERBOARD ────────────────────────────────────────────────────

function renderKnockoutLeaderboard() {
  const tbody = document.getElementById("knockoutLeaderboardBody");
  if (!tbody) return;

  const rows = [...state.knockoutRows].sort((a, b) =>
    (normalizeScore(b)                    - normalizeScore(a))                    ||
    (num(b, "Final")                      - num(a, "Final"))                      ||
    (num(b, "Semi", "Semis")              - num(a, "Semi", "Semis"))              ||
    (num(b, "Quarter", "Quarterfinal")    - num(a, "Quarter", "Quarterfinal"))    ||
    (num(b, "Round of 16", "R16")         - num(a, "Round of 16", "R16"))         ||
    (num(b, "Round of 32", "R32")         - num(a, "Round of 32", "R32"))         ||
    String(a["Leaderboard Name"] || "").localeCompare(String(b["Leaderboard Name"] || ""))
  );

  tbody.innerHTML = "";
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="muted-cell">Waiting for knockout scores.</td></tr>`;
    return;
  }

  rows.forEach((row, idx) => {
    const tr = document.createElement("tr");
    if (idx < POSITION_CLASSES.length) tr.classList.add(POSITION_CLASSES[idx]);
    tr.innerHTML =
      `<td>${idx + 1}</td>` +
      `<td>${esc(row["Leaderboard Name"] || row["Name"] || "")}</td>` +
      `<td>${normalizeScore(row)}</td>` +
      `<td>${fmtPossible(row)}</td>` +
      `<td>${num(row, "Final")}</td>` +
      `<td>${num(row, "Semi", "Semis")}</td>` +
      `<td>${num(row, "Quarter", "Quarterfinal")}</td>` +
      `<td>${num(row, "Round of 16", "R16")}</td>` +
      `<td>${num(row, "Round of 32", "R32")}</td>`;
    tbody.appendChild(tr);
  });
}

// ─── LIVE GROUP STANDINGS ────────────────────────────────────────────────────

function renderGroups() {
  const grid = document.getElementById("groupsGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const groups = state.actualGroups;
  if (!groups.length) {
    grid.innerHTML = '<div class="notice-card"><p>Live standings will appear here once results are available.</p></div>';
    return;
  }

  const buckets = {};
  groups.forEach(row => {
    const name = String(row.Group || row.group || "").trim();
    if (!name) return;
    if (!buckets[name]) buckets[name] = [];
    buckets[name].push(row);
  });

  Object.keys(buckets).sort().forEach(groupName => {
    const rows     = buckets[groupName].slice().sort((a, b) => Number(a.Rank || 0) - Number(b.Rank || 0));
    const hasGames = rows.some(r => Number(r.P || 0) > 0);

    const card = document.createElement("article");
    card.className = "group-card";

    const tableRows = rows.map(r => {
      const pts      = Number(r.Pts || 0);
      const p        = Number(r.P   || 0);
      const rowClass = p > 0 ? "" : ' class="not-played"';
      return `<tr${rowClass}>` +
        `<td>${Number(r.Rank || 0)}</td>` +
        `<td>${esc(r.Team || "")}</td>` +
        `<td>${p}</td>` +
        `<td>${Number(r.W  || 0)}</td>` +
        `<td>${Number(r.D  || 0)}</td>` +
        `<td>${Number(r.L  || 0)}</td>` +
        `<td>${Number(r.GF || 0)}</td>` +
        `<td>${Number(r.GA || 0)}</td>` +
        `<td>${Number(r.GD || 0)}</td>` +
        `<td><strong>${pts}</strong></td>` +
        `</tr>`;
    }).join("");

    card.innerHTML =
      `<h4>${esc(groupName)}${hasGames ? ' <span class="pill" style="margin-left:8px;padding:4px 10px;">Live</span>' : ""}</h4>` +
      `<div class="table-wrap">` +
        `<table class="leaderboard-table standings-table">` +
          `<thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr></thead>` +
          `<tbody>${tableRows}</tbody>` +
        `</table>` +
      `</div>`;

    grid.appendChild(card);
  });
}

// ─── SUBMITTED PREDICTIONS ───────────────────────────────────────────────────

function renderPicks() {
  const grid = document.getElementById("picksGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const pill = document.getElementById("picksStatePill");
  if (pill) {
    pill.textContent = state.picksPublic ? "Public" : "Private";
    pill.className   = state.picksPublic ? "pill" : "pill pill--locked";
  }

  if (!state.picksPublic) {
    grid.innerHTML = '<div class="notice-card"><p>Participant predictions are currently private.</p></div>';
    return;
  }

  const entries = (state.picksRows || []).filter(r =>
    String(r["Leaderboard Name"] || r["Name"] || "").trim()
  );

  if (!entries.length) {
    grid.innerHTML = '<div class="notice-card"><p>No participant predictions have been submitted yet.</p></div>';
    return;
  }

  entries.sort((a, b) =>
    String(a["Leaderboard Name"] || a["Name"] || "").localeCompare(
    String(b["Leaderboard Name"] || b["Name"] || ""))
  );

  entries.forEach(entry => {
    const name = esc(String(entry["Leaderboard Name"] || entry["Name"] || "Unknown").trim());

    const grouped = {};
    Object.keys(entry).forEach(key => {
      const m = key.match(/^Group\s+([A-L])\s*\[(.+?)\s*\]$/i);
      if (!m) return;
      const letter = m[1].toUpperCase();
      const team   = m[2].trim();
      const place  = String(entry[key] || "").trim();
      if (!place) return;
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push({ team, place });
    });

    const groupCards = Object.keys(grouped).sort().map(letter => {
      const picks = grouped[letter]
        .sort((a, b) => placeRank(a.place) - placeRank(b.place))
        .map(item => `<li><span class="pick-place">${esc(item.place)}</span> ${esc(item.team)}</li>`)
        .join("");
      return `<article class="group-card"><h4>Group ${letter}</h4><ol class="picks-list">${picks}</ol></article>`;
    }).join("");

    const card = document.createElement("article");
    card.className = "rules-card participant-card";
    card.innerHTML = `<h3>${name}</h3><div class="groups-grid">${groupCards}</div>`;
    grid.appendChild(card);
  });
}

// ─── DATA LOADING ────────────────────────────────────────────────────────────

function applyData(payload, isLive) {
  state.leaderboardRows = payload.leaderboardRows || payload.rows || [];
  state.knockoutRows    = payload.knockoutRows    || [];
  state.actualGroups    = payload.actualGroups    || [];
  state.picksRows       = payload.picksRows       || [];
  state.updatedAt       = payload.updatedAt || payload.generatedAt || new Date().toISOString();
  state.isLive          = !!isLive;

  if (typeof payload.picksPublic === "boolean") {
    state.picksPublic = payload.picksPublic;
  }

  const pill = document.getElementById("dataSourcePill");
  if (pill) {
    if (state.isLive) {
      pill.textContent       = "live data";
      pill.style.background  = "rgba(141,245,199,0.14)";
      pill.style.color       = "#8df5c7";
      pill.style.borderColor = "rgba(141,245,199,0.22)";
    } else {
      pill.textContent       = "connecting";
      pill.style.background  = "rgba(255,196,97,0.12)";
      pill.style.color       = "#ffd59c";
      pill.style.borderColor = "rgba(255,196,97,0.18)";
    }
  }

  renderGroupLeaderboard();
  renderKnockoutLeaderboard();
  renderGroups();
  renderSummary();
  renderPicks();
}

function refreshLiveData() {
  if (!WEB_APP_URL || WEB_APP_URL.includes("PASTE_YOUR")) {
    applyData({}, false);
    return;
  }

  const script  = document.createElement("script");
  script.src    = WEB_APP_URL + "?t=" + Date.now();

  script.onload = () => {
    if (window.POOL_DATA) {
      applyData(window.POOL_DATA, true);
    } else {
      applyData({}, false);
    }
    script.remove();
  };

  script.onerror = () => {
    applyData({}, false);
    script.remove();
  };

  document.body.appendChild(script);
}

// ─── ENTRY LINK ──────────────────────────────────────────────────────────────

function initEntryLink() {
  const link = document.getElementById("entrySheetLink");
  if (!link) return;
  if (ENTRY_FORM_URL && !ENTRY_FORM_URL.includes("PASTE_YOUR")) {
    link.href = ENTRY_FORM_URL;
  } else {
    link.href = "#";
    link.addEventListener("click", e => e.preventDefault());
  }
}

// ─── UTILITY ─────────────────────────────────────────────────────────────────

function normalizeScore(row) {
  return Number(row["Points Won"] ?? row["Total Points"] ?? row["Score"] ?? 0);
}

function fmtPossible(row) {
  const v = row["Total Pts Possible"] ?? row["Points Possible"] ?? row["Possible Points"];
  return (v === null || v === undefined || v === "") ? "-" : String(Number(v));
}

function num(row, ...keys) {
  for (const k of keys) {
    const v = row[k];
    if (v !== null && v !== undefined && v !== "") return Number(v);
  }
  return 0;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function placeRank(place) {
  const p = String(place || "").trim().toLowerCase();
  if (p === "1st" || p === "1") return 1;
  if (p === "2nd" || p === "2") return 2;
  if (p === "3rd" || p === "3") return 3;
  if (p === "4th" || p === "4") return 4;
  return 99;
}

// ─── INIT ────────────────────────────────────────────────────────────────────

function init() {
  document.title = "World Cup 2026 Pool";
  initTabs();
  initEntryLink();
  refreshLiveData();
  setInterval(refreshLiveData, 60_000);
}

document.addEventListener("DOMContentLoaded", init);
