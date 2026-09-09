import { registerPanel, getPanelBody, setPanelTitle, state, render, openProjectDetail } from "./panelSystem.js";

let skillCatalog = {};
let projectsRef = [];

export function setSkillsData(catalog, projects) {
  skillCatalog = catalog;
  projectsRef = projects;
}

function renderSkillsPanel() {
  const body = getPanelBody();
  const groups = {};
  Object.values(skillCatalog).forEach((s) => {
    if (!groups[s.category]) groups[s.category] = [];
    groups[s.category].push(s);
  });

  if (state.skillsLevel === "overview") {
    setPanelTitle("Skills");
    const categories = Object.keys(groups);
    body.innerHTML = `<div class="category-grid">${categories
      .map(
        (cat) => `
        <div class="category-tile" data-cat="${cat}">
          <div class="cat-name">${cat}</div>
          <div class="cat-count">${groups[cat].length} technologies</div>
        </div>`,
      )
      .join("")}</div>`;
    body.querySelectorAll(".category-tile").forEach((el) => {
      el.addEventListener("click", () => {
        state.skillsLevel = "category";
        state.selectedCategory = el.dataset.cat;
        render();
      });
    });
  } else if (state.skillsLevel === "category") {
    const cat = state.selectedCategory;
    setPanelTitle(cat);
    const skills = groups[cat] || [];
    body.innerHTML = `<div class="skill-vertical-list">${skills
      .map((s) => {
        const count = s.projectIds.size;
        const key = s.name.toLowerCase();
        return `
        <div class="skill-vertical-item${count ? " clickable" : ""}" data-key="${key}">
          <span class="skill-dash">—</span>
          <span class="skill-name">${s.name}</span>
          ${count ? `<span class="skill-count-badge">${count} project${count === 1 ? "" : "s"}</span>` : ""}
        </div>`;
      })
      .join("")}</div>`;
    body.querySelectorAll(".skill-vertical-item.clickable").forEach((el) => {
      el.addEventListener("click", () => {
        state.skillsLevel = "skill";
        state.selectedSkillKey = el.dataset.key;
        render();
      });
    });
  } else {
    const skill = skillCatalog[state.selectedSkillKey];
    setPanelTitle(skill ? skill.name : "Skill");
    if (!skill) {
      body.innerHTML = `<p style="color:var(--text-soft); font-size:0.85rem;">Skill not found.</p>`;
      return;
    }
    const projectRows = [...skill.projectIds].map((id) => projectsRef.find((p) => p.id === id)).filter(Boolean);
    const detailsHtml = skill.details
      ? `<div class="skill-detail-tags">${skill.details.map((d) => `<span class="skill-pill">${d}</span>`).join("")}</div>`
      : "";
    body.innerHTML = `
      <p style="color:var(--text-soft); font-size:0.8rem; margin-bottom:16px;">
        ${skill.category} · ${projectRows.length} project${projectRows.length === 1 ? "" : "s"} using this
      </p>
      ${detailsHtml}
      <div class="skill-vertical-list">${
        projectRows
          .map(
            (p) => `<div class="skill-vertical-item clickable" data-pid="${p.id}"><span class="skill-dash">→</span><span class="skill-name">${p.title}</span></div>`,
          )
          .join("") || `<p style="color:var(--text-soft); font-size:0.85rem;">No detected project usage yet.</p>`
      }</div>
    `;
    body.querySelectorAll(".skill-vertical-item.clickable").forEach((el) => {
      el.addEventListener("click", () => openProjectDetail(el.dataset.pid));
    });
  }
}

registerPanel("skills", renderSkillsPanel);