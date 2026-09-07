import { registerPanel, getPanelBody, setPanelTitle, openProjectDetail } from "./panelSystem.js";
import { experienceData } from "../data/experience.js";

let projectsRef = [];
export function setExperienceProjects(projects) {
  projectsRef = projects;
}

function renderExperiencePanel() {
  setPanelTitle("Experience");
  const body = getPanelBody();
  const proj = experienceData.project;
  const linkedProject = projectsRef.find((p) => p.id === proj.repoId);

  body.innerHTML = `
    <div class="edu-row"><span class="edu-label">Organization</span><span class="edu-value">${experienceData.organization}</span></div>
    <div class="edu-row"><span class="edu-label">Duration</span><span class="edu-value">${experienceData.duration}</span></div>
    <div class="edu-row"><span class="edu-label">Focus Areas</span><span class="edu-value">${experienceData.focusAreas.join(" & ")}</span></div>

    <p class="gh-section-label">Project Under This Partnership</p>
    <div class="edu-row"><span class="edu-label">Project</span><span class="edu-value">${proj.name}</span></div>
    <div class="edu-row"><span class="edu-label">Type</span><span class="edu-value">${proj.type}</span></div>
    <div class="edu-row"><span class="edu-label">Role</span><span class="edu-value">${proj.role}</span></div>
    <p style="color:var(--text-muted); font-size:0.88rem; margin-top:14px; line-height:1.6;">${proj.note}</p>
    ${linkedProject ? `<button class="btn btn-outline btn-sm" id="viewSkillConnectBtn" style="margin-top:16px;">View SkillConnect Project</button>` : ""}
  `;

  if (linkedProject) {
    document.getElementById("viewSkillConnectBtn").addEventListener("click", () => openProjectDetail(proj.repoId));
  }
}

registerPanel("experience", renderExperiencePanel);