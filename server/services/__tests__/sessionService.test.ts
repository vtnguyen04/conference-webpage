import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sessionService } from '../sessionService';
import { sessionRepository } from '../../repositories/sessionRepository';
import { registrationRepository } from '../../repositories/registrationRepository';

vi.mock('../../repositories/sessionRepository');
vi.mock('../../repositories/registrationRepository');

describe('SessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSessionsCapacityStatus', () => {
    it('should combine session and capacity data', async () => {
      const mockSessions = [{ id: 's1', title: 'Session 1' }] as any;
      const mockStatus = [{ sessionId: 's1', available: 10 }] as any;
      
      vi.mocked(sessionRepository.getAll).mockResolvedValue(mockSessions);
      vi.mocked(registrationRepository.getSessionCapacityStatus).mockResolvedValue(mockStatus);

      const result = await sessionService.getSessionsCapacityStatus('slug');
      
      expect(sessionRepository.getAll).toHaveBeenCalledWith('slug');
      expect(registrationRepository.getSessionCapacityStatus).toHaveBeenCalledWith(mockSessions);
      expect(result).toEqual(mockStatus);
    });
  });

  describe('CRUD operations', () => {
    it('should call repository for createSession', async () => {
      const data = { title: 'New Sess' };
      await sessionService.createSession('slug', data);
      expect(sessionRepository.create).toHaveBeenCalledWith('slug', expect.objectContaining(data));
    });

    it('should call repository for deleteSession', async () => {
      await sessionService.deleteSession('slug', 'id-1');
      expect(sessionRepository.delete).toHaveBeenCalledWith('slug', 'id-1');
    });
  });
});
