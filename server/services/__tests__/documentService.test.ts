import { describe, it, expect, vi, beforeEach } from 'vitest';
import { documentService } from '../documentService';
import { documentRepository } from '../../repositories/documentRepository';

vi.mock('../../repositories/documentRepository');

describe('DocumentService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should get all documents for a conference', async () => {
        const mockData = [{ id: '1', title: 'Doc' }] as any;
        vi.mocked(documentRepository.getAll).mockResolvedValue(mockData);
        
        const result = await documentService.getAllByConference('slug');
        expect(result).toEqual(mockData);
    });

    it('should get document by id', async () => {
        const mockData = { id: '1', title: 'Doc' } as any;
        vi.mocked(documentRepository.getById).mockResolvedValue(mockData);
        
        const result = await documentService.getById('slug', '1');
        expect(result).toEqual(mockData);
    });

    it('should increment document views', async () => {
        vi.mocked(documentRepository.incrementViews).mockResolvedValue({ id: '1', views: 5 } as any);
        const result = await documentService.incrementViews('slug', '1');
        expect(result?.views).toBe(5);
    });
});
