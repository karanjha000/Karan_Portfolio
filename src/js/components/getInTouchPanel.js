import { registerPanel, getPanelBody, setPanelTitle } from "./panelSystem.js";

// Dashboard "Get in Touch" tile — the working contact form only. Direct
// instant contact methods (email/phone/LinkedIn/GitHub) live in their
// own separate "Contact" panel (contactPanel.js), reached from the
// navbar, so the two are never mixed together.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function renderGetInTouchPanel() {
  setPanelTitle("Get in Touch");
  getPanelBody().innerHTML = `
    <p style="color:var(--text-soft); font-size:0.85rem; margin-bottom:18px; line-height:1.6;">
      Send a message directly and I'll get back to you as soon as possible.
    </p>
    <form id="getInTouchForm" class="contact-form" novalidate>
      <div class="form-group">
        <label class="form-label" for="git-name">Name</label>
        <input class="form-input" type="text" id="git-name" name="name" autocomplete="name" required />
        <p class="form-error" id="git-name-error" role="alert"></p>
      </div>

      <div class="form-group">
        <label class="form-label" for="git-email">Email</label>
        <input class="form-input" type="email" id="git-email" name="email" autocomplete="email" required />
        <p class="form-error" id="git-email-error" role="alert"></p>
      </div>

      <div class="form-group">
        <label class="form-label" for="git-subject">Subject</label>
        <input class="form-input" type="text" id="git-subject" name="subject" autocomplete="off" required />
        <p class="form-error" id="git-subject-error" role="alert"></p>
      </div>

      <div class="form-group">
        <label class="form-label" for="git-message">Message</label>
        <textarea class="form-textarea" id="git-message" name="message" rows="5" required></textarea>
        <p class="form-error" id="git-message-error" role="alert"></p>
      </div>

      <button type="submit" class="btn btn-primary form-submit-btn" id="gitSubmitBtn">Send Message</button>
      <div id="gitStatus" class="form-status" role="status" aria-live="polite"></div>
    </form>
  `;

  wireGetInTouchForm();
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
  if (!data.name.trim()) errors["git-name-error"] = "Name is required.";
  if (!data.email.trim()) errors["git-email-error"] = "Email is required.";
  else if (!EMAIL_RE.test(data.email.trim())) errors["git-email-error"] = "Enter a valid email address.";
  if (!data.subject.trim()) errors["git-subject-error"] = "Subject is required.";
  if (!data.message.trim()) errors["git-message-error"] = "Message is required.";
  return errors;
}

function wireGetInTouchForm() {
  const form = document.getElementById("getInTouchForm");
  const submitBtn = document.getElementById("gitSubmitBtn");
  const status = document.getElementById("gitStatus");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    ["git-name-error", "git-email-error", "git-subject-error", "git-message-error"].forEach((id) => fieldError(id, ""));
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

registerPanel("getintouch", renderGetInTouchPanel);