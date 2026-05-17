(function () {
  const data = window.POOL_DATA;
  if (!data) return;

  document.getElementById("siteTitle").textContent = data.title;
  document.getElementById("siteSubtitle").textContent = data.subtitle;
  document.getElementById("footerText").textContent = `Built for ${data.title}.`;

  const heroStats = document.getElementById("heroStats");
  heroStats.innerHTML = data.stats.map(s => `
    <div class="stat">
      <div class="stat__label">${s.label}</div>
      <div class="stat__value">${s.value}</div>
    </div>
  `).join("");

  const lb = document.querySelector("#leaderboardTable tbody");
  lb.innerHTML = data.leaderboard
    .sort((a, b) => b.total - a.total || b.perfect - a.perfect || b.excellent - a.excellent || b.good - a.good)
    .map((row, idx) => `
      <tr>
        <td class="rank">${idx + 1}</td>
        <td>${row.name}</td>
        <td><strong>${row.total}</strong></td>
        <td><span class="pill pill--good">${row.perfect}</span></td>
        <td><span class="pill pill--warn">${row.excellent}</span></td>
        <td><span class="pill pill--bad">${row.good}</span></td>
        <td>${row.groups}</td>
        <td>${row.knockout}</td>
      </tr>
    `).join("");

  const groupsGrid = document.getElementById("groupsGrid");
  groupsGrid.innerHTML = data.groups.map(group => `
    <div class="group-card">
      <h3>${group.name}</h3>
      ${group.rows.map(([team, pts]) => `
        <div class="group-row">
          <span>${team}</span>
          <span>${pts}</span>
        </div>
      `).join("")}
    </div>
  `).join("");

  const bracket = document.getElementById("bracket");
  bracket.innerHTML = data.bracket.map(round => `
    <div class="round">
      <h3>${round.round}</h3>
      ${round.matches.map(([a, b]) => `
        <div class="match">
          <span>${a}</span>
          <span>vs ${b}</span>
        </div>
      `).join("")}
    </div>
  `).join("");

  const tiebreakers = document.getElementById("tiebreakers");
  tiebreakers.innerHTML = data.tiebreakers.map(item => `<li>${item}</li>`).join("");

  const scoringSummary = document.getElementById("scoringSummary");
  scoringSummary.innerHTML = data.scoring.map(item => `
    <div class="rule"><strong>${item.title}:</strong> ${item.text}</div>
  `).join("");

  const resultsFeed = document.getElementById("resultsFeed");
  resultsFeed.innerHTML = data.results.map(item => `
    <div class="feed-item">
      <div class="feed-item__meta">${item.time}</div>
      <div><strong>${item.title}</strong></div>
      <div style="color: var(--muted); margin-top: 4px;">${item.text}</div>
    </div>
  `).join("");
})();
