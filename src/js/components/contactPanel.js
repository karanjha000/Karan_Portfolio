import { registerPanel, getPanelBody, setPanelTitle } from "./panelSystem.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    </div>

    <p class="gh-section-label" style="margin-top:22px;">Send a Message</p>
    <form id="contactForm" class="contact-form" novalidate>
      <div class="form-group">
        <label class="form-label" for="cf-name">Name</label>
        <input class="form-input" type="text" id="cf-name" name="name" autocomplete="name" required />
        <p class="form-error" id="cf-name-error" role="alert"></p>
      </div>

      <div class="form-group">
        <label class="form-label" for="cf-email">Email</label>
        <input class="form-input" type="email" id="cf-email" name="email" autocomplete="email" required />
        <p class="form-error" id="cf-email-error" role="alert"></p>
      </div>

      <div class="form-group">
        <label class="form-label" for="cf-subject">Subject</label>
        <input class="form-input" type="text" id="cf-subject" name="subject" autocomplete="off" required />
        <p class="form-error" id="cf-subject-error" role="alert"></p>
      </div>

      <div class="form-group">
        <label class="form-label" for="cf-message">Message</label>
        <textarea class="form-textarea" id="cf-message" name="message" rows="5" required></textarea>
        <p class="form-error" id="cf-message-error" role="alert"></p>
      </div>

      <button type="submit" class="btn btn-primary form-submit-btn" id="cfSubmitBtn">Send Message</button>
      <div id="cfStatus" class="form-status" role="status" aria-live="polite"></div>
    </form>
  `;

  wireContactForm();
}

function fieldError(id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message || "";
  const input = document.getElementById(id.replace("-error", ""));
  if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
}

function validateForm(data) {
  const errors = {};
  if (!data.name.trim()) errors["cf-name-error"] = "Name is required.";
  if (!data.email.trim()) errors["cf-email-error"] = "Email is required.";
  else if (!EMAIL_RE.test(data.email.trim())) errors["cf-email-error"] = "Enter a valid email address.";
  if (!data.subject.trim()) errors["cf-subject-error"] = "Subject is required.";
  if (!data.message.trim()) errors["cf-message-error"] = "Message is required.";
  return errors;
}

function wireContactForm() {
  const form = document.getElementById("contactForm");
  const submitBtn = document.getElementById("cfSubmitBtn");
  const status = document.getElementById("cfStatus");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    ["cf-name-error", "cf-email-error", "cf-subject-error", "cf-message-error"].forEach((id) => fieldError(id, ""));
    status.textContent = "";
    status.className = "form-status";

    const data = {
      name: form.name.value,
      email: form.email.value,
      subject: form.subject.value,
      message: form.message.value,
    };

    const errors = validateForm(data);
    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([id, msg]) => fieldError(id, msg));
      status.textContent = "Please fix the highlighted fields.";
      status.classList.add("form-status-error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";
    status.textContent = "Sending your message…";
    status.classList.add("form-status-pending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim(),
          subject: data.subject.trim(),
          message: data.message.trim(),
          timestamp: new Date().toISOString(),
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(body.error || "Something went wrong sending your message.");

      status.className = "form-status form-status-success";
      status.textContent = "Message sent — thanks for reaching out, I'll reply soon.";
      form.reset();
    } catch (err) {
      status.className = "form-status form-status-error";
      status.textContent = err.message || "Failed to send message. Please try again or email me directly.";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Message";
    }
  });
}

registerPanel("contact", renderContactPanel);