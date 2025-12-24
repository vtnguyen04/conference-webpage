import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  index,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { randomUUID } from "node:crypto";

// ============================================================================
// DATABASE TABLES (Transactional data only)
// ============================================================================

export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess", { mode: "json" }).notNull(),
    expire: integer("expire", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    expireIdx: index("IDX_session_expire").on(table.expire),
  })
);

export const systemConfig = sqliteTable("system_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("user"),
  profileImageUrl: text("profile_image_url"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

export const registrations = sqliteTable("registrations", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  conferenceSlug: text("conference_slug").notNull(),
  sessionId: text("session_id").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  organization: text("organization"),
  position: text("position"),
  role: text("role").notNull().default("participant"),
  cmeCertificateRequested: integer("cme_certificate_requested", { mode: "boolean" }).notNull().default(false),
  conferenceCertificateSent: integer("conference_certificate_sent", { mode: "boolean" }).notNull().default(false),
  qrCode: text("qr_code"),
  status: text("status").notNull().default("pending"),
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

export const checkIns = sqliteTable("check_ins", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  registrationId: text("registration_id")
    .notNull()
    .references(() => registrations.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull(),
  method: text("method").notNull().default("qr"),
  deviceId: text("device_id"),
  checkedInAt: integer("checked_in_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
}, (table) => ({
  regIdx: index("idx_checkins_reg").on(table.registrationId),
  sessionIdx: index("idx_checkins_session").on(table.sessionId),
  checkedAtIdx: index("idx_checkins_checked_at").on(table.checkedInAt),
}));

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  metadata: text("metadata", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
}, (table) => ({
  userIdx: index("idx_audit_logs_user").on(table.userId),
  createdIdx: index("idx_audit_logs_created").on(table.createdAt),
}));

export const contactMessages = sqliteTable("contact_messages", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  submittedAt: integer("submitted_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()),
}, (table) => ({
  emailIdx: index("idx_contact_email").on(table.email),
  submittedIdx: index("idx_contact_submitted").on(table.submittedAt),
}));

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
// EXPORT TYPES
// ============================================================================

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = typeof registrations.$inferInsert;
export type CheckIn = typeof checkIns.$inferSelect;
export type InsertCheckIn = typeof checkIns.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;

// Import JSON-only types from types.ts
import { 
  Conference, Session, Speaker, Organizer, Sponsor, Announcement, Sightseeing, Whitelist, DashboardStats 
} from "./types";

export type { 
  Conference, Session, Speaker, Organizer, Sponsor, Announcement, Sightseeing, Whitelist, DashboardStats 
};
