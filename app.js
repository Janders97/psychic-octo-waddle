// ─── CONFIG ──────────────────────────────────────────────────────────────────

const WEB_APP_URL    = "https://script.google.com/macros/s/AKfycbxfghiDreRM0OittBv8bKi4ak25KlMXhzx9Cq_h-UA58_qcVbBcv3Hw7mQ-WeyoUW_N/exec";
const ENTRY_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSe6zAHK_tEozTJuD1ALQwpPjXFdB1jwwhkRT49sfI8YPoiqTw/viewform";

// ─── STATE ───────────────────────────────────────────────────────────────────

const state = {
  leaderboardRows : [],
  knockoutRows    : [],
  actualGroups    : [],
  picksRows       : [],
  picksPublic     : true,
  selectedPick    : "",
  updatedAt       : null,
  isLive          : false
};

// ─── TABS ────────────────────────────────────────────────────────────────────

const TAB_IDS = ["leaderboard", "picks", "groups", "rules", "payouts"];

function activateTab(name) {
  document.querySelectorAll(".tab").forEach(b =>
    b.classList.toggle("is-active", b.dataset.tab === name)
  );
  TAB_IDS.forEach(id => {
    const p = document.getElementById("tab-" + id);
    if (p) p.classList.toggle("is-visible", id === name);
  });
}

function initTabs() {
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => activateTab(btn.dataset.tab));
  });
}

// Jump from a leaderboard row to that participant's predictions
function showParticipantPicks(name) {
  state.selectedPick = name;
  activateTab("picks");
  renderPicks();
  const nav = document.querySelector(".tabs");
  if (nav) nav.scrollIntoView({ behavior: "smooth", block: "start" });
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
      (num(b, "Bullseyes", "Exact Placements") - num(a, "Bullseyes", "Exact Placements")) ||
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
    (num(b, "Bullseyes", "Exact Placements") - num(a, "Bullseyes", "Exact Placements")) ||
    String(a["Leaderboard Name"] || "").localeCompare(String(b["Leaderboard Name"] || ""))
  );

  tbody.innerHTML = "";
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="muted-cell">Waiting for live group results.</td></tr>`;
    return;
  }

  rows.forEach((row, idx) => {
    const tr = document.createElement("tr");

    // Colour top 5 rows to reflect payout positions
    if (idx < POSITION_CLASSES.length) {
      tr.classList.add(POSITION_CLASSES[idx]);
    }

    // Click a row to jump to that participant's predictions
    const pName = String(row["Leaderboard Name"] || row["Name"] || "").trim();
    if (pName) {
      tr.classList.add("clickable-row");
      tr.tabIndex = 0;
      tr.title = "View " + pName + "'s predictions";
      tr.addEventListener("click", () => showParticipantPicks(pName));
      tr.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); showParticipantPicks(pName); }
      });
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
      `<td>${num(row, "Good Groups")}</td>` +
      `<td>${num(row, "Bullseyes", "Exact Placements")}</td>`;
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

// Same canonicalization the scorer uses, so picks line up with ESPN names
const TEAM_ALIASES = {
  "korea republic": "south korea", "republic of korea": "south korea", "korea dpr": "north korea",
  "czech republic": "czechia", "usa": "united states", "united states of america": "united states",
  "ir iran": "iran", "china pr": "china", "ivory coast": "cote divoire", "cote d'ivoire": "cote divoire",
  "cape verde": "cabo verde", "bosnia and herzegovina": "bosnia", "bosnia-herzegovina": "bosnia",
  "bosnia & herzegovina": "bosnia", "turkiye": "turkey", "congo dr": "dr congo"
};

function canonTeam(s) {
  const n = String(s == null ? "" : s)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim().toLowerCase().replace(/\s+/g, " ");
  return TEAM_ALIASES[n] || n;
}

function groupLetter(s) {
  const str = String(s || "");
  const m = str.match(/group\s+([A-L])/i) || str.match(/\b([A-L])\b\s*$/i);
  return m ? m[1].toUpperCase() : "";
}

// letter -> { byTeam: {canonName: actualRank}, scored: bool }
function buildActualLookup() {
  const out = {};
  (state.actualGroups || []).forEach(row => {
    const L = groupLetter(row.Group || row.group);
    if (!L) return;
    if (!out[L]) out[L] = { byTeam: {}, played: 0, total: 0 };
    out[L].byTeam[canonTeam(row.Team || row.team || "")] = Number(row.Rank || row.rank || 0);
    out[L].total += 1;
    if (Number(row.P || 0) > 0) out[L].played += 1;
  });
  Object.keys(out).forEach(L => {
    out[L].scored = out[L].total > 0 && out[L].played === out[L].total;
  });
  return out;
}

// "" (no colour) until the group is scored, then green/yellow/orange/red by accuracy
function pickDiffClass(item, actual) {
  if (!actual || !actual.scored) return "";
  const actualRank = actual.byTeam[canonTeam(item.team)];
  const predPlace = placeRank(item.place);
  if (!(actualRank >= 1 && actualRank <= 4) || !(predPlace >= 1 && predPlace <= 4)) return "";
  const diff = Math.abs(predPlace - actualRank);
  if (diff === 0) return " pick-correct";
  if (diff === 1) return " pick-off1";
  if (diff === 2) return " pick-off2";
  return " pick-off3";
}

function renderPicks() {
  const grid = document.getElementById("picksGrid");
  if (!grid) return;

  const select = document.getElementById("picksSelect");
  const pill = document.getElementById("picksStatePill");
  if (pill) {
    pill.textContent = state.picksPublic ? "Public" : "Private";
    pill.className   = state.picksPublic ? "pill" : "pill pill--locked";
  }

  if (!state.picksPublic) {
    grid.innerHTML = '<div class="notice-card"><p>Participant predictions are currently private.</p></div>';
    if (select) select.style.display = "none";
    return;
  }

  const entries = (state.picksRows || []).filter(r =>
    String(r["Leaderboard Name"] || r["Name"] || "").trim()
  );

  if (!entries.length) {
    grid.innerHTML = '<div class="notice-card"><p>No participant predictions have been submitted yet.</p></div>';
    if (select) select.style.display = "none";
    return;
  }

  entries.sort((a, b) =>
    String(a["Leaderboard Name"] || a["Name"] || "").localeCompare(
    String(b["Leaderboard Name"] || b["Name"] || ""))
  );

  // Populate the jump-to dropdown (only rebuild options when the names change)
  const names = entries.map(e => String(e["Leaderboard Name"] || e["Name"] || "").trim());
  if (select) {
    select.style.display = "";
    if (!state.selectedPick || names.indexOf(state.selectedPick) === -1) state.selectedPick = "";
    const key = names.join("|");
    if (select.dataset.names !== key) {
      select.innerHTML =
        '<option value="">All participants</option>' +
        names.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join("");
      select.dataset.names = key;
    }
    select.value = state.selectedPick;
  }

  const shown = state.selectedPick
    ? entries.filter(e => String(e["Leaderboard Name"] || e["Name"] || "").trim() === state.selectedPick)
    : entries;

  const actualLookup = buildActualLookup();
  grid.innerHTML = "";
  shown.forEach(entry => grid.appendChild(buildPickCard(entry, actualLookup)));
}

function buildPickCard(entry, actualLookup) {
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
    const actual = actualLookup ? actualLookup[letter] : null;
    const picks = grouped[letter]
      .sort((a, b) => placeRank(a.place) - placeRank(b.place))
      .map(item => {
        const cls = pickDiffClass(item, actual);
        return `<li><span class="pick-place">${esc(item.place)}</span>` +
               `<span class="pick-team${cls}">${esc(item.team)}</span></li>`;
      })
      .join("");
    return `<article class="group-card"><h4>Group ${letter}</h4><ul class="picks-list">${picks}</ul></article>`;
  }).join("");

  const card = document.createElement("article");
  card.className = "rules-card participant-card";
  card.innerHTML = `<h3>${name}</h3><div class="groups-grid">${groupCards}</div>`;
  return card;
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

function initPicksControls() {
  const select = document.getElementById("picksSelect");
  if (!select) return;
  select.addEventListener("change", () => {
    state.selectedPick = select.value;
    renderPicks();
  });
}

function init() {
  document.title = "World Cup 2026 Pool";
  initTabs();
  initEntryLink();
  initPicksControls();
  refreshLiveData();
  setInterval(refreshLiveData, 60_000);
}

document.addEventListener("DOMContentLoaded", init);
