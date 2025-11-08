import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, copyFileSync } from "fs";
import { join, extname } from "path";
import type {
  Conference,
  Session,
  Speaker,
  Sponsor,
  Announcement,
  Whitelist,
  Sightseeing,
} from "@shared/schema";

const DATA_DIR = join(process.cwd(), "server", "data");

// Conference content data stored in JSON files
// Registrations and check-ins are stored in PostgreSQL database
interface ConferenceData {
  conference: Conference;
  sessions: Session[];
  speakers: Speaker[];
  sponsors: Sponsor[];
  announcements: Announcement[];
  sightseeing: Sightseeing[];
  whitelists: Whitelist[];
}

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

function getFilePath(year: number): string {
  return join(DATA_DIR, `${year}.json`);
}

function readData(year: number): ConferenceData | null {
  const filePath = getFilePath(year);
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    const content = readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);
    // Convert date strings back to Date objects for consistency with the interface
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

function writeData(year: number, data: ConferenceData): void {
  const filePath = getFilePath(year);
  try {
    writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  }
  catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    throw error;
  }
}

// Helper function to delete files
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
    // Return original path as a fallback to avoid breaking the cloning process
    return filePathRelative;
  }
}

function getActiveYear(): number | null {
  try {
    if (!existsSync(DATA_DIR)) return null;
    const files = readdirSync(DATA_DIR);
    for (const file of files) {
      if (file.endsWith(".json")) {
        const year = parseInt(file.replace(".json", ""));
        const data = readData(year);
        if (data?.conference.isActive) {
          return year;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting active year:", error);
    return null;
  }
}

export class JSONStorage {
  // Conference operations
  async getActiveConference(): Promise<Conference | undefined> {
    const year = getActiveYear();
    if (!year) return undefined;
    const data = readData(year);
    return data?.conference;
  }

  async getConferenceByYear(year: number): Promise<Conference | undefined> {
    const data = readData(year);
    return data?.conference;
  }

  async getAllConferences(): Promise<Conference[]> {
    try {
      if (!existsSync(DATA_DIR)) return [];
      const files = readdirSync(DATA_DIR);
      const conferences: Conference[] = [];
      for (const file of files) {
        if (file.endsWith(".json")) {
          const year = parseInt(file.replace(".json", ""));
          const data = readData(year);
          if (data?.conference) {
            conferences.push(data.conference);
          }
        }
      }
      return conferences.sort((a, b) => b.year - a.year);
    } catch (error) {
      console.error("Error getting all conferences:", error);
      return [];
    }
  }

  async createConference(conf: Partial<Conference>): Promise<Conference> {
    const year = conf.year || new Date().getFullYear();
    
    // Set all others to inactive
    const allConfs = await this.getAllConferences();
    for (const c of allConfs) {
      if (c.isActive) {
        const data = readData(c.year);
        if (data) {
          data.conference.isActive = false;
          writeData(c.year, data);
        }
      }
    }

    const conference: Conference = {
      id: `conf-${year}`,
      year,
      name: conf.name || `Hội nghị ${year}`,
      theme: conf.theme || "",
      logoUrl: conf.logoUrl || "",
      bannerUrls: conf.bannerUrls || [], // Handle new field
      introContent: conf.introContent || "",
      registrationNote1: conf.registrationNote1 || "", // New field
      registrationNote2: conf.registrationNote2 || "", // New field
      startDate: conf.startDate || new Date(), // Handle Date object
      endDate: conf.endDate || new Date(),     // Handle Date object
      location: conf.location || "",
      contactEmail: conf.contactEmail || "",
      contactPhone: conf.contactPhone || "",
      isActive: true,
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

    writeData(year, newData);
    return conference;
  }

  async updateConference(year: number, updates: Partial<Conference>): Promise<Conference | undefined> {
    const data = readData(year);
    if (!data) return undefined;

    const oldConference = data.conference;

    // Delete old logo if updated
    if (updates.logoUrl && updates.logoUrl !== oldConference.logoUrl) {
      deleteFile(oldConference.logoUrl);
    }

    // Delete old banners if updated
    if (updates.bannerUrls) {
      const oldBannerUrls = new Set(oldConference.bannerUrls);
      const newBannerUrls = new Set(updates.bannerUrls);
      oldBannerUrls.forEach(url => {
        if (!newBannerUrls.has(url)) {
          deleteFile(url);
        }
      });
    }

    data.conference = {
      ...oldConference,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    writeData(year, data);
    return data.conference;
  }

  async deleteConference(year: number): Promise<void> {
    const data = readData(year);
    if (!data) {
      // If data doesn't exist, there's nothing to delete.
      return;
    }

    // Delete all associated files
    deleteFile(data.conference.logoUrl);
    data.conference.bannerUrls?.forEach(deleteFile);
    data.speakers?.forEach(speaker => deleteFile(speaker.photoUrl));
    data.sponsors?.forEach(sponsor => deleteFile(sponsor.logoUrl));
    data.announcements?.forEach(announcement => {
      deleteFile(announcement.featuredImageUrl);
      deleteFile(announcement.pdfUrl);
    });
    data.sightseeing?.forEach(sightseeing => deleteFile(sightseeing.featuredImageUrl));

    // Delete the JSON file itself
    const filePath = getFilePath(year);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
      console.log(`Deleted data file: ${filePath}`);
    }
  }

  async setActiveConference(yearToActivate: number): Promise<void> {
    const allConfs = await this.getAllConferences();
    for (const c of allConfs) {
      const data = readData(c.year);
      if (data) {
        const shouldBeActive = data.conference.year === yearToActivate;
        if (data.conference.isActive !== shouldBeActive) {
          data.conference.isActive = shouldBeActive;
          writeData(c.year, data);
        }
      }
    }
  }

  // Sessions operations
  async getSessions(year: number): Promise<Session[]> {
    const data = readData(year);
    return data?.sessions || [];
  }

  async getSession(year: number, id: string): Promise<Session | undefined> {
    const data = readData(year);
    return data?.sessions.find(session => session.id === id);
  }

  async createSession(year: number, session: Omit<Session, "id" | "createdAt" | "updatedAt">): Promise<Session> {
    const data = readData(year);
    if (!data) throw new Error("Conference not found");

    const newSession: Session = {
      ...session,
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conferenceId: data.conference.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.sessions.push(newSession);
    writeData(year, data);
    return newSession;
  }

  async updateSession(year: number, id: string, updates: Partial<Session>): Promise<Session | undefined> {
    const data = readData(year);
    if (!data) return undefined;

    const index = data.sessions.findIndex(s => s.id === id);
    if (index === -1) return undefined;

    data.sessions[index] = {
      ...data.sessions[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    writeData(year, data);
    return data.sessions[index];
  }

  async deleteSession(year: number, id: string): Promise<void> {
    const data = readData(year);
    if (!data) return;

    data.sessions = data.sessions.filter(s => s.id !== id);
    writeData(year, data);
  }

  // Similar methods for speakers, sponsors, announcements, registrations, whitelists, checkIns
  async getSpeakers(year: number): Promise<Speaker[]> {
    const data = readData(year);
    return data?.speakers || [];
  }

  async createSpeaker(year: number, speaker: Omit<Speaker, "id" | "createdAt" | "updatedAt">): Promise<Speaker> {
    const data = readData(year);
    if (!data) throw new Error("Conference not found");

    const newSpeaker: Speaker = {
      ...speaker,
      id: `speaker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conferenceId: data.conference.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.speakers.push(newSpeaker);
    writeData(year, data);
    return newSpeaker;
  }

  async updateSpeaker(year: number, id: string, updates: Partial<Speaker>): Promise<Speaker | undefined> {
    const data = readData(year);
    if (!data) return undefined;

    const index = data.speakers.findIndex(s => s.id === id);
    if (index === -1) return undefined;

    const oldSpeaker = data.speakers[index];

    // If a new photoUrl is provided and it's different from the old one, delete the old photo
    if (updates.photoUrl && updates.photoUrl !== oldSpeaker.photoUrl) {
      deleteFile(oldSpeaker.photoUrl);
    }

    data.speakers[index] = {
      ...oldSpeaker,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    writeData(year, data);
    return data.speakers[index];
  }

  async deleteSpeaker(year: number, id: string): Promise<void> {
    const data = readData(year);
    if (!data) return;

    const speakerToDelete = data.speakers.find(s => s.id === id);
    if (speakerToDelete) {
      deleteFile(speakerToDelete.photoUrl);
    }

    data.speakers = data.speakers.filter(s => s.id !== id);
    writeData(year, data);
  }

  async getSponsors(year: number): Promise<Sponsor[]> {
    const data = readData(year);
    return data?.sponsors || [];
  }

  async createSponsor(year: number, sponsor: Omit<Sponsor, "id" | "createdAt" | "updatedAt">): Promise<Sponsor> {
    const data = readData(year);
    if (!data) throw new Error("Conference not found");

    const newSponsor: Sponsor = {
      ...sponsor,
      id: `sponsor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conferenceId: data.conference.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.sponsors.push(newSponsor);
    writeData(year, data);
    return newSponsor;
  }

  async updateSponsor(year: number, id: string, updates: Partial<Sponsor>): Promise<Sponsor | undefined> {
    const data = readData(year);
    if (!data) return undefined;

    const index = data.sponsors.findIndex(s => s.id === id);
    if (index === -1) return undefined;

    const oldSponsor = data.sponsors[index];

    // If a new logoUrl is provided and it's different from the old one, delete the old logo
    if (updates.logoUrl && updates.logoUrl !== oldSponsor.logoUrl) {
      deleteFile(oldSponsor.logoUrl);
    }

    data.sponsors[index] = {
      ...oldSponsor,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    writeData(year, data);
    return data.sponsors[index];
  }

  async deleteSponsor(year: number, id: string): Promise<void> {
    const data = readData(year);
    if (!data) return;

    const sponsorToDelete = data.sponsors.find(s => s.id === id);
    if (sponsorToDelete) {
      deleteFile(sponsorToDelete.logoUrl);
    }

    data.sponsors = data.sponsors.filter(s => s.id !== id);
    writeData(year, data);
  }

  async getAnnouncements(year: number): Promise<Announcement[]> {
    const data = readData(year);
    return data?.announcements || [];
  }

  async getAnnouncement(year: number, id: string): Promise<Announcement | undefined> {
    const data = readData(year);
    return data?.announcements.find(announcement => announcement.id === id);
  }

  async createAnnouncement(year: number, announcement: Omit<Announcement, "id" | "createdAt" | "updatedAt">): Promise<Announcement> {
    const data = readData(year);
    if (!data) throw new Error("Conference not found");

    const newAnnouncement: Announcement = {
      ...announcement,
      id: `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conferenceId: data.conference.id,
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.announcements.push(newAnnouncement);
    writeData(year, data);
    return newAnnouncement;
  }

  async updateAnnouncement(year: number, id: string, updates: Partial<Announcement>): Promise<Announcement | undefined> {
    const data = readData(year);
    if (!data) return undefined;

    const index = data.announcements.findIndex(a => a.id === id);
    if (index === -1) return undefined;

    const oldAnnouncement = data.announcements[index];

    // If a new featuredImageUrl is provided and it's different from the old one, delete the old image
    if (updates.featuredImageUrl && updates.featuredImageUrl !== oldAnnouncement.featuredImageUrl) {
      deleteFile(oldAnnouncement.featuredImageUrl);
    }
    // If a new pdfUrl is provided and it's different from the old one, delete the old PDF
    if (updates.pdfUrl && updates.pdfUrl !== oldAnnouncement.pdfUrl) {
      deleteFile(oldAnnouncement.pdfUrl);
    }

    data.announcements[index] = {
      ...oldAnnouncement,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    writeData(year, data);
    return data.announcements[index];
  }

  async deleteAnnouncement(year: number, id: string): Promise<void> {
    const data = readData(year);
    if (!data) return;

    const announcementToDelete = data.announcements.find(a => a.id === id);
    if (announcementToDelete) {
      deleteFile(announcementToDelete.featuredImageUrl);
      deleteFile(announcementToDelete.pdfUrl); // Delete associated PDF file
    }

    data.announcements = data.announcements.filter(a => a.id !== id);
    writeData(year, data);
  }

  async incrementAnnouncementViews(year: number, id: string): Promise<Announcement | undefined> {
    const data = readData(year);
    if (!data) return undefined;

    const index = data.announcements.findIndex(a => a.id === id);
    if (index === -1) return undefined;

    data.announcements[index].views = (data.announcements[index].views || 0) + 1;

    writeData(year, data);
    return data.announcements[index];
  }

  async getSightseeing(year: number): Promise<Sightseeing[]> {
    const data = readData(year);
    return data?.sightseeing || [];
  }

  async getSightseeingById(year: number, id: string): Promise<Sightseeing | undefined> {
    const data = readData(year);
    return data?.sightseeing.find(s => s.id === id);
  }

  async createSightseeing(year: number, sightseeing: Omit<Sightseeing, "id" | "createdAt" | "updatedAt">): Promise<Sightseeing> {
    const data = readData(year);
    if (!data) throw new Error("Conference not found");

    if (!data.sightseeing) {
      data.sightseeing = [];
    }

    const newSightseeing: Sightseeing = {
      ...sightseeing,
      id: `sightseeing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conferenceId: data.conference.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.sightseeing.push(newSightseeing);
    writeData(year, data);
    return newSightseeing;
  }

  async updateSightseeing(year: number, id: string, updates: Partial<Sightseeing>): Promise<Sightseeing | undefined> {
    const data = readData(year);
    if (!data) return undefined;

    const index = data.sightseeing.findIndex(s => s.id === id);
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

    writeData(year, data);
    return data.sightseeing[index];
  }

  async deleteSightseeing(year: number, id: string): Promise<void> {
    const data = readData(year);
    if (!data) return;

    const sightseeingToDelete = data.sightseeing.find(s => s.id === id);
    if (sightseeingToDelete) {
      deleteFile(sightseeingToDelete.featuredImageUrl);
    }

    data.sightseeing = data.sightseeing.filter(s => s.id !== id);
    writeData(year, data);
  }

  // REGISTRATIONS AND CHECK-INS are now stored in PostgreSQL database
  // See registrationDb.ts for database-based registration operations

  // Whitelist operations (can stay in JSON as they're pre-conference content)
  async getWhitelists(year: number): Promise<Whitelist[]> {
    const data = readData(year);
    return data?.whitelists || [];
  }

  async addToWhitelist(year: number, email: string): Promise<Whitelist> {
    const data = readData(year);
    if (!data) throw new Error("Conference not found");

    const newWhitelist: Whitelist = {
      id: `wl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conferenceId: data.conference.id,
      email,
      name: "",
      createdAt: new Date().toISOString(),
    };

    data.whitelists.push(newWhitelist);
    writeData(year, data);
    return newWhitelist;
  }

  async removeFromWhitelist(year: number, id: string): Promise<void> {
    const data = readData(year);
    if (!data) return;

    data.whitelists = data.whitelists.filter(w => w.id !== id);
    writeData(year, data);
  }

  async checkWhitelist(year: number, email: string): Promise<boolean> {
    const data = readData(year);
    return data?.whitelists.some(w => w.email === email) || false;
  }

  // Stats for JSON content only (sessions, sponsors)
  // For registration and check-in stats, query PostgreSQL database
  async getContentStats(year: number): Promise<{ totalSessions: number; totalSponsors: number }> {
    const data = readData(year);
    if (!data) return { totalSessions: 0, totalSponsors: 0 };

    return {
      totalSessions: data.sessions.length,
      totalSponsors: data.sponsors.length,
    };
  }

  async cloneConference(fromYear: number, toYear: number): Promise<Conference> {
    const sourceData = readData(fromYear);
    if (!sourceData) throw new Error("Source conference not found");

    // Create new conference with cloned structure but empty data
    const newConference = await this.createConference({
      year: toYear,
      name: sourceData.conference.name.replace(fromYear.toString(), toYear.toString()),
      theme: sourceData.conference.theme,
      logoUrl: cloneFile(sourceData.conference.logoUrl),
      bannerUrls: sourceData.conference.bannerUrls?.map(cloneFile) as string[],
      introContent: sourceData.conference.introContent,
      registrationNote1: sourceData.conference.registrationNote1,
      registrationNote2: sourceData.conference.registrationNote2,
      startDate: sourceData.conference.startDate,
      endDate: sourceData.conference.endDate,
      location: sourceData.conference.location,
      contactEmail: sourceData.conference.contactEmail,
      contactPhone: sourceData.conference.contactPhone,
      isActive: false, // New cloned conference is not active by default
    });

    // Clone sessions, speakers, sponsors, etc., with deep copy for files
    const newData = readData(toYear);
    if (newData) {
      newData.sessions = sourceData.sessions.map(s => ({
        ...s,
        id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conferenceId: newConference.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      newData.speakers = sourceData.speakers.map(s => ({
        ...s,
        id: `speaker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conferenceId: newConference.id,
        photoUrl: cloneFile(s.photoUrl),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      newData.sponsors = sourceData.sponsors.map(s => ({
        ...s,
        id: `sponsor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conferenceId: newConference.id,
        logoUrl: cloneFile(s.logoUrl),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      newData.announcements = sourceData.announcements.map(a => ({
        ...a,
        id: `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conferenceId: newConference.id,
        featuredImageUrl: cloneFile(a.featuredImageUrl),
        pdfUrl: cloneFile(a.pdfUrl),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      newData.sightseeing = sourceData.sightseeing.map(s => ({
        ...s,
        id: `sightseeing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conferenceId: newConference.id,
        featuredImageUrl: cloneFile(s.featuredImageUrl),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      newData.whitelists = sourceData.whitelists.map(w => ({
        ...w,
        id: `wl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conferenceId: newConference.id,
        createdAt: new Date().toISOString(),
      }));

      writeData(toYear, newData);
    }

    return newConference;
  }
}

export const jsonStorage = new JSONStorage();