import { registerPanel, getPanelBody, setPanelTitle } from "./panelSystem.js";

function renderContactPanel() {
  setPanelTitle("Contact");
  getPanelBody().innerHTML = `
    <div class="contact-action-list">
      <a class="contact-action" href="mailto:karanjhax12@gmail.com">
        <div><div class="ca-label">Email</div><div class="ca-value">karanjhax12@gmail.com</div></div>
        <span class="ca-arrow">→</span>
      </a>
      <a class="contact-action" href="tel:+918959863919">
        <div><div class="ca-label">Phone</div><div class="ca-value">+91 89598 63919</div></div>
        <span class="ca-arrow">→</span>
      </a>
      <a class="contact-action" href="https://www.linkedin.com/in/karanjha000/" target="_blank" rel="noreferrer">
        <div><div class="ca-label">LinkedIn</div><div class="ca-value">linkedin.com/in/karanjha000</div></div>
        <span class="ca-arrow">→</span>
      </a>
      <a class="contact-action" href="https://github.com/karanjha000" target="_blank" rel="noreferrer">
        <div><div class="ca-label">GitHub</div><div class="ca-value">github.com/karanjha000</div></div>
        <span class="ca-arrow">→</span>
      </a>
      <a class="contact-action" href="resume.pdf" download>
        <div><div class="ca-label">Resume</div><div class="ca-value">Download PDF</div></div>
        <span class="ca-arrow">↓</span>
      </a>
    </div>
  `;
}

registerPanel("contact", renderContactPanel);