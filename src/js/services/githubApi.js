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

export async function searchAuthored(type) {
  const res = await ghFetch(`search/issues?q=author:${GITHUB_USER}+type:${type}`);
  if (!res || !res.ok) return null;
  const data = await res.json();
  return typeof data.total_count === "number" ? data.total_count : null;
}

export async function getRepoTree(repoName, branch = "main") {
  const res = await ghFetch(`repos/${GITHUB_USER}/${repoName}/git/trees/${branch}?recursive=1`);
  if (!res || !res.ok) return null;
  return res.json();
}

export function rawFileUrl(repoName, branch, path) {
  return `https://raw.githubusercontent.com/${GITHUB_USER}/${repoName}/${branch}/${path}`;
}

const CONTRIBUTIONS_QUERY = `
  query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          weeks { contributionDays { date contributionCount } }
        }
        commitContributionsByRepository(maxRepositories: 25) {
          repository { name }
          contributions(first: 30, orderBy: { field: OCCURRED_AT, direction: DESC }) {
            nodes { occurredAt commitCount }
          }
        }
      }
    }
  }
`;

export async function getContributions(from, to) {
  try {
    const res = await fetch("/api/github-graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: CONTRIBUTIONS_QUERY, variables: { login: GITHUB_USER, from, to } }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.user?.contributionsCollection || null;
  } catch { return null; }
}