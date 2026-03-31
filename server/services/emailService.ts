import nodemailer from 'nodemailer';

interface EmailSendResult {
  success: boolean;
  error?: string;
  errorCode?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private defaultFrom: string = '';
  private isConfigured: boolean = false;

  private validateConfiguration() {
    const hasAuth = !!process.env.SMTP_USER && !!process.env.SMTP_PASS;
    const hasHost = !!process.env.SMTP_HOST;
    
    if (!hasHost || !hasAuth) {
      console.error('[EmailService] Configuration Error:');
      console.error(`  - SMTP_HOST: ${hasHost ? '✓' : '✗ MISSING'}`);
      console.error(`  - SMTP_USER: ${process.env.SMTP_USER ? '✓' : '✗ MISSING'}`);
      console.error(`  - SMTP_PASS: ${process.env.SMTP_PASS ? '✓' : '✗ MISSING'}`);
      console.error('  - SMTP_FROM:', process.env.SMTP_FROM || process.env.EMAIL_FROM || '"Hệ thống Hội nghị" <noreply@conference.edu.vn>');
      console.error('\nPlease configure SMTP settings in .env file');
      return false;
    }
    return true;
  }

  private async ensureTransporter(): Promise<boolean> {
    if (this.transporter) return this.isConfigured;

    console.log('[EmailService] Initializing transporter...');
    this.defaultFrom = process.env.SMTP_FROM || process.env.EMAIL_FROM || '"Hệ thống Hội nghị" <noreply@conference.edu.vn>';

    if (!this.validateConfiguration()) {
      this.isConfigured = false;
      return false;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // Verify transporter configuration
      try {
        await this.transporter.verify();
        console.log('[EmailService] Transporter ready to send emails');
        this.isConfigured = true;
      } catch (error: any) {
        console.error('[EmailService] Transporter verification failed:', error.message);
        this.isConfigured = false;
      }

      return this.isConfigured;
    } catch (error: any) {
      console.error('[EmailService] Failed to create transporter:', error.message);
      this.isConfigured = false;
      return false;
    }
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
  async sendRegistrationVerificationEmail(email: string, fullName: string, conferenceName: string, confirmationToken: string): Promise<EmailSendResult> {
    if (!(await this.ensureTransporter())) {
      const result: EmailSendResult = {
        success: false,
        error: 'Email service not configured. Please check SMTP settings.',
        errorCode: 'NOT_CONFIGURED'
      };
      console.error('[EmailService] Cannot send verification email:', result.error);
      return result;
    }

    try {
      const baseUrl = (process.env.BASE_URL || '').replace(/\/$/, '');
      
      if (!baseUrl) {
        console.warn('[EmailService] BASE_URL not set, confirmation link may be incomplete');
      }
      
      const confirmationLink = `${baseUrl}/api/registrations/confirm/${confirmationToken}`;
      const title = "Xác nhận đăng ký của bạn";
      const content = `
        <p>Kính gửi <strong>${fullName}</strong>,</p>
        <p>Cảm ơn bạn đã đăng ký tham gia <strong>${conferenceName}</strong>. Vui lòng nhấp vào nút bên dưới để xác nhận đăng ký của bạn.</p>
        <div style="margin: 30px 0;"><a href="${confirmationLink}" class="button">Xác nhận đăng ký</a></div>
      `;
      const html = this.createEmailTemplate(title, content, "Email này được gửi tự động. Vui lòng không trả lời.", conferenceName);
      
      const info = await this.transporter!.sendMail({
        from: this.defaultFrom,
        to: email,
        subject: `Xác nhận đăng ký tham gia ${conferenceName}`,
        html,
      });
      
      console.log(`[EmailService] Verification email sent to ${email}. Message ID: ${info.messageId}`);
      return { success: true };
    } catch (error: any) {
      console.error(`[EmailService] Failed to send verification email to ${email}:`, error.message);
      console.error('[EmailService] Error details:', {
        code: error.code,
        command: error.command,
        response: error.response,
      });
      return { 
        success: false, 
        error: error.message || 'Failed to send email',
        errorCode: error.code || 'SEND_FAILED'
      };
    }
  }
  async sendConsolidatedRegistrationEmail(
    email: string,
    fullName: string,
    conferenceName: string,
    certificateRequested: boolean,
    sessions: Array<{ title: string; time: string; room: string; qrCode: string; }>
  ): Promise<EmailSendResult> {
    if (!(await this.ensureTransporter())) {
      const result: EmailSendResult = {
        success: false,
        error: 'Email service not configured. Please check SMTP settings.',
        errorCode: 'NOT_CONFIGURED'
      };
      console.error('[EmailService] Cannot send consolidated email:', result.error);
      return result;
    }

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
      const certificateNote = certificateRequested ? `
        <div style="padding: 12px; background-color: #FFFBEB; border-left: 4px solid #FBBF24; margin: 15px 0;">
          <p style="margin: 0; color: #92400E; font-size: 14px;">Bạn đã yêu cầu Chứng nhận tham dự hội nghị cho các phiên này.</p>
        </div>` : '';
      const content = `
        <p>Kính gửi <strong>${fullName}</strong>,</p>
        <p>Chúc mừng bạn đã đăng ký thành công các phiên làm việc tại <strong>${conferenceName}</strong>.</p>
        ${certificateNote}
        <table style="width: 100%;">${sessionRows}</table>
      `;
      const html = this.createEmailTemplate("Đăng ký thành công!", content, "Email này được gửi tự động.", conferenceName);
      
      const info = await this.transporter!.sendMail({
        from: this.defaultFrom,
        to: email,
        subject: `Xác nhận đăng ký - ${conferenceName}`,
        html,
        attachments
      });
      
      console.log(`[EmailService] Consolidated registration email sent to ${email}. Message ID: ${info.messageId}`);
      return { success: true };
    } catch (error: any) {
      console.error(`[EmailService] Failed to send consolidated email to ${email}:`, error.message);
      return { 
        success: false, 
        error: error.message || 'Failed to send email',
        errorCode: error.code || 'SEND_FAILED'
      };
    }
  }
  async sendConfirmationReminderEmail(to: string, conferenceName: string, details: any) {
    if (!(await this.ensureTransporter())) {
      console.error('[EmailService] Cannot send reminder email: Email service not configured');
      return;
    }
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
    } catch (e: any) { console.error("[EmailService] Reminder email failed:", e.message); }
  }

  async sendCertificateEmail(to: string, userName: string, title: string, conferenceName: string, certificate: Buffer) {
    if (!(await this.ensureTransporter())) {
      console.error('[EmailService] Cannot send certificate email: Email service not configured');
      return;
    }
    try {
      // Nếu title là "Hội nghị", gửi thông báo chung, ngược lại gửi cho phiên cụ thể
      const contextText = title === "Hội nghị" ? `hội nghị <strong>${conferenceName}</strong>` : `phiên <strong>${title}</strong>`;
      const content = `<p>Kính gửi <strong>${userName}</strong>,</p><p>Đính kèm là Chứng nhận tham dự cho ${contextText}.</p>`;
      const html = this.createEmailTemplate("Chứng nhận tham dự", content, "Tự động gửi.", conferenceName);

      await this.transporter!.sendMail({
        from: this.defaultFrom,
        to,
        subject: `Chứng nhận tham dự - ${conferenceName}`,
        html,
        attachments: [{ filename: 'Giay_chung_nhan_tham_du.pdf', content: certificate, contentType: 'application/pdf' }]
      });
    } catch (e: any) { console.error("[EmailService] Certificate email failed:", e.message); }
  }

  async sendReminderEmail(to: string, sessionTitle: string, time: string, conferenceName: string) {
    if (!(await this.ensureTransporter())) {
      console.error('[EmailService] Cannot send session reminder email: Email service not configured');
      return;
    }
    try {
      const content = `<p>Nhắc nhở: Phiên <strong>${sessionTitle}</strong> sẽ bắt đầu sau <strong>${time}</strong>.</p>`;
      const html = this.createEmailTemplate("Nhắc nhở lịch hẹn", content, "Tự động gửi.", conferenceName);
      await this.transporter!.sendMail({ from: this.defaultFrom, to, subject: `Nhắc nhở: ${sessionTitle}`, html });
    } catch (e: any) { console.error("[EmailService] Session reminder email failed:", e.message); }
  }
}
export const emailService = new EmailService();
