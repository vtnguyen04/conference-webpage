import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter;

export function initializeEmailTransporter() {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    } : undefined,
  });
}

const emailStyles = `
  body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6; }
  table { width: 100%; border-collapse: collapse; }
  .container { width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
  .header { padding: 40px 40px 20px; background: linear-gradient(135deg, #FFC857 0%, #FF6B6B 50%, #335CFF 100%); }
  .header h1 { margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; }
  .content { padding: 30px 40px 20px; }
  .content p { margin: 0 0 15px; font-size: 16px; color: #374151; }
  .button { background-color: #7c91e6ff; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; }
  .footer { padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; }
  .footer p { margin: 0 0 10px; font-size: 14px; color: #6b7280; }
`;

function createEmailTemplate(title: string, content: string, footerNote: string, conferenceName: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${emailStyles}</style>
    </head>
    <body>
      <table role="presentation">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" class="container">
              <tr class="header">
                <td><h1>${title}</h1></td>
              </tr>
              <tr>
                <td class="content">${content}</td>
              </tr>
              <tr class="footer">
                <td>
                  <p>Trân trọng,<br/><strong>Ban tổ chức ${conferenceName}</strong></p>
                  <p style="margin-top: 10px; font-size: 12px; color: #9ca3af;">${footerNote}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export async function sendRegistrationVerificationEmail(email: string, fullName: string, conferenceName: string, confirmationToken: string): Promise<boolean> {
  try {
    const confirmationLink = `${process.env.BASE_URL}/api/registrations/confirm/${confirmationToken}`;
    const title = "Xác nhận đăng ký của bạn";
    const content = `
      <p>Kính gửi <strong>${fullName}</strong>,</p>
      <p>Cảm ơn bạn đã đăng ký tham gia <strong>${conferenceName}</strong>. Vui lòng nhấp vào nút bên dưới để xác nhận đăng ký của bạn.</p>
      <a href="${confirmationLink}" class="button">Xác nhận đăng ký</a>
    `;
    const footerNote = "Email này được gửi tự động. Vui lòng không trả lời email này.";
    const html = createEmailTemplate(title, content, footerNote, conferenceName);

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Hệ thống Hội nghị" <noreply@conference.edu.vn>`,
      to: email,
      subject: `Xác nhận đăng ký tham gia ${conferenceName}`,
      html,
    });
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return false;
  }
}

export async function sendConsolidatedRegistrationEmail(
  email: string,
  fullName: string,
  conferenceName: string,
  cmeCertificateRequested: boolean,
  sessions: Array<{ title: string; time: string; room: string; qrCode: string; }>
): Promise<boolean> {
  try {
    const attachments: any[] = [];
    const sessionRows = sessions.map((session, index) => {
      const cid = `qrcode_${index}`; // Use index for unique Content-ID
      
      // Extract base64 data from data URL
      const base64Data = session.qrCode.split(',')[1];
      if (base64Data) {
        attachments.push({
          filename: `qrcode-${index}.png`, // Use index for filename
          content: Buffer.from(base64Data, 'base64'),
          contentType: 'image/png',
          cid: cid, // Reference in HTML
        });
      }

      return `
        <tr>
          <td colspan="2" style="padding: 20px 0; ${index > 0 ? 'border-top: 2px solid #e5e7eb;' : ''}">
            <h3 style="margin: 0 0 10px 0; color: #335CFF;">${session.title}</h3>
            <p style="margin: 5px 0; color: #666;">
              <strong>Thời gian:</strong> ${session.time}<br/>
              <strong>Địa điểm:</strong> ${session.room}
            </p>
            <div style="margin-top: 15px;">
              <img src="cid:${cid}" alt="QR Code - ${session.title}" style="width: 200px; height: 200px; border: 2px solid #335CFF; border-radius: 8px;" />
            </div>
          </td>
        </tr>
      `;
    }).join('');

    const cmeNote = cmeCertificateRequested ? `
      <div style="padding: 12px; background-color: #FEF3C7; border-left: 4px solid #FFC857; margin: 15px 0;">
        <p style="margin: 0; color: #92400E; font-size: 14px;">
          <strong>Lưu ý:</strong> Bạn đã yêu cầu chứng chỉ CME cho các phiên đã đăng ký.
        </p>
      </div>
    ` : '';

    const instructions = `
      <div style="background-color: #EFF6FF; border-radius: 8px; padding: 20px;">
        <h3 style="margin: 0 0 10px; color: #1E40AF; font-size: 18px;">Hướng dẫn check-in</h3>
        <ul style="margin: 10px 0; padding-left: 20px; color: #1E40AF;">
          <li style="margin: 8px 0;">Vui lòng mang theo mã QR khi tham dự hội nghị</li>
          <li style="margin: 8px 0;">Mỗi phiên có mã QR riêng - vui lòng check-in đúng phiên</li>
          <li style="margin: 8px 0;">Bạn có thể lưu email này hoặc chụp ảnh mã QR</li>
        </ul>
      </div>
    `;

    const title = "Đăng ký thành công!";
    const content = `
      <p>Kính gửi <strong>${fullName}</strong>,</p>
      <p>Chúc mừng bạn đã đăng ký thành công <strong>${sessions.length} phiên</strong> tại <strong>${conferenceName}</strong>!</p>
      ${cmeNote}
      <table style="width: 100%; border-collapse: collapse;">${sessionRows}</table>
      <br/>
      ${instructions}
    `;
    const footerNote = "Email này được gửi tự động. Vui lòng không trả lời email này.";
    const html = createEmailTemplate(title, content, footerNote, conferenceName);

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Hệ thống Hội nghị" <noreply@conference.edu.vn>`,
      to: email,
      subject: `Xác nhận đăng ký ${sessions.length} phiên - ${conferenceName}`,
      html,
      attachments: attachments,
    });
    console.log(`Consolidated registration email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Failed to send consolidated registration email:", error);
    return false;
  }
}


export async function sendConfirmationReminderEmail(to: string, conferenceName: string, registrationDetails: any) {
  const confirmationLink = `${process.env.BASE_URL}/api/registrations/confirm/${registrationDetails.confirmationToken}`;
  const title = `Nhắc nhở: Vui lòng xác nhận đăng ký tham gia ${conferenceName}`;
  const content = `
    <p>Kính gửi <strong>${registrationDetails.name}</strong>,</p>
    <p>Bạn gần đây đã đăng ký tham gia ${conferenceName}. Để hoàn tất đăng ký, vui lòng xác nhận địa chỉ email của bạn bằng cách nhấp vào liên kết bên dưới:</p>
    <p><a href="${confirmationLink}" class="button">Xác nhận đăng ký</a></p>
    <p>Nếu bạn đã xác nhận, vui lòng bỏ qua email này.</p>
  `;
  const footerNote = "Email này được gửi tự động. Vui lòng không trả lời email này.";
  const html = createEmailTemplate(title, content, footerNote, conferenceName);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: to,
      subject: `Nhắc nhở: Vui lòng xác nhận đăng ký tham gia ${conferenceName}`,
      html,
    });
    console.log(`Confirmation reminder email sent to ${to}`);
  } catch (error) {
    console.error(`Error sending confirmation reminder email to ${to}:`, error);
    throw error;
  }
}

export async function sendCmeCertificateEmail(to: string, userName: string, sessionTitle: string, conferenceName: string, certificate: Buffer) {
  const title = `Chứng chỉ CME cho phiên ${sessionTitle}`;
  const content = `
    <p>Kính gửi <strong>${userName}</strong>,</p>
    <p>Cảm ơn bạn đã tham dự phiên "<strong>${sessionTitle}</strong>". Vui lòng xem chứng chỉ CME của bạn trong tệp đính kèm.</p>
  `;
  const footerNote = "Email này được gửi tự động. Vui lòng không trả lời email này.";
  const html = createEmailTemplate(title, content, footerNote, conferenceName);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: to,
      subject: `Chứng chỉ CME cho phiên ${sessionTitle}`,
      html,
      attachments: [
        {
          filename: 'Chung_chi_CME.pdf',
          content: certificate,
          contentType: 'application/pdf',
        },
      ],
    });
    console.log(`CME certificate email sent to ${to}`);
  } catch (error) {
    console.error(`Error sending CME certificate email to ${to}:`, error);
    throw error;
  }
}

export async function sendReminderEmail(to: string, sessionTitle: string, time: string, conferenceName: string) {
  const title = "Email nhắc nhở!";
  const content = `
    <p>Đây là email nhắc nhở rằng phiên "<strong>${sessionTitle}</strong>" sẽ bắt đầu sau <strong>${time}</strong>.</p>
    <p>Chúng tôi rất mong được gặp bạn tại đó!</p>
  `;
  const footerNote = "Email này được gửi tự động. Vui lòng không trả lời email này.";
  const html = createEmailTemplate(title, content, footerNote, conferenceName);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: to,
      subject: `Nhắc nhở: ${sessionTitle} sắp bắt đầu`,
      html,
    });
    console.log(`Reminder email sent to ${to}`);
  } catch (error) {
    console.error(`Error sending reminder email to ${to}:`, error);
    throw error;
  }
}