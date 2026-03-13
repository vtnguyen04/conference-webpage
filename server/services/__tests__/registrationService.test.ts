import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registrationService } from '../registrationService';
import { registrationRepository } from '../../repositories/registrationRepository';
import { sessionRepository } from '../../repositories/sessionRepository';
import { db } from '../../db';
import { jsonStorage } from '../../jsonStorage';

vi.mock('../../repositories/registrationRepository');
vi.mock('../../repositories/sessionRepository');
vi.mock('../../jsonStorage');
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])), // Default empty
        })),
      })),
    })),
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
  });

  describe('confirmRegistration', () => {
    it('should return error if token not found', async () => {
      const result = await registrationService.confirmRegistration('invalid-token');
      expect(result.success).toBe(false);
      expect(result.errorTitle).toBe('Lỗi xác nhận');
    });

    it('should return error if token expired', async () => {
      const expiredDate = new Date(Date.now() - 3600000); // 1 hour ago
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([{ confirmationTokenExpires: expiredDate }])),
          })),
        })),
      } as any);

      const result = await registrationService.confirmRegistration('expired-token');
      expect(result.success).toBe(false);
      expect(result.errorTitle).toBe('Mã hết hạn');
    });
  });

  describe('processCheckIn', () => {
    it('should throw error if already checked in', async () => {
      vi.mocked(registrationRepository.isCheckedIn).mockResolvedValue(true);
      const reg = { id: 'r1' } as any;
      
      await expect(registrationService.processCheckIn(reg, 's1', 'Conf', 'qr'))
        .rejects.toThrow('Người tham dự này đã check-in rồi.');
    });

    it('should create check-in and return result', async () => {
      vi.mocked(registrationRepository.isCheckedIn).mockResolvedValue(false);
      vi.mocked(registrationRepository.createCheckIn).mockResolvedValue({ id: 'c1' } as any);
      const reg = { id: 'r1' } as any;

      const result = await registrationService.processCheckIn(reg, 's1', 'Conf', 'qr');
      expect(result.id).toBe('c1');
      expect(registrationRepository.createCheckIn).toHaveBeenCalled();
    });
  });
});
