import { documentRepository } from "../repositories/documentRepository";
import { deleteFile } from "../utils";

export class DocumentService {
    async getAllByConference(conferenceSlug: string) {
        return await documentRepository.getAll(conferenceSlug);
    }

    async getById(conferenceSlug: string, id: string) {
        return await documentRepository.getById(conferenceSlug, id);
    }

    async incrementViews(conferenceSlug: string, id: string) {
        return await documentRepository.incrementViews(conferenceSlug, id);
    }

    async createDocument(conferenceSlug: string, data: any) {
        return await documentRepository.create(conferenceSlug, { ...data, conferenceId: conferenceSlug });
    }

    async updateDocument(conferenceSlug: string, id: string, updates: any) {
        const { filesToDelete, ...cleanUpdates } = updates;
        if (Array.isArray(filesToDelete)) {
            for (const f of filesToDelete) await deleteFile(f);
        }
        return await documentRepository.update(conferenceSlug, id, cleanUpdates);
    }

    async deleteDocument(conferenceSlug: string, id: string) {
        return await documentRepository.delete(conferenceSlug, id);
    }

    async deleteAllDocuments(conferenceSlug: string) {
        return await documentRepository.deleteAll(conferenceSlug);
    }
}

export const documentService = new DocumentService();
