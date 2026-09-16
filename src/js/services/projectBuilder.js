import {
  PRIORITY_MATCHERS, EXCLUDE_SUBSTRINGS, RESUME_VERIFIED_TAGS, KNOWN_IMAGES, GITHUB_USER,
} from "../data/config.js";
import { getLanguages } from "./githubApi.js";
import { detectProjectTech } from "./techDetector.js";

function isLikelyRealProject(r) {
  const n = r.name.toLowerCase();
  if (n === GITHUB_USER.toLowerCase()) return false;
  if (EXCLUDE_SUBSTRINGS.some((x) => n.includes(x))) return false;
  return true;
}

// Strips all non-alphanumeric characters before comparing, so a repo
// name's separator style (underscores, hyphens, or none) never causes
// a real match to be missed — "Book_Pilot_Manager" and the lookup key
// "bookpilot" both normalize to a form where the substring check works
// correctly (this was the exact bug that made BookPilot's resume-
// verified tags, including MySQL, silently fail to attach).
function normalizeForMatch(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function priorityIndex(r) {
  const n = normalizeForMatch(r.name);
  const idx = PRIORITY_MATCHERS.findIndex((m) => n.includes(normalizeForMatch(m)));
  return idx === -1 ? PRIORITY_MATCHERS.length : idx;
}

function resumeTagsFor(repoName) {
  const n = normalizeForMatch(repoName);
  for (const [key, tags] of Object.entries(RESUME_VERIFIED_TAGS)) {
    if (n.includes(normalizeForMatch(key))) return tags;
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
 * - Filters out the portfolio repo, the profile-README repo, and forks
 *   only (see isLikelyRealProject) — everything else fetched from
 *   GitHub shows up automatically, including brand-new repos.
 * - Prioritizes the named flagship projects, then sorts the rest by
 *   most recently updated.
 * - Technology detection is evidence-based, not keyword-scraped: real
 *   per-repo language-BYTE breakdown (every language actually present,
 *   not just a percentage-gated subset) plus an actual scan of each
 *   repo's dependency/config files (package.json, pom.xml,
 *   build.gradle, requirements.txt, Spring application config,
 *   Docker/CI presence — see techDetector.js), merged with
 *   resume-verified ground truth for the documented projects. Repo
 *   topics and description text are never converted into skills.
 */
export async function buildProjects(repos) {
  const candidateRepos = repos.filter(isLikelyRealProject).sort((a, b) => {
    const pa = priorityIndex(a);
    const pb = priorityIndex(b);
    if (pa !== pb) return pa - pb;
    return new Date(b.pushed_at) - new Date(a.pushed_at);
  });

  // Capped to keep the request count sane — each repo here costs one
  // language-breakdown call plus techDetector's own handful of raw
  // file fetches (which don't count against the GitHub API rate limit
  // at all, since they go straight to raw.githubusercontent.com).
  const ENRICH_LIMIT = 15;
  const languageBreakdowns = {};
  const detectedTech = {};
  await Promise.all(
    candidateRepos.slice(0, ENRICH_LIMIT).map(async (r) => {
      const [breakdown, tech] = await Promise.all([
        getLanguages(r.name),
        detectProjectTech(r.name, r.default_branch || "main"),
      ]);
      if (breakdown) languageBreakdowns[r.name] = breakdown;
      detectedTech[r.name] = tech;
    }),
  );

  return candidateRepos.map((r) => {
    const tags = [];
    const breakdown = languageBreakdowns[r.name];
    if (breakdown) {
      Object.keys(breakdown).forEach((lang) => tags.push(lang));
    } else if (r.language) {
      tags.push(r.language);
    }
    tags.push(...(detectedTech[r.name] || []));
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