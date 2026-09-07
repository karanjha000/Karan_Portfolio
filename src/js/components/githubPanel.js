import { registerPanel, getPanelBody, setPanelTitle, state, render } from "./panelSystem.js";

export let ghData = {
  profile: null, repos: [], weeksMatrix: null, totalCommits: 0, repoStatsLoaded: 0,
  languageCounts: {}, currentStreak: 0, longestStreak: 0, commitDataAvailable: false,
  activeRepos: 0, pullRequests: null, issues: null, recentActivity: [],
};
export let ghLoaded = false;

export function setGithubData(data) {
  ghData = { ...ghData, ...data };
}
export function setGithubLoaded(v) {
  ghLoaded = v;
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return days + "d ago";
  return Math.floor(days / 30) + "mo ago";
}

function renderHeatmapInto(container, weeksMatrix) {
  if (!container) return;
  container.className = "github-heatmap";
  container.innerHTML = "";
  const maxVal = Math.max(1, ...weeksMatrix.flat());
  weeksMatrix.forEach((week) => {
    const weekEl = document.createElement("div");
    weekEl.className = "week";
    week.forEach((count) => {
      const dayEl = document.createElement("div");
      dayEl.className = "day";
      const intensity = count === 0 ? 0.12 : 0.3 + 0.7 * (count / maxVal);
      dayEl.style.background = `rgba(59, 130, 246, ${intensity})`;
      dayEl.title = count + " commit" + (count === 1 ? "" : "s");
      weekEl.appendChild(dayEl);
    });
    container.appendChild(weekEl);
  });
}

function renderGithubPanel() {
  const body = getPanelBody();

  if (!ghLoaded) {
    setPanelTitle("GitHub Activity");
    body.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem;">Loading live GitHub data…</p>`;
    return;
  }

  if (state.level === "overview") {
    setPanelTitle("GitHub Activity");
    body.innerHTML = `
      <p class="gh-section-label">Contribution Graph</p>
      <div id="heatmapOverview"></div>

      <p class="gh-section-label">Commit Activity</p>
      <div class="gh-stat-row">
        <div class="gh-stat primary"><div class="gh-stat-value">${ghData.commitDataAvailable ? ghData.currentStreak + "d" : "—"}</div><div class="gh-stat-label">Current Streak</div></div>
        <div class="gh-stat primary"><div class="gh-stat-value">${ghData.commitDataAvailable ? ghData.totalCommits : "—"}</div><div class="gh-stat-label">Commits (1yr)</div></div>
        <div class="gh-stat primary"><div class="gh-stat-value">${ghData.profile ? ghData.profile.public_repos : "—"}</div><div class="gh-stat-label">Public Repos</div></div>
      </div>

      <div class="gh-detail-btn-wrap">
        <button class="btn btn-outline btn-sm" id="viewDetailedGh">View Detailed Activity</button>
      </div>
    `;
    renderHeatmapInto(document.getElementById("heatmapOverview"), ghData.weeksMatrix ? ghData.weeksMatrix.slice(-18) : []);
    document.getElementById("viewDetailedGh").addEventListener("click", () => {
      state.level = "detail";
      render();
    });
  } else {
    setPanelTitle("Detailed Activity");

    const recentHtml = ghData.recentActivity.length
      ? ghData.recentActivity
          .map(
            (a) => `
            <div class="recent-activity-item">
              <span class="recent-activity-repo">${a.repo} — ${a.commits} commit${a.commits === 1 ? "" : "s"}</span>
              <span class="recent-activity-meta">${timeAgo(a.date)}</span>
            </div>`,
          )
          .join("")
      : `<p style="color:var(--text-soft); font-size:0.85rem;">No recent public push activity.</p>`;

    body.innerHTML = `
      <p class="gh-section-label">Contribution Graph — Past Year</p>
      <div id="heatmapDetail"></div>
      <div class="gh-legend">
        <span>Less</span>
        <span class="legend-box" style="background: rgba(59,130,246,0.15);"></span>
        <span class="legend-box" style="background: rgba(59,130,246,0.4);"></span>
        <span class="legend-box" style="background: rgba(59,130,246,0.7);"></span>
        <span class="legend-box" style="background: rgba(59,130,246,1);"></span>
        <span>More</span>
      </div>

      <p class="gh-section-label">Repository &amp; Contribution Stats</p>
      <div class="gh-secondary-row">
        <div class="gh-secondary-stat"><div class="gh-secondary-value">${ghData.commitDataAvailable ? ghData.longestStreak + "d" : "—"}</div><div class="gh-secondary-label">Longest Streak</div></div>
        <div class="gh-secondary-stat"><div class="gh-secondary-value">${ghData.activeRepos}</div><div class="gh-secondary-label">Active Repos</div></div>
        <div class="gh-secondary-stat"><div class="gh-secondary-value">${ghData.pullRequests !== null ? ghData.pullRequests : "—"}</div><div class="gh-secondary-label">Pull Requests</div></div>
        <div class="gh-secondary-stat"><div class="gh-secondary-value">${ghData.issues !== null ? ghData.issues : "—"}</div><div class="gh-secondary-label">Issues</div></div>
      </div>

      <p class="gh-section-label">Recent Activity</p>
      <div class="recent-activity-list">${recentHtml}</div>

      <p class="gh-section-label">Languages</p>
      <div class="lang-list">${
        Object.keys(ghData.languageCounts).length
          ? Object.entries(ghData.languageCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([lang]) => `<span class="lang-pill">${lang}</span>`)
              .join("")
          : `<span class="lang-pill">Not available</span>`
      }</div>
    `;
    renderHeatmapInto(document.getElementById("heatmapDetail"), ghData.weeksMatrix || []);
  }
}

registerPanel("github", renderGithubPanel);