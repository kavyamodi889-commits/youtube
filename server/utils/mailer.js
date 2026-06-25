// FILE: server/utils/mailer.js
const nodemailer = require('nodemailer')

// ── Build transporter ─────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',   // true only for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// ── Verify connection on startup so you catch config errors early ─────────────
transporter.verify((err) => {
  if (err) {
    console.error('[mailer] ❌ SMTP connection failed:', err.message)
    console.error('[mailer]    Check SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS in your .env')
  } else {
    console.log('[mailer] ✅ SMTP connected — ready to send emails')
  }
})

// ── Sender address — NOTE: lowercase 'from', used in every sendMail call ──────
const from    = `"AURA" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`
const APP_URL = process.env.CLIENT_URL || 'http://localhost:5173'

// ── Shared HTML shell ─────────────────────────────────────────────────────────
function shell(body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#0a0a14;font-family:'Segoe UI',Arial,sans-serif;color:#e2e0f0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a14;padding:40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0"
  style="background:#12121e;border-radius:16px;border:1px solid #2a2a3e;overflow:hidden;max-width:560px;width:100%;">
  <tr>
    <td style="background:linear-gradient(135deg,#b5294e,#6654a8);padding:26px 36px;text-align:center;">
      <span style="font-size:24px;font-weight:800;letter-spacing:3px;color:#fff;">AURA</span>
    </td>
  </tr>
  <tr>
    <td style="padding:36px 36px 28px;">${body}</td>
  </tr>
  <tr>
    <td style="padding:16px 36px 28px;border-top:1px solid #2a2a3e;text-align:center;">
      <p style="margin:0;font-size:12px;color:#6b6888;">
        &copy; ${new Date().getFullYear()} AURA &middot;
        <a href="${APP_URL}" style="color:#9580c8;text-decoration:none;">Visit AURA</a>
      </p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

function btn(href, label) {
  return `
  <div style="text-align:center;margin-top:24px;">
    <a href="${href}"
      style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#b5294e,#6654a8);
             color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
      ${label}
    </a>
  </div>`
}

// ── 1. Welcome email ──────────────────────────────────────────────────────────
async function sendWelcomeEmail({ to, displayName }) {
  const html = shell(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#fff;">Welcome to AURA, ${displayName}! 🎉</h2>
    <p style="margin:0 0 16px;color:#a09cbe;line-height:1.7;">
      Your account is ready. Start exploring videos, subscribe to creators, and upload your own content.
    </p>
    <ul style="color:#c0bdd8;padding-left:20px;line-height:2.2;margin:0 0 8px;">
      <li>🔍 Discover trending videos on your feed</li>
      <li>📺 Subscribe to channels you love</li>
      <li>🎬 Upload your first video</li>
    </ul>
    ${btn(APP_URL, 'Go to AURA &rarr;')}
  `)

  await transporter.sendMail({
    from,
    to,
    subject: `Welcome to AURA, ${displayName}! 🎉`,
    html,
    text: `Welcome to AURA, ${displayName}! Your account is ready. Visit ${APP_URL}`,
  })
  console.log(`[mailer] welcome email sent → ${to}`)
}

// ── 2. Login alert email ──────────────────────────────────────────────────────
async function sendLoginAlertEmail({ to, displayName, ip, userAgent, time }) {
  const html = shell(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#fff;">New sign-in to your account</h2>
    <p style="margin:0 0 20px;color:#a09cbe;line-height:1.7;">
      Hi <strong style="color:#e2e0f0;">${displayName}</strong>,
      we noticed a new sign-in to your AURA account.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#0f0f1e;border-radius:10px;border:1px solid #2a2a3e;margin-bottom:20px;">
      <tr>
        <td style="padding:14px 18px;border-bottom:1px solid #2a2a3e;">
          <div style="font-size:11px;color:#6b6888;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Time</div>
          <div style="font-size:14px;color:#e2e0f0;">${time}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 18px;border-bottom:1px solid #2a2a3e;">
          <div style="font-size:11px;color:#6b6888;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">IP Address</div>
          <div style="font-size:14px;color:#e2e0f0;">${ip || 'Unknown'}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 18px;">
          <div style="font-size:11px;color:#6b6888;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Device</div>
          <div style="font-size:13px;color:#e2e0f0;">${String(userAgent || 'Unknown').substring(0, 120)}</div>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#a09cbe;font-size:13px;line-height:1.7;">
      If this was you, no action is needed.
      If not, please change your password immediately.
    </p>
    ${btn(`${APP_URL}/auth`, 'Secure my account &rarr;')}
  `)

  await transporter.sendMail({
    from,
    to,
    subject: 'New sign-in to your AURA account',
    html,
    text: `Hi ${displayName}, new sign-in detected at ${time} from IP ${ip}. If this wasn't you, visit ${APP_URL}/auth`,
  })
  console.log(`[mailer] login alert sent → ${to}`)
}

// ── 3. Password reset email ───────────────────────────────────────────────────
async function sendPasswordResetEmail({ to, displayName, resetToken }) {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`

  const html = shell(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#fff;">Reset your password</h2>
    <p style="margin:0 0 16px;color:#a09cbe;line-height:1.7;">
      Hi <strong style="color:#e2e0f0;">${displayName}</strong>,
      we received a request to reset your AURA password.
      Click the button below to set a new one.
    </p>
    ${btn(resetUrl, 'Reset Password &rarr;')}
    <p style="margin:24px 0 0;color:#6b6888;font-size:13px;line-height:1.7;">
      This link expires in <strong style="color:#a09cbe;">1 hour</strong>.<br/>
      If you didn&rsquo;t request this, you can safely ignore this email &mdash; your password won&rsquo;t change.
    </p>
    <p style="margin:14px 0 0;font-size:12px;color:#6b6888;word-break:break-all;">
      Or paste this URL into your browser:<br/>
      <a href="${resetUrl}" style="color:#9580c8;">${resetUrl}</a>
    </p>
  `)

  await transporter.sendMail({
    from,
    to,
    subject: 'Reset your AURA password',
    html,
    text: `Hi ${displayName},\n\nReset your AURA password here:\n${resetUrl}\n\nThis link expires in 1 hour.\nIf you didn't request this, ignore this email.`,
  })
  console.log(`[mailer] password reset email sent → ${to}`)
}

module.exports = { sendWelcomeEmail, sendLoginAlertEmail, sendPasswordResetEmail }