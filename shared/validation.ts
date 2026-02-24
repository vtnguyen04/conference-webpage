import { z } from "zod";
const stringToBoolean = z.preprocess((val) => {
  if (typeof val === "string") {
    if (val === "true") return true;
    if (val === "false") return false;
  }
  return val;
}, z.boolean());
export const insertConferenceSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  tagline: z.string().optional().or(z.literal("")),
  theme: z.string().optional().or(z.literal("")),
  logoUrl: z.string().optional().or(z.literal("")),
  bannerUrls: z.array(z.string()).optional(),
  introContent: z.string().optional().or(z.literal("")),
  registrationNote1: z.string().optional().or(z.literal("")),
  registrationNote2: z.string().optional().or(z.literal("")),
  registrationBenefits: z.string().optional().or(z.literal("")),
  registrationRules: z.string().optional().or(z.literal("")),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  location: z.string().optional().or(z.literal("")),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional().or(z.literal("")),
  isActive: z.coerce.boolean().default(true),
});
export const conferenceSchema = insertConferenceSchema.extend({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const agendaItemSchema = z.object({
  timeSlot: z.string(),
  title: z.string(),
  speakerId: z.string().nullable().optional(),
  notes: z.string().optional(),
});
export const materialSchema = z.object({
  type: z.string(),
  title: z.string(),
  url: z.string(),
});
export const insertSessionSchema = z.object({
  day: z.coerce.number().int().min(1),
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
  capacity: z.coerce.number().int().positive().nullable().optional(),
  allowCmeCertificate: z.coerce.boolean().optional().default(true),
});
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
export const insertOrganizerSchema = z.object({
  name: z.string().min(1),
  title: z.string(),
  credentials: z.string(),
  photoUrl: z.string().optional().or(z.literal("")),
  bio: z.string(),
  organizingRole: z.enum(["Trưởng Ban", "Phó trưởng Ban", "Thành viên", "Thành viên TK"]),
  displayOrder: z.coerce.number().int().default(0),
});
export const insertSponsorSchema = z.object({
  name: z.string().min(1),
  logoUrl: z.string().optional().or(z.literal("")),
  tier: z.enum(["diamond", "gold", "silver", "bronze", "supporting", "other"]),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  displayOrder: z.coerce.number().int().default(0),
});
export const insertAnnouncementSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
  excerpt: z.string(),
  featuredImageUrl: z.string().optional().or(z.literal("")),
  pdfUrl: z.string().optional().or(z.literal("")),
  category: z.enum(["general", "important", "deadline"]).default("general"),
  publishedAt: z.string().optional(),
});
export const insertSightseeingSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
  excerpt: z.string(),
  featuredImageUrl: z.string().optional().or(z.literal("")),
});
export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
  recaptcha: z.coerce.boolean().refine(val => val === true, {
    message: "You must confirm you are not a robot.",
  }),
});
export const batchRegistrationRequestSchema = z.object({
  conferenceSlug: z.string().min(1),
  sessionIds: z.array(z.string()).min(1),
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  organization: z.string().optional(),
  position: z.string().optional(),
  role: z.string().default("participant"),
  cmeCertificateRequested: stringToBoolean.default(false),
});
export const insertRegistrationSchema = z.object({
    conferenceSlug: z.string(),
    sessionId: z.string(),
    fullName: z.string().min(1, "Họ và tên là bắt buộc"),
    email: z.string().email("Email không hợp lệ"),
    phone: z.string().optional().nullable(),
    organization: z.string().optional().nullable(),
    position: z.string().optional().nullable(),
    role: z.string().default("participant"),
    cmeCertificateRequested: stringToBoolean.default(false),
    status: z.enum(["pending", "confirmed", "cancelled"]).default("confirmed"),
});
export type BatchRegistrationRequest = z.infer<typeof batchRegistrationRequestSchema>;
export type InsertRegistrationRequest = z.infer<typeof insertRegistrationSchema>;
export type ContactFormRequest = z.infer<typeof contactFormSchema>;
export type ContactFormValues = ContactFormRequest;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type InsertOrganizer = z.infer<typeof insertOrganizerSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertSightseeing = z.infer<typeof insertSightseeingSchema>;
export type InsertSpeaker = z.infer<typeof insertSpeakerSchema>;
export type InsertSponsor = z.infer<typeof insertSponsorSchema>;
