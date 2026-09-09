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

import { getProfile, getRepos, getCommitActivity, getPublicEvents, searchAuthored } from "./services/githubApi.js";
import { buildProjects } from "./services/projectBuilder.js";
import { buildSkillCatalog } from "./services/skillCatalog.js";

initPanelSystem();
initNavbar();
initBackgroundAnimation();

// Fetches real commit-activity for a list of repo names and accumulates
// results into the shared weeksMatrix. Returns how many repos actually
// returned data (GitHub returns 202 "still computing" on cold cache,
// which counts as zero loaded here, not a fake zero-commit result).
async function fetchCommitActivityFor(repoNames, weeksMatrix, addCommits) {
  let loaded = 0;
  await Promise.all(
    repoNames.map(async (name) => {
      const weeks = await getCommitActivity(name);
      if (!weeks) return;
      weeks.slice(-52).forEach((week, wi) => {
        if (!week || !Array.isArray(week.days)) return;
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
  let totalCommits = 0;
  const addCommits = (c) => {
    totalCommits += c;
  };
  const languageCounts = {};
  repos.forEach((r) => {
    if (r.language) languageCounts[r.language] = (languageCounts[r.language] || 0) + 1;
  });

  let repoStatsLoaded = await fetchCommitActivityFor(reposToCheck, weeksMatrix, addCommits);

  // Retry once after a short wait if nothing loaded — 202 means GitHub is
  // still computing stats, not that there's genuinely zero activity.
  if (repoStatsLoaded === 0 && reposToCheck.length > 0) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    repoStatsLoaded = await fetchCommitActivityFor(reposToCheck, weeksMatrix, addCommits);
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
  let current = 0;
  for (let i = flatDays.length - 1; i >= 0; i--) {
    if (flatDays[i] > 0) current++;
    else break;
  }

  const [pullRequests, issues] = await Promise.all([searchAuthored("pr"), searchAuthored("issue")]);

  const events = await getPublicEvents();
  // GitHub's events API caps/truncates the `commits` array on a PushEvent
  // payload, so payload.commits.length can read as 0 (or lower than
  // reality) even when real commits were pushed. payload.distinct_size /
  // payload.size are the authoritative counts GitHub reports for that
  // push and must be preferred — falling back to commits.length only
  // when neither is present, never defaulting a missing count to 0.
  const recentActivity = events
    .filter((e) => e.type === "PushEvent")
    .slice(0, 5)
    .map((e) => {
      const p = e.payload || {};
      const commitCount =
        typeof p.distinct_size === "number"
          ? p.distinct_size
          : typeof p.size === "number"
            ? p.size
            : Array.isArray(p.commits)
              ? p.commits.length
              : 0;
      return {
        repo: e.repo.name.split("/")[1] || e.repo.name,
        commits: commitCount,
        date: e.created_at,
      };
    });

  setGithubData({
    profile, repos, weeksMatrix, totalCommits, repoStatsLoaded,
    commitDataAvailable: repoStatsLoaded > 0,
    // profile and repos both come back empty/null on total API failure
    // (rate limit, network error, etc.) — that's a genuine "unavailable"
    // state and must be shown as such, never silently rendered as zeros.
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