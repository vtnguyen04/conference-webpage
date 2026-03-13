import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emailService } from '../emailService';
import nodemailer from 'nodemailer';

vi.mock('nodemailer');

describe('EmailService', () => {
  const mockSendMail = vi.fn().mockResolvedValue({ messageId: '123' });
  
  beforeEach(() => {
    vi.clearAllMocks();
    (nodemailer.createTransport as any).mockReturnValue({
      sendMail: mockSendMail
    });
  });

  it('should send registration verification email', async () => {
    process.env.BASE_URL = 'http://localhost';
    const result = await emailService.sendRegistrationVerificationEmail(
      'user@test.com', 
      'User Name', 
      'Conf Name', 
      'token-123'
    );

    expect(result).toBe(true);
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'user@test.com',
      subject: expect.stringContaining('Xác nhận đăng ký')
    }));
  });

  it('should send consolidated registration email with attachments', async () => {
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

    expect(result).toBe(true);
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      attachments: expect.arrayContaining([
        expect.objectContaining({ filename: 'qrcode-0.png' })
      ])
    }));
  });
});
