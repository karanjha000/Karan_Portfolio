// STUB — pairs with api/preview/start.js. Once a real sandbox backend
// exists, this would accept a session ID and return one of:
//   { status: "preparing" | "installing" | "building" | "starting" | "running" | "failed", previewUrl?, error? }
// so the frontend can poll it while a non-JS preview session boots.
// Currently unused because start.js never issues a session (it's honest
// about not being implemented yet).

module.exports = function handler(req, res) {
  res.status(501).json({
    message: "Preview backend is not yet configured for this project's stack.",
  });
};