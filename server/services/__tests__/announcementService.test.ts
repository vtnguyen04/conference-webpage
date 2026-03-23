import { describe, it, expect, vi, beforeEach } from 'vitest';
import { announcementService } from '../announcementService';
import { announcementRepository } from '../../repositories/announcementRepository';

vi.mock('../../repositories/announcementRepository');

describe('AnnouncementService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should get all announcements for a conference', async () => {
        const mockData = [{ id: '1', title: 'Test' }] as any;
        vi.mocked(announcementRepository.getAll).mockResolvedValue(mockData);
        
        const result = await announcementService.getAllByConference('slug');
        expect(result).toEqual(mockData);
        expect(announcementRepository.getAll).toHaveBeenCalledWith('slug');
    });

    it('should get announcement by id', async () => {
        const mockData = { id: '1', title: 'Test' } as any;
        vi.mocked(announcementRepository.getById).mockResolvedValue(mockData);
        
        const result = await announcementService.getById('slug', '1');
        expect(result).toEqual(mockData);
    });

    it('should increment views', async () => {
        vi.mocked(announcementRepository.incrementViews).mockResolvedValue({ id: '1', views: 1 } as any);
        const result = await announcementService.incrementViews('slug', '1');
        expect(result?.views).toBe(1);
    });
});
