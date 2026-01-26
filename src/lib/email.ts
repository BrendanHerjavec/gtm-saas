/**
 * Email utility for sending transactional emails.
 *
 * TODO: Set up Resend account and add RESEND_API_KEY to environment variables
 * - Sign up at https://resend.com
 * - Create an API key
 * - Add RESEND_API_KEY and FROM_EMAIL to .env
 *
 * In production, set RESEND_API_KEY environment variable.
 * In development without the key, emails are logged to console.
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@example.com";

export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  const { to, subject, html } = options;

  // Development mode: log email to console
  if (!RESEND_API_KEY) {
    console.log("=== EMAIL (dev mode - no RESEND_API_KEY) ===");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html}`);
    console.log("============================================");
    return { success: true, messageId: "dev-mode" };
  }

  // Production mode: send via Resend API
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend API error:", error);
      return { success: false, error: `Email send failed: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error("Email send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function getPasswordResetEmailHtml(resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Reset Your Password</h1>
        <p style="color: #666; line-height: 1.6;">
          You requested to reset your password. Click the button below to create a new password.
          This link will expire in 1 hour.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Reset Password
        </a>
        <p style="color: #999; font-size: 14px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </body>
    </html>
  `;
}
