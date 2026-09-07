import { registerPanel, getPanelBody, setPanelTitle } from "./panelSystem.js";
import { educationFacts } from "../data/education.js";

function renderEducationPanel() {
  setPanelTitle("Education");
  getPanelBody().innerHTML = educationFacts
    .map((f) => `<div class="edu-row"><span class="edu-label">${f.label}</span><span class="edu-value">${f.value}</span></div>`)
    .join("");
}

registerPanel("education", renderEducationPanel);