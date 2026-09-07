import { GITHUB_USER } from "../data/config.js";

const BASE = "https://api.github.com";

export async function getProfile() {
  try {
    const res = await fetch(`${BASE}/users/${GITHUB_USER}`);
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

export async function getRepos() {
  try {
    const res = await fetch(`${BASE}/users/${GITHUB_USER}/repos?per_page=100&sort=updated`);
    return res.ok ? res.json() : [];
  } catch {
    return [];
  }
}

export async function getLanguages(repoName) {
  try {
    const res = await fetch(`${BASE}/repos/${GITHUB_USER}/${repoName}/languages`);
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

// Returns null (not zero) when GitHub is still computing stats (HTTP 202)
// or the request fails — callers must distinguish "unavailable" from
// "genuinely zero commits" rather than assuming a false zero.
export async function getCommitActivity(repoName) {
  try {
    const res = await fetch(`${BASE}/repos/${GITHUB_USER}/${repoName}/stats/commit_activity`);
    if (res.status !== 200) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

export async function getPublicEvents() {
  try {
    const res = await fetch(`${BASE}/users/${GITHUB_USER}/events/public?per_page=20`);
    return res.ok ? res.json() : [];
  } catch {
    return [];
  }
}

export async function searchAuthored(type) {
  try {
    const res = await fetch(`${BASE}/search/issues?q=author:${GITHUB_USER}+type:${type}`);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.total_count === "number" ? data.total_count : null;
  } catch {
    return null;
  }
}

export async function getRepoTree(repoName, branch = "main") {
  try {
    const res = await fetch(`${BASE}/repos/${GITHUB_USER}/${repoName}/git/trees/${branch}?recursive=1`);
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

export function rawFileUrl(repoName, branch, path) {
  return `https://raw.githubusercontent.com/${GITHUB_USER}/${repoName}/${branch}/${path}`;
}