import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registrationService } from '../registrationService';
import { registrationRepository } from '../../repositories/registrationRepository';
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

    it('should create check-in but NOT send certificate immediately', async () => {
      vi.mocked(registrationRepository.isCheckedIn).mockResolvedValue(false);
      vi.mocked(registrationRepository.createCheckIn).mockResolvedValue({ id: 'c1' } as any);

      const result = await registrationService.processCheckIn(mockReg, 's1', 'Conf', 'qr');
      
      expect(result.id).toBe('c1');
      expect(emailService.sendCertificateEmail).not.toHaveBeenCalled();
      expect(db.update).not.toHaveBeenCalled();
    });

    it('should NOT send certificate during check-in even if not sent yet', async () => {
        vi.mocked(registrationRepository.isCheckedIn).mockResolvedValue(false);
        vi.mocked(registrationRepository.createCheckIn).mockResolvedValue({ id: 'c1' } as any);
  
        await registrationService.processCheckIn(mockReg, 's1', 'Conf', 'qr');
        
        expect(emailService.sendCertificateEmail).not.toHaveBeenCalled();
      });
  });
});
