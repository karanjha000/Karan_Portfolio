import { getRepoTree, rawFileUrl } from "./githubApi.js";

// Fetches a raw file straight from raw.githubusercontent.com — this is
// a plain CDN, not the GitHub REST API, so it isn't subject to the
// api.github.com rate limit and doesn't need the /api/github proxy.
async function fetchRaw(repoName, branch, path) {
  try {
    const res = await fetch(rawFileUrl(repoName, branch, path));
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function keysFromPackageJson(text) {
  try {
    const json = JSON.parse(text);
    return [
      ...Object.keys(json.dependencies || {}),
      ...Object.keys(json.devDependencies || {}),
    ];
  } catch {
    return [];
  }
}

function keysFromPom(text) {
  const ids = [];
  const re = /<artifactId>([^<]+)<\/artifactId>/g;
  let m;
  while ((m = re.exec(text))) ids.push(m[1].trim());
  return ids;
}

function keysFromGradle(text) {
  const ids = [];
  const re = /['"]([\w.\-]+):([\w.\-]+):[\w.\-]+['"]/g;
  let m;
  while ((m = re.exec(text))) ids.push(m[2].trim());
  return ids;
}

function keysFromRequirementsTxt(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split(/[=<>~!\[; ]/)[0].trim().toLowerCase())
    .filter(Boolean);
}

function keysFromSpringConfig(text) {
  const keys = [];
  const lower = text.toLowerCase();
  if (lower.includes("postgresql")) keys.push("postgresql");
  if (lower.includes("mysql")) keys.push("mysql");
  if (lower.includes("mongodb")) keys.push("mongodb");
  if (lower.includes("h2")) keys.push("h2");
  if (lower.includes("sqlite")) keys.push("sqlite");
  return keys;
}

const CANDIDATE_FILES = [
  { path: "package.json", parse: keysFromPackageJson },
  { path: "pom.xml", parse: keysFromPom },
  { path: "build.gradle", parse: keysFromGradle },
  { path: "requirements.txt", parse: keysFromRequirementsTxt },
  { path: "application.properties", parse: keysFromSpringConfig },
  { path: "src/main/resources/application.properties", parse: keysFromSpringConfig },
  { path: "src/main/resources/application.yml", parse: keysFromSpringConfig },
];

export async function detectProjectTech(repoName, defaultBranch) {
  const found = new Set();

  await Promise.all(
    CANDIDATE_FILES.map(async ({ path, parse }) => {
      const text = await fetchRaw(repoName, defaultBranch, path);
      if (!text) return;
      parse(text).forEach((k) => found.add(k.toLowerCase()));
    }),
  );

  const tree = await getRepoTree(repoName, defaultBranch);
  if (tree && Array.isArray(tree.tree)) {
    const paths = tree.tree.map((t) => t.path.toLowerCase());
    if (paths.some((p) => p === "dockerfile" || p.endsWith("/dockerfile"))) found.add("docker");
    if (paths.some((p) => p.includes("docker-compose"))) found.add("docker");
    if (paths.some((p) => p.startsWith(".github/workflows/"))) found.add("github-actions");
  }

  return [...found];
}