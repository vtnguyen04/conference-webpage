import { organizerRepository } from "../repositories/organizerRepository";

export class OrganizerService {
    async getAllByConference(conferenceSlug: string) {
        return await organizerRepository.getAll(conferenceSlug);
    }

    async createOrganizer(conferenceSlug: string, data: any) {
        return await organizerRepository.create(conferenceSlug, { ...data, conferenceId: conferenceSlug });
    }

    async updateOrganizer(conferenceSlug: string, id: string, data: any) {
        return await organizerRepository.update(conferenceSlug, id, data);
    }

    async deleteOrganizer(conferenceSlug: string, id: string) {
        return await organizerRepository.delete(conferenceSlug, id);
    }

    async deleteAllOrganizers(conferenceSlug: string) {
        return await organizerRepository.deleteAll(conferenceSlug);
    }
}

export const organizerService = new OrganizerService();
