import { join, extname } from "path";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  copyFileSync,
  readdirSync,
} from "fs";
import type {
  Conference,
  Session,
  Speaker,
  Sponsor,
  Announcement,
  Sightseeing,
  Whitelist,
} from "@shared/schema";

interface ConferenceData {
  conference: Conference;
  sessions: Session[];
  speakers: Speaker[];
  sponsors: Sponsor[];
  announcements: Announcement[];
  sightseeing: Sightseeing[];
  whitelists: Whitelist[];
}

const DATA_DIR = join(process.cwd(), "server", "data");
const CONFIG_FILE_PATH = join(DATA_DIR, "config.json");

interface Config {
  activeConferenceSlug: string | null;
}

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

function readConfig(): Config {
  if (!existsSync(CONFIG_FILE_PATH)) {
    return { activeConferenceSlug: null };
  }
  try {
    const content = readFileSync(CONFIG_FILE_PATH, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${CONFIG_FILE_PATH}:`, error);
    return { activeConferenceSlug: null };
  }
}

function writeConfig(config: Config): void {
  try {
    writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), "utf-8");
  } catch (error) {
    console.error(`Error writing ${CONFIG_FILE_PATH}:`, error);
  }
}

function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

function getConferenceFilePath(slug: string): string {
  return join(DATA_DIR, `${slug}.json`);
}

function readConferenceData(slug: string): ConferenceData | null {
  const filePath = getConferenceFilePath(slug);
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    const content = readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);
    if (data?.conference?.startDate) {
      data.conference.startDate = new Date(data.conference.startDate);
    }
    if (data?.conference?.endDate) {
      data.conference.endDate = new Date(data.conference.endDate);
    }
    return data;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

function writeConferenceData(slug: string, data: ConferenceData): void {
  const filePath = getConferenceFilePath(slug);
  try {
    writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  }
  catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    throw error;
  }
}

function deleteFile(filePathRelative: string) {
  if (filePathRelative && filePathRelative.startsWith('/uploads/')) {
    const absolutePath = join(process.cwd(), "public", filePathRelative);
    if (existsSync(absolutePath)) {
      unlinkSync(absolutePath);
      console.log(`Deleted file: ${absolutePath}`);
    }
  }
}

function cloneFile(filePathRelative: string | null | undefined): string | undefined {
  if (!filePathRelative || !filePathRelative.startsWith('/uploads/')) {
    return filePathRelative ?? undefined;
  }

  const sourcePath = join(process.cwd(), "public", filePathRelative);
  if (!existsSync(sourcePath)) {
    return filePathRelative;
  }

  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const extension = extname(filePathRelative);
  const newFilename = `image-${uniqueSuffix}${extension}`;
  const newRelativePath = `/uploads/${newFilename}`;
  const destinationPath = join(process.cwd(), "public", "uploads", newFilename);

  try {
    copyFileSync(sourcePath, destinationPath);
    console.log(`Cloned file from ${filePathRelative} to ${newRelativePath}`);
    return newRelativePath;
  } catch (error) {
    console.error(`Failed to clone file ${filePathRelative}:`, error);
    return filePathRelative;
  }
}

function getActiveConferenceSlug(): string | null {
  const config = readConfig();
  return config.activeConferenceSlug;
}

export class JSONStorage {
  async getActiveConference(): Promise<Conference | undefined> {
    const slug = getActiveConferenceSlug();
    if (!slug) return undefined;
    const data = readConferenceData(slug);
    return data?.conference;
  }

  // Get conference by slug
  async getConferenceBySlug(slug: string): Promise<Conference | undefined> {
    const data = readConferenceData(slug);
    return data?.conference;
  }

  // Get all conferences
  async getAllConferences(): Promise<Conference[]> {
    try {
      if (!existsSync(DATA_DIR)) return [];
      const files = readdirSync(DATA_DIR);
      const conferences: Conference[] = [];
      for (const file of files) {
        if (file.endsWith(".json") && file !== "config.json") {
          const slug = file.replace(".json", "");
          const data = readConferenceData(slug);
          if (data?.conference) {
            conferences.push(data.conference);
          }
        }
      }
      // Sort by year (if available) or creation date, newest first
      return conferences.sort((a, b) => {
        const yearA = (a as any).year || new Date(a.createdAt).getFullYear();
        const yearB = (b as any).year || new Date(b.createdAt).getFullYear();
        return yearB - yearA;
      });
    } catch (error) {
      console.error("Error getting all conferences:", error);
      return [];
    }
  }

  // Create a new conference
  async createConference(conf: Partial<Conference>): Promise<Conference> {
    if (!conf.name) {
      throw new Error("Conference name is required to create a slug.");
    }

    let baseSlug = slugify(conf.name);
    let slug = baseSlug;
    let counter = 1;
    while (existsSync(getConferenceFilePath(slug))) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const conference: Conference = {
      id: slug, // Use slug as ID
      slug: slug,
      name: conf.name,
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
      isActive: false, // New conferences are created as inactive
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newData: ConferenceData = {
      conference,
      sessions: [],
      speakers: [],
      sponsors: [],
      announcements: [],
      sightseeing: [],
      whitelists: [],
    };

    writeConferenceData(slug, newData);
    return conference;
  }

  // Update a conference
  async updateConference(slug: string, updates: Partial<Conference>): Promise<Conference | undefined> {
    const data = readConferenceData(slug);
    if (!data) return undefined;

    const oldConference = data.conference;

    if (updates.logoUrl && updates.logoUrl !== oldConference.logoUrl && oldConference.logoUrl) {
      deleteFile(oldConference.logoUrl);
    }

    if (updates.bannerUrls) {
      const oldBannerUrls = new Set(oldConference.bannerUrls);
      const newBannerUrls = new Set(updates.bannerUrls);
      oldBannerUrls.forEach(url => {
        if (!newBannerUrls.has(url)) {
          deleteFile(url as string);
        }
      });
    }

    data.conference = {
      ...oldConference,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    writeConferenceData(slug, data);
    return data.conference;
  }

  // Delete a conference
  async deleteConference(slug: string): Promise<void> {
    const data = readConferenceData(slug);
    if (!data) {
      return;
    }

    if (data.conference.logoUrl) {
      deleteFile(data.conference.logoUrl);
    }
    data.conference.bannerUrls?.forEach(deleteFile);
    data.speakers?.forEach((speaker: Speaker) => deleteFile(speaker.photoUrl));
    data.sponsors?.forEach((sponsor: Sponsor) => deleteFile(sponsor.logoUrl));
    data.announcements?.forEach((announcement: Announcement) => {
      deleteFile(announcement.featuredImageUrl);
      if (announcement.pdfUrl) {
        deleteFile(announcement.pdfUrl);
      }
    });
    data.sightseeing?.forEach((sightseeing: Sightseeing) => deleteFile(sightseeing.featuredImageUrl));

    const filePath = getConferenceFilePath(slug);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
      console.log(`Deleted data file: ${filePath}`);
    }

    // If the deleted conference was active, clear the active slug
    const config = readConfig();
    if (config.activeConferenceSlug === slug) {
      config.activeConferenceSlug = null;
      writeConfig(config);
    }
  }

  // Set active conference
  async setActiveConference(slugToActivate: string): Promise<void> {
    const config = readConfig();
    config.activeConferenceSlug = slugToActivate;
    writeConfig(config);

    const allConferences = await this.getAllConferences();
    for (const conf of allConferences) {
      const data = readConferenceData(conf.slug);
      if (data) {
        const shouldBeActive = data.conference.slug === slugToActivate;
        if (data.conference.isActive !== shouldBeActive) {
          data.conference.isActive = shouldBeActive;
          writeConferenceData(data.conference.slug, data);
        }
      }
    }
  }

  // Get all sessions for a conference
  async getSessions(slug: string): Promise<Session[]> {
    const data = readConferenceData(slug);
    return data?.sessions || [];
  }

  // Get a session by ID
  async getSession(slug: string, id: string): Promise<Session | undefined> {
    const data = readConferenceData(slug);
    return data?.sessions.find((session: Session) => session.id === id);
  }

  // Create a new session
  async createSession(slug: string, session: Omit<Session, "id" | "createdAt" | "updatedAt">): Promise<Session> {
    const data = readConferenceData(slug);
    if (!data) throw new Error("Conference not found");

    const newSession: Session = {
      ...session,
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conferenceId: data.conference.slug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.sessions.push(newSession);
    writeConferenceData(slug, data);
    return newSession;
  }

  // Update a session
  async updateSession(slug: string, id: string, updates: Partial<Session>): Promise<Session | undefined> {
    const data = readConferenceData(slug);
    if (!data) return undefined;

    const index = data.sessions.findIndex((s: Session) => s.id === id);
    if (index === -1) return undefined;

    data.sessions[index] = {
      ...data.sessions[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    writeConferenceData(slug, data);
    return data.sessions[index];
  }

  // Delete a session
  async deleteSession(slug: string, id: string): Promise<void> {
    const data = readConferenceData(slug);
    if (!data) return;

    data.sessions = data.sessions.filter((s: Session) => s.id !== id);
    writeConferenceData(slug, data);
  }

  // Delete all sessions
  async deleteAllSessions(slug: string): Promise<void> {
    const data = readConferenceData(slug);
    if (!data) return;

    data.sessions = [];
    writeConferenceData(slug, data);
  }

  // Get all speakers for a conference
  async getSpeakers(slug: string): Promise<Speaker[]> {
    const data = readConferenceData(slug);
    return data?.speakers || [];
  }

  // Get a speaker by ID
  async getSpeakerById(slug: string, id: string): Promise<Speaker | undefined> {
    const data = readConferenceData(slug);
    return data?.speakers.find((speaker: Speaker) => speaker.id === id);
  }

  // Create a new speaker
  async createSpeaker(slug: string, speaker: Omit<Speaker, "id" | "createdAt" | "updatedAt">): Promise<Speaker> {
    const data = readConferenceData(slug);
    if (!data) throw new Error("Conference not found");

    const newSpeaker: Speaker = {
      ...speaker,
      id: `speaker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conferenceId: data.conference.slug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.speakers.push(newSpeaker);
    writeConferenceData(slug, data);
    return newSpeaker;
  }

  // Update a speaker
  async updateSpeaker(slug: string, id: string, updates: Partial<Speaker>): Promise<Speaker | undefined> {
    const data = readConferenceData(slug);
    if (!data) return undefined;

    const index = data.speakers.findIndex((s: Speaker) => s.id === id);
    if (index === -1) return undefined;

    const oldSpeaker = data.speakers[index];

    if (updates.photoUrl && updates.photoUrl !== oldSpeaker.photoUrl) {
      deleteFile(oldSpeaker.photoUrl);
    }

    data.speakers[index] = {
      ...oldSpeaker,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    writeConferenceData(slug, data);
    return data.speakers[index];
  }

  // Delete a speaker
  async deleteSpeaker(slug: string, id: string): Promise<void> {
    const data = readConferenceData(slug);
    if (!data) return;

    const speakerToDelete = data.speakers.find((s: Speaker) => s.id === id);
    if (speakerToDelete) {
      deleteFile(speakerToDelete.photoUrl);
    }

    data.speakers = data.speakers.filter((s: Speaker) => s.id !== id);
    writeConferenceData(slug, data);
  }

  // Delete all speakers
  async deleteAllSpeakers(slug: string): Promise<void> {
    const data = readConferenceData(slug);
    if (!data) return;

    data.speakers.forEach((speaker: Speaker) => deleteFile(speaker.photoUrl));
    data.speakers = [];
    writeConferenceData(slug, data);
  }

  // Get all sponsors for a conference
  async getSponsors(slug: string): Promise<Sponsor[]> {
    const data = readConferenceData(slug);
    return data?.sponsors || [];
  }

  // Get a sponsor by ID
  async getSponsorById(slug: string, id: string): Promise<Sponsor | undefined> {
    const data = readConferenceData(slug);
    return data?.sponsors.find((sponsor: Sponsor) => sponsor.id === id);
  }

  // Create a new sponsor
  async createSponsor(slug: string, sponsor: Omit<Sponsor, "id" | "createdAt" | "updatedAt">): Promise<Sponsor> {
    const data = readConferenceData(slug);
    if (!data) throw new Error("Conference not found");

    const newSponsor: Sponsor = {
      ...sponsor,
      id: `sponsor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conferenceId: data.conference.slug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.sponsors.push(newSponsor);
    writeConferenceData(slug, data);
    return newSponsor;
  }

  // Update a sponsor
  async updateSponsor(slug: string, id: string, updates: Partial<Sponsor>): Promise<Sponsor | undefined> {
    const data = readConferenceData(slug);
    if (!data) return undefined;

    const index = data.sponsors.findIndex((s: Sponsor) => s.id === id);
    if (index === -1) return undefined;

    const oldSponsor = data.sponsors[index];

    if (updates.logoUrl && updates.logoUrl !== oldSponsor.logoUrl) {
      deleteFile(oldSponsor.logoUrl);
    }

    data.sponsors[index] = {
      ...oldSponsor,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    writeConferenceData(slug, data);
    return data.sponsors[index];
  }

  // Delete a sponsor
  async deleteSponsor(slug: string, id: string): Promise<void> {
    const data = readConferenceData(slug);
    if (!data) return;

    const sponsorToDelete = data.sponsors.find((s: Sponsor) => s.id === id);
    if (sponsorToDelete) {
      deleteFile(sponsorToDelete.logoUrl);
    }

    data.sponsors = data.sponsors.filter((s: Sponsor) => s.id !== id);
    writeConferenceData(slug, data);
  }

  // Delete all sponsors
  async deleteAllSponsors(slug: string): Promise<void> {
    const data = readConferenceData(slug);
    if (!data) return;

    data.sponsors.forEach((sponsor: Sponsor) => deleteFile(sponsor.logoUrl));
    data.sponsors = [];
    writeConferenceData(slug, data);
  }

  // Get all announcements for a conference
  async getAnnouncements(slug: string): Promise<Announcement[]> {
    const data = readConferenceData(slug);
    return data?.announcements || [];
  }

  // Get an announcement by ID
  async getAnnouncement(slug: string, id: string): Promise<Announcement | undefined> {
    const data = readConferenceData(slug);
    return data?.announcements.find((announcement: Announcement) => announcement.id === id);
  }

  // Create a new announcement
  async createAnnouncement(slug: string, announcement: Omit<Announcement, "id" | "createdAt" | "updatedAt">): Promise<Announcement> {
    const data = readConferenceData(slug);
    if (!data) throw new Error("Conference not found");

    const newAnnouncement: Announcement = {
      ...announcement,
      id: `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conferenceId: data.conference.slug,
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.announcements.push(newAnnouncement);
    writeConferenceData(slug, data);
    return newAnnouncement;
  }

  // Update an announcement
  async updateAnnouncement(slug: string, id: string, updates: Partial<Announcement>): Promise<Announcement | undefined> {
    const data = readConferenceData(slug);
    if (!data) return undefined;

    const index = data.announcements.findIndex((a: Announcement) => a.id === id);
    if (index === -1) return undefined;

    const oldAnnouncement = data.announcements[index];

    if (updates.featuredImageUrl && updates.featuredImageUrl !== oldAnnouncement.featuredImageUrl) {
      deleteFile(oldAnnouncement.featuredImageUrl);
    }
    if (updates.pdfUrl && updates.pdfUrl !== oldAnnouncement.pdfUrl && oldAnnouncement.pdfUrl) {
      deleteFile(oldAnnouncement.pdfUrl);
    }

    data.announcements[index] = {
      ...oldAnnouncement,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    writeConferenceData(slug, data);
    return data.announcements[index];
  }

  // Delete an announcement
  async deleteAnnouncement(slug: string, id: string): Promise<void> {
    const data = readConferenceData(slug);
    if (!data) return;

    const announcementToDelete = data.announcements.find((a: Announcement) => a.id === id);
    if (announcementToDelete) {
      deleteFile(announcementToDelete.featuredImageUrl);
      if (announcementToDelete.pdfUrl) {
        deleteFile(announcementToDelete.pdfUrl);
      }
    }

    data.announcements = data.announcements.filter((a: Announcement) => a.id !== id);
    writeConferenceData(slug, data);
  }

  // Delete all announcements
  async deleteAllAnnouncements(slug: string): Promise<void> {
    const data = readConferenceData(slug);
    if (!data) return;

    data.announcements.forEach((announcement: Announcement) => {
      deleteFile(announcement.featuredImageUrl);
      if (announcement.pdfUrl) {
        deleteFile(announcement.pdfUrl);
      }
    });
    data.announcements = [];
    writeConferenceData(slug, data);
  }

  // Increment announcement views
  async incrementAnnouncementViews(slug: string, id: string): Promise<Announcement | undefined> {
    const data = readConferenceData(slug);
    if (!data) return undefined;

    const index = data.announcements.findIndex((a: Announcement) => a.id === id);
    if (index === -1) return undefined;

    data.announcements[index].views = (data.announcements[index].views || 0) + 1;

    writeConferenceData(slug, data);
    return data.announcements[index];
  }

  // Get all sightseeing for a conference
  async getSightseeing(slug: string): Promise<Sightseeing[]> {
    const data = readConferenceData(slug);
    return data?.sightseeing || [];
  }

  // Get a sightseeing by ID
  async getSightseeingById(slug: string, id: string): Promise<Sightseeing | undefined> {
    const data = readConferenceData(slug);
    return data?.sightseeing.find((s: Sightseeing) => s.id === id);
  }

  // Create a new sightseeing
  async createSightseeing(slug: string, sightseeing: Omit<Sightseeing, "id" | "createdAt" | "updatedAt">): Promise<Sightseeing> {
    const data = readConferenceData(slug);
    if (!data) throw new Error("Conference not found");

    if (!data.sightseeing) {
      data.sightseeing = [];
    }

    const newSightseeing: Sightseeing = {
      ...sightseeing,
      id: `sightseeing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conferenceId: data.conference.slug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.sightseeing.push(newSightseeing);
    writeConferenceData(slug, data);
    return newSightseeing;
  }

  // Update a sightseeing
  async updateSightseeing(slug: string, id: string, updates: Partial<Sightseeing>): Promise<Sightseeing | undefined> {
    const data = readConferenceData(slug);
    if (!data) return undefined;

    const index = data.sightseeing.findIndex((s: Sightseeing) => s.id === id);
    if (index === -1) return undefined;

    const oldSightseeing = data.sightseeing[index];

    if (updates.featuredImageUrl && updates.featuredImageUrl !== oldSightseeing.featuredImageUrl) {
      deleteFile(oldSightseeing.featuredImageUrl);
    }

    data.sightseeing[index] = {
      ...oldSightseeing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    writeConferenceData(slug, data);
    return data.sightseeing[index];
  }

  // Delete a sightseeing
  async deleteSightseeing(slug: string, id: string): Promise<void> {
    const data = readConferenceData(slug);
    if (!data) return;

    const sightseeingToDelete = data.sightseeing.find((s: Sightseeing) => s.id === id);
    if (sightseeingToDelete) {
      deleteFile(sightseeingToDelete.featuredImageUrl);
    }

    data.sightseeing = data.sightseeing.filter((s: Sightseeing) => s.id !== id);
    writeConferenceData(slug, data);
  }

  // Delete all sightseeing
  async deleteAllSightseeing(slug: string): Promise<void> {
    const data = readConferenceData(slug);
    if (!data) return;

    data.sightseeing.forEach((sightseeing: Sightseeing) => deleteFile(sightseeing.featuredImageUrl));
    data.sightseeing = [];
    writeConferenceData(slug, data);
  }

  // Get all whitelists for a conference
  async getWhitelists(slug: string): Promise<Whitelist[]> {
    const data = readConferenceData(slug);
    return data?.whitelists || [];
  }

  // Add an email to the whitelist
  async addToWhitelist(slug: string, email: string): Promise<Whitelist> {
    const data = readConferenceData(slug);
    if (!data) throw new Error("Conference not found");

    const newWhitelist: Whitelist = {
      id: `wl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conferenceId: data.conference.slug,
      email,
      name: "",
      createdAt: new Date().toISOString(),
    };

    data.whitelists.push(newWhitelist);
    writeConferenceData(slug, data);
    return newWhitelist;
  }

  // Remove an email from the whitelist
  async removeFromWhitelist(slug: string, id: string): Promise<void> {
    const data = readConferenceData(slug);
    if (!data) return;

    data.whitelists = data.whitelists.filter((w: Whitelist) => w.id !== id);
    writeConferenceData(slug, data);
  }

  // Check if an email is in the whitelist
  async checkWhitelist(slug: string, email: string): Promise<boolean> {
    const data = readConferenceData(slug);
    return data?.whitelists.some((w: Whitelist) => w.email === email) || false;
  }

  // Get content stats
  async getContentStats(slug: string): Promise<{ totalSessions: number; totalSponsors: number }> {
    const data = readConferenceData(slug);
    if (!data) return { totalSessions: 0, totalSponsors: 0 };

    return {
      totalSessions: data.sessions.length,
      totalSponsors: data.sponsors.length,
    };
  }

  // Clone a conference
  async cloneConference(fromSlug: string, newConferenceName: string): Promise<Conference> {
    const sourceData = readConferenceData(fromSlug);
    if (!sourceData) throw new Error("Source conference not found");

    const newConferenceSlug = slugify(newConferenceName);
    if (existsSync(getConferenceFilePath(newConferenceSlug))) {
      throw new Error(`Conference with slug '${newConferenceSlug}' already exists.`);
    }

    const newConference: Conference = {
      ...sourceData.conference,
      id: newConferenceSlug,
      slug: newConferenceSlug,
      name: newConferenceName,
      isActive: true, // New cloned conference becomes active
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newData: ConferenceData = {
      conference: newConference,
      sessions: sourceData.sessions.map((s: Session) => ({
        ...s,
        id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conferenceId: newConferenceSlug,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      speakers: sourceData.speakers.map((s: Speaker) => ({
        ...s,
        id: `speaker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conferenceId: newConferenceSlug,
        photoUrl: cloneFile(s.photoUrl) || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      sponsors: sourceData.sponsors.map((s: Sponsor) => ({
        ...s,
        id: `sponsor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conferenceId: newConferenceSlug,
        logoUrl: cloneFile(s.logoUrl) || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      announcements: sourceData.announcements.map((a: Announcement) => ({
        ...a,
        id: `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conferenceId: newConferenceSlug,
        featuredImageUrl: cloneFile(a.featuredImageUrl) || '',
        pdfUrl: cloneFile(a.pdfUrl) || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      sightseeing: sourceData.sightseeing.map((s: Sightseeing) => ({
        ...s,
        id: `sightseeing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conferenceId: newConferenceSlug,
        featuredImageUrl: cloneFile(s.featuredImageUrl) || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      whitelists: sourceData.whitelists.map((w: Whitelist) => ({
        ...w,
        id: `wl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conferenceId: newConferenceSlug,
        createdAt: new Date().toISOString(),
      })),
    };

    writeConferenceData(newConferenceSlug, newData);
    await this.setActiveConference(newConferenceSlug); // Set the new conference as active

    return newConference;
  }
}

export const jsonStorage = new JSONStorage();
