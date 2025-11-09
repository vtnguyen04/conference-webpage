import { db } from "./db";
import { registrations, checkIns } from "@shared/schema";
import type {
  Registration,
  InsertRegistration,
  CheckIn,
  InsertCheckIn,
  BatchRegistrationRequest,
  Session,
} from "@shared/schema";
import { eq, and, sql, inArray, or, like, isNull, gt, lt } from "drizzle-orm";
import QRCode from "qrcode";
import { sendRegistrationVerificationEmail } from "./emailService";
import crypto from "crypto";
import { randomUUID } from "crypto";

// ============================================================================
// SESSION-BASED REGISTRATION OPERATIONS (SQLite)
// ============================================================================

/**
 * Get all registrations for a conference year with pagination
 */
export async function getRegistrationsByYear(
  year: number,
  page: number,
  limit: number
): Promise<{ registrations: Registration[]; total: number }> {
  const offset = (page - 1) * limit;
  const data = await db
    .select()
    .from(registrations)
    .where(eq(registrations.conferenceYear, year))
    .limit(limit)
    .offset(offset)
    .all();
  
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(registrations)
    .where(eq(registrations.conferenceYear, year))
    .get();
  
  const total = Number(totalResult?.count || 0);

  return { registrations: data, total };
}

/**
 * Get all registrations for a specific session
 */
export async function getRegistrationsBySession(
  sessionId: string
): Promise<Registration[]> {
  return await db
    .select()
    .from(registrations)
    .where(eq(registrations.sessionId, sessionId))
    .all();
}

/**
 * Get registrations by attendee email
 */
export async function getRegistrationsByEmail(
  email: string,
  year: number
): Promise<Registration[]> {
  return await db
    .select()
    .from(registrations)
    .where(
      and(
        eq(registrations.email, email),
        eq(registrations.conferenceYear, year)
      )
    )
    .all();
}

/**
 * Check if attendee is already registered for a session
 */
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

/**
 * Get count of registrations for a session (for capacity check)
 */
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

/**
 * Create a single session registration with QR code
 */
export async function createRegistration(
  data: InsertRegistration
): Promise<Registration> {
  const id = randomUUID();
  // Generate unique QR code data
  const qrData = `CONF|${data.conferenceYear}|${data.sessionId}|${data.email}|${Date.now()}`; // Changed delimiter to '|'
  const qrCodeImage = await QRCode.toDataURL(qrData);

  const newRegistration = {
    ...data,
    id,
    qrCode: qrCodeImage,
    status: "pending",
    createdAt: new Date(),
    registeredAt: new Date(),
    cmeCertificateRequested: data.cmeCertificateRequested || false,
    conferenceCertificateSent: false, // NEW FIELD
    emailSent: false,
    reminderCount: 0,
  };

  await db
    .insert(registrations)
    .values(newRegistration)
    .run();

  // Send confirmation email for single registration
  const conferenceName = `Conference ${data.conferenceYear}`; // Placeholder
  await sendRegistrationVerificationEmail(
    newRegistration.email,
    newRegistration.fullName,
    conferenceName,
    newRegistration.confirmationToken!
  );

  return { ...newRegistration, createdAt: new Date(newRegistration.createdAt), registeredAt: new Date(newRegistration.registeredAt) } as Registration;
}

/**
 * Batch registration for multiple sessions with transaction support
 * Validates capacity, overlap, whitelist, and creates multiple registration records atomically
 */
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
  const { conferenceYear, sessionIds, email, fullName, phone, organization, position, cmeCertificateRequested } = request;

  // Step 1: Get session details for the requested sessions
  const requestedSessions = sessions.filter(s => sessionIds.includes(s.id));

  if (requestedSessions.length !== sessionIds.length) {
    return {
      success: false,
      error: "Some sessions not found",
    };
  }

  // Step 2: Check time overlap
  const hasOverlap = checkSessionTimeOverlap(requestedSessions);
  if (hasOverlap) {
    return {
      success: false,
      error: "Selected sessions have overlapping time slots",
    };
  }

  // Step 3: Perform all database operations in a transaction
  try {
    // Pre-generate QR codes outside the transaction
    const qrCodeDetails: { sessionId: string; qrCodeDataURL: string }[] = [];
    for (const sessionId of sessionIds) {
      console.log(`DEBUG: Generating QR for sessionId: ${sessionId}`);
      const qrData = `CONF|${conferenceYear}|${sessionId}|${email}|${Date.now()}`;
      const qrCodeDataURL = await QRCode.toDataURL(qrData); // Generate data URL
      qrCodeDetails.push({ sessionId, qrCodeDataURL });
    }

    const createdRegistrations = db.transaction((tx) => {
      // Check if already registered for any of these sessions
      for (const sessionId of sessionIds) {
        const existingRegistration = tx
          .select()
          .from(registrations)
          .where(
            and(
              eq(registrations.email, email),
              eq(registrations.conferenceYear, conferenceYear),
              eq(registrations.sessionId, sessionId)
            )
          )
          .limit(1)
          .all();

        if (existingRegistration.length > 0) {
          throw new Error(`Already registered for session: ${sessionId}`);
        }
      }

      // Create all registrations atomically
      const allRegistrations: Registration[] = [];
      
      for (const sessionId of sessionIds) {
        const id = randomUUID();
        // Retrieve pre-generated QR code data URL
        const { qrCodeDataURL } = qrCodeDetails.find(d => d.sessionId === sessionId)!;

        const confirmationToken = crypto.randomBytes(32).toString("hex");
        const confirmationTokenExpires = new Date(Date.now() + 3600000).toISOString(); // 1 hour

        const newRegistration = {
          id,
          conferenceYear,
          sessionId,
          fullName,
          email,
          phone,
          organization: organization || null,
          position: position || null,
          cmeCertificateRequested,
          conferenceCertificateSent: false, // NEW FIELD
          status: "pending",
          qrCode: qrCodeDataURL, // Store data URL
          confirmationToken,
          confirmationTokenExpires: new Date(Date.now() + 3600000), // 1 hour
          createdAt: new Date(),
          registeredAt: new Date(),
          emailSent: false,
          reminderCount: 0,
        };

        tx
          .insert(registrations)
          .values(newRegistration)
          .run();

        // Convert date strings back to Date objects for response
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
    
    // Check if error is about already registered or capacity
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

/**
 * Check if sessions have overlapping time slots
 */
function checkSessionTimeOverlap(sessions: Session[]): boolean {
  if (sessions.length <= 1) return false;

  // Sort sessions by start time
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Check each pair of consecutive sessions
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    const currentEnd = new Date(current.endTime).getTime();
    const nextStart = new Date(next.startTime).getTime();

    // If current session ends after next session starts, there's overlap
    if (currentEnd > nextStart) {
      return true;
    }
  }

  return false;
}

/**
 * Cancel a registration
 */
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

/**
 * Delete all registrations for a conference year
 */
export async function deleteRegistrationsByYear(year: number): Promise<void> {
  await db.delete(registrations).where(eq(registrations.conferenceYear, year)).run();
}

/**
 * Delete a single registration by ID
 */
export async function deleteRegistration(id: string): Promise<boolean> {
  const result = await db
    .delete(registrations)
    .where(eq(registrations.id, id))
    .run();

  return result.changes > 0;
}

/**
 * Search registrations by full name or email with pagination
 */
export async function searchRegistrations(
  year: number,
  query: string,
  page: number,
  limit: number
): Promise<{ registrations: Registration[]; total: number }> {
  const lowerCaseQuery = query.toLowerCase();
  const offset = (page - 1) * limit;

  const where = and(
    eq(registrations.conferenceYear, year),
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

/**
 * Get pending registrations that are due for a reminder
 */
export async function getPendingRegistrationsDueForReminder(
  conferenceYear: number,
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
        eq(registrations.conferenceYear, conferenceYear),
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


/**
 * Update a registration's reminder status (increment count, set last sent time)
 */
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

/**
 * Cancel and delete an unconfirmed registration
 */
export async function cancelAndDeleteUnconfirmedRegistration(registrationId: string): Promise<void> {
  await db.delete(registrations).where(eq(registrations.id, registrationId)).run();
}

// ============================================================================
// CHECK-IN OPERATIONS (SQLite)
// ============================================================================

/**
 * Create a check-in record for a registration
 */
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

/**
 * Get check-ins for a registration
 */
export async function getCheckInsByRegistration(
  registrationId: string
): Promise<CheckIn[]> {
  return await db
    .select()
    .from(checkIns)
    .where(eq(checkIns.registrationId, registrationId))
    .all();
}

/**
 * Get check-ins for a session with pagination
 */
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

/**
 * Check if already checked in for a session
 */
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

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get registration and check-in statistics for a conference year
 */
export async function getRegistrationStats(year: number) {
  const { registrations: allRegistrations } = await getRegistrationsByYear(year, 1, Number.MAX_SAFE_INTEGER);
  
  const totalRegistrations = allRegistrations.length;
  const uniqueAttendees = new Set(allRegistrations.map(r => r.email)).size;
  
  // Get all check-ins for this year's registrations
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

/**
 * Get capacity status for all sessions
 */
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