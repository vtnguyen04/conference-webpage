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
import { eq, and, sql, inArray, or, ilike } from "drizzle-orm";
import QRCode from "qrcode";
import { sendRegistrationConfirmationEmail } from "./emailService";
import crypto from "crypto";

// ============================================================================
// SESSION-BASED REGISTRATION OPERATIONS (PostgreSQL)
// ============================================================================

/**
 * Get all registrations for a conference year
 */
export async function getRegistrationsByYear(
  year: number
): Promise<Registration[]> {
  return await db
    .select()
    .from(registrations)
    .where(eq(registrations.conferenceYear, year));
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
    .where(eq(registrations.sessionId, sessionId));
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
    );
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
    .limit(1);
  
  return existing.length > 0;
}

/**
 * Get count of registrations for a session (for capacity check)
 */
export async function getSessionRegistrationCount(
  sessionId: string
): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(registrations)
    .where(eq(registrations.sessionId, sessionId));
  
  return result[0]?.count || 0;
}

/**
 * Create a single session registration with QR code
 */
export async function createRegistration(
  data: InsertRegistration
): Promise<Registration> {
  // Generate unique QR code data
  const qrData = `CONF-${data.conferenceYear}-${data.sessionId}-${data.email}-${Date.now()}`;
  const qrCodeImage = await QRCode.toDataURL(qrData);

  const [registration] = await db
    .insert(registrations)
    .values({
      ...data,
      qrCode: qrCodeImage,
    })
    .returning();

  // Send confirmation email for single registration
  const conferenceName = `Conference ${data.conferenceYear}`; // Placeholder
  await sendRegistrationConfirmationEmail(
    registration.email,
    conferenceName,
    {
      name: registration.fullName,
      email: registration.email,
      // Add other relevant details from registration object
    }
  );

  return registration;
}

/**
 * Batch registration for multiple sessions with transaction support
 * Validates capacity, overlap, whitelist, and creates multiple registration records atomically
 */
export async function batchRegisterSessions(
  request: BatchRegistrationRequest,
  sessions: Session[],
  isWhitelisted: boolean
): Promise<{
  success: boolean;
  registrations?: Registration[];
  error?: string;
  failedSessions?: string[];
}> {
  const { conferenceYear, sessionIds, email, fullName, phone, organization, position, cmeCertificateRequested } = request;

  // Step 1: Validate whitelist (if required)
  // Note: Whitelist check should be done by the calling code
  // This function assumes whitelist validation is already done

  // Step 2: Get session details for the requested sessions
  const requestedSessions = sessions.filter(s => sessionIds.includes(s.id));

  if (requestedSessions.length !== sessionIds.length) {
    return {
      success: false,
      error: "Some sessions not found",
    };
  }

  // Step 3: Check time overlap
  const hasOverlap = checkSessionTimeOverlap(requestedSessions);
  if (hasOverlap) {
    return {
      success: false,
      error: "Selected sessions have overlapping time slots",
    };
  }

  // Step 4-6: Perform all database operations in a transaction
  // This ensures atomicity: either all registrations succeed or none do
  try {
    const createdRegistrations = await db.transaction(async (tx) => {
      // Check if already registered for any of these sessions
      const existingRegistrations = await tx
        .select()
        .from(registrations)
        .where(
          and(
            eq(registrations.email, email),
            eq(registrations.conferenceYear, conferenceYear)
          )
        );

      const alreadyRegisteredSessions = existingRegistrations
        .filter(r => sessionIds.includes(r.sessionId))
        .map(r => r.sessionId);

      if (alreadyRegisteredSessions.length > 0) {
        throw new Error(`Already registered for sessions: ${alreadyRegisteredSessions.join(", ")}`);
      }

      // Sort sessions by ID to prevent deadlocks
      // This ensures all transactions acquire locks in the same order
      // NOTE: This prevents most deadlocks but edge cases with complex concurrent
      // patterns (non-overlapping session sets) may still occur. For high-concurrency
      // production use, consider: (1) persisting sessions in SQL with FOR UPDATE,
      // or (2) using a global registration queue/serialization mechanism.
      const sortedSessions = [...requestedSessions].sort((a, b) => 
        a.id.localeCompare(b.id)
      );

      // Acquire advisory locks for each session to serialize capacity checks
      // This prevents race conditions even when sessions have zero registrations
      for (const session of sortedSessions) {
        if (session.capacity) {
          // Use PostgreSQL advisory lock based on session ID
          // This serializes ALL transactions trying to register for this session
          await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${session.id}))`);
          
          // Now count registrations atomically (lock is held)
          const result = await tx
            .select({ count: sql<number>`count(*)::int` })
            .from(registrations)
            .where(eq(registrations.sessionId, session.id));
          
          const currentCount = result[0]?.count || 0;
          
          if (currentCount >= session.capacity) {
            throw new Error(`Session "${session.title}" is full (${currentCount}/${session.capacity})`);
          }
        }
      }

      // Create all registrations atomically
      const allRegistrations: Registration[] = [];
      
      for (const sessionId of sessionIds) {
        // Generate unique QR code data
        const qrData = `CONF-${conferenceYear}-${sessionId}-${email}-${Date.now()}`;
        const qrCodeImage = await QRCode.toDataURL(qrData);

        const confirmationToken = crypto.randomBytes(32).toString("hex");
        const confirmationTokenExpires = new Date(Date.now() + 3600000); // 1 hour

        const [registration] = await tx
          .insert(registrations)
          .values({
            conferenceYear,
            sessionId,
            fullName,
            email,
            phone,
            organization: organization || null,
            position: position || null,
            cmeCertificateRequested,
            status: "pending",
            qrCode: qrCodeImage,
            confirmationToken,
            confirmationTokenExpires,
          })
          .returning();

        allRegistrations.push(registration);
      }

      for (const registration of allRegistrations) {
        // Assuming conferenceName can be derived or passed. For now, using a placeholder.
        const conferenceName = `Conference ${conferenceYear}`; 
        await sendRegistrationConfirmationEmail(
          registration.email,
          conferenceName,
          {
            name: registration.fullName,
            email: registration.email,
            confirmationToken: registration.confirmationToken,
            // Add other relevant details from registration object
          }
        );
      }

      return allRegistrations;
    });

    return {
      success: true,
      registrations: createdRegistrations,
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
    .returning();

  return result.length > 0;
}

/**
 * Delete all registrations for a conference year
 */
export async function deleteRegistrationsByYear(year: number): Promise<void> {
  await db.delete(registrations).where(eq(registrations.conferenceYear, year));
}

/**
 * Delete a single registration by ID
 */
export async function deleteRegistration(id: string): Promise<boolean> {
  const result = await db
    .delete(registrations)
    .where(eq(registrations.id, id))
    .returning();

  return result.length > 0;
}

/**
 * Search registrations by full name or email
 */
export async function searchRegistrations(year: number, query: string): Promise<Registration[]> {
  const lowerCaseQuery = query.toLowerCase();
  return await db
    .select()
    .from(registrations)
    .where(
      and(
        eq(registrations.conferenceYear, year),
        or(
          ilike(registrations.fullName, `%${lowerCaseQuery}%`),
          ilike(registrations.email, `%${lowerCaseQuery}%`)
        )
      )
    );
}

// ============================================================================
// CHECK-IN OPERATIONS (PostgreSQL)
// ============================================================================

/**
 * Create a check-in record for a registration
 */
export async function createCheckIn(
  data: InsertCheckIn
): Promise<CheckIn> {
  const [checkIn] = await db
    .insert(checkIns)
    .values(data)
    .returning();

  return checkIn;
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
    .where(eq(checkIns.registrationId, registrationId));
}

/**
 * Get check-ins for a session
 */
export async function getCheckInsBySession(
  sessionId: string
): Promise<CheckIn[]> {
  return await db
    .select()
    .from(checkIns)
    .where(eq(checkIns.sessionId, sessionId));
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
    .limit(1);

  return existing.length > 0;
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get registration and check-in statistics for a conference year
 */
export async function getRegistrationStats(year: number) {
  const allRegistrations = await getRegistrationsByYear(year);
  
  const totalRegistrations = allRegistrations.length;
  const uniqueAttendees = new Set(allRegistrations.map(r => r.email)).size;
  
  // Get all check-ins for this year's registrations
  const registrationIds = allRegistrations.map(r => r.id);
  let allCheckIns: CheckIn[] = [];
  if (registrationIds.length > 0) {
    allCheckIns = await db
      .select()
      .from(checkIns)
      .where(inArray(checkIns.registrationId, registrationIds));
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
