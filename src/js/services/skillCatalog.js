import { skillsData } from "../data/skills.js";
import { TECH_ALIASES, CATEGORY_MAP } from "../data/config.js";

function normalizeTech(raw) {
  const key = raw.trim().toLowerCase();
  if (TECH_ALIASES[key]) return TECH_ALIASES[key];
  return raw.length <= 4 ? raw.toUpperCase() : raw.replace(/\b\w/g, (c) => c.toUpperCase());
}

function categorize(tech) {
  for (const [cat, list] of Object.entries(CATEGORY_MAP)) {
    if (list.some((x) => x.toLowerCase() === tech.toLowerCase())) return cat;
  }
  return "From GitHub";
}

/**
 * Merges resume skills (source of truth, always visible even with zero
 * detected project usage) with technologies detected from live project
 * tags. Each entry tracks which project IDs it was found in, so the UI
 * can show "Java — 3 projects" and list them.
 */
export function buildSkillCatalog(projects) {
  const catalog = {};

  function addSkill(name, category, projectId, source) {
    const key = name.toLowerCase();
    if (!catalog[key]) catalog[key] = { name, category, source, projectIds: new Set() };
    if (source === "github" && catalog[key].source === "resume") catalog[key].source = "both";
    if (projectId) catalog[key].projectIds.add(projectId);
  }

  Object.entries(skillsData).forEach(([cat, list]) => {
    list.forEach((s) => addSkill(s, cat, null, "resume"));
  });

  projects.forEach((p) => {
    p.tags.forEach((t) => {
      const norm = normalizeTech(t);
      addSkill(norm, categorize(norm), p.id, "github");
    });
  });

  return catalog;
}