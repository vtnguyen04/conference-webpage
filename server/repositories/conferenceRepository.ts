
import { jsonStorage } from "../jsonStorage";
import { Conference } from "@shared/schema";

export class ConferenceRepository {
  async getAll(): Promise<Conference[]> {
    return await jsonStorage.getAllConferences();
  }

  async getActive(): Promise<Conference | undefined> {
    return await jsonStorage.getActiveConference();
  }

  async getBySlug(slug: string): Promise<Conference | undefined> {
    return await jsonStorage.getConferenceBySlug(slug);
  }

  async create(data: Partial<Conference>): Promise<Conference> {
    return await jsonStorage.createConference(data);
  }

  async update(slug: string, updates: Partial<Conference>): Promise<Conference | undefined> {
    return await jsonStorage.updateConference(slug, updates);
  }

  async delete(slug: string): Promise<void> {
    return await jsonStorage.deleteConference(slug);
  }

  async setActive(slug: string): Promise<void> {
    return await jsonStorage.setActiveConference(slug);
  }
}

export const conferenceRepository = new ConferenceRepository();
