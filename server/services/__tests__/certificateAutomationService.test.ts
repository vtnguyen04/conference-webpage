import { describe, it, expect, vi, beforeEach } from 'vitest';
import { certificateAutomationService } from '../certificateAutomationService';
import { db } from '../../db';
import { emailService } from '../emailService';
import { certificateService } from '../certificateService';
import { conferenceRepository } from '../../repositories/conferenceRepository';
import { sessionRepository } from '../../repositories/sessionRepository';

vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          run: vi.fn(),
        })),
      })),
    })),
  },
}));

vi.mock('../../repositories/conferenceRepository');
vi.mock('../../repositories/sessionRepository');
vi.mock('../emailService');
vi.mock('../certificateService');

describe('CertificateAutomationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(emailService, 'sendCertificateEmail').mockResolvedValue(undefined as any);
    vi.spyOn(certificateService, 'generateCertificate').mockResolvedValue(Buffer.from('pdf'));
  });

  it('should send certificates to eligible users after session ends', async () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 3600000); // 1 hour ago
    
    vi.mocked(conferenceRepository.getActive).mockResolvedValue({ slug: 'conf-slug', name: 'Conf' } as any);
    vi.mocked(sessionRepository.getAll).mockResolvedValue([
      { id: 's1', endTime: pastDate.toISOString() }
    ] as any);

    // Mock the complex query in processCertificates
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            all: vi.fn(() => [
              { email: 'user@test.com', fullName: 'User One', conferenceSlug: 'conf-slug' }
            ]),
          })),
        })),
      })),
    } as any);

    // Access private method for testing
    await (certificateAutomationService as any).processCertificates();

    expect(emailService.sendCertificateEmail).toHaveBeenCalledWith(
      'user@test.com',
      'User One',
      expect.any(String),
      'Conf',
      expect.any(Buffer)
    );
    expect(db.update).toHaveBeenCalled();
  });

  it('should NOT send certificate if session has not ended', async () => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 3600000); // 1 hour later
    
    vi.mocked(conferenceRepository.getActive).mockResolvedValue({ slug: 'conf-slug', name: 'Conf' } as any);
    vi.mocked(sessionRepository.getAll).mockResolvedValue([
      { id: 's1', endTime: futureDate.toISOString() }
    ] as any);

    await (certificateAutomationService as any).processCertificates();

    expect(emailService.sendCertificateEmail).not.toHaveBeenCalled();
  });
});
