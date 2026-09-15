import { GITHUB_USER } from "../data/config.js";

// All requests go through /api/github (see api/github.js) rather than
// straight to api.github.com. Direct client-side calls share GitHub's
// unauthenticated rate limit (60/hr core, 10/min search) across every
// visitor on the same network — easy to exhaust, and once exhausted
// every GitHub panel goes blank until the window resets. The proxy
// authenticates server-side and caches responses at the edge.
const BASE = "/api/github";

async function ghFetch(path) {
  try {
    return await fetch(`${BASE}?path=${encodeURIComponent(path)}`);
  } catch {
    return null;
  }
}

export async function getProfile() {
  const res = await ghFetch(`users/${GITHUB_USER}`);
  if (!res || !res.ok) return null;
  return res.json();
}

export async function getRepos() {
  const res = await ghFetch(`users/${GITHUB_USER}/repos?per_page=100&sort=updated`);
  if (!res || !res.ok) return [];
  return res.json();
}

export async function getLanguages(repoName) {
  const res = await ghFetch(`repos/${GITHUB_USER}/${repoName}/languages`);
  if (!res || !res.ok) return null;
  return res.json();
}

// Returns null (not zero) when GitHub is still computing stats (HTTP 202),
// rate-limited (403), or the request otherwise fails — callers must
// distinguish "unavailable" from "genuinely zero commits" rather than
// assuming a false zero.
export async function getCommitActivity(repoName) {
  const res = await ghFetch(`repos/${GITHUB_USER}/${repoName}/stats/commit_activity`);
  if (!res || res.status !== 200) return null;
  const data = await res.json();
  return Array.isArray(data) ? data : null;
}

export async function getPublicEvents() {
  const res = await ghFetch(`users/${GITHUB_USER}/events/public?per_page=20`);
  if (!res || !res.ok) return [];
  return res.json();
}

export async function searchAuthored(type) {
  const res = await ghFetch(`search/issues?q=author:${GITHUB_USER}+type:${type}`);
  if (!res || !res.ok) return null;
  const data = await res.json();
  return typeof data.total_count === "number" ? data.total_count : null;
}

// GitHub's public Events API no longer includes any commit count/list
// on PushEvent payloads (no size, distinct_size, or commits field —
// only the before/head SHAs). Diffing before...head via the compare
// API is now the only reliable way to get an accurate commit count.
// repoFullName must be "owner/repo" (from event.repo.name) since a
// push can be to a repo the user doesn't own (a collaborator push).
export async function compareCommits(repoFullName, base, head) {
  if (!base || !head || /^0+$/.test(base)) return null;
  const res = await ghFetch(`repos/${repoFullName}/compare/${base}...${head}`);
  if (!res || !res.ok) return null;
  const data = await res.json();
  return typeof data.total_commits === "number" ? data.total_commits : null;
}

export async function getRepoTree(repoName, branch = "main") {
  const res = await ghFetch(`repos/${GITHUB_USER}/${repoName}/git/trees/${branch}?recursive=1`);
  if (!res || !res.ok) return null;
  return res.json();
}

export function rawFileUrl(repoName, branch, path) {
  return `https://raw.githubusercontent.com/${GITHUB_USER}/${repoName}/${branch}/${path}`;
}