import { conferenceRepository } from "../repositories/conferenceRepository";
import { registrationRepository } from "../repositories/registrationRepository";
import { Conference } from "@shared/schema";
import { deleteFile } from "../utils";

export class ConferenceService {
    async updateConference(slug: string, updates: Partial<Conference> & { filesToDelete?: string[] }): Promise<Conference | undefined> {
        const { filesToDelete, ...cleanUpdates } = updates;
        
        if (Array.isArray(filesToDelete)) {
            for (const file of filesToDelete) {
                try {
                    await deleteFile(file);
                } catch (error) {
                    console.error(`Failed to delete file: ${file}`, error);
                }
            }
        }
        
        return await conferenceRepository.update(slug, cleanUpdates);
    }

    async deleteConference(slug: string): Promise<void> {
        // Xóa tất cả đăng ký liên quan trước khi xóa hội nghị (Tránh rác dữ liệu)
        await registrationRepository.deleteByConferenceSlug(slug);
        await conferenceRepository.delete(slug);
    }

    // Các phương thức khác chỉ đơn giản là gọi Repository
    async getAllConferences() {
        return await conferenceRepository.getAll();
    }

    async getActiveConference() {
        return await conferenceRepository.getActive();
    }

    async getBySlug(slug: string) {
        return await conferenceRepository.getBySlug(slug);
    }

    async createConference(data: Partial<Conference>) {
        return await conferenceRepository.create(data);
    }

    async cloneConference(fromSlug: string) {
        return await conferenceRepository.clone(fromSlug);
    }

    async setActiveConference(slug: string) {
        return await conferenceRepository.setActive(slug);
    }
}

export const conferenceService = new ConferenceService();
