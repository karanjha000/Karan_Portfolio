export const panelEyebrows = {
  skills: "01 / SKILLS",
  experience: "02 / EXPERIENCE",
  projects: "03 / PROJECTS",
  education: "04 / EDUCATION",
  github: "05 / GITHUB",
  contact: "06 / CONTACT",
  resumeview: "// RESUME",
};

const renderers = {};
export function registerPanel(type, renderFn) {
  renderers[type] = renderFn;
}

export let state = {
  type: null,
  level: "overview",
  selected: null,
  imgIndex: 0,
  skillsLevel: "overview",
  selectedCategory: null,
  selectedSkillKey: null,
};

let overlay, panelTitle, panelEyebrow, panelBody, panelBack, panelClose, bgAppBuild;

export function initPanelSystem() {
  overlay = document.getElementById("panelOverlay");
  panelTitle = document.getElementById("panelTitle");
  panelEyebrow = document.getElementById("panelEyebrow");
  panelBody = document.getElementById("panelBody");
  panelBack = document.getElementById("panelBack");
  panelClose = document.getElementById("panelClose");
  bgAppBuild = document.getElementById("bgAppBuild");

  panelClose.addEventListener("click", closePanel);
  panelBack.addEventListener("click", goBack);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closePanel();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePanel();
  });

  document.querySelectorAll("[data-panel]").forEach((el) => {
    el.addEventListener("click", () => openPanel(el.dataset.panel));
  });
}

export function getPanelBody() {
  return panelBody;
}

export function setPanelTitle(text) {
  panelTitle.textContent = text;
}

function setActiveNav(type) {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.panel === type);
  });
}

export function openPanel(type) {
  state = {
    type, level: "overview", selected: null, imgIndex: 0,
    skillsLevel: "overview", selectedCategory: null, selectedSkillKey: null,
  };
  setActiveNav(type);
  render();
  overlay.classList.add("open");
  bgAppBuild?.classList.add("dimmed");
}

export function closePanel() {
  overlay.classList.remove("open");
  setActiveNav(null);
  bgAppBuild?.classList.remove("dimmed");
}

export function goBack() {
  if (state.type === "skills") {
    if (state.skillsLevel === "skill") {
      state.skillsLevel = "category";
      state.selectedSkillKey = null;
    } else {
      state.skillsLevel = "overview";
      state.selectedCategory = null;
    }
  } else {
    state.level = "overview";
    state.selected = null;
  }
  render();
}

// Lets a project row inside a Skill's or Experience's detail view jump
// straight to that project's full detail, switching panel type mid-flow.
export function openProjectDetail(projectId) {
  state = {
    type: "projects", level: "detail", selected: projectId, imgIndex: 0,
    skillsLevel: "overview", selectedCategory: null, selectedSkillKey: null,
  };
  setActiveNav("projects");
  render();
}

export function render() {
  const showBack = state.type === "skills" ? state.skillsLevel !== "overview" : state.level !== "overview";
  panelBack.classList.toggle("show", showBack);
  panelEyebrow.textContent = panelEyebrows[state.type] || "";
  const renderFn = renderers[state.type];
  if (renderFn) renderFn();
}