import { describe, it, expect, vi, beforeEach } from 'vitest';
import { speakerService } from '../speakerService';
import { speakerRepository } from '../../repositories/speakerRepository';
import { sessionRepository } from '../../repositories/sessionRepository';
import { registrationService } from '../registrationService';
import { db } from '../../db';

// Mock all dependencies
vi.mock('../../repositories/speakerRepository');
vi.mock('../../repositories/sessionRepository');
vi.mock('../registrationService');
vi.mock('../../db', () => ({
  db: {
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          run: vi.fn(),
        })),
      })),
    })),
  },
}));

describe('SpeakerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('autoRegisterModerator', () => {
    const mockConference = { slug: 'test-conf', name: 'Test Conf' } as any;
    const mockSpeaker = { id: 's1', name: 'John', email: 'john@test.com', role: 'moderator' } as any;

    it('should NOT register if speaker role is not moderator', async () => {
      const nonMod = { ...mockSpeaker, role: 'speaker' };
      await speakerService.autoRegisterModerator(nonMod, mockConference);
      expect(sessionRepository.getAll).not.toHaveBeenCalled();
    });

    it('should NOT register if speaker has no email', async () => {
      const noEmail = { ...mockSpeaker, email: '' };
      await speakerService.autoRegisterModerator(noEmail, mockConference);
      expect(sessionRepository.getAll).not.toHaveBeenCalled();
    });

    it('should register and confirm if speaker is moderator', async () => {
      vi.mocked(sessionRepository.getAll).mockResolvedValue([{ id: 'sess1' }] as any);
      vi.mocked(registrationService.batchRegisterSessions).mockResolvedValue({ 
        success: true, 
        registrations: [{ id: 'reg1' }] 
      } as any);

      await speakerService.autoRegisterModerator(mockSpeaker, mockConference);

      expect(registrationService.batchRegisterSessions).toHaveBeenCalled();
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('CRUD operations', () => {
    it('should call repository for deleteSpeaker', async () => {
      await speakerService.deleteSpeaker('conf-1', 'sp-1');
      expect(speakerRepository.delete).toHaveBeenCalledWith('conf-1', 'sp-1');
    });

    it('should call repository for deleteAllSpeakers', async () => {
      await speakerService.deleteAllSpeakers('conf-1');
      expect(speakerRepository.deleteAll).toHaveBeenCalledWith('conf-1');
    });
  });
});
