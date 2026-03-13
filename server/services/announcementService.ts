import { announcementRepository } from "../repositories/announcementRepository";
import { Announcement } from "@shared/schema";
import { deleteFile } from "../utils";

export class AnnouncementService {
    async getAllByConference(conferenceSlug: string) {
        return await announcementRepository.getAll(conferenceSlug);
    }

    async createAnnouncement(conferenceSlug: string, data: any) {
        return await announcementRepository.create(conferenceSlug, { ...data, conferenceId: conferenceSlug });
    }

    async updateAnnouncement(conferenceSlug: string, id: string, updates: any) {
        const { filesToDelete, ...cleanUpdates } = updates;
        if (Array.isArray(filesToDelete)) {
            for (const f of filesToDelete) await deleteFile(f);
        }
        return await announcementRepository.update(conferenceSlug, id, cleanUpdates);
    }

    async deleteAnnouncement(conferenceSlug: string, id: string) {
        return await announcementRepository.delete(conferenceSlug, id);
    }

    async deleteAllAnnouncements(conferenceSlug: string) {
        return await announcementRepository.deleteAll(conferenceSlug);
    }
}

export const announcementService = new AnnouncementService();
