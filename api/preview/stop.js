// STUB — pairs with api/preview/start.js. Once a real sandbox backend
// exists, this would accept a session ID, tear down that session's
// container, and free its resources. Currently unused for the same
// reason as status.js — start.js never issues a session yet.

export default function handler(req, res) {
  res.status(501).json({
    message: "Preview backend is not yet configured for this project's stack.",
  });
}