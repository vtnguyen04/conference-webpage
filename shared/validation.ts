import { z } from "zod";

// ============================================================================
// IMPORTANT
// This file is intended for CLIENT-SIDE validation schemas.
// It should ONLY contain Zod schemas and have no server-side dependencies.
// DO NOT import from drizzle-orm, createInsertSchema, etc.
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

export const conferenceSchema = insertConferenceSchema.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Agenda Item schema
export const agendaItemSchema = z.object({
  timeSlot: z.string(),
  title: z.string(),
  speakerId: z.string().nullable().optional(),
  notes: z.string().optional(),
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
  capacity: z.number().int().positive().nullable().optional(),
  allowCmeCertificate: z.boolean().optional().default(true),
});


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

// Sponsor validation schema
export const insertSponsorSchema = z.object({
  name: z.string().min(1),
  logoUrl: z.string().optional().or(z.literal("")),
  tier: z.enum(["diamond", "gold", "silver", "bronze", "supporting", "other"]),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  displayOrder: z.number().int().default(0),
});

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

// Sightseeing validation schema
export const insertSightseeingSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
  excerpt: z.string(),
  featuredImageUrl: z.string().optional().or(z.literal("")),
});

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

// Batch registration schema
export const batchRegistrationRequestSchema = z.object({
  conferenceSlug: z.string().min(1),
  sessionIds: z.array(z.string()).min(1),
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  organization: z.string().optional(),
  position: z.string().optional(),
  role: z.enum(["participant", "speaker", "moderator"]).default("participant"),
  cmeCertificateRequested: z.boolean().default(false),
});

// Manual insert registration schema for admin
export const insertRegistrationSchema = z.object({
    conferenceSlug: z.string(),
    sessionId: z.string(),
    fullName: z.string().min(1, "Họ và tên là bắt buộc"),
    email: z.string().email("Email không hợp lệ"),
    phone: z.string().optional(),
    organization: z.string().optional(),
    position: z.string().optional(),
    role: z.enum(["participant", "speaker", "moderator", "both"]).default("participant"),
    cmeCertificateRequested: z.boolean().default(false),
    status: z.enum(["pending", "confirmed", "cancelled"]).default("confirmed"),
});

