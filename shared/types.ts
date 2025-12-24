// ============================================================================
// IMPORTANT
// This file is intended for CLIENT-SIDE type definitions.
// It should ONLY contain pure TypeScript types and interfaces.
// DO NOT import any server-side dependencies (like drizzle, zod, etc.) here.
// ============================================================================


// ============================================================================
// DATABASE-DERIVED TYPES (Manually defined for client-side safety)
// ============================================================================

export interface User {
  id: string;
  email: string;
  passwordHash: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  profileImageUrl: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Registration {
  id: string;
  conferenceSlug: string;
  sessionId: string;
  fullName: string;
  email: string;
  phone: string | null;
  organization: string | null;
  position: string | null;
  role: string;
  cmeCertificateRequested: boolean;
  conferenceCertificateSent: boolean; // NEW FIELD
  qrCode: string | null;
  status: string; // 'pending', 'confirmed', 'cancelled'
  emailSent: boolean | null;
  confirmationToken: string | null;
  confirmationTokenExpires: Date | null;
  reminderCount: number;
  lastReminderSentAt: Date | null;
  registeredAt: Date | null;
  createdAt: Date | null;
}

export interface CheckIn {
  id: string;
  registrationId: string;
  sessionId: string;
  method: string;
  deviceId: string | null;
  checkedInAt: Date | null;
  createdAt: Date | null;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: any | null; // JSON blob
  createdAt: Date | null;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: Date | null;
}


// ============================================================================
// JSON-ONLY TYPES (Conference content - NOT stored in database)
// ============================================================================

// Agenda item for a session
export interface AgendaItem {
  timeSlot: string;
  title: string;
  speakerId?: string | null;
  notes?: string;
}

// Material/document
export interface Material {
  type: string;
  title: string;
  url: string;
}

// Session (phiên hội nghị)
export interface Session {
  id: string;
  conferenceId: string;
  day: number;
  title: string;
  track: string;
  description: string;
  descriptionMd?: string;
  startTime: string;
  endTime: string;
  room: string;
  type: string;
  chairIds: string[];
  agendaItems: AgendaItem[];
  materials: Material[];
  capacity?: number | null;
  allowCmeCertificate?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Speaker/Chair
export interface Speaker {
  id: string;
  conferenceId: string;
  name: string;
  title: string;
  credentials: string;
  specialty: string;
  photoUrl: string;
  bio: string;
  email?: string;
  role: "speaker" | "moderator" | "both";
  createdAt: string;
  updatedAt: string;
}

// Organizer (Ban To Chuc)
export interface Organizer {
  id: string;
  conferenceId: string;
  name: string;
  title: string;
  credentials: string;
  photoUrl: string;
  bio: string;
  organizingRole: "Trưởng Ban" | "Phó trưởng Ban" | "Thành viên" | "Thành viên TK";
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Sponsor
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

// Announcement
export interface Announcement {
  id: string;
  conferenceId: string;
  title: string;
  content: string;
  excerpt: string;
  featuredImageUrl: string;
  pdfUrl?: string;
  views: number;
  category: "general" | "important" | "deadline";
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

// Sightseeing
export interface Sightseeing {
  id: string;
  conferenceId: string;
  title: string;
  content: string;
  excerpt: string;
  featuredImageUrl: string;
  createdAt: string;
  updatedAt: string;
}

// Whitelist
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

// Conference
export interface Conference {
  id: string;
  slug: string;
  name: string;
  theme?: string;
  logoUrl?: string;
  bannerUrls?: string[];
  introContent?: string;
  registrationNote1?: string;
  registrationNote2?: string;
  registrationBenefits?: string;
  registrationRules?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
