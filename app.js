const WEB_APP_URL = "PASTE_YOUR_DEPLOYED_WEB_APP_URL_HERE";
const PICKS_PUBLIC = false;
const ENTRY_SHEET_URL = "PASTE_YOUR_GOOGLE_SHEET_URL_HERE";

const SAMPLE_DATA = {
  updatedAt: new Date().toISOString(),
  rows: [
    { "Leaderboard Name": "Jordan", "Points Won": 102, "Points Possible": 198, "Points Remaining": 96, "Perfect Groups": 3, "Excellent Groups": 4, "Good Groups": 2 },
    { "Leaderboard Name": "Sophie", "Points Won": 97, "Points Possible": 198, "Points Remaining": 101, "Perfect Groups": 2, "Excellent Groups": 5, "Good Groups": 3 },
    { "Leaderboard Name": "Alex", "Points Won": 90, "Points Possible": 198, "Points Remaining": 108, "Perfect Groups": 2, "Excellent Groups": 4, "Good Groups": 2 },
    { "Leaderboard Name": "Maya", "Points Won": 84, "Points Possible": 198, "Points Remaining": 114, "Perfect Groups": 1, "Excellent Groups": 3, "Good Groups": 4 }
  ]
};

const SAMPLE_GROUPS = [
  { group: "A", teams: ["Mexico", "South Africa", "South Korea", "Czechia"] },
  { group: "B", teams: ["Canada", "Bosnia and Herzegovina", "Qatar", "Switzerland"] },
  { group: "C", teams: ["Brazil", "Morocco", "Haiti", "Scotland"] },
  { group: "D", teams: ["USA", "Paraguay", "Australia", "Turkey"] },
  { group: "E", teams: ["Germany", "Curacao", "Ivory Coast", "Ecuador"] },
  { group: "F", teams: ["Netherlands", "Japan", "Sweden", "Tunisia"] },
  { group: "G", teams: ["Belgium", "Egypt", "Iran", "New Zealand"] },
  { group: "H", teams: ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"] },
  { group: "I", teams: ["France", "Senegal", "Iraq", "Norway"] },
  { group: "J", teams: ["Argentina", "Algeria", "Austria", "Jordan"] },
  { group: "K", teams: ["Portugal", "DR Congo", "Uzbekistan", "Colombia"] },
  { group: "L", teams: ["England", "Croatia", "Ghana", "Panama"] }
];

const SAMPLE_PICKS = [
  {
    name: "Jordan",
    picks: {
      A: ["Mexico", "South Korea", "South Africa", "Czechia"],
      B: ["Switzerland", "Canada", "Qatar", "Bosnia and Herzegovina"],
      C: ["Brazil", "Morocco", "Scotland", "Haiti"]
    }
  },
  {
    name: "Sophie",
    picks: {
      A: ["Mexico", "South Africa", "South Korea", "Czechia"],
      D: ["USA", "Paraguay", "Australia", "Turkey"],
      H: ["Spain", "Uruguay", "Saudi Arabia", "Cape Verde"]
    }
  },
  {
    name: "Alex",
    picks: {
      B: ["Canada", "Switzerland", "Bosnia and Herzegovina", "Qatar"],
      F: ["Netherlands", "Japan", "Sweden", "Tunisia"],
      J: ["Argentina", "Austria", "Algeria", "Jordan"]
    }
  }
];

const state = {
  data: SAMPLE_DATA,
  groups: SAMPLE_GROUPS,
  updatedAt: SAMPLE_DATA.updatedAt,
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
  if (won === null || won === undefined) return "—";
  if (possible === null || possible === undefined) return String(won);
  return `${won} / ${possible}`;
}

function renderSummary(rows) {
  const participants = rows.length;
  const topRow = rows.reduce((best, row) => {
    const bestWon = Number(best?.["Points Won"] ?? best?.["Total Points"] ?? 0);
    const rowWon = Number(row["Points Won"] ?? row["Total Points"] ?? 0);
    return rowWon > bestWon ? row : best;
  }, null);

  const topWon = Number(topRow?.["Points Won"] ?? topRow?.["Total Points"] ?? 0);
  const topPossible = Number(topRow?.["Points Possible"] ?? topRow?.["Possible Points"] ?? 0);
  const updatedAt = state.updatedAt ? new Date(state.updatedAt) : null;

  document.getElementById("statParticipants").textContent = participants ? String(participants) : "—";
  document.getElementById("statTopScore").textContent = topRow ? scoreText(topWon, topPossible || null) : "—";
  document.getElementById("statUpdated").textContent = updatedAt && !Number.isNaN(updatedAt.getTime())
    ? updatedAt.toLocaleString()
    : "—";
}

function renderLeaderboard(rows) {
  const tbody = document.getElementById("leaderboardBody");
  if (!tbody) return;

  const sorted = [...rows].sort((a, b) => {
    const scoreA = Number(a["Points Won"] ?? a["Total Points"] ?? 0);
    const scoreB = Number(b["Points Won"] ?? b["Total Points"] ?? 0);
    return scoreB - scoreA;
  });

  tbody.innerHTML = "";

  if (!sorted.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="muted-cell">No scores loaded yet.</td></tr>';
    renderSummary([]);
    return;
  }

  sorted.forEach((row, idx) => {
    const pointsWon = Number(row["Points Won"] ?? row["Total Points"] ?? 0);
    const possible = row["Points Possible"] ?? row["Possible Points"] ?? null;
    const remaining = row["Points Remaining"] ?? row["Possible Remaining"] ?? (possible !== null ? Math.max(Number(possible) - pointsWon, 0) : null);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${row["Leaderboard Name"] || row["Name"] || ""}</td>
      <td>${scoreText(pointsWon, possible)}</td>
      <td>${remaining === null ? "—" : remaining}</td>
      <td>${row["Perfect Groups"] ?? 0}</td>
      <td>${row["Excellent Groups"] ?? 0}</td>
      <td>${row["Good Groups"] ?? 0}</td>
    `;
    tbody.appendChild(tr);
  });

  renderSummary(sorted);
}

function renderGroups(groups) {
  const grid = document.getElementById("groupsGrid");
  if (!grid) return;
  grid.innerHTML = "";

  groups.forEach(group => {
    const card = document.createElement("article");
    card.className = "group-card";
    card.innerHTML = `
      <h4>Group ${group.group}</h4>
      <ul>
        ${group.teams.map(team => `<li>${team}</li>`).join("")}
      </ul>
    `;
    grid.appendChild(card);
  });
}

function renderPicks(picks) {
  const grid = document.getElementById("picksGrid");
  if (!grid) return;

  if (!PICKS_PUBLIC) {
    grid.innerHTML = "";
    return;
  }

  grid.innerHTML = "";
  picks.forEach(person => {
    const card = document.createElement("article");
    card.className = "pick-card";
    const groupsHtml = Object.entries(person.picks).map(([group, teams]) => `
      <div style="margin-top:12px;">
        <strong>Group ${group}</strong>
        <ul>
          ${teams.map(team => `<li>${team}</li>`).join("")}
        </ul>
      </div>
    `).join("");
    card.innerHTML = `<h4>${person.name}</h4>${groupsHtml}`;
    grid.appendChild(card);
  });
}

function applyData(payload, isLive) {
  const rows = payload?.rows || [];
  state.data = payload;
  state.updatedAt = payload?.updatedAt || payload?.generatedAt || new Date().toISOString();
  state.isLive = !!isLive;

  const pill = document.getElementById("dataSourcePill");
  if (pill) {
    pill.textContent = state.isLive ? "Live sheet data" : "Sample data";
    pill.style.background = state.isLive ? "rgba(141,245,199,0.14)" : "rgba(255,196,97,0.12)";
    pill.style.color = state.isLive ? "#8df5c7" : "#ffd59c";
    pill.style.borderColor = state.isLive ? "rgba(141,245,199,0.22)" : "rgba(255,196,97,0.18)";
  }

  renderLeaderboard(rows);
}

function refreshLeaderboard() {
  if (!WEB_APP_URL || WEB_APP_URL.includes("PASTE_YOUR_DEPLOYED_WEB_APP_URL_HERE")) {
    applyData(SAMPLE_DATA, false);
    return;
  }

  const script = document.createElement("script");
  script.src = `${WEB_APP_URL}?t=${Date.now()}`;
  script.onload = () => {
    if (window.POOL_DATA) {
      applyData(window.POOL_DATA, true);
    } else {
      applyData(SAMPLE_DATA, false);
    }
    script.remove();
  };
  script.onerror = () => {
    applyData(SAMPLE_DATA, false);
    script.remove();
  };
  document.body.appendChild(script);
}

function initRefreshButton() {
  const btn = document.getElementById("refreshBtn");
  if (!btn) return;
  btn.addEventListener("click", refreshLeaderboard);
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
  initTabs();
  renderGroups(SAMPLE_GROUPS);
  renderPicks(SAMPLE_PICKS);
  initRefreshButton();
  initEntryLink();
  refreshLeaderboard();
  setInterval(refreshLeaderboard, 60000);
}

document.addEventListener("DOMContentLoaded", init);
