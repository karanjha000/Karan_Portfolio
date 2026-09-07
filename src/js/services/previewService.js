// Real, honest project preview.
//
// - JS/Node/React repos: booted LIVE in the visitor's own browser tab via
//   StackBlitz WebContainers. This genuinely clones, installs, and runs
//   the project's real code — no fabrication, no backend needed.
// - Any other stack (Java/Spring Boot, Python, etc.): WebContainers can't
//   run a JVM or other non-Node runtime in-browser. There is no safe way
//   to fake this, so it calls the /api/preview/* backend contract
//   instead. Until that backend is actually implemented with real
//   sandboxed container infrastructure, it honestly returns 501 and this
//   service surfaces that as "Preview unavailable" — it NEVER claims an
//   app is running when it isn't.
//
// IMPORTANT — WebContainers requires these response headers on every page
// that uses it (see PREVIEW_SETUP.md and server.js):
//   Cross-Origin-Embedder-Policy: require-corp
//   Cross-Origin-Opener-Policy: same-origin
// Without them, the browser will refuse to boot the sandbox.

import { JS_STACK_TAGS } from "../data/config.js";
import { getRepoTree, rawFileUrl } from "./githubApi.js";

let webcontainerInstance = null;

export function isWebPreviewEligible(project) {
  return project.tags.some((t) => JS_STACK_TAGS.includes(t));
}

async function loadWebContainerSDK() {
  // Loaded on demand from a CDN as an ES module so visitors who never
  // click Preview never pay for this (fairly heavy) SDK. To self-host
  // instead of relying on the CDN, `npm install @webcontainer/api` and
  // change this import to a local path — see PREVIEW_SETUP.md.
  return import("https://esm.sh/@webcontainer/api@1.3.0");
}

async function fetchRepoAsFileTree(project, onProgress) {
  const tree = await getRepoTree(project.id, project.defaultBranch);
  if (!tree || !Array.isArray(tree.tree)) {
    throw new Error("Could not read this repository's file tree.");
  }

  const files = tree.tree.filter((entry) => entry.type === "blob");
  const MAX_FILES = 300;
  if (files.length > MAX_FILES) {
    throw new Error(
      `This repository has ${files.length} files — too large for an in-browser preview (limit ${MAX_FILES}).`,
    );
  }

  const fileTree = {};
  let done = 0;

  await Promise.all(
    files.map(async (entry) => {
      if (/^(\.git|node_modules|dist|build)\//.test(entry.path)) return;
      if (/\.(png|jpe?g|gif|ico|pdf|zip|jar|class)$/i.test(entry.path)) return;

      const res = await fetch(rawFileUrl(project.id, project.defaultBranch, entry.path));
      if (!res.ok) return;
      const contents = await res.text();

      const parts = entry.path.split("/");
      let cursor = fileTree;
      parts.forEach((part, i) => {
        if (i === parts.length - 1) {
          cursor[part] = { file: { contents } };
        } else {
          cursor[part] = cursor[part] || { directory: {} };
          cursor = cursor[part].directory;
        }
      });

      done++;
      onProgress?.(done, files.length);
    }),
  );

  return fileTree;
}

function detectStartCommand(fileTree) {
  const pkg = fileTree["package.json"];
  if (!pkg) return null;
  try {
    const parsed = JSON.parse(pkg.file.contents);
    const scripts = parsed.scripts || {};
    if (scripts.dev) return ["npm", ["run", "dev"]];
    if (scripts.start) return ["npm", ["start"]];
  } catch {
    return null;
  }
  return null;
}

export async function runWebPreview(project, { onStage } = {}) {
  onStage?.("Fetching repository files…");
  const fileTree = await fetchRepoAsFileTree(project, (done, total) => {
    onStage?.(`Fetching repository files… (${done}/${total})`);
  });

  const startCommand = detectStartCommand(fileTree);
  if (!startCommand) {
    throw new Error('Could not detect a start script (expected "dev" or "start" in package.json).');
  }

  onStage?.("Booting isolated browser sandbox…");
  const { WebContainer } = await loadWebContainerSDK();
  if (!webcontainerInstance) {
    webcontainerInstance = await WebContainer.boot();
  }
  await webcontainerInstance.mount(fileTree);

  onStage?.("Installing dependencies…");
  const install = await webcontainerInstance.spawn("npm", ["install"]);
  const installExit = await install.exit;
  if (installExit !== 0) {
    throw new Error("Dependency installation failed inside the sandbox.");
  }

  onStage?.("Starting the application…");
  const [cmd, args] = startCommand;
  await webcontainerInstance.spawn(cmd, args);

  return new Promise((resolve) => {
    webcontainerInstance.on("server-ready", (_port, url) => resolve(url));
  });
}

// Non-JS stacks — genuinely requires a backend that doesn't exist yet.
// This calls the real endpoint and surfaces its real (honest) response.
export async function requestBackendPreview(project, { onStage } = {}) {
  onStage?.("Requesting a preview session…");
  const res = await fetch("/api/preview/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo: project.id, github: project.github }),
  });

  if (res.status === 501) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Preview backend is not yet configured for this project's stack.");
  }
  if (!res.ok) {
    throw new Error("Preview request failed.");
  }
  const data = await res.json();
  return data.previewUrl;
}