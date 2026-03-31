import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emailService } from '../emailService';
import nodemailer from 'nodemailer';

vi.mock('nodemailer');

describe('EmailService', () => {
  const mockSendMail = vi.fn().mockResolvedValue({ messageId: '123' });
  const mockVerify = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    (nodemailer.createTransport as any).mockReturnValue({
      sendMail: mockSendMail,
      verify: mockVerify
    });
  });

  it('should send registration verification email', async () => {
    process.env.BASE_URL = 'http://localhost';
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_USER = 'test@test.com';
    process.env.SMTP_PASS = 'password';
    
    const result = await emailService.sendRegistrationVerificationEmail(
      'user@test.com',
      'User Name',
      'Conf Name',
      'token-123'
    );

    expect(result.success).toBe(true);
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'user@test.com',
      subject: expect.stringContaining('Xác nhận đăng ký')
    }));
  });

  it('should send consolidated registration email with attachments', async () => {
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_USER = 'test@test.com';
    process.env.SMTP_PASS = 'password';
    
    const sessions = [
      { title: 'Sess 1', time: '10:00', room: 'Room A', qrCode: 'data:image/png;base64,abc' }
    ];

    const result = await emailService.sendConsolidatedRegistrationEmail(
      'user@test.com',
      'User Name',
      'Conf Name',
      true,
      sessions
    );

    expect(result.success).toBe(true);
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      attachments: expect.arrayContaining([
        expect.objectContaining({ filename: 'qrcode-0.png' })
      ])
    }));
  });
});
