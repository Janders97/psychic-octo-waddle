const WEB_APP_URL = "PASTE_YOUR_DEPLOYED_WEB_APP_URL_HERE";
const PICKS_PUBLIC = false;
const ENTRY_SHEET_URL = "PASTE_YOUR_GOOGLE_SHEET_URL_HERE";

const state = {
  leaderboardRows: [],
  knockoutRows: [],
  actualGroups: [],
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

function scoreText(won, possible) {
  if (won === null || won === undefined) return "-";
  if (possible === null || possible === undefined) return String(won);
  return `${won} / ${possible}`;
}

function normalizeScore(row) {
  return Number(row["Points Won"] ?? row["Total Points"] ?? row["Score"] ?? 0);
}

function normalizePossible(row, won) {
  const possible = row["Points Possible"] ?? row["Possible Points"] ?? row["Points Remaining"] ?? null;
  if (possible !== null && possible !== undefined && possible !== "") return Number(possible);
  return Number.isFinite(won) ? won : null;
}

function renderSummary(rows) {
  const participants = rows.length;
  const topRow = rows.reduce((best, row) => {
    const bestWon = best ? normalizeScore(best) : -1;
    const rowWon = normalizeScore(row);
    return rowWon > bestWon ? row : best;
  }, null);

  const topWon = topRow ? normalizeScore(topRow) : null;
  const topPossible = topRow ? normalizePossible(topRow, topWon) : null;
  const topName = topRow ? String(topRow["Leaderboard Name"] || topRow["Name"] || "") : "";
  const updatedAt = state.updatedAt ? new Date(state.updatedAt) : null;

  const participantsEl = document.getElementById("statParticipants");
  const topScoreEl = document.getElementById("statTopScore");
  const topScorerEl = document.getElementById("statTopScorer");
  const updatedEl = document.getElementById("statUpdated");

  if (participantsEl) participantsEl.textContent = participants ? String(participants) : "-";
  if (topScoreEl) topScoreEl.textContent = topRow ? scoreText(topWon, topPossible) : "-";
  if (topScorerEl) topScorerEl.textContent = topName ? `Top scorer: ${topName}` : "";
  if (updatedEl) {
    updatedEl.textContent = updatedAt && !Number.isNaN(updatedAt.getTime())
      ? updatedAt.toLocaleString()
      : "-";
  }
}

function renderTable(rows, tbodyId, emptyText) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  const sorted = [...rows].sort((a, b) => {
    const scoreA = normalizeScore(a);
    const scoreB = normalizeScore(b);
    return scoreB - scoreA;
  });

  tbody.innerHTML = "";

  if (!sorted.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="muted-cell">${emptyText}</td></tr>`;
    return;
  }

  sorted.forEach((row, idx) => {
    const pointsWon = normalizeScore(row);
    const pointsPossible = normalizePossible(row, pointsWon);
    const pointsRemaining = row["Points Remaining"] ?? (pointsPossible !== null ? Math.max(Number(pointsPossible) - Number(pointsWon), 0) : null);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${row["Leaderboard Name"] || row["Name"] || ""}</td>
      <td>${scoreText(pointsWon, pointsPossible)}</td>
      <td>${pointsRemaining === null ? "-" : pointsRemaining}</td>
      <td>${row["Perfect Groups"] ?? 0}</td>
      <td>${row["Excellent Groups"] ?? 0}</td>
      <td>${row["Good Groups"] ?? 0}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderGroups(groups) {
  const grid = document.getElementById("groupsGrid");
  if (!grid) return;
  grid.innerHTML = "";

  if (!groups.length) {
    grid.innerHTML = '<div class="notice-card"><p>Waiting for live group standings from the sheet feed.</p></div>';
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

function renderPicks() {
  const grid = document.getElementById("picksGrid");
  if (!grid) return;
  grid.innerHTML = "";

  if (!PICKS_PUBLIC) return;

  grid.innerHTML = '<div class="notice-card"><p>Participant picks are ready to be revealed later.</p></div>';
}

function applyData(payload, isLive) {
  const leaderboardRows = payload?.leaderboardRows || payload?.rows || [];
  const knockoutRows = payload?.knockoutRows || [];
  const actualGroups = payload?.actualGroups || [];

  state.leaderboardRows = leaderboardRows;
  state.knockoutRows = knockoutRows;
  state.actualGroups = actualGroups;
  state.updatedAt = payload?.updatedAt || payload?.generatedAt || new Date().toISOString();
  state.isLive = !!isLive;

  const pill = document.getElementById("dataSourcePill");
  if (pill) {
    pill.textContent = state.isLive ? "Live sheet data" : "Connecting";
    pill.style.background = state.isLive ? "rgba(141,245,199,0.14)" : "rgba(255,196,97,0.12)";
    pill.style.color = state.isLive ? "#8df5c7" : "#ffd59c";
    pill.style.borderColor = state.isLive ? "rgba(141,245,199,0.22)" : "rgba(255,196,97,0.18)";
  }

  renderLeaderboard();
  renderGroups(state.actualGroups);
  renderSummary(state.leaderboardRows.length ? state.leaderboardRows : state.knockoutRows);
}

function renderLeaderboard() {
  renderTable(state.leaderboardRows, "groupLeaderboardBody", "Connecting to live sheet data...");
  renderTable(state.knockoutRows, "knockoutLeaderboardBody", "Waiting for knockout scores...");
}

function refreshLiveData() {
  if (!WEB_APP_URL || WEB_APP_URL.includes("PASTE_YOUR_DEPLOYED_WEB_APP_URL_HERE")) {
    applyData({ leaderboardRows: [], knockoutRows: [], actualGroups: [], updatedAt: null }, false);
    return;
  }

  const script = document.createElement("script");
  script.src = `${WEB_APP_URL}?t=${Date.now()}`;
  script.onload = () => {
    if (window.POOL_DATA) {
      applyData(window.POOL_DATA, true);
    } else {
      applyData({ leaderboardRows: [], knockoutRows: [], actualGroups: [], updatedAt: null }, false);
    }
    script.remove();
  };
  script.onerror = () => {
    applyData({ leaderboardRows: [], knockoutRows: [], actualGroups: [], updatedAt: null }, false);
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
  renderPicks();
  initEntryLink();
  refreshLiveData();
  setInterval(refreshLiveData, 60000);
}

document.addEventListener("DOMContentLoaded", init);
