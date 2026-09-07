// STUB — no sandbox execution backend is wired up yet.
// This intentionally returns 501 so the frontend shows an honest
// "Preview unavailable" message instead of fabricating a running app.
//
// To make this real for non-JS stacks (e.g. Java/Spring Boot), this
// endpoint would need to:
//   1. Receive { repo, github } in the request body.
//   2. Clone/fetch the repo into an isolated, ephemeral container
//      (e.g. Firecracker, gVisor, or a hosted service like E2B or
//      CodeSandbox's SDK — never execute repo code directly on this host).
//   3. Detect the build system (pom.xml -> Maven, build.gradle -> Gradle,
//      Dockerfile -> Docker) and run the matching build/start commands
//      only inside that isolated container.
//   4. Poll a health check until the app responds, then return
//      { previewUrl } pointing at the container's exposed temporary URL.
//   5. Enforce CPU/memory/disk/time limits and tear the container down
//      automatically after inactivity — treat all repo code as untrusted.
//
// JS/Node/React repos don't need this at all — see
// src/js/services/previewService.js, which runs those live in the
// visitor's own browser via WebContainers, no backend required.

export default function handler(req, res) {
  res.status(501).json({
    message: "Preview backend is not yet configured for this project's stack.",
  });
}