export function updateGithubTilePreview(text) {
  const el = document.getElementById("ghTilePreview");
  if (el) el.textContent = text;
}

export function updateProjectsTilePreview(text) {
  const el = document.getElementById("projectsTilePreview");
  if (el) el.textContent = text;
}