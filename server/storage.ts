import {
  users,
  registrations,
  checkIns,
  auditLogs,
  type User,
  type UpsertUser,
  type Registration,
  type InsertRegistration,
  type CheckIn,
  type InsertCheckIn,
  type Conference,
  type InsertConference,
  type Session,
  type InsertSession,
  type Speaker,
  type InsertSpeaker,
  type Sponsor,
  type InsertSponsor,
  type Announcement,
  type InsertAnnouncement,
  type Whitelist,
  type InsertWhitelist,
  type DashboardStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { jsonStorage } from "./jsonStorage"; // Import jsonStorage
import { existsSync, unlinkSync } from "fs";
import { join } from "path";

// Helper function to delete image files
function deleteImageFile(imagePath: string) {
  if (imagePath && imagePath.startsWith('/uploads/')) {
    const filePath = join(process.cwd(), "public", imagePath);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
      console.log(`Deleted image file: ${filePath}`);
    }
  }
}

// Storage interface for database operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Conference operations (delegated to jsonStorage)
  getConferences(): Promise<Conference[]>;
  getActiveConference(): Promise<Conference | undefined>;
  getConferenceById(id: string): Promise<Conference | undefined>;
  createConference(conference: InsertConference): Promise<Conference>;
  updateConference(id: string, conference: Partial<InsertConference>): Promise<Conference | undefined>;
  cloneConference(conferenceId: string, newYear: number): Promise<Conference>;
  
  // Session operations (delegated to jsonStorage)
  getSessions(conferenceId: string): Promise<Session[]>;
  getSessionById(conferenceId: string, id: string): Promise<Session | undefined>;
  createSession(conferenceId: string, session: InsertSession): Promise<Session>;
  updateSession(conferenceId: string, id: string, session: Partial<InsertSession>): Promise<Session | undefined>;
  deleteSession(conferenceId: string, id: string): Promise<void>;
  
  // Speaker operations (delegated to jsonStorage)
  getSpeakers(conferenceId: string): Promise<Speaker[]>;
  getSpeakerById(conferenceId: string, id: string): Promise<Speaker | undefined>;
  createSpeaker(conferenceId: string, speaker: InsertSpeaker): Promise<Speaker>;
  updateSpeaker(conferenceId: string, id: string, speaker: Partial<InsertSpeaker>): Promise<Speaker | undefined>;
  deleteSpeaker(conferenceId: string, id: string): Promise<void>;
  
  // Sponsor operations (delegated to jsonStorage)
  getSponsors(conferenceId: string): Promise<Sponsor[]>;
  getSponsorById(conferenceId: string, id: string): Promise<Sponsor | undefined>;
  createSponsor(conferenceId: string, sponsor: InsertSponsor): Promise<Sponsor>;
  updateSponsor(conferenceId: string, id: string, sponsor: Partial<InsertSponsor>): Promise<Sponsor | undefined>;
  deleteSponsor(conferenceId: string, id: string): Promise<void>;
  
  // Announcement operations (delegated to jsonStorage)
  getAnnouncements(conferenceId: string): Promise<Announcement[]>;
  getAnnouncementById(conferenceId: string, id: string): Promise<Announcement | undefined>;
  createAnnouncement(conferenceId: string, announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(conferenceId: string, id: string, announcement: Partial<InsertAnnouncement>): Promise<Announcement | undefined>;
  deleteAnnouncement(conferenceId: string, id: string): Promise<void>;
  
  // Registration operations
  getRegistrations(conferenceId: string): Promise<Registration[]>;
  getRegistrationById(id: string): Promise<Registration | undefined>;
  getRegistrationByEmail(conferenceId: string, email: string): Promise<Registration | undefined>;
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  updateRegistration(id: string, registration: Partial<InsertRegistration>): Promise<Registration | undefined>;
  
  // Whitelist operations (delegated to jsonStorage)
  getWhitelists(conferenceId: string): Promise<Whitelist[]>;
  checkWhitelist(conferenceId: string, email: string): Promise<boolean>;
  addToWhitelist(conferenceId: string, email: string): Promise<Whitelist>;
  removeFromWhitelist(conferenceId: string, id: string): Promise<void>;
  
  // Check-in operations
  getCheckIns(conferenceId: string): Promise<CheckIn[]>;
  getCheckInsByRegistration(registrationId: string): Promise<CheckIn[]>;
  createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn>;
  getRecentCheckIns(conferenceId: string, limit: number): Promise<any[]>;
  
  // Analytics
  getStats(conferenceId: string): Promise<{
    totalRegistrations: number;
    totalCheckIns: number;
    totalSessions: number;
    totalSponsors: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Fetch the existing user to check for old profile image URL
    let oldUser: User | undefined;
    if (userData.id) { // If updating an existing user
      oldUser = await this.getUser(userData.id);
    }

    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();

    // If profileImageUrl was updated and is different from the old one, delete the old image
    if (oldUser?.profileImageUrl && userData.profileImageUrl && userData.profileImageUrl !== oldUser.profileImageUrl) {
      deleteImageFile(oldUser.profileImageUrl);
    } else if (oldUser?.profileImageUrl && !userData.profileImageUrl) {
      // If profileImageUrl was removed (set to null/empty)
      deleteImageFile(oldUser.profileImageUrl);
    }

    return user;
  }
  
  // Conference operations (delegated to jsonStorage)
  async getConferences(): Promise<Conference[]> {
    return jsonStorage.getAllConferences();
  }

  async getActiveConference(): Promise<Conference | undefined> {
    return jsonStorage.getActiveConference();
  }

  async getConferenceById(id: string): Promise<Conference | undefined> {
    return jsonStorage.getConference(parseInt(id));
  }

  async createConference(conferenceData: InsertConference): Promise<Conference> {
    return jsonStorage.createConference(conferenceData);
  }

  async updateConference(id: string, conferenceData: Partial<InsertConference>): Promise<Conference | undefined> {
    return jsonStorage.updateConference(parseInt(id), conferenceData);
  }

  async cloneConference(conferenceId: string, newYear: number): Promise<Conference> {
    return jsonStorage.cloneConference(parseInt(conferenceId), newYear);
  }
  
  // Session operations (delegated to jsonStorage)
  async getSessions(conferenceId: string): Promise<Session[]> {
    return jsonStorage.getSessions(parseInt(conferenceId));
  }

  async getSessionById(conferenceId: string, id: string): Promise<Session | undefined> {
    return jsonStorage.getSession(parseInt(conferenceId), id);
  }

  async createSession(conferenceId: string, sessionData: InsertSession): Promise<Session> {
    return jsonStorage.createSession(parseInt(conferenceId), sessionData);
  }

  async updateSession(conferenceId: string, id: string, sessionData: Partial<InsertSession>): Promise<Session | undefined> {
    return jsonStorage.updateSession(parseInt(conferenceId), id, sessionData);
  }

  async deleteSession(conferenceId: string, id: string): Promise<void> {
    return jsonStorage.deleteSession(parseInt(conferenceId), id);
  }
  
  // Speaker operations (delegated to jsonStorage)
  async getSpeakers(conferenceId: string): Promise<Speaker[]> {
    return jsonStorage.getSpeakers(parseInt(conferenceId));
  }

  async getSpeakerById(conferenceId: string, id: string): Promise<Speaker | undefined> {
    return jsonStorage.getSpeaker(parseInt(conferenceId), id);
  }

  async createSpeaker(conferenceId: string, speakerData: InsertSpeaker): Promise<Speaker> {
    return jsonStorage.createSpeaker(parseInt(conferenceId), speakerData);
  }

  async updateSpeaker(conferenceId: string, id: string, speakerData: Partial<InsertSpeaker>): Promise<Speaker | undefined> {
    return jsonStorage.updateSpeaker(parseInt(conferenceId), id, speakerData);
  }

  async deleteSpeaker(conferenceId: string, id: string): Promise<void> {
    return jsonStorage.deleteSpeaker(parseInt(conferenceId), id);
  }
  
  // Sponsor operations (delegated to jsonStorage)
  async getSponsors(conferenceId: string): Promise<Sponsor[]> {
    return jsonStorage.getSponsors(parseInt(conferenceId));
  }

  async getSponsorById(conferenceId: string, id: string): Promise<Sponsor | undefined> {
    return jsonStorage.getSponsor(parseInt(conferenceId), id);
  }

  async createSponsor(conferenceId: string, sponsorData: InsertSponsor): Promise<Sponsor> {
    return jsonStorage.createSponsor(parseInt(conferenceId), sponsorData);
  }

  async updateSponsor(conferenceId: string, id: string, sponsorData: Partial<InsertSponsor>): Promise<Sponsor | undefined> {
    return jsonStorage.updateSponsor(parseInt(conferenceId), id, sponsorData);
  }

  async deleteSponsor(conferenceId: string, id: string): Promise<void> {
    return jsonStorage.deleteSponsor(parseInt(conferenceId), id);
  }
  
  // Announcement operations (delegated to jsonStorage)
  async getAnnouncements(conferenceId: string): Promise<Announcement[]> {
    return jsonStorage.getAnnouncements(parseInt(conferenceId));
  }

  async getAnnouncementById(conferenceId: string, id: string): Promise<Announcement | undefined> {
    return jsonStorage.getAnnouncement(parseInt(conferenceId), id);
  }

  async createAnnouncement(conferenceId: string, announcementData: InsertAnnouncement): Promise<Announcement> {
    return jsonStorage.createAnnouncement(parseInt(conferenceId), announcementData);
  }

  async updateAnnouncement(conferenceId: string, id: string, announcementData: Partial<InsertAnnouncement>): Promise<Announcement | undefined> {
    return jsonStorage.updateAnnouncement(parseInt(conferenceId), id, announcementData);
  }

  async deleteAnnouncement(conferenceId: string, id: string): Promise<void> {
    return jsonStorage.deleteAnnouncement(parseInt(conferenceId), id);
  }
  
  // Registration operations
  async getRegistrations(conferenceId: string): Promise<Registration[]> {
    return await db.select().from(registrations)
      .where(eq(registrations.conferenceId, parseInt(conferenceId)))
      .orderBy(desc(registrations.registeredAt));
  }

  async getRegistrationById(id: string): Promise<Registration | undefined> {
    const [registration] = await db.select().from(registrations).where(eq(registrations.id, id));
    return registration;
  }

  async getRegistrationByEmail(conferenceId: string, email: string): Promise<Registration | undefined> {
    const [registration] = await db.select().from(registrations)
      .where(and(
        eq(registrations.conferenceId, parseInt(conferenceId)),
        eq(registrations.email, email)
      ));
    return registration;
  }

  async createRegistration(registrationData: InsertRegistration): Promise<Registration> {
    const [registration] = await db.insert(registrations).values(registrationData).returning();
    return registration;
  }

  async updateRegistration(id: string, registrationData: Partial<InsertRegistration>): Promise<Registration | undefined> {
    const [registration] = await db
      .update(registrations)
      .set({ ...registrationData, updatedAt: new Date() })
      .where(eq(registrations.id, id))
      .returning();
    return registration;
  }
  
  // Whitelist operations (delegated to jsonStorage)
  async getWhitelists(conferenceId: string): Promise<Whitelist[]> {
    return jsonStorage.getWhitelists(parseInt(conferenceId));
  }

  async checkWhitelist(conferenceId: string, email: string): Promise<boolean> {
    return jsonStorage.checkWhitelist(parseInt(conferenceId), email);
  }

  async addToWhitelist(conferenceId: string, email: string): Promise<Whitelist> {
    return jsonStorage.addToWhitelist(parseInt(conferenceId), email);
  }

  async removeFromWhitelist(conferenceId: string, id: string): Promise<void> {
    return jsonStorage.removeFromWhitelist(parseInt(conferenceId), id);
  }
  
  // Check-in operations
  async getCheckIns(conferenceId: string): Promise<CheckIn[]> {
    return await db.select().from(checkIns)
      .innerJoin(registrations, eq(checkIns.registrationId, registrations.id))
      .where(eq(registrations.conferenceId, parseInt(conferenceId)))
      .orderBy(desc(checkIns.checkedInAt));
  }

  async getCheckInsByRegistration(registrationId: string): Promise<CheckIn[]> {
    return await db.select().from(checkIns)
      .where(eq(checkIns.registrationId, registrationId))
      .orderBy(desc(checkIns.checkedInAt));
  }

  async createCheckIn(checkInData: InsertCheckIn): Promise<CheckIn> {
    const [checkIn] = await db.insert(checkIns).values(checkInData).returning();
    return checkIn;
  }

  async getRecentCheckIns(conferenceId: string, limit: number = 10): Promise<any[]> {
    // Implement with joins in Task 3
    return [];
  }
  
  // Analytics
  async getStats(conferenceId: string): Promise<DashboardStats> {
    const [regCount] = await db.select({ count: sql<number>`count(*)` })
      .from(registrations)
      .where(eq(registrations.conferenceId, parseInt(conferenceId)));
    
    const [checkInCount] = await db.select({ count: sql<number>`count(*)` })
      .from(checkIns)
      .innerJoin(registrations, eq(checkIns.registrationId, registrations.id))
      .where(eq(registrations.conferenceId, parseInt(conferenceId)));

    const contentStats = await jsonStorage.getContentStats(parseInt(conferenceId));

    return {
      totalRegistrations: Number(regCount.count) || 0,
      totalCheckIns: Number(checkInCount.count) || 0,
      totalSessions: contentStats.totalSessions,
      totalSponsors: contentStats.totalSponsors,
    };
  }
}

export const storage = new DatabaseStorage();
