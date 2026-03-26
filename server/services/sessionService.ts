import { sessionRepository } from "../repositories/sessionRepository";
import { registrationRepository } from "../repositories/registrationRepository";

export class SessionService {
    async getAllSessions(conferenceSlug: string) {
        return await sessionRepository.getAll(conferenceSlug);
    }

    async createSession(conferenceSlug: string, data: any) {
        return await sessionRepository.create(conferenceSlug, { ...data, conferenceId: conferenceSlug });
    }

    async updateSession(conferenceSlug: string, id: string, data: any) {
        return await sessionRepository.update(conferenceSlug, id, data);
    }

    async deleteSession(conferenceSlug: string, id: string) {
        return await sessionRepository.delete(conferenceSlug, id);
    }

    async deleteAllSessions(conferenceSlug: string) {
        return await sessionRepository.deleteAll(conferenceSlug);
    }

    async getSessionsCapacityStatus(conferenceSlug: string) {
        const sessions = await sessionRepository.getAll(conferenceSlug);
        return await registrationRepository.getSessionCapacityStatus(sessions);
    }
}

export const sessionService = new SessionService();
