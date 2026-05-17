(function () {
  const CONFIG = window.POOL_CONFIG || {};
  const SAMPLE = window.POOL_DATA || {};
  const statusEl = document.getElementById("dataStatus");
  const refreshMs = Number(CONFIG.refreshMinutes || 0) * 60 * 1000;

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function normalize(data) {
    const fallback = SAMPLE;
    if (!data || typeof data !== "object") return fallback;
    return {
      title: data.title || fallback.title,
      subtitle: data.subtitle || fallback.subtitle,
      stats: Array.isArray(data.stats) ? data.stats : fallback.stats,
      leaderboard: Array.isArray(data.leaderboard) ? data.leaderboard : fallback.leaderboard,
      groups: Array.isArray(data.groups) ? data.groups : fallback.groups,
      bracket: Array.isArray(data.bracket) ? data.bracket : fallback.bracket,
      tiebreakers: Array.isArray(data.tiebreakers) ? data.tiebreakers : fallback.tiebreakers,
      scoring: Array.isArray(data.scoring) ? data.scoring : fallback.scoring,
      results: Array.isArray(data.results) ? data.results : fallback.results
    };
  }

  function sortLeaderboard(rows) {
    return [...rows].sort((a, b) =>
      (Number(b.total) || 0) - (Number(a.total) || 0) ||
      (Number(b.perfect) || 0) - (Number(a.perfect) || 0) ||
      (Number(b.excellent) || 0) - (Number(a.excellent) || 0) ||
      (Number(b.good) || 0) - (Number(a.good) || 0) ||
      String(a.name || "").localeCompare(String(b.name || ""))
    );
  }

  function render(data) {
    const normalized = normalize(data);

    document.getElementById("siteTitle").textContent = normalized.title;
    document.getElementById("siteSubtitle").textContent = normalized.subtitle;
    document.getElementById("footerText").textContent = `Built for ${normalized.title}.`;

    document.getElementById("heroStats").innerHTML = normalized.stats.map(stat => `
      <div class="stat">
        <div class="stat__label">${escapeHtml(stat.label)}</div>
        <div class="stat__value">${escapeHtml(stat.value)}</div>
      </div>
    `).join("");

    const lb = document.querySelector("#leaderboardTable tbody");
    lb.innerHTML = sortLeaderboard(normalized.leaderboard)
      .map((row, idx) => `
        <tr>
          <td class="rank">${idx + 1}</td>
          <td>${escapeHtml(row.name)}</td>
          <td><strong>${escapeHtml(row.total)}</strong></td>
          <td><span class="pill pill--good">${escapeHtml(row.perfect ?? 0)}</span></td>
          <td><span class="pill pill--warn">${escapeHtml(row.excellent ?? 0)}</span></td>
          <td><span class="pill pill--bad">${escapeHtml(row.good ?? 0)}</span></td>
          <td>${escapeHtml(row.groups ?? 0)}</td>
          <td>${escapeHtml(row.knockout ?? 0)}</td>
        </tr>
      `).join("");

    const groupsGrid = document.getElementById("groupsGrid");
    groupsGrid.innerHTML = normalized.groups.map(group => `
      <div class="group-card">
        <h3>${escapeHtml(group.name)}</h3>
        ${(group.rows || []).map(([team, pts]) => `
          <div class="group-row">
            <span>${escapeHtml(team)}</span>
            <span>${escapeHtml(pts)}</span>
          </div>
        `).join("")}
      </div>
    `).join("");

    const bracket = document.getElementById("bracket");
    bracket.innerHTML = normalized.bracket.map(round => `
      <div class="round">
        <h3>${escapeHtml(round.round)}</h3>
        ${(round.matches || []).map(([a, b]) => `
          <div class="match">
            <span>${escapeHtml(a)}</span>
            <span>vs ${escapeHtml(b)}</span>
          </div>
        `).join("")}
      </div>
    `).join("");

    const tiebreakers = document.getElementById("tiebreakers");
    tiebreakers.innerHTML = normalized.tiebreakers.map(item => `<li>${escapeHtml(item)}</li>`).join("");

    const scoringSummary = document.getElementById("scoringSummary");
    scoringSummary.innerHTML = normalized.scoring.map(item => `
      <div class="rule"><strong>${escapeHtml(item.title)}:</strong> ${escapeHtml(item.text)}</div>
    `).join("");

    const resultsFeed = document.getElementById("resultsFeed");
    resultsFeed.innerHTML = normalized.results.map(item => `
      <div class="feed-item">
        <div class="feed-item__meta">${escapeHtml(item.time)}</div>
        <div><strong>${escapeHtml(item.title)}</strong></div>
        <div style="color: var(--muted); margin-top: 4px;">${escapeHtml(item.text)}</div>
      </div>
    `).join("");

    if (data && data.generatedAt) {
      setStatus(`Connected to Google Sheet · updated ${new Date(data.generatedAt).toLocaleString()}`);
    } else {
      setStatus("Using sample data");
    }
  }

  function loadRemoteScript(url, onSuccess, onError) {
    const script = document.createElement("script");
    const cacheBust = url.includes("?") ? "&" : "?";
    script.src = `${url}${cacheBust}cb=${Date.now()}`;
    script.async = true;
    script.onload = () => onSuccess && onSuccess();
    script.onerror = () => onError && onError(new Error("Could not load remote data script."));
    document.head.appendChild(script);
  }

  function init() {
    if (CONFIG.dataUrl && String(CONFIG.dataUrl).trim()) {
      setStatus("Connecting to Google Sheet...");
      window.POOL_DATA = window.POOL_DATA || SAMPLE;
      loadRemoteScript(
        CONFIG.dataUrl.trim(),
        () => render(window.POOL_DATA || SAMPLE),
        () => {
          setStatus("Using sample data (remote sheet unavailable)");
          render(SAMPLE);
          const banner = document.createElement("div");
          banner.className = "error-banner";
          banner.textContent = "Could not load the live Google Sheet data, so the sample content is showing instead.";
          document.querySelector("main .container").prepend(banner);
        }
      );
    } else {
      render(SAMPLE);
    }

    if (refreshMs > 0 && CONFIG.dataUrl) {
      setInterval(() => loadRemoteScript(CONFIG.dataUrl.trim(), () => render(window.POOL_DATA || SAMPLE)), refreshMs);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
