import { registerPanel, getPanelBody, setPanelTitle } from "./panelSystem.js";

function renderResumeViewer() {
  setPanelTitle("Resume");
  getPanelBody().innerHTML = `
    <div style="height:100%; display:flex; flex-direction:column;">
      <iframe
        src="/resume.pdf"
        title="Karan Jha Resume"
        style="width:100%; flex:1; min-height:420px; border:1px solid var(--border); border-radius:8px; background:#fff;"
      ></iframe>
    </div>
  `;
}

registerPanel("resumeview", renderResumeViewer);