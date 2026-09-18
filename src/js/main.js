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

import { getProfile, getRepos, getContributions, searchAuthored } from "./services/githubApi.js";
import { buildProjects } from "./services/projectBuilder.js";
import { buildSkillCatalog } from "./services/skillCatalog.js";

initPanelSystem();
initNavbar();
initBackgroundAnimation();

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

  const languageCounts = {};
  repos.forEach((r) => {
    if (r.language) languageCounts[r.language] = (languageCounts[r.language] || 0) + 1;
  });

  const now = new Date();
  const from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
  const to = now.toISOString();
  const contributions = await getContributions(from, to);

  const weeksMatrix = contributions
    ? contributions.contributionCalendar.weeks.map((w) => w.contributionDays.map((d) => d.contributionCount))
    : Array.from({ length: 52 }, () => Array(7).fill(0));
  const totalCommits = weeksMatrix.flat().reduce((a, b) => a + b, 0);
  const commitDataAvailable = !!contributions;

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

  let current = 0;
  if (contributions) {
    const dayCells = contributions.contributionCalendar.weeks
      .flatMap((w) => w.contributionDays)
      .map((d) => ({ ms: new Date(d.date + "T00:00:00Z").getTime(), count: d.contributionCount }))
      .sort((a, b) => a.ms - b.ms);
    const todayUTCms = Math.floor(Date.now() / 86400000) * 86400000;
    const pastOrToday = dayCells.filter((d) => d.ms <= todayUTCms);
    let i = pastOrToday.length - 1;
    // Today not being over yet shouldn't break an ongoing streak.
    if (i >= 0 && pastOrToday[i].count === 0) i--;
    for (; i >= 0; i--) {
      if (pastOrToday[i].count > 0) current++;
      else break;
    }
  }

  const [pullRequests, issues] = await Promise.all([searchAuthored("pr"), searchAuthored("issue")]);

  // Recent Activity: commitContributionsByRepository already gives
  // per-repo, per-day commit totals directly from GitHub — no manual
  // event-grouping or commit-diffing needed, and no risk of it missing
  // activity that fell outside a shallow "last 20 events" window.
  let recentActivity = [];
  if (contributions) {
    const entries = [];
    contributions.commitContributionsByRepository.forEach((repoContrib) => {
      repoContrib.contributions.nodes.forEach((n) => {
        entries.push({ repo: repoContrib.repository.name, commits: n.commitCount, date: n.occurredAt });
      });
    });
    recentActivity = entries.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  }

  setGithubData({
    profile, repos, weeksMatrix, totalCommits, repoStatsLoaded: commitDataAvailable ? 1 : 0,
    commitDataAvailable,
    apiUnavailable: !profile && repos.length === 0,
    languageCounts, currentStreak: current, longestStreak: longest,
    activeRepos, pullRequests, issues, recentActivity,
  });
  setGithubLoaded(true);

  updateGithubTilePreview(
    profile
      ? `${profile.public_repos} repos · ${commitDataAvailable ? current + "d streak" : "activity syncing"}`
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