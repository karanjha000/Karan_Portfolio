module.exports = async function handler(req, res) {
  const { path } = req.query;
  if (!path || typeof path !== "string") {
    return res.status(400).json({ error: "Missing path query parameter" });
  }

  const headers = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const ghRes = await fetch(`https://api.github.com/${path}`, { headers });
    const body = await ghRes.text();

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.setHeader("Content-Type", ghRes.headers.get("content-type") || "application/json");
    res.status(ghRes.status);
    return res.send(body);
  } catch (err) {
    return res.status(502).json({ error: "GitHub API request failed" });
  }
};