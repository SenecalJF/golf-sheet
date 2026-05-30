import "server-only";
import nodemailer from "nodemailer";

const DEFAULT_GMAIL_USER = "jeanjeansenecal@gmail.com";

type PasswordResetEmailInput = {
  to: string;
  name: string | null | undefined;
  resetUrl: string;
};

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: PasswordResetEmailInput) {
  const smtpUser = process.env.GMAIL_SMTP_USER?.trim() || DEFAULT_GMAIL_USER;
  const appPassword = process.env.GMAIL_APP_PASSWORD?.trim();

  if (!appPassword) {
    throw new Error("GMAIL_APP_PASSWORD is required to send password reset emails.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtpUser,
      pass: appPassword,
    },
  });

  const displayName = name?.trim() || "there";
  const escapedName = escapeHtml(displayName);
  const escapedUrl = escapeHtml(resetUrl);

  await transporter.sendMail({
    from: process.env.PASSWORD_RESET_FROM?.trim() || `Golf Clubhouse <${smtpUser}>`,
    to,
    subject: "Reset your Golf Clubhouse password",
    text: [
      `Hi ${displayName},`,
      "",
      "Use this link to reset your Golf Clubhouse password:",
      resetUrl,
      "",
      "This link expires in 1 hour. If you did not ask for it, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #102015; line-height: 1.5;">
        <p>Hi ${escapedName},</p>
        <p>Use this link to reset your Golf Clubhouse password:</p>
        <p>
          <a href="${escapedUrl}" style="display: inline-block; background: #16a34a; color: #ffffff; padding: 10px 16px; border-radius: 8px; text-decoration: none;">
            Reset password
          </a>
        </p>
        <p>This link expires in 1 hour. If you did not ask for it, you can ignore this email.</p>
      </div>
    `,
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}
