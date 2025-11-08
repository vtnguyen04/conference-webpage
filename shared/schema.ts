import { sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// DATABASE TABLES (Transactional data only - user interactions, registrations, check-ins)
// ============================================================================

// Session storage table (required for express-session)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table (admins, staff)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role").notNull().default("user"), // admin, editor, user
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Registrations table - SESSION-BASED (1 registration = 1 person + 1 session)
// Each session registration has its own QR code and confirmation email
export const registrations = pgTable("registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conferenceYear: integer("conference_year").notNull(), // 2025, 2026, etc.
  sessionId: varchar("session_id").notNull(), // Session ID from JSON (e.g., "sess-001")
  
  // Attendee information
  fullName: text("full_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  organization: text("organization"),
  position: text("position"),
  
  // Session-specific options
  cmeCertificateRequested: boolean("cme_certificate_requested").notNull().default(false),
  
  // QR code and status
  qrCode: text("qr_code"), // Unique QR code for this session registration
  status: varchar("status").notNull().default("pending"), // pending, confirmed, cancelled
  emailSent: boolean("email_sent").default(false),
  confirmationToken: varchar("confirmation_token"),
  confirmationTokenExpires: timestamp("confirmation_token_expires"),
  
  registeredAt: timestamp("registered_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_registrations_year").on(table.conferenceYear),
  index("idx_registrations_session").on(table.sessionId),
  index("idx_registrations_email").on(table.email),
  index("idx_registrations_email_session").on(table.email, table.sessionId),
]);

export const insertRegistrationSchema = createInsertSchema(registrations).omit({
  id: true,
  qrCode: true,
  emailSent: true,
  registeredAt: true,
  createdAt: true,
  confirmationToken: true,
  confirmationTokenExpires: true,
});

export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type Registration = typeof registrations.$inferSelect;

// REMOVED: registrationSessions table - no longer needed with session-based registration
// REMOVED: tickets table - QR codes now stored directly in registrations table

// Check-ins table (record of who attended which sessions)
export const checkIns = pgTable("check_ins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  registrationId: varchar("registration_id")
    .notNull()
    .references(() => registrations.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id").notNull(), // References session ID from JSON
  method: varchar("method").notNull().default("qr"), // qr, manual, face
  deviceId: varchar("device_id"),
  checkedInAt: timestamp("checked_in_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_checkins_reg").on(table.registrationId),
  index("idx_checkins_session").on(table.sessionId),
  index("idx_checkins_checked_at").on(table.checkedInAt),
]);

export const insertCheckInSchema = createInsertSchema(checkIns).omit({
  id: true,
  checkedInAt: true,
  createdAt: true,
});

export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;
export type CheckIn = typeof checkIns.$inferSelect;

// Audit logs (track admin changes)
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action").notNull(), // create, update, delete, clone_year, etc.
  entityType: varchar("entity_type").notNull(), // conference, session, speaker, etc.
  entityId: varchar("entity_id"),
  metadata: jsonb("metadata"), // Additional context
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_audit_logs_user").on(table.userId),
  index("idx_audit_logs_created").on(table.createdAt),
]);

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// Contact Messages table
export const contactMessages = pgTable("contact_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
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
// These are stored in JSON files (e.g., server/data/2025.json)
// ============================================================================

// Conference info (stored in JSON, not DB)
export interface Conference {
  id: string;
  year: number;
  name: string;
  theme: string;
  logoUrl: string;
  bannerUrls: string[]; // Changed from bannerUrl
  introContent: string; // HTML/Markdown
  registrationNote1: string; // New field
  registrationNote2: string; // New field
  startDate: Date; // Changed from string
  endDate: Date; // Changed from string
  location: string;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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
  role: "speaker" | "moderator" | "both";
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
  pdfUrl?: string; // New field for PDF URL
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
  year: z.number().int().min(2000).max(2100),
  name: z.string().min(1),
  theme: z.string().optional().or(z.literal("")),
  logoUrl: z.string().optional().or(z.literal("")),
  bannerUrls: z.array(z.string()).optional(), // Changed from bannerUrl
  introContent: z.string().optional().or(z.literal("")),
  registrationNote1: z.string().optional().or(z.literal("")), // New field
  registrationNote2: z.string().optional().or(z.literal("")), // New field
  startDate: z.date(), // Changed from string
  endDate: z.date(), // Changed from string
  location: z.string().optional().or(z.literal("")),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export type InsertConference = z.infer<typeof insertConferenceSchema>;

// Agenda Item schema - Complete structure for conference program
export const agendaItemSchema = z.object({
  timeSlot: z.string(), // "07g00-07g30", "09g00-09g15"
  title: z.string(), // "Khai mạ", "Phát biểu khai mạc", etc.
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
  role: z.enum(["speaker", "moderator", "both"]).default("speaker"),
});

export type InsertSpeaker = z.infer<typeof insertSpeakerSchema>;

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
  pdfUrl: z.string().optional().or(z.literal("")), // New field for PDF URL
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
  conferenceYear: z.number().int(),
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