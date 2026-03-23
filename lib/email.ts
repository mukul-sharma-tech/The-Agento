import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    console.log(`[email] Sending to=${to} subject="${subject}"`);
    const info = await transporter.sendMail({
      from: `"Agento" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
    console.log(`[email] Sent OK: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error(`[email] FAILED to=${to} subject="${subject}":`, error);
    return { success: false, error };
  }
};

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to Agento!</h2>
      <p>Please verify your email address by clicking the button below:</p>
      <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p>${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
    </div>
  `;
  return sendEmail(email, 'Verify Your Email - Agento', html);
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your Synopsee account.</p>
      <p>Click the button below to reset your password:</p>
      <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p>${resetUrl}</p>
      <p>This link will expire in 15 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;
  return sendEmail(email, 'Reset Your Password - Synopsee', html);
};

/** Sent to ADMIN_MAIL when a user requests a plan upgrade */
export const sendSubscriptionRequestEmail = async (
  userName: string,
  userEmail: string,
  companyName: string,
  plan: string
) => {
  const adminMail = process.env.ADMIN_MAIL;
  if (!adminMail) return { success: false, error: "ADMIN_MAIL not set" };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Subscription Request — Agento</h2>
      <p>A user has requested a plan upgrade. Please review and approve or reject from the Admin Dashboard.</p>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Name</td><td style="padding:8px;border:1px solid #ddd">${userName}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd">${userEmail}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Company</td><td style="padding:8px;border:1px solid #ddd">${companyName}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Plan</td><td style="padding:8px;border:1px solid #ddd">${plan}</td></tr>
      </table>
      <p style="margin-top:16px">
        <a href="${process.env.NEXTAUTH_URL}/admin" style="background:#4f46e5;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block">
          Open Admin Dashboard
        </a>
      </p>
      <p style="color:#888;font-size:12px">You can reply to this email to contact the user directly at ${userEmail}.</p>
    </div>
  `;
  return sendEmail(adminMail, `[Agento] Subscription Request: ${plan} — ${userName}`, html);
};

/** Sent to user when admin approves their subscription */
export const sendSubscriptionApprovedEmail = async (
  userEmail: string,
  userName: string,
  plan: string,
  tokenExpiry: Date
) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your ${plan} Plan is Active — Agento</h2>
      <p>Hi ${userName}, your subscription request has been approved!</p>
      <p><strong>Plan:</strong> ${plan}</p>
      <p><strong>Valid until:</strong> ${tokenExpiry.toDateString()}</p>
      <p>Log in to Agento to start using your upgraded plan.</p>
      <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background:#4f46e5;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block">
        Go to Dashboard
      </a>
    </div>
  `;
  return sendEmail(userEmail, `[Agento] Your ${plan} subscription is now active`, html);
};

/** Sent to user when admin rejects their subscription */
export const sendSubscriptionRejectedEmail = async (
  userEmail: string,
  userName: string,
  plan: string
) => {
  const adminMail = process.env.ADMIN_MAIL || "support@agento.ai";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Subscription Request Update — Agento</h2>
      <p>Hi ${userName}, unfortunately your request for the <strong>${plan}</strong> plan was not approved at this time.</p>
      <p>If you have questions, reply to this email or contact us at <a href="mailto:${adminMail}">${adminMail}</a>.</p>
    </div>
  `;
  return sendEmail(userEmail, `[Agento] Subscription request update`, html);
};

const PLAN_PRICES: Record<string, string> = {
  "pro-chat":  "₹350",
  "pro-query": "₹350",
  "business":  "₹699",
};

/** Sent to user immediately after they submit a subscription request */
export const sendSubscriptionQueuedEmail = async (
  userEmail: string,
  userName: string,
  plan: string
) => {
  const upiPhone = process.env.ADMIN_UPI_PHONE_NO || "N/A";
  const adminMail = process.env.ADMIN_MAIL || "support@agento.ai";
  const price = PLAN_PRICES[plan] ?? "the plan amount";
  const planLabel = plan === "pro-chat" ? "Pro (AI Chat + Voice)" : plan === "pro-query" ? "Pro (Query Genius)" : "Business";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
      <h2 style="color:#4f46e5">Your request is in queue — Agento</h2>
      <p>Hi ${userName},</p>
      <p>We've received your subscription request for the <strong>${planLabel}</strong> plan. 🎉</p>

      <div style="background:#f1f5f9;border-left:4px solid #4f46e5;padding:16px 20px;border-radius:6px;margin:20px 0">
        <p style="margin:0 0 8px 0;font-weight:bold">To activate your plan, please complete the payment:</p>
        <p style="margin:4px 0">💰 <strong>Amount:</strong> ${price}/month</p>
        <p style="margin:4px 0">📱 <strong>UPI / Phone Pay to:</strong> <span style="font-size:18px;font-weight:bold;color:#4f46e5">${upiPhone}</span></p>
      </div>

      <p>After payment, <strong>reply to this email with your payment screenshot</strong> and we'll activate your plan within 24 hours.</p>

      <p style="color:#64748b;font-size:13px">
        Questions? Reply to this email or contact us at 
        <a href="mailto:${adminMail}" style="color:#4f46e5">${adminMail}</a>
      </p>

      <p>— Team Agento</p>
    </div>
  `;
  return sendEmail(userEmail, `[Agento] Your ${planLabel} request is in queue — complete payment to activate`, html);
};
