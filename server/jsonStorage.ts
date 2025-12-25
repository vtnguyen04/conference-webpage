import { existsSync } from "fs";
import { readdir, unlink } from "fs/promises";
import type {
  Conference,
} from "@shared/schema";
import { 
    readConferenceData, 
    writeConferenceData, 
    readConfig, 
    writeConfig, 
    getConferenceFilePath, 
    slugify, 
    DATA_DIR,
    ConferenceData 
} from "./dataContext";
export class JSONStorage {
  async getActiveConference(): Promise<Conference | undefined> {
    const config = await readConfig();
    const slug = config.activeConferenceSlug;
    if (!slug) return undefined;
    const data = await readConferenceData(slug);
    return data?.conference;
  }
  async getConferenceBySlug(slug: string): Promise<Conference | undefined> {
    const data = await readConferenceData(slug);
    return data?.conference;
  }
  async getAllConferences(): Promise<Conference[]> {
    try {
      const files = await readdir(DATA_DIR);
      const conferences: Conference[] = [];
      for (const file of files) {
        if (file.endsWith(".json") && file !== "config.json") {
          const slug = file.replace(".json", "");
          const data = await readConferenceData(slug);
          if (data?.conference) conferences.push(data.conference);
        }
      }
      return conferences.sort((a, b) => {
        const yearA = (a as any).year || new Date(a.createdAt).getFullYear();
        const yearB = (b as any).year || new Date(b.createdAt).getFullYear();
        return yearB - yearA;
      });
    } catch (error) {
      return [];
    }
  }
  async createConference(conf: Partial<Conference>): Promise<Conference> {
    const baseSlug = slugify(conf.name!);
    let slug = baseSlug;
    let counter = 1;
    while (existsSync(getConferenceFilePath(slug))) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    const conference: Conference = {
      id: slug,
      slug: slug,
      name: conf.name!,
      theme: conf.theme || "",
      logoUrl: conf.logoUrl || "",
      bannerUrls: conf.bannerUrls || [],
      introContent: conf.introContent || "",
      registrationNote1: conf.registrationNote1 || "",
      registrationNote2: conf.registrationNote2 || "",
      registrationBenefits: conf.registrationBenefits || "",
      registrationRules: conf.registrationRules || "",
      startDate: conf.startDate || new Date(),
      endDate: conf.endDate || new Date(),
      location: conf.location || "",
      contactEmail: conf.contactEmail || "",
      contactPhone: conf.contactPhone || "",
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;
    const newData: ConferenceData = {
      conference,
      sessions: [], speakers: [], organizers: [], sponsors: [], announcements: [], sightseeing: [], whitelists: [],
    };
    await writeConferenceData(slug, newData);
    return conference;
  }
  async updateConference(slug: string, updates: Partial<Conference>): Promise<Conference | undefined> {
    const data = await readConferenceData(slug);
    if (!data) return undefined;
    data.conference = { ...data.conference, ...updates, updatedAt: new Date().toISOString() } as any;
    await writeConferenceData(slug, data);
    return data.conference;
  }
  async deleteConference(slug: string): Promise<void> {
    const filePath = getConferenceFilePath(slug);
    if (existsSync(filePath)) {
      await unlink(filePath);
    }
    const config = await readConfig();
    if (config.activeConferenceSlug === slug) {
      config.activeConferenceSlug = null;
      await writeConfig(config);
    }
  }
  async setActiveConference(slugToActivate: string): Promise<void> {
    const config = await readConfig();
    config.activeConferenceSlug = slugToActivate;
    await writeConfig(config);
  }
  async getContentStats(slug: string): Promise<{ totalSessions: number; totalSponsors: number }> {
    const data = await readConferenceData(slug);
    if (!data) return { totalSessions: 0, totalSponsors: 0 };
    return {
      totalSessions: data.sessions.length,
      totalSponsors: data.sponsors.length,
    };
  }
}
export const jsonStorage = new JSONStorage();
