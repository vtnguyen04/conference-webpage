import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendRegistrationConfirmationEmail(to: string, conferenceName: string, registrationDetails: any) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: to,
    subject: `Registration Confirmation for ${conferenceName}`,
    html: `
      <h1>Thank you for registering for ${conferenceName}!</h1>
      <p>Dear ${registrationDetails.name},</p>
      <p>Your registration for ${conferenceName} has been successfully confirmed.</p>
      <p>Please confirm your email address by clicking the link below:</p>
      <p><a href="${process.env.BASE_URL}/api/registrations/confirm/${registrationDetails.confirmationToken}">Confirm Registration</a></p>
      <p>Here are your registration details:</p>
      <ul>
        <li><strong>Name:</strong> ${registrationDetails.name}</li>
        <li><strong>Email:</strong> ${registrationDetails.email}</li>
        <li><strong>Conference:</strong> ${conferenceName}</li>
        <!-- Add more details as needed -->
      </ul>
      <p>We look forward to seeing you there!</p>
      <p>Best regards,</p>
      <p>The ${conferenceName} Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${to}`);
  } catch (error) {
    console.error(`Error sending confirmation email to ${to}:`, error);
    throw error;
  }
}
export async function sendCmeCertificateEmail(to: string, userName: string, sessionTitle: string, certificate: Buffer) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: to,
    subject: `CME Certificate for ${sessionTitle}`,
    html: `
      <h1>CME Certificate</h1>
      <p>Dear ${userName},</p>
      <p>Thank you for attending the session "${sessionTitle}". Please find your CME certificate attached.</p>
      <p>Best regards,</p>
      <p>The Conference Team</p>
    `,
    attachments: [
      {
        filename: 'CME_Certificate.pdf',
        content: certificate,
        contentType: 'application/pdf',
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`CME certificate email sent to ${to}`);
  } catch (error) {
    console.error(`Error sending CME certificate email to ${to}:`, error);
    throw error;
  }
}
export async function sendReminderEmail(to: string, sessionTitle: string, time: string) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: to,
    subject: `Reminder: ${sessionTitle} is starting in ${time}`,
    html: `
      <h1>Reminder!</h1>
      <p>This is a reminder that the session "${sessionTitle}" is starting in ${time}.</p>
      <p>We look forward to seeing you there!</p>
      <p>Best regards,</p>
      <p>The Conference Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Reminder email sent to ${to}`);
  } catch (error) {
    console.error(`Error sending reminder email to ${to}:`, error);
    throw error;
  }
}
