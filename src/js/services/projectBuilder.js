import {
  PRIORITY_MATCHERS, EXCLUDE_SUBSTRINGS, RESUME_VERIFIED_TAGS, KNOWN_IMAGES, GITHUB_USER,
} from "../data/config.js";
import { getLanguages } from "./githubApi.js";

// This portfolio's own repo and the GitHub profile-README repo (named
// exactly the username) are excluded — they're not development projects.
// Trivial/empty repos (no description, no language, tiny size) are
// filtered too, so the showcase isn't "every public repo".
function isLikelyRealProject(r) {
  const n = r.name.toLowerCase();
  if (n === GITHUB_USER.toLowerCase()) return false;
  if (EXCLUDE_SUBSTRINGS.some((x) => n.includes(x))) return false;
  if (r.fork) return false;
  if (!r.description && !r.language && (r.size || 0) < 50) return false;
  return true;
}

function priorityIndex(r) {
  const n = r.name.toLowerCase();
  const idx = PRIORITY_MATCHERS.findIndex((m) => n.includes(m));
  return idx === -1 ? PRIORITY_MATCHERS.length : idx;
}

function resumeTagsFor(repoName) {
  const n = repoName.toLowerCase();
  for (const [key, tags] of Object.entries(RESUME_VERIFIED_TAGS)) {
    if (n.includes(key)) return tags;
  }
  return [];
}

function humanizeName(name) {
  return name.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n - 1).trim() + "…" : str;
}

/**
 * Builds the portfolio's project list from live GitHub repos.
 * - Filters out the portfolio repo, README-only repos, and forks.
 * - Prioritizes the five named flagship projects, then sorts the rest by
 *   most recently updated.
 * - Detects technologies from real per-repo language-BYTE breakdowns
 *   (not just GitHub's single "primary language" field, which misses
 *   Java on mixed-stack repos), merged with topics and resume-verified
 *   tags for the documented projects.
 */
export async function buildProjects(repos) {
  const candidateRepos = repos.filter(isLikelyRealProject).sort((a, b) => {
    const pa = priorityIndex(a);
    const pb = priorityIndex(b);
    if (pa !== pb) return pa - pb;
    return new Date(b.pushed_at) - new Date(a.pushed_at);
  });

  // Capped to stay within unauthenticated GitHub rate limits.
  const ENRICH_LIMIT = 15;
  const languageBreakdowns = {};
  await Promise.all(
    candidateRepos.slice(0, ENRICH_LIMIT).map(async (r) => {
      const breakdown = await getLanguages(r.name);
      if (breakdown) languageBreakdowns[r.name] = breakdown;
    }),
  );

  return candidateRepos.map((r) => {
    const tags = [];
    const breakdown = languageBreakdowns[r.name];
    if (breakdown) {
      const totalBytes = Object.values(breakdown).reduce((a, b) => a + b, 0) || 1;
      Object.entries(breakdown).forEach(([lang, bytes]) => {
        if (bytes / totalBytes >= 0.08) tags.push(lang);
      });
    } else if (r.language) {
      tags.push(r.language);
    }
    if (Array.isArray(r.topics)) tags.push(...r.topics);
    tags.push(...resumeTagsFor(r.name));

    return {
      id: r.name,
      title: humanizeName(r.name),
      shortDesc: r.description ? truncate(r.description, 90) : "No description provided.",
      fullDesc: r.description || "No description has been provided for this repository yet.",
      tags: [...new Set(tags)],
      language: r.language,
      stars: r.stargazers_count,
      forks: r.forks_count,
      updated: r.pushed_at,
      github: r.html_url,
      liveUrl: r.homepage && r.homepage.trim() ? r.homepage.trim() : null,
      defaultBranch: r.default_branch || "main",
      images: KNOWN_IMAGES[r.name] || [],
    };
  });
}