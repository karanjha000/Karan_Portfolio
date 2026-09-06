const nodemailer = require("nodemailer");

const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

const setCORSHeaders = (res) => {
  res.setHeader("Access-Control-Allow-Origin", CORS_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
};

let transporter;
if (process.env.NODE_ENV === "development" || !process.env.EMAIL_USER) {
  transporter = {
    sendMail: async () => ({
      messageId: `<dev-${Date.now()}@example.com>`,
      response: "Visit logged",
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
  .footer { border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
`;

const getClientIP = (req) => {
  return (
    req.headers["cf-connecting-ip"] ||
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.socket.remoteAddress ||
    "Unknown"
  ).trim();
};

const parseUserAgent = (ua) => {
  if (!ua) return { browser: "Unknown", os: "Unknown", device: "Unknown" };

  let browser = "Unknown",
    os = "Unknown",
    device = "Desktop";

  // Browser detection
  if (/Chrome|CriOS/i.test(ua) && !/Edge|Edg|OPR/i.test(ua)) {
    browser = "Chrome";
  } else if (/Safari/i.test(ua) && !/Chrome|CriOS/i.test(ua)) {
    browser = "Safari";
  } else if (/Firefox/i.test(ua)) {
    browser = "Firefox";
  } else if (/Edge|Edg/i.test(ua)) {
    browser = "Edge";
  } else if (/OPR/i.test(ua)) {
    browser = "Opera";
  }

  // OS detection
  if (/Windows/i.test(ua)) {
    os = "Windows";
  } else if (/Mac/i.test(ua)) {
    os = "macOS";
  } else if (/Linux/i.test(ua)) {
    os = "Linux";
  } else if (/Android/i.test(ua)) {
    os = "Android";
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    os = "iOS";
  }

  // Device detection
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
    device = "Mobile";
  } else if (/Tablet|iPad/i.test(ua)) {
    device = "Tablet";
  }

  return { browser, os, device };
};

module.exports = async (req, res) => {
  setCORSHeaders(res);
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { referrer } = req.body;

    // Capture actual server-side data
    const visitTime = new Date();
    const clientIP = getClientIP(req);
    const userAgentString = req.headers["user-agent"] || "Unknown";
    const { browser, os, device } = parseUserAgent(userAgentString);
    const sanitizedReferrer = (referrer || "Direct Visit").substring(0, 200);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.RECIPIENT_EMAIL,
      subject: "Portfolio Visit Notification",
      html: `<!DOCTYPE html>
<html>
<head><style>${emailCSS}</style></head>
<body>
  <div class="container">
    <div class="header"><h1>Portfolio Visit</h1></div>
    <div class="section">
      <div class="label">Visit Date & Time</div>
      <div class="value">${visitTime.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      })}</div>
    </div>
    <div class="section">
      <div class="label">Visitor IP Address</div>
      <div class="value">${clientIP}</div>
    </div>
    <div class="section">
      <div class="label">Browser</div>
      <div class="value">${browser}</div>
    </div>
    <div class="section">
      <div class="label">Operating System</div>
      <div class="value">${os}</div>
    </div>
    <div class="section">
      <div class="label">Device Type</div>
      <div class="value">${device}</div>
    </div>
    <div class="section">
      <div class="label">Full User Agent</div>
      <div class="value">${userAgentString.substring(0, 300)}</div>
    </div>
    <div class="section">
      <div class="label">Referrer/Source</div>
      <div class="value">${sanitizedReferrer}</div>
    </div>
    <div class="footer">
      <p>This is an automated notification from your portfolio.</p>
    </div>
  </div>
</body>
</html>`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Visit error:", error.message);
    return res.status(500).json({ error: "Failed to track visit" });
  }
};
