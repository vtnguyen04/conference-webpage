import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registrationService } from '../registrationService';
import { registrationRepository } from '../../repositories/registrationRepository';
import { sessionRepository } from '../../repositories/sessionRepository';
import { db } from '../../db';
import { emailService } from '../emailService';
import { certificateService } from '../certificateService';
import { backgroundQueue } from '../../utils/backgroundQueue';

vi.mock('../../repositories/registrationRepository');
vi.mock('../../repositories/sessionRepository');
vi.mock('../../jsonStorage');
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

describe('RegistrationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock backgroundQueue to execute immediately and AWAIT it
    vi.spyOn(backgroundQueue, 'enqueue').mockImplementation(async (task) => {
        await task();
    });
    vi.spyOn(emailService, 'sendCertificateEmail').mockResolvedValue(undefined as any);
    vi.spyOn(certificateService, 'generateCertificate').mockResolvedValue(Buffer.from('pdf'));
  });

  describe('confirmRegistration', () => {
    it('should return error if token not found', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      } as any);

      const result = await registrationService.confirmRegistration('invalid-token');
      expect(result.success).toBe(false);
      expect(result.errorTitle).toBe('Lỗi xác nhận');
    });
  });

  describe('processCheckIn', () => {
    const mockReg = { 
        id: 'r1', 
        email: 'test@test.com', 
        conferenceSlug: 'slug', 
        certificateRequested: true,
        conferenceCertificateSent: false
    } as any;

    it('should throw error if already checked in', async () => {
      vi.mocked(registrationRepository.isCheckedIn).mockResolvedValue(true);
      
      await expect(registrationService.processCheckIn(mockReg, 's1', 'Conf', 'qr'))
        .rejects.toThrow('Người tham dự này đã check-in rồi.');
    });

    it('should create check-in and send certificate if not sent yet', async () => {
      vi.mocked(registrationRepository.isCheckedIn).mockResolvedValue(false);
      vi.mocked(registrationRepository.createCheckIn).mockResolvedValue({ id: 'c1' } as any);
      vi.mocked(registrationRepository.getByEmail).mockResolvedValue([mockReg]);
      vi.mocked(sessionRepository.getById).mockResolvedValue({ title: 'Session 1' } as any);

      const result = await registrationService.processCheckIn(mockReg, 's1', 'Conf', 'qr');
      
      // Wait for all promises to resolve just in case
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(result.id).toBe('c1');
      expect(emailService.sendCertificateEmail).toHaveBeenCalled();
      expect(db.update).toHaveBeenCalled();
    });

    it('should NOT send certificate if already sent to this user', async () => {
        vi.mocked(registrationRepository.isCheckedIn).mockResolvedValue(false);
        vi.mocked(registrationRepository.createCheckIn).mockResolvedValue({ id: 'c1' } as any);
        vi.mocked(registrationRepository.getByEmail).mockResolvedValue([
            { ...mockReg, conferenceCertificateSent: true }
        ]);
  
        await registrationService.processCheckIn(mockReg, 's1', 'Conf', 'qr');
        
        expect(emailService.sendCertificateEmail).not.toHaveBeenCalled();
      });
  });
});
