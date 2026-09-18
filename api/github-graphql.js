module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.GITHUB_TOKEN) return res.status(500).json({ error: "GITHUB_TOKEN not configured" });
  const { query, variables } = req.body || {};
  if (!query) return res.status(400).json({ error: "Missing query" });
  try {
    const ghRes = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    const body = await ghRes.text();
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.setHeader("Content-Type", "application/json");
    res.status(ghRes.status);
    return res.send(body);
  } catch (err) {
    return res.status(502).json({ error: "GitHub GraphQL request failed" });
  }
};