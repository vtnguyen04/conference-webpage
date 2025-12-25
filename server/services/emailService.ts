import nodemailer from 'nodemailer';
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private defaultFrom: string = '';
  private ensureTransporter() {
    if (this.transporter) return;
    console.log('[EmailService] Initializing transporter...');
    this.defaultFrom = process.env.SMTP_FROM || process.env.EMAIL_FROM || '"Hệ thống Hội nghị" <noreply@conference.edu.vn>';
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
    });
  }
  private createEmailTemplate(title: string, content: string, footerNote: string, conferenceName: string) {
    const emailStyles = `
      body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6; }
      table { width: 100%; border-collapse: collapse; }
      .container { width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
      .header { padding: 40px 40px 20px; background: linear-gradient(135deg, #FFC857 0%, #FF6B6B 50%, #335CFF 100%); }
      .header h1 { margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; }
      .content { padding: 30px 40px 20px; }
      .content p { margin: 0 0 15px; font-size: 16px; color: #374151; }
      .button { background-color: #335CFF; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; }
      .footer { padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; }
      .footer p { margin: 0 0 10px; font-size: 14px; color: #6b7280; }
    `;
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
  async sendRegistrationVerificationEmail(email: string, fullName: string, conferenceName: string, confirmationToken: string): Promise<boolean> {
    this.ensureTransporter();
    try {
      const baseUrl = (process.env.BASE_URL || '').replace(/\/$/, '');
      const confirmationLink = `${baseUrl}/api/registrations/confirm/${confirmationToken}`;
      const title = "Xác nhận đăng ký của bạn";
      const content = `
        <p>Kính gửi <strong>${fullName}</strong>,</p>
        <p>Cảm ơn bạn đã đăng ký tham gia <strong>${conferenceName}</strong>. Vui lòng nhấp vào nút bên dưới để xác nhận đăng ký của bạn.</p>
        <div style="margin: 30px 0;"><a href="${confirmationLink}" class="button">Xác nhận đăng ký</a></div>
      `;
      const html = this.createEmailTemplate(title, content, "Email này được gửi tự động. Vui lòng không trả lời.", conferenceName);
      await this.transporter!.sendMail({
        from: this.defaultFrom,
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
  async sendConsolidatedRegistrationEmail(
    email: string,
    fullName: string,
    conferenceName: string,
    cmeCertificateRequested: boolean,
    sessions: Array<{ title: string; time: string; room: string; qrCode: string; }>
  ): Promise<boolean> {
    this.ensureTransporter();
    try {
      const attachments: any[] = [];
      const sessionRows = sessions.map((session, index) => {
        const cid = `qrcode_${index}`;
        const base64Parts = session.qrCode.split(',');
        const base64Data = base64Parts.length > 1 ? base64Parts[1] : base64Parts[0];
        attachments.push({
          filename: `qrcode-${index}.png`,
          content: Buffer.from(base64Data, 'base64'),
          contentType: 'image/png',
          cid: cid,
        });
        return `
          <tr>
            <td style="padding: 20px 0; ${index > 0 ? 'border-top: 1px solid #e5e7eb;' : ''}">
              <h3 style="margin: 0 0 10px 0; color: #335CFF;">${session.title}</h3>
              <p style="margin: 5px 0; color: #374151;">
                <strong>Thời gian:</strong> ${session.time}<br/>
                <strong>Địa điểm:</strong> ${session.room}
              </p>
              <div style="margin-top: 15px;">
                <img src="cid:${cid}" alt="QR Code" style="width: 180px; height: 180px; border: 1px solid #e5e7eb; border-radius: 8px;" />
              </div>
            </td>
          </tr>
        `;
      }).join('');
      const cmeNote = cmeCertificateRequested ? `
        <div style="padding: 12px; background-color: #FFFBEB; border-left: 4px solid #FBBF24; margin: 15px 0;">
          <p style="margin: 0; color: #92400E; font-size: 14px;">Bạn đã yêu cầu chứng chỉ CME cho các phiên này.</p>
        </div>` : '';
      const content = `
        <p>Kính gửi <strong>${fullName}</strong>,</p>
        <p>Chúc mừng bạn đã đăng ký thành công các phiên làm việc tại <strong>${conferenceName}</strong>.</p>
        ${cmeNote}
        <table style="width: 100%;">${sessionRows}</table>
      `;
      const html = this.createEmailTemplate("Đăng ký thành công!", content, "Email này được gửi tự động.", conferenceName);
      await this.transporter!.sendMail({
        from: this.defaultFrom,
        to: email,
        subject: `Xác nhận đăng ký - ${conferenceName}`,
        html,
        attachments
      });
      console.log(`Consolidated registration email sent to ${email}`);
      return true;
    } catch (error) {
      console.error("Failed to send consolidated email:", error);
      return false;
    }
  }
  async sendConfirmationReminderEmail(to: string, conferenceName: string, details: any) {
    this.ensureTransporter();
    try {
      const baseUrl = (process.env.BASE_URL || '').replace(/\/$/, '');
      const link = `${baseUrl}/api/registrations/confirm/${details.confirmationToken}`;
      const content = `
        <p>Kính gửi <strong>${details.name}</strong>,</p>
        <p>Vui lòng xác nhận đăng ký tham gia ${conferenceName} bằng cách nhấp vào nút bên dưới:</p>
        <div style="margin: 30px 0;"><a href="${link}" class="button">Xác nhận ngay</a></div>
      `;
      const html = this.createEmailTemplate("Nhắc nhở xác nhận đăng ký", content, "Tự động gửi.", conferenceName);
      await this.transporter!.sendMail({ from: this.defaultFrom, to, subject: `Nhắc nhở: Xác nhận đăng ký ${conferenceName}`, html });
    } catch (e) { console.error("Reminder email failed:", e); }
  }
  async sendCmeCertificateEmail(to: string, userName: string, sessionTitle: string, conferenceName: string, certificate: Buffer) {
    this.ensureTransporter();
    try {
      const content = `<p>Kính gửi <strong>${userName}</strong>,</p><p>Đính kèm là chứng chỉ CME cho phiên <strong>${sessionTitle}</strong>.</p>`;
      const html = this.createEmailTemplate("Chứng chỉ CME", content, "Tự động gửi.", conferenceName);
      await this.transporter!.sendMail({
        from: this.defaultFrom,
        to,
        subject: `Chứng chỉ CME - ${sessionTitle}`,
        html,
        attachments: [{ filename: 'Chung_chi_CME.pdf', content: certificate, contentType: 'application/pdf' }]
      });
    } catch (e) { console.error("Certificate email failed:", e); }
  }
  async sendReminderEmail(to: string, sessionTitle: string, time: string, conferenceName: string) {
    this.ensureTransporter();
    try {
      const content = `<p>Nhắc nhở: Phiên <strong>${sessionTitle}</strong> sẽ bắt đầu sau <strong>${time}</strong>.</p>`;
      const html = this.createEmailTemplate("Nhắc nhở lịch hẹn", content, "Tự động gửi.", conferenceName);
      await this.transporter!.sendMail({ from: this.defaultFrom, to, subject: `Nhắc nhở: ${sessionTitle}`, html });
    } catch (e) { console.error("Session reminder email failed:", e); }
  }
}
export const emailService = new EmailService();
