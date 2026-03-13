import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { batchRegister, confirmRegistration } from '../../controllers/registration.controller';
import { registrationService } from '../../services/registrationService';
import { emailService } from '../../services/emailService';

const app = express();
app.use(express.json());

// Mock request with active conference
const activeConferenceMiddleware = (req: any, res: any, next: any) => {
  req.activeConference = { slug: 'test-conf', name: 'Test Conference' };
  next();
};

app.post('/api/registrations/batch', activeConferenceMiddleware, batchRegister);
app.get('/api/registrations/confirm/:token', activeConferenceMiddleware, confirmRegistration);

vi.mock('../../services/registrationService');
vi.mock('../../services/emailService');

describe('Registration API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /api/registrations/batch - should create registration and send verification email', async () => {
    vi.mocked(registrationService.batchRegisterSessions).mockResolvedValue({
      success: true,
      registrations: [{ id: 'reg1' }] as any,
      confirmationToken: 'token-123'
    });
    vi.mocked(emailService.sendRegistrationVerificationEmail).mockResolvedValue(true);

    const res = await request(app)
      .post('/api/registrations/batch')
      .send({
        email: 'user@test.com',
        fullName: 'Nguyễn Văn A',
        phone: '0987654321', // Bổ sung các trường schema yêu cầu
        organization: 'Test Org',
        position: 'Staff',
        sessionIds: ['sess1'],
        role: 'participant',
        cmeCertificateRequested: false
      });

    if (res.status !== 200) {
      console.error('Validation Error Details:', JSON.stringify(res.body));
    }

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(emailService.sendRegistrationVerificationEmail).toHaveBeenCalled();
  });

  it('GET /api/registrations/confirm/:token - should show success template', async () => {
    vi.mocked(registrationService.confirmRegistration).mockResolvedValue({
      success: true,
      conferenceName: 'Test Conference'
    });

    const res = await request(app).get('/api/registrations/confirm/token-123');
    
    expect(res.status).toBe(200);
    expect(res.text).toContain('Đăng ký thành công!');
    expect(res.text).toContain('Test Conference');
  });
});
