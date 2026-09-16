import { initPanelSystem, state, render } from "./components/panelSystem.js";
import { initNavbar } from "./components/navbar.js";
import { initBackgroundAnimation } from "./components/backgroundAnimation.js";
import { updateGithubTilePreview, updateProjectsTilePreview } from "./components/hero.js";

// Side-effect imports — each of these calls registerPanel() on load.
import "./components/skillsPanel.js";
import "./components/experiencePanel.js";
import "./components/educationPanel.js";
import "./components/contactPanel.js";
import "./components/getInTouchPanel.js";
import "./components/resumeViewer.js";
import "./components/githubPanel.js";

import { setGithubData, setGithubLoaded } from "./components/githubPanel.js";
import { setProjects, setProjectsError } from "./components/projectsPanel.js";
import { setSkillsData } from "./components/skillsPanel.js";
import { setExperienceProjects } from "./components/experiencePanel.js";

import { getProfile, getRepos, getCommitActivity, getPublicEvents, searchAuthored, compareCommits } from "./services/githubApi.js";
import { buildProjects } from "./services/projectBuilder.js";
import { buildSkillCatalog } from "./services/skillCatalog.js";

initPanelSystem();
initNavbar();
initBackgroundAnimation();

// Fetches real commit-activity for a list of repo names and accumulates
// results into the shared weeksMatrix. Returns how many repos actually
// returned data (GitHub returns 202 "still computing" on cold cache,
// which counts as zero loaded here, not a fake zero-commit result).
// weekTimestamps captures each week bucket's real UTC start time (from
// GitHub's own `week` field) — needed so the streak calc below can
// tell which array slot is actually "today" instead of assuming the
// last slot always is (it isn't; the final week is usually partial).
async function fetchCommitActivityFor(repoNames, weeksMatrix, addCommits, weekTimestamps) {
  let loaded = 0;
  await Promise.all(
    repoNames.map(async (name) => {
      const weeks = await getCommitActivity(name);
      if (!weeks) return;
      weeks.slice(-52).forEach((week, wi) => {
        if (!week || !Array.isArray(week.days)) return;
        if (weekTimestamps[wi] == null && typeof week.week === "number") {
          weekTimestamps[wi] = week.week;
        }
        week.days.forEach((count, di) => {
          weeksMatrix[wi][di] += count;
          addCommits(count);
        });
      });
      loaded++;
    }),
  );
  return loaded;
}

(async () => {
  const profile = await getProfile();
  const repos = await getRepos();

  // ---- Projects (filtered + prioritized + tech-enriched) ----
  let projects = [];
  try {
    projects = await buildProjects(repos);
    setProjects(projects);
    updateProjectsTilePreview(projects.length ? `${projects.length} shown from GitHub` : "No projects found");
  } catch (err) {
    setProjectsError();
  }

  const catalog = buildSkillCatalog(projects);
  setSkillsData(catalog, projects);
  setExperienceProjects(projects);
  if (state.type === "projects" || state.type === "skills" || state.type === "experience") render();

  // ---- GitHub Activity ----
  const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
  const activeRepos = repos.filter((r) => new Date(r.pushed_at).getTime() > oneYearAgo).length;
  const reposToCheck = repos
    .filter((r) => !r.fork)
    .slice(0, 8)
    .map((r) => r.name);

  const weeksMatrix = Array.from({ length: 52 }, () => Array(7).fill(0));
  const weekTimestamps = Array(52).fill(null);
  let totalCommits = 0;
  const addCommits = (c) => {
    totalCommits += c;
  };
  const languageCounts = {};
  repos.forEach((r) => {
    if (r.language) languageCounts[r.language] = (languageCounts[r.language] || 0) + 1;
  });

  let repoStatsLoaded = await fetchCommitActivityFor(reposToCheck, weeksMatrix, addCommits, weekTimestamps);

  // Retry once after a short wait if nothing loaded — 202 means GitHub is
  // still computing stats, not that there's genuinely zero activity.
  if (repoStatsLoaded === 0 && reposToCheck.length > 0) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    repoStatsLoaded = await fetchCommitActivityFor(reposToCheck, weeksMatrix, addCommits, weekTimestamps);
  }

  const flatDays = weeksMatrix.flat();
  let longest = 0;
  let running = 0;
  for (const c of flatDays) {
    if (c > 0) {
      running++;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  }

  // Current streak — must be anchored to the real calendar date of
  // each cell, not just "walk back from the last array slot". The
  // final week bucket is usually a PARTIAL week (this week isn't over
  // yet), so its trailing day-slots represent days that haven't
  // happened yet — always zero — which previously broke the streak
  // calculation immediately regardless of real activity. Using
  // GitHub's own per-week UTC start timestamp lets us find the cell
  // that's actually "today" and walk backward from there, skipping
  // not-yet-occurred cells instead of treating them as a broken streak.
  let current = 0;
  const dayCells = [];
  weekTimestamps.forEach((wt, wi) => {
    if (wt == null) return;
    for (let di = 0; di < 7; di++) {
      dayCells.push({ ms: (wt + di * 86400) * 1000, count: weeksMatrix[wi][di] });
    }
  });
  if (dayCells.length) {
    dayCells.sort((a, b) => a.ms - b.ms);
    const todayUTCms = Math.floor(Date.now() / 86400000) * 86400000;
    const pastOrToday = dayCells.filter((d) => d.ms <= todayUTCms);
    let i = pastOrToday.length - 1;
    // If today has no commits yet, that doesn't break an ongoing streak
    // — the day isn't over. Start counting from yesterday instead.
    if (i >= 0 && pastOrToday[i].count === 0) i--;
    for (; i >= 0; i--) {
      if (pastOrToday[i].count > 0) current++;
      else break;
    }
  }

  const [pullRequests, issues] = await Promise.all([searchAuthored("pr"), searchAuthored("issue")]);

  const events = await getPublicEvents();
  // GitHub's public Events API no longer includes commit count/list
  // fields on PushEvent payloads at all (confirmed against a live
  // payload — only ref/before/head SHAs are present). The only
  // reliable way to get an accurate count now is to diff before...head
  // via the compare API.
  //
  // Multiple pushes to the same repo on the same day (a normal
  // work session) must show as ONE aggregated entry with the summed
  // commit count, not one entry per push — so look at more raw events
  // than we'll display, then group by repo+day before taking the top 5.
  const pushEvents = events.filter((e) => e.type === "PushEvent").slice(0, 15);
  const perPush = await Promise.all(
    pushEvents.map(async (e) => {
      const p = e.payload || {};
      const commits = await compareCommits(e.repo.name, p.before, p.head);
      return { repo: e.repo.name.split("/")[1] || e.repo.name, commits, date: e.created_at };
    }),
  );

  const grouped = new Map();
  perPush.forEach(({ repo, commits, date }) => {
    const day = date.slice(0, 10); // YYYY-MM-DD, UTC (created_at is a Z-suffixed ISO string)
    const key = `${repo}|${day}`;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, { repo, commits, date });
      return;
    }
    existing.commits = existing.commits == null && commits == null ? null : (existing.commits || 0) + (commits || 0);
    if (date > existing.date) existing.date = date;
  });

  const recentActivity = [...grouped.values()]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  setGithubData({
    profile, repos, weeksMatrix, totalCommits, repoStatsLoaded,
    commitDataAvailable: repoStatsLoaded > 0,
    apiUnavailable: !profile && repos.length === 0,
    languageCounts, currentStreak: current, longestStreak: longest,
    activeRepos, pullRequests, issues, recentActivity,
  });
  setGithubLoaded(true);

  updateGithubTilePreview(
    profile
      ? `${profile.public_repos} repos · ${repoStatsLoaded > 0 ? current + "d streak" : "activity syncing"}`
      : "Live data unavailable",
  );

  if (state.type === "github") render();
})();

// ---- Visit tracking ----
(async () => {
  if (sessionStorage.getItem("visitTracked")) return;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userAgent: navigator.userAgent,
        referrer: document.referrer || "Direct",
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (response.ok) sessionStorage.setItem("visitTracked", "true");
  } catch (error) {
    // Silently ignore
  }
})();