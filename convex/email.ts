const sendEmail = async (to: string, subject: string, html: string, text: string) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "LowEffort.bet <noreply@loweffort.bet>",
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to send email:", error);
    throw new Error(`Failed to send email: ${response.status}`);
  }

  return response.json();
};

export async function sendPasswordResetEmail({
  identifier,
  token,
  url,
}: {
  identifier: string;
  token: string;
  url: string;
}) {
  const resetUrl = `${process.env.SITE_URL}/reset-password?token=${token}&email=${encodeURIComponent(identifier)}`;
  
  const htmlContent = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1f2937; margin: 0;">🏈 LowEffort.bet</h1>
        <p style="color: #6b7280; margin: 5px 0;">NFL Pool</p>
      </div>
      
      <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
        <h2 style="color: #1f2937; margin: 0 0 16px 0;">Reset your password</h2>
        <p style="color: #374151; margin: 0 0 20px 0;">
          We received a request to reset your password. Click the button below to create a new password:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
          This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
      
      <div style="text-align: center; color: #9ca3af; font-size: 12px;">
        <p>© 2025 LowEffort.bet - NFL Pool Application</p>
      </div>
    </div>
  `;

  const textContent = `Reset your password - LowEffort.bet

We received a request to reset your password. Click the link below to create a new password:

${resetUrl}

This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.

© 2025 LowEffort.bet - NFL Pool Application`;

  try {
    await sendEmail(identifier, "Reset your password - LowEffort.bet", htmlContent, textContent);
    console.log(`Password reset email sent to ${identifier}`);
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
}

export async function sendVerificationEmail({
  identifier,
  token,
  url,
}: {
  identifier: string;
  token: string;
  url: string;
}) {
  const verifyUrl = `${process.env.SITE_URL}/verify-email?token=${token}&email=${encodeURIComponent(identifier)}`;
  
  const htmlContent = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1f2937; margin: 0;">🏈 LowEffort.bet</h1>
        <p style="color: #6b7280; margin: 5px 0;">NFL Pool</p>
      </div>
      
      <div style="background: #f0f9ff; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
        <h2 style="color: #1f2937; margin: 0 0 16px 0;">Welcome to LowEffort.bet!</h2>
        <p style="color: #374151; margin: 0 0 20px 0;">
          Please verify your email address to complete your account setup:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" 
             style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Verify Email
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
          This link will expire in 24 hours. If you didn't create this account, you can safely ignore this email.
        </p>
      </div>
      
      <div style="text-align: center; color: #9ca3af; font-size: 12px;">
        <p>© 2025 LowEffort.bet - NFL Pool Application</p>
      </div>
    </div>
  `;

  const textContent = `Welcome to LowEffort.bet!

Please verify your email address to complete your account setup:

${verifyUrl}

This link will expire in 24 hours. If you didn't create this account, you can safely ignore this email.

© 2025 LowEffort.bet - NFL Pool Application`;

  try {
    await sendEmail(identifier, "Verify your email - LowEffort.bet", htmlContent, textContent);
    console.log(`Verification email sent to ${identifier}`);
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw new Error("Failed to send verification email");
  }
}