import nodemailer from 'nodemailer';

// Create transporter
let transporter = nodemailer.createTransport({
  secure: process.env.SMTP_SECURE === "true",
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Validate email format
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const sendEmail = async (email, type, data = {}) => {
  try {
    if (!validateEmail(email.trim())) {
      return 'Invalid email address provided.';
    }

    let mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: "",
      html: "",
    };

    if (type === 'welcome') {
      mailOptions.subject = 'Welcome to  GBS Admin ACCESS';
      mailOptions.html = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
</head>
<body style="font-family: Helvetica, Arial, sans-serif; margin: 0px; padding: 0px; background-color: #FFFFFF;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0px; border-spacing: 0px; font-family: Arial, Helvetica, sans-serif; background-color: rgb(239, 239, 239);">
    <tbody>
      <tr>
        <td align="center" style="padding: 1rem 2rem; vertical-align: top; width: 100%;">
          <table role="presentation" style="max-width: 600px; border-collapse: collapse; border: 0px; border-spacing: 0px; text-align: left; background-color: #FFFFFF !important;">
            <tbody>
              <tr>
                <td style="padding: 20px 0px 0px;">
                  <div style="text-align: center;">
                    <div style="padding: 10px;">
                      <div style="color: rgb(0, 0, 0); text-align: left;">
                        <h1 style="margin: 1rem 0; text-align: center;">Welcome, ${data.name}!</h1>
                        <p style="padding-bottom: 8px">Your admin account has been successfully created.</p>
                        <p style="padding-bottom: 8px">You can now log in to the admin dashboard.</p>
                        <p style="padding-bottom: 8px">If you have any questions, please contact support.</p>
                        <p style="padding-bottom: 8px">Best regards,<br>The Admin Team</p>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
    } else if (type === 'reset') {
      mailOptions.subject = 'Password Reset';
      mailOptions.html = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="font-family: Helvetica, Arial, sans-serif; margin: 0px; padding: 0px; background-color: #FFFFFF;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; border: 0px; border-spacing: 0px; font-family: Arial, Helvetica, sans-serif; background-color: rgb(239, 239, 239);">
    <tbody>
      <tr>
        <td align="center" style="padding: 1rem 2rem; vertical-align: top; width: 100%;">
          <table role="presentation" style="max-width: 600px; border-collapse: collapse; border: 0px; border-spacing: 0px; text-align: left; background-color: #FFFFFF !important;">
            <tbody>
              <tr>
                <td style="padding: 20px 0px 0px;">
                  <div style="padding: 10px;">
                    <div style="color: rgb(0, 0, 0); text-align: left;">
                      <h1 style="margin: 1rem 0; text-align: center;">Password Reset</h1>
                      <p style="padding-bottom: 8px">Here is your password reset code:</p>
                      <p style="padding-bottom: 8px; text-align: center; font-size: 24px; font-weight: bold;">${data.code}</p>
                      <p style="padding-bottom: 8px">This code will expire in 10 minutes.</p>
                      <p style="padding-bottom: 8px">If you didn't request this, please ignore this email.</p>
                      <p style="padding-bottom: 8px">Thanks,<br>The Admin Team</p>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
    }

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Email sent successfully' };
  } catch (err) {
    console.error('Error sending email:', err.message);
    return { success: false, message: 'Failed to send email' };
  }
};