// ─── CONFIG ──────────────────────────────────────────────────────────────────

const WEB_APP_URL    = "https://script.google.com/macros/s/AKfycbxGsLGRoWRvfAng4Hz7KESe4Gj7uIbnpg4XSwF4xf-IErJE4uATDmigNSbUoPmK-9ZU/exec";
const ENTRY_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSe6zAHK_tEozTJuD1ALQwpPjXFdB1jwwhkRT49sfI8YPoiqTw/viewform";

// ─── STATE ───────────────────────────────────────────────────────────────────

const state = {
  leaderboardRows : [],
  knockoutRows    : [],
  knockout        : null,
  selectedKO      : "",
  actualGroups    : [],
  picksRows       : [],
  picksPublic     : true,
  selectedPick    : "",
  updatedAt       : null,
  isLive          : false
};

// ─── TABS ────────────────────────────────────────────────────────────────────

const TAB_IDS = ["leaderboard", "knockout", "picks", "groups", "rules", "payouts"];

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

    const pName = String(row["Leaderboard Name"] || row["Name"] || "").trim();
    if (pName) {
      tr.classList.add("clickable-row");
      tr.tabIndex = 0;
      tr.title = "View " + pName + "'s bracket";
      tr.addEventListener("click", () => showParticipantBracket(pName));
      tr.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); showParticipantBracket(pName); }
      });
    }

    tr.innerHTML =
      `<td>${idx + 1}</td>` +
      `<td>${esc(row["Leaderboard Name"] || row["Name"] || "")}</td>` +
      `<td>${normalizeScore(row)}</td>` +
      `<td>${num(row, "Correct")}</td>` +
      `<td>${num(row, "Final")}</td>` +
      `<td>${num(row, "Semi", "Semis")}</td>` +
      `<td>${num(row, "Quarter", "Quarterfinal")}</td>` +
      `<td>${num(row, "Round of 16", "R16")}</td>` +
      `<td>${num(row, "Round of 32", "R32")}</td>`;
    tbody.appendChild(tr);
  });
}

// ─── KNOCKOUT BRACKETS (graded) ──────────────────────────────────────────────

const KO_ROUND_LABELS = ["Round of 32", "Round of 16", "Quarter-finals", "Semi-finals", "Final"];
const KO_PREFIX = ["R32", "R16", "QF", "SF", "F"];
const KO_SIZES  = [16, 8, 4, 2, 1];

function koRoundIdxOfSlot(sk) {
  if (sk.indexOf("R32") === 0) return 0;
  if (sk.indexOf("R16") === 0) return 1;
  if (sk.indexOf("QF")  === 0) return 2;
  if (sk.indexOf("SF")  === 0) return 3;
  return 4;
}

// Jump from a knockout leaderboard row to that participant's bracket
function showParticipantBracket(name) {
  state.selectedKO = name;
  activateTab("knockout");
  renderKnockoutBracketTab();
  const nav = document.querySelector(".tabs");
  if (nav) nav.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderKnockoutBracketTab() {
  const k = state.knockout;
  const wrap = document.getElementById("koBracketWrap");
  const pill = document.getElementById("koStatePill");
  const ptsBody = document.getElementById("koPointsBody");
  const select = document.getElementById("koSelect");
  if (!wrap) return;

  // Points-per-pick table (built once)
  if (ptsBody && k && k.pointsTable && ptsBody.dataset.filled !== "1") {
    ptsBody.innerHTML = k.pointsTable.map(r =>
      `<tr><td>${esc(r.name || r.team)}</td><td>${r.R32}</td><td>${r.R16}</td>` +
      `<td>${r.QF}</td><td>${r.SF}</td><td>${r.Final}</td></tr>`).join("");
    ptsBody.dataset.filled = "1";
  }

  if (!k || !k.locked) {
    if (pill) { pill.textContent = "Locks " + (k ? new Date(k.lockISO).toLocaleString() : "soon"); pill.className = "pill pill--locked"; }
    if (select) select.style.display = "none";
    wrap.innerHTML = '<div class="notice-card"><p>Brackets become visible here once predictions lock.</p></div>';
    return;
  }

  const preds = (k.predictions || []).slice().sort((a, b) =>
    (b.total - a.total) || String(a.name).localeCompare(String(b.name)));
  if (pill) { pill.textContent = "Locked · graded live"; pill.className = "pill"; }

  if (!preds.length) {
    if (select) select.style.display = "none";
    wrap.innerHTML = "";
    wrap.appendChild(buildActualBracketCard(k));
    const note = document.createElement("div");
    note.className = "notice-card";
    note.innerHTML = "<p>No brackets were submitted.</p>";
    wrap.appendChild(note);
    return;
  }

  // Participant dropdown (default to the leader)
  const names = preds.map(p => p.name);
  if (select) {
    select.style.display = "";
    if (!state.selectedKO || names.indexOf(state.selectedKO) === -1) state.selectedKO = names[0];
    const key = names.join("|");
    if (select.dataset.names !== key) {
      select.innerHTML = '<option value="__all__">All participants</option>' +
        names.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join("");
      select.dataset.names = key;
    }
    select.value = state.selectedKO;
  }

  const shown = state.selectedKO === "__all__" ? preds
    : preds.filter(p => p.name === state.selectedKO);

  wrap.innerHTML = "";
  wrap.appendChild(buildActualBracketCard(k));      // master "what actually happened" bracket
  shown.forEach(p => wrap.appendChild(buildBracketCard(p, k)));
}

// The real bracket as it unfolds — actual winners from results, no grading colours.
function buildActualBracketCard(k) {
  const names = k.teamNames || {};
  const teamLabel = c => esc(names[c] || c || "—");
  const results = k.results || {};
  const decided = Object.keys(results).length;

  const card = document.createElement("article");
  card.className = "rules-card participant-card ko-actual-card";

  const bracket = document.createElement("div");
  bracket.className = "ko-bracket";

  // Column 0 — R32 matchups (white)
  const colM = document.createElement("div");
  colM.className = "ko-col";
  const hM = document.createElement("h5");
  hM.textContent = "Round of 32";
  colM.appendChild(hM);
  (k.bracketR32 || []).forEach(m => {
    const cell = document.createElement("div");
    cell.className = "ko-cell matchup";
    cell.innerHTML = `<span class="ko-team">${teamLabel(m[0])} <span class="ko-vs">v</span> ${teamLabel(m[1])}</span>`;
    colM.appendChild(cell);
  });
  bracket.appendChild(colM);

  // Columns 1–5 — actual winners per round
  const HEAD = ["Wins R32", "Wins R16", "Wins QF", "Wins SF", "Champion"];
  for (let r = 0; r < 5; r++) {
    const col = document.createElement("div");
    col.className = "ko-col";
    const h = document.createElement("h5");
    h.textContent = HEAD[r];
    col.appendChild(h);
    for (let i = 0; i < KO_SIZES[r]; i++) {
      const w = results[KO_PREFIX[r] + (i + 1)] || "";
      const cell = document.createElement("div");
      cell.className = "ko-cell ko-actual" + (w ? " decided" : "") + (r === 4 ? " champion" : "");
      cell.innerHTML = `<span class="ko-team">${w ? teamLabel(w) : "—"}</span>`;
      col.appendChild(cell);
    }
    bracket.appendChild(col);
  }

  card.innerHTML = `<h3>Actual Results <span class="ko-total">${decided}/31 matches in</span></h3>`;
  card.appendChild(bracket);
  return card;
}

function buildBracketCard(pred, k) {
  const names = k.teamNames || {};
  const teamLabel = c => esc(names[c] || c || "—");
  // potential points lookup: code -> {R32,R16,QF,SF,Final}
  const pot = {};
  (k.pointsTable || []).forEach(r => { pot[r.team] = r; });
  const roundKey = ["R32", "R16", "QF", "SF", "Final"];

  const card = document.createElement("article");
  card.className = "rules-card participant-card";

  const bracket = document.createElement("div");
  bracket.className = "ko-bracket";

  // Column 0 — the fixed Round-of-32 matchups, in white
  const colM = document.createElement("div");
  colM.className = "ko-col";
  const hM = document.createElement("h5");
  hM.textContent = "Round of 32";
  colM.appendChild(hM);
  (k.bracketR32 || []).forEach(m => {
    const cell = document.createElement("div");
    cell.className = "ko-cell matchup";
    cell.innerHTML = `<span class="ko-team">${teamLabel(m[0])} <span class="ko-vs">v</span> ${teamLabel(m[1])}</span>`;
    colM.appendChild(cell);
  });
  bracket.appendChild(colM);

  // Columns 1–5 — the participant's advancement picks per round (graded)
  const PICK_HEADERS = ["Wins R32", "Wins R16", "Wins QF", "Wins SF", "Champion"];
  for (let r = 0; r < 5; r++) {
    const col = document.createElement("div");
    col.className = "ko-col";
    const h = document.createElement("h5");
    h.textContent = PICK_HEADERS[r];
    col.appendChild(h);

    for (let i = 0; i < KO_SIZES[r]; i++) {
      const sk = KO_PREFIX[r] + (i + 1);
      const pick = (pred.picks || {})[sk] || "";
      const status = (pred.status || {})[sk] || "pending";
      const scored = (pred.slotPoints || {})[sk] || 0;
      const potential = (pot[pick] && pot[pick][roundKey[r]]) || 0;

      const cell = document.createElement("div");
      cell.className = "ko-cell ko-pick " + status + (r === 4 ? " champion" : "");
      let badge = "";
      if (status === "correct") badge = `<span class="ko-pts good">+${scored}</span>`;
      else if (status === "wrong") badge = `<span class="ko-pts bad">+0</span>`;
      else if (pick) badge = `<span class="ko-pts">+${potential}</span>`; // pending: what's at stake
      cell.innerHTML = `<span class="ko-team">${pick ? teamLabel(pick) : "—"}</span>${badge}`;
      col.appendChild(cell);
    }
    bracket.appendChild(col);
  }

  const correct = Object.keys(pred.status || {}).filter(s => pred.status[s] === "correct").length;
  card.innerHTML = `<h3>${esc(pred.name)} <span class="ko-total">${pred.total} pts · ${correct} correct</span></h3>`;
  card.appendChild(bracket);
  return card;
}

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
  state.actualGroups    = payload.actualGroups    || [];
  state.picksRows       = payload.picksRows       || [];
  state.updatedAt       = payload.updatedAt || payload.generatedAt || new Date().toISOString();
  state.isLive          = !!isLive;

  // Knockout block (from getKnockoutBlock in knockout.gs)
  state.knockout = payload.knockout || null;
  const koScores = (state.knockout && state.knockout.scores) || [];
  state.knockoutRows = koScores.length
    ? koScores.map(s => ({
        "Leaderboard Name": s.name,
        "Score": s.total,
        "Correct": s.correct,
        "Final": s.Final, "Semi": s.SF, "Quarter": s.QF,
        "Round of 16": s.R16, "Round of 32": s.R32
      }))
    : (payload.knockoutRows || []);

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
  renderKnockoutBracketTab();
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

function initKnockoutControls() {
  const select = document.getElementById("koSelect");
  if (!select) return;
  select.addEventListener("change", () => {
    state.selectedKO = select.value;
    renderKnockoutBracketTab();
  });
}

function init() {
  document.title = "World Cup 2026 Pool";
  initTabs();
  initEntryLink();
  initPicksControls();
  initKnockoutControls();
  refreshLiveData();
  setInterval(refreshLiveData, 60_000);
}

document.addEventListener("DOMContentLoaded", init);
