const nodemailer = require("nodemailer");

const NODE_ENV = process.env.NODE_ENV || "development";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

const setCORSHeaders = (res) => {
  res.setHeader("Access-Control-Allow-Origin", CORS_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
};

let transporter;
if (NODE_ENV === "development" || !process.env.EMAIL_USER) {
  transporter = {
    sendMail: async (mailOptions) => ({
      messageId: `<dev-${Date.now()}@example.com>`,
      response: "Message logged",
    }),
  };
} else {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

const emailCSS = `
  body { font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; }
  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  .header { border-bottom: 3px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { margin: 0; color: #0a192f; font-size: 24px; }
  .section { margin-bottom: 25px; }
  .label { color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 8px; }
  .value { color: #1f2933; font-size: 14px; line-height: 1.6; }
  .message-box { background-color: #f3f4f6; border-left: 4px solid #007bff; padding: 16px; border-radius: 4px; margin-top: 10px; }
  .message-text { color: #1f2933; font-size: 14px; line-height: 1.8; white-space: pre-wrap; word-break: break-word; }
  .footer { border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
`;

const escapeHTML = (text) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

module.exports = async (req, res) => {
  setCORSHeaders(res);
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, subject, message, timestamp } = req.body;

    if (!name || typeof name !== "string" || !email || typeof email !== "string" || !message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing or invalid required fields" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const sanitizedName = name.trim().substring(0, 100);
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedSubject = (typeof subject === "string" ? subject.trim() : "").substring(0, 150);
    const sanitizedMessage = message.trim().substring(0, 5000);

    if (!sanitizedName || !sanitizedMessage) {
      return res.status(400).json({ error: "Name and message cannot be empty" });
    }

    const mailOptions = {
      from: `"${sanitizedName}" <${process.env.EMAIL_USER}>`,
      to: process.env.RECIPIENT_EMAIL,
      replyTo: sanitizedEmail,
      subject: sanitizedSubject ? `Portfolio: ${sanitizedSubject}` : `Message from ${sanitizedName}`,
      html: `<!DOCTYPE html>
<html>
<head><style>${emailCSS}</style></head>
<body>
  <div class="container">
    <div class="header"><h1>Message Received</h1></div>
    <div class="section">
      <div class="label">From</div>
      <div class="value">${escapeHTML(sanitizedName)}</div>
    </div>
    <div class="section">
      <div class="label">Contact Email</div>
      <div class="value"><a href="mailto:${sanitizedEmail}" style="color: #007bff; text-decoration: none;">${sanitizedEmail}</a></div>
    </div>
    ${sanitizedSubject ? `<div class="section">
      <div class="label">Subject</div>
      <div class="value">${escapeHTML(sanitizedSubject)}</div>
    </div>` : ""}
    <div class="section">
      <div class="label">Message</div>
      <div class="message-box">
        <div class="message-text">${escapeHTML(sanitizedMessage)}</div>
      </div>
    </div>
    <div class="footer">
      <div>Received on ${new Date(timestamp).toLocaleString()}</div>
    </div>
  </div>
</body>
</html>`,
    };

    await transporter.sendMail(mailOptions);

    const visitorConfirmationEmail = {
      from: process.env.EMAIL_USER,
      to: sanitizedEmail,
      replyTo: process.env.RECIPIENT_EMAIL,
      subject: "We Received Your Message",
      html: `<!DOCTYPE html>
<html>
<head><style>${emailCSS}</style></head>
<body>
  <div class="container">
    <div class="header"><h1>Thank You for Reaching Out</h1></div>
    <div class="section">
      <p class="value">Hi ${escapeHTML(sanitizedName)},</p>
      <p class="value">Thank you for visiting my portfolio and taking the time to send me a message. I have received your inquiry and will get back to you as soon as possible.</p>
      <p style="color: #1f2933; font-size: 14px; font-weight: 600;">Your Message:</p>
      <div class="message-box">
        <div class="message-text">${escapeHTML(sanitizedMessage)}</div>
      </div>
      <p style="color: #1f2933; font-size: 14px; margin-top: 20px;">I appreciate your interest and will be in touch shortly.</p>
      <p style="color: #1f2933; font-size: 14px;">Best regards,<br>Karan Jha</p>
    </div>
    <div class="footer">
      <p>This is an automated confirmation email. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`,
    };

    await transporter.sendMail(visitorConfirmationEmail);

    return res.status(201).json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("Contact error:", error.message);
    return res.status(500).json({ error: "Failed to send message" });
  }
};