import {
  eq,
  and,
  or,
  like,
  isNull,
  gt,
  lt,
  sql,
  inArray,
} from "drizzle-orm";
import { db } from "./db";
import {
  registrations,
  checkIns,
  Registration,
  InsertRegistration,
  CheckIn,
  InsertCheckIn,
  Session,
  BatchRegistrationRequest,
} from "../shared/schema";
import { randomUUID } from "node:crypto";
import crypto from "node:crypto";
import QRCode from "qrcode";
import { sendRegistrationVerificationEmail } from "./emailService";


export async function getRegistrationsByConferenceSlug(
  slug: string,
  page: number,
  limit: number
): Promise<{ registrations: Registration[]; total: number }> {
  const offset = (page - 1) * limit;
  const data = await db
    .select()
    .from(registrations)
    .where(eq(registrations.conferenceSlug, slug))
    .limit(limit)
    .offset(offset)
    .all();
  
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(registrations)
    .where(eq(registrations.conferenceSlug, slug))
    .get();
  
  const total = Number(totalResult?.count || 0);

  return { registrations: data, total };
}

export async function getRegistrationsBySession(
  sessionId: string
): Promise<Registration[]> {
  return await db
    .select()
    .from(registrations)
    .where(eq(registrations.sessionId, sessionId))
    .all();
}


// Get registrations by email
export async function getRegistrationsByEmail(
  email: string,
  slug: string
): Promise<Registration[]> {
  return await db
    .select()
    .from(registrations)
    .where(
      and(
        eq(registrations.email, email),
        eq(registrations.conferenceSlug, slug)
      )
    )
    .all();
}

// Check if registered for a session
export async function isRegisteredForSession(
  email: string,
  sessionId: string
): Promise<boolean> {
  const existing = await db
    .select()
    .from(registrations)
    .where(
      and(
        eq(registrations.email, email),
        eq(registrations.sessionId, sessionId)
      )
    )
    .limit(1)
    .all();
  
  return existing.length > 0;
}

export async function getSessionRegistrationCount(
  sessionId: string
): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(registrations)
    .where(
      and(
        eq(registrations.sessionId, sessionId),
        eq(registrations.status, "confirmed")
      )
    )
    .get();
  
  return Number(result?.count || 0);
}

export async function createRegistration(
  data: InsertRegistration
): Promise<Registration> {
  const id = randomUUID();
  const qrData = `CONF|${data.conferenceSlug}|${data.sessionId}|${data.email}|${Date.now()}`;
  const qrCodeImage = await QRCode.toDataURL(qrData);

  const newRegistration = {
    ...data,
    id,
    qrCode: qrCodeImage,
    status: "pending",
    createdAt: new Date(),
    registeredAt: new Date(),
    cmeCertificateRequested: data.cmeCertificateRequested || false,
    conferenceCertificateSent: false,
    emailSent: false,
    reminderCount: 0,
  };

  await db
    .insert(registrations)
    .values(newRegistration)
    .run();

  const conferenceName = `Conference ${data.conferenceSlug}`;
  await sendRegistrationVerificationEmail(
    newRegistration.email,
    newRegistration.fullName,
    conferenceName,
    newRegistration.confirmationToken!
  );

  return { ...newRegistration, createdAt: new Date(newRegistration.createdAt), registeredAt: new Date(newRegistration.registeredAt) } as Registration;
}

export async function createAdminRegistration(
  data: InsertRegistration
): Promise<Registration> {
  const id = randomUUID();
  const qrData = `CONF|${data.conferenceSlug}|${data.sessionId}|${data.email}|${Date.now()}`;
  const qrCodeImage = await QRCode.toDataURL(qrData);

  const newRegistration = {
    ...data,
    id,
    qrCode: qrCodeImage,
    status: "confirmed", // Admin adds directly as confirmed
    createdAt: new Date(),
    registeredAt: new Date(),
    cmeCertificateRequested: data.cmeCertificateRequested || false,
    conferenceCertificateSent: false,
    emailSent: false, // No verification email needed
    confirmationToken: null, // No confirmation token needed
    confirmationTokenExpires: null, // No confirmation token needed
    reminderCount: 0,
    lastReminderSentAt: null, // No reminder sent yet
  };

  console.log("createAdminRegistration: Inserting registration:", newRegistration); // Debug log

  await db
    .insert(registrations)
    .values(newRegistration)
    .run();

  return { ...newRegistration, createdAt: new Date(newRegistration.createdAt), registeredAt: new Date(newRegistration.registeredAt) } as Registration;
}

export async function batchRegisterSessions(
  request: BatchRegistrationRequest,
  sessions: Session[],
): Promise<{
  success: boolean;
  registrations?: Registration[];
  confirmationToken?: string | null;
  error?: string;
  failedSessions?: string[];
}> {
  const { conferenceSlug, sessionIds, email, fullName, phone, organization, position, role, cmeCertificateRequested } = request;

  const requestedSessions = sessions.filter(s => sessionIds.includes(s.id));

  if (requestedSessions.length !== sessionIds.length) {
    return {
      success: false,
      error: "Some sessions not found",
    };
  }

  const hasOverlap = checkSessionTimeOverlap(requestedSessions);
  if (hasOverlap) {
    return {
      success: false,
      error: "Selected sessions have overlapping time slots",
    };
  }

  try {
    const qrCodeDetails: { sessionId: string; qrCodeDataURL: string }[] = [];
    for (const sessionId of sessionIds) {
      console.log(`DEBUG: Generating QR for sessionId: ${sessionId}`);
      const qrData = `CONF|${conferenceSlug}|${sessionId}|${email}|${Date.now()}`;
      const qrCodeDataURL = await QRCode.toDataURL(qrData);
      qrCodeDetails.push({ sessionId, qrCodeDataURL });
    }

    const createdRegistrations = db.transaction((tx) => {
      for (const sessionId of sessionIds) {
        const existingRegistration = tx
          .select()
          .from(registrations)
          .where(
            and(
              eq(registrations.email, email),
              eq(registrations.conferenceSlug, conferenceSlug),
              eq(registrations.sessionId, sessionId)
            )
          )
          .limit(1)
          .all();

        if (existingRegistration.length > 0) {
          throw new Error(`Already registered for session: ${sessionId}`);
        }
      }

      const allRegistrations: Registration[] = [];
      
      for (const sessionId of sessionIds) {
        const id = randomUUID();
        const { qrCodeDataURL } = qrCodeDetails.find(d => d.sessionId === sessionId)!;

        const confirmationToken = crypto.randomBytes(32).toString("hex");
        const confirmationTokenExpires = new Date(Date.now() + 3600000).toISOString();

        const newRegistration = {
          id,
          conferenceSlug,
          sessionId,
          fullName,
          email,
          phone,
          organization: organization || null,
          position: position || null,
          role, // Added role
          cmeCertificateRequested,
          conferenceCertificateSent: false,
          status: "pending",
          qrCode: qrCodeDataURL,
          confirmationToken,
          confirmationTokenExpires: new Date(Date.now() + 3600000),
          createdAt: new Date(),
          registeredAt: new Date(),
          emailSent: false,
          reminderCount: 0,
        };

        console.log("batchRegisterSessions: Inserting registration:", newRegistration); // Debug log
        tx
          .insert(registrations)
          .values(newRegistration)
          .run();

        allRegistrations.push({
          ...newRegistration,
          createdAt: new Date(newRegistration.createdAt),
          registeredAt: new Date(newRegistration.registeredAt),
          confirmationTokenExpires: new Date(newRegistration.confirmationTokenExpires),
        } as Registration);
      }

      return allRegistrations;
    });

    return {
      success: true,
      registrations: createdRegistrations,
      confirmationToken: createdRegistrations[0]?.confirmationToken,
    };
  } catch (error: any) {
    console.error("Batch registration transaction error:", error);
    
    if (error.message.includes("Already registered")) {
      const sessionIds = error.message.match(/sessions: (.+)$/)?.[1]?.split(", ") || [];
      return {
        success: false,
        error: error.message,
        failedSessions: sessionIds,
      };
    }
    
    if (error.message.includes("is full")) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Failed to create registrations: " + error.message,
    };
  }
}

function checkSessionTimeOverlap(sessions: Session[]): boolean {
  if (sessions.length <= 1) return false;

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    const currentEnd = new Date(current.endTime).getTime();
    const nextStart = new Date(next.startTime).getTime();

    if (currentEnd > nextStart) {
      return true;
    }
  }

  return false;
}

export async function cancelRegistration(
  registrationId: string
): Promise<boolean> {
  const result = await db
    .update(registrations)
    .set({ status: "cancelled" })
    .where(eq(registrations.id, registrationId))
    .run();

  return result.changes > 0;
}

export async function deleteRegistrationsByConferenceSlug(slug: string): Promise<void> {
  await db.delete(registrations).where(eq(registrations.conferenceSlug, slug)).run();
}

export async function deleteRegistration(id: string): Promise<boolean> {
  const result = await db
    .delete(registrations)
    .where(eq(registrations.id, id))
    .run();

  return result.changes > 0;
}

export async function searchRegistrations(
  slug: string,
  query: string,
  page: number,
  limit: number
): Promise<{ registrations: Registration[]; total: number }> {
  const lowerCaseQuery = query.toLowerCase();
  const offset = (page - 1) * limit;

  const where = and(
    eq(registrations.conferenceSlug, slug),
    or(
      like(registrations.fullName, `%${lowerCaseQuery}%`),
      like(registrations.email, `%${lowerCaseQuery}%`)
    )
  );

  const data = await db
    .select()
    .from(registrations)
    .where(where)
    .limit(limit)
    .offset(offset)
    .all();

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(registrations)
    .where(where)
    .get();

  const total = Number(totalResult?.count || 0);

  return { registrations: data, total };
}

export async function getPendingRegistrationsDueForReminder(
  conferenceSlug: string,
  reminderIntervalHours: number,
  maxReminders: number
): Promise<Registration[]> {
  const now = new Date();
  const reminderCutoff = new Date(Date.now() - reminderIntervalHours * 60 * 60 * 1000);

  return await db
    .select()
    .from(registrations)
    .where(
      and(
        eq(registrations.conferenceSlug, conferenceSlug),
        eq(registrations.status, "pending"),
        gt(registrations.confirmationTokenExpires, now),
        lt(registrations.reminderCount, maxReminders),
        or(
          isNull(registrations.lastReminderSentAt),
          lt(registrations.lastReminderSentAt, reminderCutoff)
        )
      )
    )
    .all();
}


export async function updateRegistrationReminderStatus(registrationId: string): Promise<void> {
  const registration = await db
    .select()
    .from(registrations)
    .where(eq(registrations.id, registrationId))
    .get();

  if (registration) {
    await db
      .update(registrations)
      .set({
        reminderCount: registration.reminderCount + 1,
        lastReminderSentAt: new Date(),
      })
      .where(eq(registrations.id, registrationId))
      .run();
  }
}

export async function cancelAndDeleteUnconfirmedRegistration(registrationId: string): Promise<void> {
  await db.delete(registrations).where(eq(registrations.id, registrationId)).run();
}

// CHECK-IN OPERATIONS

export async function createCheckIn(
  data: InsertCheckIn
): Promise<CheckIn> {
  const id = randomUUID();
  const newCheckIn = {
    ...data,
    id,
    checkedInAt: new Date(),
    createdAt: new Date(),
  };

  db.transaction((tx) => {
    tx.insert(checkIns).values(newCheckIn).run();
    tx
      .update(registrations)
      .set({ status: "checked-in" })
      .where(eq(registrations.id, data.registrationId))
      .run();
  });

  return {
    ...newCheckIn,
    checkedInAt: new Date(newCheckIn.checkedInAt),
    createdAt: new Date(newCheckIn.createdAt),
  } as CheckIn;
}

export async function getCheckInsByRegistration(
  registrationId: string
): Promise<CheckIn[]> {
  return await db
    .select()
    .from(checkIns)
    .where(eq(checkIns.registrationId, registrationId))
    .all();
}

export async function getCheckInsBySession(
  sessionId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ checkIns: any[], total: number }> {
  const offset = (page - 1) * limit;

  const checkInsData = await db
    .select()
    .from(checkIns)
    .leftJoin(registrations, eq(checkIns.registrationId, registrations.id))
    .where(eq(checkIns.sessionId, sessionId))
    .limit(limit)
    .offset(offset)
    .all();

  const totalResult = await db
    .select({ count: sql`count(*)` })
    .from(checkIns)
    .where(eq(checkIns.sessionId, sessionId));
  
  const total = Number(totalResult[0]?.count || 0);

  return { checkIns: checkInsData, total };
}

export async function isCheckedIn(
  registrationId: string,
  sessionId: string
): Promise<boolean> {
  const existing = await db
    .select()
    .from(checkIns)
    .where(
      and(
        eq(checkIns.registrationId, registrationId),
        eq(checkIns.sessionId, sessionId)
      )
    )
    .limit(1)
    .all();

  return existing.length > 0;
}

// STATISTICS

export async function getRegistrationStats(slug: string) {
  const { registrations: allRegistrations } = await getRegistrationsByConferenceSlug(slug, 1, Number.MAX_SAFE_INTEGER);
  
  const totalRegistrations = allRegistrations.length;
  const uniqueAttendees = new Set(allRegistrations.map(r => r.email)).size;
  
  const registrationIds = allRegistrations.map(r => r.id);
  let allCheckIns: CheckIn[] = [];
  if (registrationIds.length > 0) {
    allCheckIns = await db
      .select()
      .from(checkIns)
      .where(inArray(checkIns.registrationId, registrationIds))
      .all();
  }

  const uniqueCheckedInAttendees = new Set(
    allCheckIns.map(c => {
      const reg = allRegistrations.find(r => r.id === c.registrationId);
      return reg?.email;
    }).filter(Boolean)
  ).size;

  return {
    totalRegistrations,
    uniqueAttendees,
    totalCheckIns: allCheckIns.length,
    uniqueCheckedInAttendees,
  };
}

export async function getSessionCapacityStatus(
  sessions: Session[]
): Promise<Array<{
  sessionId: string;
  sessionTitle: string;
  capacity: number | null;
  registered: number;
  available: number | null;
  isFull: boolean;
}>> {
  const results = await Promise.all(
    sessions.map(async (session) => {
      const registered = await getSessionRegistrationCount(session.id);
      const capacity = session.capacity || null;
      const available = capacity ? Math.max(0, capacity - registered) : null;
      const isFull = capacity ? registered >= capacity : false;

      console.log(`Session: ${session.title}, Registered: ${registered}, Capacity: ${capacity}`);

      return {
        sessionId: session.id,
        sessionTitle: session.title,
        capacity,
        registered,
        available,
        isFull,
      };
    })
  );

  return results;
}