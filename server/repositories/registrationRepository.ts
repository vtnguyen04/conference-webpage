import {
  eq,
  and,
  or,
  like,
  isNull,
  gt,
  lt,
  sql,
  count,
} from "drizzle-orm";
import { db } from "../db";
import {
  registrations,
  checkIns,
  Registration,
  InsertRegistration,
  CheckIn,
  InsertCheckIn,
} from "@shared/schema";
import { randomUUID } from "node:crypto";
import QRCode from "qrcode";
export class RegistrationRepository {
  async getByConferenceSlug(slug: string, page: number, limit: number): Promise<{ data: Registration[]; total: number }> {
    const offset = (page - 1) * limit;
    const data = await db.select().from(registrations).where(eq(registrations.conferenceSlug, slug)).limit(limit).offset(offset).all();
    const [totalResult] = await db.select({ value: count() }).from(registrations).where(eq(registrations.conferenceSlug, slug)).all();
    return { data: data, total: totalResult.value };
  }
  async getBySession(sessionId: string): Promise<Registration[]> {
    return await db.select().from(registrations).where(eq(registrations.sessionId, sessionId)).all();
  }
  async getByEmail(email: string, slug: string): Promise<Registration[]> {
    return await db.select().from(registrations).where(and(eq(registrations.email, email), eq(registrations.conferenceSlug, slug))).all();
  }
  async getById(id: string): Promise<Registration | undefined> {
    return await db.select().from(registrations).where(eq(registrations.id, id)).get();
  }
  async isRegisteredForSession(email: string, sessionId: string): Promise<boolean> {
    const existing = await db.select().from(registrations).where(and(eq(registrations.email, email), eq(registrations.sessionId, sessionId))).limit(1).all();
    return existing.length > 0;
  }
  async getSessionRegistrationCount(sessionId: string): Promise<number> {
    const [result] = await db.select({ value: count() })
      .from(registrations)
      .where(
        and(
          eq(registrations.sessionId, sessionId),
          or(eq(registrations.status, "confirmed"), eq(registrations.status, "checked-in"))
        )
      )
      .all();
    return result.value;
  }
  async createAdmin(data: InsertRegistration): Promise<Registration> {
    const id = randomUUID();
    const qrData = `CONF|${data.conferenceSlug}|${data.sessionId}|${data.email}|${Date.now()}`;
    const qrCodeImage = await QRCode.toDataURL(qrData);
    const newRegistration = { ...data, id, qrCode: qrCodeImage, status: "confirmed", createdAt: new Date(), registeredAt: new Date(), cmeCertificateRequested: data.cmeCertificateRequested || false, conferenceCertificateSent: false, emailSent: false, confirmationToken: null, confirmationTokenExpires: null, reminderCount: 0, lastReminderSentAt: null };
    await db.insert(registrations).values(newRegistration).run();
    return { ...newRegistration, createdAt: new Date(newRegistration.createdAt), registeredAt: new Date(newRegistration.registeredAt) } as Registration;
  }
  async createBatchInDb(newRegistrationsData: (InsertRegistration & { qrCode: string })[]): Promise<Registration[]> {
    return db.transaction((tx) => {
        const allRegistrations: Registration[] = [];
        for (const regData of newRegistrationsData) {
            const existingRegistration = tx.select().from(registrations).where(and(eq(registrations.email, regData.email), eq(registrations.conferenceSlug, regData.conferenceSlug), eq(registrations.sessionId, regData.sessionId))).limit(1).get();
            if (existingRegistration) throw new Error(`Already registered for session: ${regData.sessionId}`);
            tx.insert(registrations).values(regData).run();
            allRegistrations.push(regData as Registration);
        }
        return allRegistrations;
    });
  }
  async delete(id: string): Promise<boolean> {
    const result = await db.delete(registrations).where(eq(registrations.id, id)).run();
    return result.changes > 0;
  }
  async deleteByConferenceSlug(slug: string): Promise<void> {
    await db.delete(registrations).where(eq(registrations.conferenceSlug, slug)).run();
  }
  async search(slug: string, query: string, page: number, limit: number): Promise<{ data: Registration[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause: any = eq(registrations.conferenceSlug, slug);
    if (query) {
        const lowerCaseQuery = query.toLowerCase();
        whereClause = and(whereClause, or(like(registrations.fullName, `%${lowerCaseQuery}%`), like(registrations.email, `%${lowerCaseQuery}%`)));
    }
    const data = await db.select().from(registrations).where(whereClause).limit(limit).offset(offset).all();
    const [totalResult] = await db.select({ value: count() }).from(registrations).where(whereClause).all();
    return { data: data, total: totalResult.value };
  }
  async getDueForReminder(conferenceSlug: string, intervalHours: number, maxReminders: number): Promise<Registration[]> {
    const now = new Date();
    const reminderCutoff = new Date(Date.now() - intervalHours * 60 * 60 * 1000);
    return await db.select().from(registrations).where(and(eq(registrations.conferenceSlug, conferenceSlug), eq(registrations.status, "pending"), gt(registrations.confirmationTokenExpires, now), lt(registrations.reminderCount, maxReminders), or(isNull(registrations.lastReminderSentAt), lt(registrations.lastReminderSentAt, reminderCutoff)))).all();
  }
  async updateReminderStatus(id: string): Promise<void> {
    const reg = await db.select().from(registrations).where(eq(registrations.id, id)).get();
    if (reg) await db.update(registrations).set({ reminderCount: reg.reminderCount + 1, lastReminderSentAt: new Date() }).where(eq(registrations.id, id)).run();
  }
  async deleteUnconfirmed(id: string): Promise<void> {
    await db.delete(registrations).where(eq(registrations.id, id)).run();
  }
  async createCheckIn(data: InsertCheckIn): Promise<CheckIn> {
    const id = randomUUID();
    const newCheckIn = { ...data, id, checkedInAt: new Date(), createdAt: new Date() };
    db.transaction((tx) => {
      tx.insert(checkIns).values(newCheckIn).run();
      tx.update(registrations).set({ status: "checked-in" }).where(eq(registrations.id, data.registrationId)).run();
    });
    return { ...newCheckIn, checkedInAt: new Date(newCheckIn.checkedInAt), createdAt: new Date(newCheckIn.createdAt) } as CheckIn;
  }
  async getCheckInsBySession(sessionId: string, page: number = 1, limit: number = 10): Promise<{ data: any[], total: number }> {
    const offset = (page - 1) * limit;
    const results = await db.select().from(checkIns)
      .leftJoin(registrations, eq(checkIns.registrationId, registrations.id))
      .where(eq(checkIns.sessionId, sessionId))
      .limit(limit)
      .offset(offset)
      .all();
    const data = results.map(row => ({
      ...row.check_ins,
      registration: row.registrations
    }));
    const [totalResult] = await db.select({ value: count() }).from(checkIns).where(eq(checkIns.sessionId, sessionId)).all();
    return { data: data, total: totalResult.value };
  }
  async isCheckedIn(registrationId: string, sessionId: string): Promise<boolean> {
    const existing = await db.select().from(checkIns).where(and(eq(checkIns.registrationId, registrationId), eq(checkIns.sessionId, sessionId))).limit(1).all();
    return existing.length > 0;
  }
  async getStats(slug: string) {
    const [totalResult] = await db.select({ value: count() }).from(registrations).where(eq(registrations.conferenceSlug, slug)).all();
    const [uniqueAttendeesResult] = await db.select({ value: count(registrations.email) }).from(registrations).where(eq(registrations.conferenceSlug, slug)).all();
    const [totalCheckInsResult] = await db.select({ value: count() }).from(checkIns).innerJoin(registrations, eq(checkIns.registrationId, registrations.id)).where(eq(registrations.conferenceSlug, slug)).all();
    const [uniqueCheckedInResult] = await db.select({ value: count(registrations.email) }).from(checkIns).innerJoin(registrations, eq(checkIns.registrationId, registrations.id)).where(eq(registrations.conferenceSlug, slug)).all();
    return { totalRegistrations: totalResult.value, uniqueAttendees: uniqueAttendeesResult.value, totalCheckIns: totalCheckInsResult.value, uniqueCheckedInAttendees: uniqueCheckedInResult.value };
  }
  async getSessionCapacityStatus(sessions: any[]): Promise<any[]> {
    return await Promise.all(sessions.map(async (session) => {
      const registered = await this.getSessionRegistrationCount(session.id);
      const capacity = session.capacity || null;
      return { sessionId: session.id, sessionTitle: session.title, capacity, registered, available: capacity ? Math.max(0, capacity - registered) : null, isFull: capacity ? registered >= capacity : false };
    }));
  }
}
export const registrationRepository = new RegistrationRepository();
