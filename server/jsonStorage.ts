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
    ConferenceData,
    cloneFile
} from "./dataContext";
export class JSONStorage {
  async getActiveConference(): Promise<Conference | undefined> {
    const config = await readConfig();
    const slug = config.activeConferenceSlug;
    if (!slug) return undefined;
    const data = await readConferenceData(slug);
    if (data?.conference) {
        data.conference.isActive = true;
        return data.conference;
    }
    return undefined;
  }
  async getConferenceBySlug(slug: string): Promise<Conference | undefined> {
    const config = await readConfig();
    const data = await readConferenceData(slug);
    if (data?.conference) {
        data.conference.isActive = (slug === config.activeConferenceSlug);
        return data.conference;
    }
    return undefined;
  }
  async getAllConferences(): Promise<Conference[]> {
    try {
      const config = await readConfig();
      const files = await readdir(DATA_DIR);
      const conferences: Conference[] = [];
      for (const file of files) {
        if (file.endsWith(".json") && file !== "config.json") {
          const slug = file.replace(".json", "");
          const data = await readConferenceData(slug);
          if (data?.conference) {
            // Force isActive to match config source of truth
            data.conference.isActive = (slug === config.activeConferenceSlug);
            conferences.push(data.conference);
          }
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
      tagline: conf.tagline || "",
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
    const conference = await this.getConferenceBySlug(slugToActivate);
    if (!conference) {
      throw new Error(`Conference with slug ${slugToActivate} not found`);
    }

    // Deactivate all conferences first
    const allConferences = await this.getAllConferences();
    for (const conf of allConferences) {
      if (conf.slug !== slugToActivate && conf.isActive) {
        await this.updateConference(conf.slug, { isActive: false });
      }
    }
    
    // Activate the target one
    await this.updateConference(slugToActivate, { isActive: true });

    const config = await readConfig();
    config.activeConferenceSlug = slugToActivate;
    await writeConfig(config);
    console.log(`Activated conference: ${slugToActivate}`);
  }
  async cloneConference(fromSlug: string): Promise<Conference> {
    const sourceData = await readConferenceData(fromSlug);
    if (!sourceData) throw new Error("Source conference not found");

    const baseName = `${sourceData.conference.name} (Copy)`;
    const baseSlug = slugify(baseName);
    let slug = baseSlug;
    let counter = 1;
    while (existsSync(getConferenceFilePath(slug))) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const newLogoUrl = await cloneFile(sourceData.conference.logoUrl);
    const newBannerUrls = await Promise.all((sourceData.conference.bannerUrls || []).map(url => cloneFile(url)));

    const newConference: Conference = {
      ...sourceData.conference,
      id: slug,
      slug: slug,
      name: baseName,
      logoUrl: newLogoUrl || "",
      bannerUrls: newBannerUrls as string[],
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;

    const newSessions = await Promise.all((sourceData.sessions || []).map(async s => ({
      ...s,
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conferenceId: slug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })));

    const newSpeakers = await Promise.all((sourceData.speakers || []).map(async s => ({
      ...s,
      id: `speaker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conferenceId: slug,
      photoUrl: await cloneFile(s.photoUrl),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })));

    const newOrganizers = await Promise.all((sourceData.organizers || []).map(async o => ({
      ...o,
      id: `organizer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conferenceId: slug,
      photoUrl: await cloneFile(o.photoUrl),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })));

    const newSponsors = await Promise.all((sourceData.sponsors || []).map(async s => ({
      ...s,
      id: `sponsor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conferenceId: slug,
      logoUrl: await cloneFile(s.logoUrl),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })));

    const newAnnouncements = await Promise.all((sourceData.announcements || []).map(async a => ({
      ...a,
      id: `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conferenceId: slug,
      featuredImageUrl: await cloneFile(a.featuredImageUrl),
      pdfUrl: await cloneFile(a.pdfUrl),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })));

    const newSightseeing = await Promise.all((sourceData.sightseeing || []).map(async s => ({
      ...s,
      id: `sightseeing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conferenceId: slug,
      featuredImageUrl: await cloneFile(s.featuredImageUrl),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })));

    const newWhitelists = (sourceData.whitelists || []).map(w => ({
      ...w,
      id: `whitelist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conferenceId: slug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const newData: ConferenceData = {
      conference: newConference,
      sessions: newSessions as any,
      speakers: newSpeakers as any,
      organizers: newOrganizers as any,
      sponsors: newSponsors as any,
      announcements: newAnnouncements as any,
      sightseeing: newSightseeing as any,
      whitelists: newWhitelists as any,
    };

    await writeConferenceData(slug, newData);
    return newConference;
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
