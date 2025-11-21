import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  index,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// DATABASE TABLES (Transactional data only - user interactions, registrations, check-ins)
// ============================================================================

// Session storage table (required for express-session)
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess", { mode: "json" }).notNull(), // JSON stored as text
    expire: integer("expire", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    expireIdx: index("IDX_session_expire").on(table.expire),
  })
);

// Users table (admins, staff)
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("user"), // admin, editor, user
  profileImageUrl: text("profile_image_url"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Registrations table - SESSION-BASED (1 registration = 1 person + 1 session)
// Each session registration has its own QR code and confirmation email
export const registrations = sqliteTable("registrations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  conferenceSlug: text("conference_slug").notNull(), // e.g., "hoi-nghi-y-hoc-lan-4-2025"
  sessionId: text("session_id").notNull(), // Session ID from JSON (e.g., "sess-001")
  
  // Attendee information
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  organization: text("organization"),
  position: text("position"),
  
  // Session-specific options
  cmeCertificateRequested: integer("cme_certificate_requested", { mode: "boolean" }).notNull().default(false),
  conferenceCertificateSent: integer("conference_certificate_sent", { mode: "boolean" }).notNull().default(false), // NEW FIELD
  
  // QR code and status
  qrCode: text("qr_code"), // Unique QR code for this session registration
  status: text("status").notNull().default("pending"), // pending, confirmed, cancelled
  emailSent: integer("email_sent", { mode: "boolean" }).default(false),
  confirmationToken: text("confirmation_token"),
  confirmationTokenExpires: integer("confirmation_token_expires", { mode: "timestamp_ms" }),
  reminderCount: integer("reminder_count").notNull().default(0),
  lastReminderSentAt: integer("last_reminder_sent_at", { mode: "timestamp_ms" }),
  
  registeredAt: integer("registered_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
}, (table) => ({
  slugIdx: index("idx_registrations_slug").on(table.conferenceSlug),
  sessionIdx: index("idx_registrations_session").on(table.sessionId),
  emailIdx: index("idx_registrations_email").on(table.email),
  emailSessionIdx: index("idx_registrations_email_session").on(table.email, table.sessionId),
  confirmationTokenIdx: index("idx_registrations_confirmation_token").on(table.confirmationToken),
}));

export const insertRegistrationSchema = createInsertSchema(registrations).omit({
  id: true,
  qrCode: true,
  emailSent: true,
  registeredAt: true,
  createdAt: true,
});

export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type Registration = typeof registrations.$inferSelect;

// Check-ins table (record of who attended which sessions)
export const checkIns = sqliteTable("check_ins", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  registrationId: text("registration_id")
    .notNull()
    .references(() => registrations.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull(), // References session ID from JSON
  method: text("method").notNull().default("qr"), // qr, manual, face
  deviceId: text("device_id"),
  checkedInAt: integer("checked_in_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
}, (table) => ({
  regIdx: index("idx_checkins_reg").on(table.registrationId),
  sessionIdx: index("idx_checkins_session").on(table.sessionId),
  checkedAtIdx: index("idx_checkins_checked_at").on(table.checkedInAt),
}));

export const insertCheckInSchema = createInsertSchema(checkIns).omit({
  id: true,
  checkedInAt: true,
  createdAt: true,
});

export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;
export type CheckIn = typeof checkIns.$inferSelect;

// Audit logs (track admin changes)
export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(), // create, update, delete, clone_year, etc.
  entityType: text("entity_type").notNull(), // conference, session, speaker, etc.
  entityId: text("entity_id"),
  metadata: text("metadata", { mode: "json" }), // Additional context stored as JSON text
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
}, (table) => ({
  userIdx: index("idx_audit_logs_user").on(table.userId),
  createdIdx: index("idx_audit_logs_created").on(table.createdAt),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// Contact Messages table
export const contactMessages = sqliteTable("contact_messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  submittedAt: integer("submitted_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;

// ============================================================================
// RELATIONS
// ============================================================================

export const registrationsRelations = relations(registrations, ({ many }) => ({
  checkIns: many(checkIns),
}));

export const checkInsRelations = relations(checkIns, ({ one }) => ({
  registration: one(registrations, {
    fields: [checkIns.registrationId],
    references: [registrations.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// ============================================================================
// JSON-ONLY TYPES (Conference content - NOT stored in database)
// These are stored in JSON files (e.g., server/data/hoi-nghi-y-hoc-lan-4-2025.json)
// ============================================================================

// Agenda item for a session - Complete structure matching conference program display
export interface AgendaItem {
  timeSlot: string; // e.g., "07g00-07g30", "09g00-09g15"
  title: string; // e.g., "Khai mạc", "Phát biểu khai mạc", "Ca lâm sàng: Rối loạn lipid máu..."
  speakerId?: string | null; // ID of speaker presenting this item (null for items like "Khai mạc", "Thảo luận")
  notes?: string; // Additional notes or description (optional)
}

// Material/document
export interface Material {
  type: string; // pdf, video, link
  title: string;
  url: string;
}

// Session (phiên hội nghị) - stored in JSON with FULL details
export interface Session {
  id: string;
  conferenceId: string;
  day: number; // 1, 2, 3...
  title: string;
  track: string; // e.g., "Toàn thể", "Phẫu thuật", "Y học gia đình"
  description: string;
  descriptionMd?: string; // Markdown description
  startTime: string; // ISO timestamp
  endTime: string;
  room: string; // e.g., "Hội trường 3D"
  type: string; // e.g., "Khai mạc", "Báo cáo", "Thảo luận", "Giải lao"
  chairIds: string[]; // Array of Speaker IDs who are moderators/chairs
  agendaItems: AgendaItem[]; // Detailed agenda with speakers and time slots
  materials: Material[]; // Supporting materials
  
  // Registration capacity (optional - null/undefined = unlimited)
  capacity?: number | null; // Max number of registrations allowed
  allowCmeCertificate?: boolean; // Whether this session offers CME certificate
  
  createdAt: string;
  updatedAt: string;
}

// Speaker/Chair (stored in JSON)
export interface Speaker {
  id: string;
  conferenceId: string;
  name: string;
  title: string; // Job title
  credentials: string; // e.g., "TS.BS", "PGS.TS"
  specialty: string; // Area of expertise
  photoUrl: string;
  bio: string;
  email?: string;
  role: "speaker" | "moderator" | "both";
  createdAt: string;
  updatedAt: string;
}

// Organizer (Ban To Chuc) - stored in JSON
export interface Organizer {
  id: string;
  conferenceId: string;
  name: string;
  title: string; // Job title
  credentials: string; // e.g., "TS.BS", "PGS.TS"
  photoUrl: string;
  bio: string;
  organizingRole: "Trưởng Ban" | "Phó trưởng Ban" | "Thành viên" | "Thành viên TK";
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Sponsor (stored in JSON)
export interface Sponsor {
  id: string;
  conferenceId: string;
  name: string;
  logoUrl: string;
  tier: "diamond" | "gold" | "silver" | "bronze" | "supporting" | "other";
  websiteUrl: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Announcement (stored in JSON)
export interface Announcement {
  id: string;
  conferenceId: string;
  title: string;
  content: string; // HTML/Markdown
  excerpt: string;
  featuredImageUrl: string;
  pdfUrl?: string;
  views: number;
  category: "general" | "important" | "deadline";
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

// Sightseeing (stored in JSON)
export interface Sightseeing {
  id: string;
  conferenceId: string;
  title: string;
  content: string; // HTML/Markdown
  excerpt: string;
  featuredImageUrl: string;
  createdAt: string;
  updatedAt: string;
}

// Whitelist (optional - can be in JSON or DB)
export interface Whitelist {
  id: string;
  conferenceId: string;
  email: string;
  name: string;
  createdAt: string;
}

export type InsertWhitelist = Omit<Whitelist, "id" | "createdAt">;

export interface DashboardStats {
  totalRegistrations: number;
  totalCheckIns: number;
  totalSessions: number;
  totalSponsors: number;
}

// ============================================================================
// ZOD VALIDATION SCHEMAS FOR JSON CONTENT (used by Admin CMS)
// ============================================================================

// Conference validation schema
export const insertConferenceSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  theme: z.string().optional().or(z.literal("")),
  logoUrl: z.string().optional().or(z.literal("")),
  bannerUrls: z.array(z.string()).optional(),
  introContent: z.string().optional().or(z.literal("")),
  registrationNote1: z.string().optional().or(z.literal("")),
  registrationNote2: z.string().optional().or(z.literal("")),
  registrationBenefits: z.string().optional().or(z.literal("")),
  registrationRules: z.string().optional().or(z.literal("")),
  startDate: z.date(),
  endDate: z.date(),
  location: z.string().optional().or(z.literal("")),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export type InsertConference = z.infer<typeof insertConferenceSchema>;

export const conferenceSchema = insertConferenceSchema.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Conference = z.infer<typeof conferenceSchema>;

// Agenda Item schema - Complete structure for conference program
export const agendaItemSchema = z.object({
  timeSlot: z.string(), // "07g00-07g30", "09g00-09g15"
  title: z.string(), // "Khai mạc", "Phát biểu khai mạc", etc.
  speakerId: z.string().nullable().optional(), // Speaker ID (null if no speaker)
  notes: z.string().optional(), // Additional notes (optional)
});

// Material schema
export const materialSchema = z.object({
  type: z.string(),
  title: z.string(),
  url: z.string(),
});

// Session validation schema
export const insertSessionSchema = z.object({
  day: z.number().int().min(1),
  title: z.string().min(1),
  track: z.string(),
  description: z.string(),
  descriptionMd: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  room: z.string(),
  type: z.string(),
  chairIds: z.array(z.string()).default([]),
  agendaItems: z.array(agendaItemSchema).default([]),
  materials: z.array(materialSchema).default([]),
  
  // Registration fields
  capacity: z.number().int().positive().nullable().optional(),
  allowCmeCertificate: z.boolean().optional().default(true),
});

export type InsertSession = z.infer<typeof insertSessionSchema>;

// Speaker validation schema
export const insertSpeakerSchema = z.object({
  name: z.string().min(1),
  title: z.string(),
  credentials: z.string(),
  specialty: z.string(),
  photoUrl: z.string().optional().or(z.literal("")),
  bio: z.string(),
  email: z.string().email().optional().or(z.literal("")),
  role: z.enum(["speaker", "moderator", "both"]).default("speaker"),
});

export type InsertSpeaker = z.infer<typeof insertSpeakerSchema>;

// Organizer validation schema
export const insertOrganizerSchema = z.object({
  name: z.string().min(1),
  title: z.string(),
  credentials: z.string(),
  photoUrl: z.string().optional().or(z.literal("")),
  bio: z.string(),
  organizingRole: z.enum(["Trưởng Ban", "Phó trưởng Ban", "Thành viên", "Thành viên TK"]),
  displayOrder: z.number().int().default(0),
});

export type InsertOrganizer = z.infer<typeof insertOrganizerSchema>;

// Sponsor validation schema
export const insertSponsorSchema = z.object({
  name: z.string().min(1),
  logoUrl: z.string().optional().or(z.literal("")),
  tier: z.enum(["diamond", "gold", "silver", "bronze", "supporting", "other"]),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  displayOrder: z.number().int().default(0),
});

export type InsertSponsor = z.infer<typeof insertSponsorSchema>;

// Announcement validation schema
export const insertAnnouncementSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
  excerpt: z.string(),
  featuredImageUrl: z.string().optional().or(z.literal("")),
  pdfUrl: z.string().optional().or(z.literal("")),
  category: z.enum(["general", "important", "deadline"]).default("general"),
  publishedAt: z.string().optional(),
});

export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

// Sightseeing validation schema
export const insertSightseeingSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
  excerpt: z.string(),
  featuredImageUrl: z.string().optional().or(z.literal("")),
});

export type InsertSightseeing = z.infer<typeof insertSightseeingSchema>;

// Contact Message validation schema
export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
  recaptcha: z.boolean().refine(val => val === true, {
    message: "You must confirm you are not a robot.",
  }),
});

// ============================================================================
// BATCH REGISTRATION SCHEMA (Frontend sends this for multi-session registration)
// ============================================================================

export const batchRegistrationRequestSchema = z.object({
  conferenceSlug: z.string().min(1),
  sessionIds: z.array(z.string()).min(1), // At least one session
  
  // Attendee info
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  organization: z.string().optional(),
  position: z.string().optional(),
  
  // Options
  cmeCertificateRequested: z.boolean().default(false),
});

export type BatchRegistrationRequest = z.infer<typeof batchRegistrationRequestSchema>;
