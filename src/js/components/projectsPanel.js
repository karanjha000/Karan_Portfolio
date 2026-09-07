import { registerPanel, getPanelBody, setPanelTitle, state, render } from "./panelSystem.js";
import { isWebPreviewEligible, runWebPreview, requestBackendPreview } from "../services/previewService.js";

export let projects = [];
export let projectsLoaded = false;
export let projectsError = false;

export function setProjects(list) {
  projects = list;
  projectsLoaded = true;
}
export function setProjectsError() {
  projectsError = true;
  projectsLoaded = true;
}

function renderProjectsPanel() {
  const body = getPanelBody();

  if (state.level === "overview") {
    setPanelTitle("Projects");
    if (!projectsLoaded) {
      body.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem;">Loading projects from GitHub…</p>`;
      return;
    }
    if (projectsError) {
      body.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem;">Unable to load projects from GitHub right now. Please try again shortly.</p>`;
      return;
    }
    if (!projects.length) {
      body.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem;">No public repositories found.</p>`;
      return;
    }

    body.innerHTML = `<div class="project-grid">${projects
      .map(
        (p) => `
        <div class="project-tile" data-id="${p.id}">
          <div class="thumb">${p.title.toUpperCase()}</div>
          <div class="tile-body">
            <h3>${p.title}</h3>
            <p>${p.shortDesc}</p>
            <p class="tile-meta">${[p.language, p.stars ? "★ " + p.stars : null].filter(Boolean).join(" · ")}</p>
          </div>
        </div>`,
      )
      .join("")}</div>`;

    body.querySelectorAll(".project-tile").forEach((el) => {
      el.addEventListener("click", () => {
        state.level = "detail";
        state.selected = el.dataset.id;
        state.imgIndex = 0;
        render();
      });
    });
  } else {
    const p = projects.find((x) => x.id === state.selected);
    if (!p) {
      state.level = "overview";
      render();
      return;
    }
    setPanelTitle(p.title);

    const imageBlock = p.images.length
      ? `<div class="detail-image-nav">
           ${p.images.length > 1 ? '<button class="nav-arrow prev" id="imgPrev">‹</button>' : ""}
           <img id="detailImg" src="${p.images[state.imgIndex]}" alt="${p.title} screenshot" />
           ${p.images.length > 1 ? '<button class="nav-arrow next" id="imgNext">›</button>' : ""}
         </div>`
      : `<div class="detail-image-nav" style="background:linear-gradient(135deg,#101a2e,#1c2b45); font-family:var(--mono); color:var(--text-soft); font-size:0.85rem;">${p.title.toUpperCase()}</div>`;

    const metaLine = [
      p.stars ? "★ " + p.stars + " stars" : null,
      p.forks ? p.forks + " forks" : null,
      p.updated ? "updated " + new Date(p.updated).toLocaleDateString() : null,
    ]
      .filter(Boolean)
      .join(" · ");

    body.innerHTML = `
      ${imageBlock}
      <div class="detail-tags">${p.tags.map((t) => `<span class="skill-pill">${t}</span>`).join("")}</div>
      ${metaLine ? `<p style="color:var(--text-soft); font-size:0.78rem; font-family:var(--mono); margin-bottom:16px;">${metaLine}</p>` : ""}
      <p class="detail-desc">${p.fullDesc}</p>
      <div class="cta-row" style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:14px;">
        <button class="btn btn-outline btn-sm" id="previewBtn">Preview</button>
        ${p.liveUrl ? `<a class="btn btn-outline btn-sm" href="${p.liveUrl}" target="_blank" rel="noreferrer">Live Demo</a>` : ""}
        <a class="btn btn-primary btn-sm" href="${p.github}" target="_blank" rel="noreferrer">View on GitHub</a>
      </div>
      <div id="previewStatus"></div>
    `;

    if (p.images.length > 1) {
      const imgEl = document.getElementById("detailImg");
      document.getElementById("imgPrev").addEventListener("click", () => {
        state.imgIndex = (state.imgIndex - 1 + p.images.length) % p.images.length;
        imgEl.src = p.images[state.imgIndex];
      });
      document.getElementById("imgNext").addEventListener("click", () => {
        state.imgIndex = (state.imgIndex + 1) % p.images.length;
        imgEl.src = p.images[state.imgIndex];
      });
    }

    document.getElementById("previewBtn").addEventListener("click", () => runPreview(p, document.getElementById("previewStatus")));
  }
}

async function runPreview(project, container) {
  const setStage = (text) => {
    container.innerHTML = `<p style="font-family:var(--mono); font-size:0.82rem; color:var(--text-muted); margin-top:4px;">${text}</p>`;
  };

  try {
    let previewUrl;
    if (isWebPreviewEligible(project)) {
      previewUrl = await runWebPreview(project, { onStage: setStage });
    } else {
      previewUrl = await requestBackendPreview(project, { onStage: setStage });
    }

    container.innerHTML = `
      <div style="border:1px solid var(--border); border-radius:8px; overflow:hidden; margin-top:4px;">
        <div style="padding:10px 14px; font-family:var(--mono); font-size:0.75rem; color:#4ade80; border-bottom:1px solid var(--border);">● Preview Running</div>
        <iframe src="${previewUrl}" style="width:100%; height:360px; border:none; background:#fff;"></iframe>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `
      <div style="border:1px solid var(--border); border-radius:8px; padding:14px 16px; margin-top:4px;">
        <p style="font-family:var(--mono); font-size:0.78rem; color:var(--text-soft); margin-bottom:4px;">● Preview unavailable</p>
        <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.6;">${err.message || "This project couldn't be previewed automatically."} Use View on GitHub in the meantime.</p>
      </div>
    `;
  }
}

registerPanel("projects", renderProjectsPanel);