const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

exports.sendOTPEmail = async (to, otp, type) => {
  const subject = type === 'verify'
    ? 'Verify your Preparation Mate account'
    : 'Reset your Preparation Mate password'

  const text = type === 'verify'
    ? `Your verification code is: ${otp}\n\nExpires in 10 minutes.`
    : `Your password reset code is: ${otp}\n\nExpires in 10 minutes.`

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to,
    subject,
    text,
  })
}

exports.sendResetLinkEmail = async (to, resetLink) => {
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
      <h2 style="font-size:20px;font-weight:700;color:#111827;margin-bottom:8px">Reset your password</h2>
      <p style="color:#6B7280;font-size:14px;margin-bottom:24px">
        Click the button below to set a new password for your Preparation Mate account.
        This link expires in <strong>30 minutes</strong> and can only be used once.
      </p>
      <a href="${resetLink}"
         style="display:inline-block;background:#4F46E5;color:#fff;font-size:14px;font-weight:600;
                padding:12px 24px;border-radius:8px;text-decoration:none">
        Reset Password
      </a>
      <p style="color:#9CA3AF;font-size:12px;margin-top:24px">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `
  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to,
    subject: 'Reset your Preparation Mate password',
    html,
    text: `Reset your password: ${resetLink}\n\nThis link expires in 30 minutes and can only be used once.`,
  })
}

exports.sendPasswordChangedEmail = async (to) => {
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
      <h2 style="font-size:20px;font-weight:700;color:#111827;margin-bottom:8px">Password Changed Successfully</h2>
      <p style="color:#6B7280;font-size:14px;margin-bottom:16px">
        Your password has been changed successfully.
      </p>
      <p style="color:#6B7280;font-size:14px;margin-bottom:24px">
        If you did not perform this action, please contact support immediately.
      </p>
    </div>
  `
  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to,
    subject: 'Password Changed Successfully',
    html,
    text: `Your password has been changed successfully.\n\nIf you did not perform this action, please contact support immediately.`,
  })
}
