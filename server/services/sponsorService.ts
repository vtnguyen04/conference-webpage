import { sponsorRepository } from "../repositories/sponsorRepository";

export class SponsorService {
    async getAllSponsors(conferenceSlug: string) {
        return await sponsorRepository.getAll(conferenceSlug);
    }

    async createSponsor(conferenceSlug: string, data: any) {
        return await sponsorRepository.create(conferenceSlug, { ...data, conferenceId: conferenceSlug });
    }

    async updateSponsor(conferenceSlug: string, id: string, data: any) {
        return await sponsorRepository.update(conferenceSlug, id, data);
    }

    async deleteSponsor(conferenceSlug: string, id: string) {
        return await sponsorRepository.delete(conferenceSlug, id);
    }

    async deleteAllSponsors(conferenceSlug: string) {
        return await sponsorRepository.deleteAll(conferenceSlug);
    }
}

export const sponsorService = new SponsorService();
