import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { qrCheckIn } from '../../controllers/registration.controller';
import { registrationService } from '../../services/registrationService';
import { registrationRepository } from '../../repositories/registrationRepository';

const app = express();
app.use(express.json());

// Mock request with active conference
const activeConferenceMiddleware = (req: any, res: any, next: any) => {
  req.activeConference = { slug: 'test-conf', name: 'Test Conference' };
  next();
};

app.post('/api/check-ins', activeConferenceMiddleware, qrCheckIn);

// Use spyOn for instances
vi.mock('../../services/registrationService');
vi.mock('../../repositories/registrationRepository');

describe('Check-in API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /api/check-ins - should process check-in successfully', async () => {
    const mockRegistration = { id: 'reg123', email: 'test@test.com', sessionId: 'sess1' };
    const mockCheckIn = { id: 'ci1', registrationId: 'reg123' };
    
    // Mock getByEmail to return a list containing our mockRegistration
    vi.mocked(registrationRepository.getByEmail).mockResolvedValue([mockRegistration as any]);
    vi.mocked(registrationService.processCheckIn).mockResolvedValue(mockCheckIn as any);

    const res = await request(app)
      .post('/api/check-ins')
      .send({ 
          qrData: 'qr|test-conf|sess1|test@test.com|extra', 
          sessionId: 'sess1' 
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('ci1');
    expect(registrationService.processCheckIn).toHaveBeenCalled();
  });

  it('POST /api/check-ins - should return 400 for invalid QR format', async () => {
    const res = await request(app)
      .post('/api/check-ins')
      .send({ qrData: 'invalid', sessionId: 'sess1' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid QR');
  });

  it('POST /api/check-ins - should return 400 for conference/session mismatch', async () => {
    const res = await request(app)
      .post('/api/check-ins')
      .send({ 
          qrData: 'qr|wrong-conf|sess1|test@test.com|extra', 
          sessionId: 'sess1' 
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Mismatch');
  });
});
