const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendResetEmail = async (to, resetLink) => {
  await transporter.sendMail({
    from: '"Sophia" <no-reply@sophia.ai>',
    to,
    subject: "Reset your password",
    html: `
      <h2>Reset your password</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
    `,
  });
};
