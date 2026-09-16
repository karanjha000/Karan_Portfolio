import { skillsData } from "../data/skills.js";
import { TECH_INFO, SKILL_DETAILS } from "../data/config.js";

// Every incoming tag is looked up directly in TECH_INFO by its
// normalized key. If it's not a recognized real technology, it is
// DROPPED — not shown under a generic catch-all category. This is what
// keeps repo topics, README words, and project-description fragments
// (e.g. "library-management-system", "booking-system") out of Skills:
// they simply have no entry here, so they never become a skill.
function resolveTech(raw) {
  const key = raw.trim().toLowerCase().replace(/\s+/g, "-");
  return TECH_INFO[key] || null;
}

/**
 * Merges resume skills (source of truth, always visible even with zero
 * detected project usage) with technologies genuinely detected from
 * each project's dependency-file scan (see techDetector.js) and real
 * per-repo language breakdown. Each entry tracks which project IDs it
 * was found in, so the UI can show "Java — 3 projects" and list them.
 */
export function buildSkillCatalog(projects) {
  const catalog = {};

  function addSkill(name, category, projectId, source) {
    const key = name.toLowerCase();
    if (!catalog[key]) {
      catalog[key] = { name, category, source, projectIds: new Set(), details: SKILL_DETAILS[key] || null };
    }
    if (source === "github" && catalog[key].source === "resume") catalog[key].source = "both";
    if (projectId) catalog[key].projectIds.add(projectId);
  }

  Object.entries(skillsData).forEach(([cat, list]) => {
    list.forEach((s) => addSkill(s, cat, null, "resume"));
  });

  projects.forEach((p) => {
    p.tags.forEach((t) => {
      const resolved = resolveTech(t);
      if (!resolved) return; // not a genuine technology — discard, don't guess a category
      addSkill(resolved.name, resolved.category, p.id, "github");
    });
  });

  return catalog;
}