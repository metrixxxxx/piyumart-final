import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(toEmail, token) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify?token=${token}`;

  await resend.emails.send({
    from: "PiyuMart <onboarding@resend.dev>", // free tier default sender
    to: toEmail,
    subject: "Verify your PiyuMart Account",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:24px;background:#1a1d35;border-radius:12px;">
        <h2 style="color:#4f8ef7;">PiyuMart 🎓</h2>
        <p style="color:#e0e4ff;">Please verify your LSPU email to activate your account.</p>
        <a href="${verifyUrl}"
           style="display:inline-block;background:#4f8ef7;color:white;
                  padding:12px 24px;border-radius:999px;text-decoration:none;
                  font-weight:bold;margin:16px 0;font-size:13px;">
          Verify My Account
        </a>
        <p style="color:#4a5080;font-size:12px;">⏰ This link expires in 24 hours.</p>
        <p style="color:#4a5080;font-size:12px;">If you didn't register, ignore this email.</p>
      </div>
    `,
  });
}