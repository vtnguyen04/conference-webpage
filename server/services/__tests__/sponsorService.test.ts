import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sponsorService } from '../sponsorService';
import { sponsorRepository } from '../../repositories/sponsorRepository';

vi.mock('../../repositories/sponsorRepository');

describe('SponsorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call repository to get all sponsors', async () => {
    await sponsorService.getAllSponsors('conf-slug');
    expect(sponsorRepository.getAll).toHaveBeenCalledWith('conf-slug');
  });

  it('should call repository to create sponsor', async () => {
    const data = { name: 'Gold Sponsor' };
    await sponsorService.createSponsor('conf-slug', data);
    expect(sponsorRepository.create).toHaveBeenCalledWith('conf-slug', expect.objectContaining(data));
  });

  it('should call repository to delete sponsor', async () => {
    await sponsorService.deleteSponsor('conf-slug', 'id-1');
    expect(sponsorRepository.delete).toHaveBeenCalledWith('conf-slug', 'id-1');
  });
});
