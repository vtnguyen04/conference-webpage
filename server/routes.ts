import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage as dbStorage } from "./storage";
import { jsonStorage } from "./jsonStorage";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { registrations as registrationsTable } from "@shared/schema";
import {
  getRegistrationsByConferenceSlug,
  getRegistrationsBySession,
  getRegistrationsByEmail,
  batchRegisterSessions,
  createCheckIn,
  getCheckInsBySession,
  isCheckedIn,
  getRegistrationStats,
  getSessionCapacityStatus,
  deleteRegistrationsByConferenceSlug,
  deleteRegistration,
  searchRegistrations,
  createAdminRegistration,
} from "./registrationDb";
import { generateCmeCertificate } from "./certificateService";
import { sendCmeCertificateEmail, sendRegistrationVerificationEmail, sendConsolidatedRegistrationEmail } from "./emailService";
import {
  createContactMessage,
  getContactMessages,
  getContactMessagesCount,
  deleteContactMessage,
  deleteAllContactMessages,
  searchContactMessages,
} from "./contactDb";
import { setupAuth } from "./sessionAuth";

import { insertConferenceSchema, insertSessionSchema, insertSpeakerSchema, insertOrganizerSchema, insertSponsorSchema, insertAnnouncementSchema, insertSightseeingSchema, batchRegistrationRequestSchema, contactFormSchema, insertRegistrationSchema } from "@shared/schema";
console.log('insertSponsorSchema:', insertSponsorSchema);
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

function deleteFile(filePathRelative: string) {
  if (filePathRelative && filePathRelative.startsWith('/uploads/')) {
    const absolutePath = path.join(process.cwd(), "public", filePathRelative);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      console.log(`Deleted file: ${absolutePath}`);
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  const checkActiveConference = async (req: any, res: any, next: any) => {
    const activeConference = await jsonStorage.getActiveConference();
    if (!activeConference) {
      return res.status(404).json({ message: "No active conference found." });
    }
    req.activeConference = activeConference;

    const conferenceSlugParam = req.params.conferenceSlug;

    // For write operations (POST, PUT, DELETE), ensure it's the active conference
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      if (conferenceSlugParam && conferenceSlugParam !== activeConference.slug) {
        return res.status(403).json({ message: "Only the active conference can be modified." });
      }
      // If no slug param, assume it's for the active conference
      // This handles routes like /api/sessions (which implicitly target the active conference)
    }
    next();
  };

  app.get('/api/auth/user', async (req: any, res) => {
    try {
      console.log('Headers for /api/auth/user:', req.headers);
      console.log('Session for /api/auth/user:', req.session);
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (userId === "admin") {
        return res.json({
          id: "admin",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          role: "admin",
        });
      }

      const user = await dbStorage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post('/api/logout', (req: any, res) => {
    console.log('Logout endpoint hit.');
    console.log('req.session:', req.session);
    if (!req.session) {
      console.log('No active session to destroy.');
      res.clearCookie('connect.sid');
      return res.json({ message: "Logged out successfully (no active session)" });
    }
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ message: "Failed to log out" });
      }
      console.log('Session destroyed. Clearing cookie.');
      res.clearCookie('connect.sid');
      res.json({ message: "Logged out successfully" });
    });
  });

  app.post('/api/login', async (req: any, res) => {
    try {
      const { email, password } = req.body;
      console.log('Login attempt with email:', email);
      console.log('Password received:', password);
      console.log('ADMIN_PASSWORD from env:', process.env.ADMIN_PASSWORD);

      if (email === "admin@example.com" && password === process.env.ADMIN_PASSWORD) {
        req.session.userId = "admin";
        req.session.save((err: any) => {
          if (err) {
            console.error("Error saving session after login:", err);
            return res.status(500).json({ message: "Failed to save session" });
          }
          console.log('Login successful for admin');
          console.log('Session after login:', req.session);
          return res.json({ message: "Login successful" });
        });
      } else {
        console.log('Invalid credentials');
        return res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded." });
      }

      const imagePath = `/uploads/${req.file.filename}`;

      const oldImagePath = req.body.oldImagePath;
      if (oldImagePath) {
        const oldFilePath = path.join(process.cwd(), "public", oldImagePath);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log(`Deleted old image: ${oldFilePath}`);
        }
      }

      res.json({ imagePath });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: error.message || "Failed to upload image." });
    }
  });

  app.post('/api/upload-pdf', upload.single('pdf'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded." });
      }

      const pdfPath = `/uploads/${req.file.filename}`;

      const oldPdfPath = req.body.oldPdfPath;
      if (oldPdfPath) {
        deleteFile(oldPdfPath);
      }

      res.json({ pdfPath });
    } catch (error: any) {
      console.error("Error uploading PDF:", error);
      res.status(500).json({ message: error.message || "Failed to upload PDF." });
    }
  });

  app.post('/api/upload/banners', upload.array('banners', 5), async (req, res) => {
    try {
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({ message: "No files uploaded." });
      }

      const files = req.files as Express.Multer.File[];
      const imagePaths = files.map(file => `/uploads/${file.filename}`);

      res.json({ imagePaths });
    } catch (error: any) {
      console.error("Error uploading banners:", error);
      res.status(500).json({ message: error.message || "Failed to upload banners." });
    }
  });

  app.get('/api/conferences', async (req, res) => {
    try {
      const conferences = await jsonStorage.getAllConferences();
      res.json(conferences);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conferences" });
    }
  });

  app.get('/api/conferences/active', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      res.json(conference || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active conference" });
    }
  });

  app.get('/api/conferences/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const conference = await jsonStorage.getConferenceBySlug(slug);
      if (!conference) {
        return res.status(404).json({ message: "Conference not found" });
      }
      res.json(conference);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conference" });
    }
  });

  app.post('/api/conferences', async (req, res) => {
    try {
      const data = insertConferenceSchema.parse(req.body);
      const conference = await jsonStorage.createConference(data);
      res.json(conference);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/conferences/:conferenceSlug', checkActiveConference, async (req: any, res) => {
    try {
      const { conferenceSlug } = req.params;
      const { filesToDelete, ...updates } = req.body;

      if (Array.isArray(filesToDelete)) {
        filesToDelete.forEach(filePath => {
          deleteFile(filePath);
        });
      }

      const updated = await jsonStorage.updateConference(conferenceSlug, updates);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/conferences/:fromSlug/clone', async (req, res) => {
    console.log('Clone conference endpoint hit');
    try {
      const { fromSlug } = req.params;
      const { newConferenceName } = req.body;
      if (!newConferenceName) {
        return res.status(400).json({ message: "New conference name is required." });
      }
      const cloned = await jsonStorage.cloneConference(fromSlug, newConferenceName);
      res.json(cloned);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/conferences/:conferenceSlug/activate', async (req, res) => {
    try {
      const { conferenceSlug } = req.params;
      await jsonStorage.setActiveConference(conferenceSlug);
      res.json({ success: true, message: `Conference ${conferenceSlug} activated.` });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/conferences/:conferenceSlug', async (req, res) => {
    try {
      const { conferenceSlug } = req.params;

      await deleteRegistrationsByConferenceSlug(conferenceSlug);

      await jsonStorage.deleteConference(conferenceSlug);

      res.json({ success: true, message: `Conference ${conferenceSlug} and all its data deleted.` });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/sessions/:conferenceSlug', async (req, res) => {
    try {
      const { conferenceSlug } = req.params;
      const sessions = await jsonStorage.getSessions(conferenceSlug);
      console.log(`API /api/sessions/${conferenceSlug}: Fetched sessions:`, sessions);
      res.json(sessions);
    } catch (error) {
      console.error(`API /api/sessions/${req.params.conferenceSlug}: Failed to fetch sessions:`, error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.get('/api/sessions', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      console.log("API /api/sessions: Active conference:", conference);
      if (!conference) {
        console.log("API /api/sessions: No active conference found, returning empty array.");
        return res.json([]);
      }
      const sessions = await jsonStorage.getSessions(conference.slug);
      console.log("API /api/sessions: Fetched sessions:", sessions);
      res.json(sessions);
    } catch (error) {
      console.error("API /api/sessions: Failed to fetch sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.post('/api/sessions', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const data = insertSessionSchema.parse(req.body);
      const session = await jsonStorage.createSession(conference.slug, { ...data, conferenceId: conference.slug });
      res.json(session);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/sessions/:id', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const updated = await jsonStorage.updateSession(conference.slug, req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/sessions/:id', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      await jsonStorage.deleteSession(conference.slug, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/admin/sessions/all', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      await jsonStorage.deleteAllSessions(conference.slug);
      res.json({ success: true, message: "All sessions deleted." });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/speakers', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.json([]);
      }
      const speakers = await jsonStorage.getSpeakers(conference.slug);
      res.json(speakers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch speakers" });
    }
  });

  app.get('/api/speakers/:conferenceSlug', async (req, res) => {
    try {
      const { conferenceSlug } = req.params;
      const speakers = await jsonStorage.getSpeakers(conferenceSlug);
      res.json(speakers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch speakers" });
    }
  });

  app.post('/api/speakers', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const data = insertSpeakerSchema.parse(req.body);
      const speaker = await jsonStorage.createSpeaker(conference.slug, { ...data, conferenceId: conference.slug, photoUrl: data.photoUrl || '' });

      // Auto-register moderators/chairs
      if ((speaker.role === 'moderator' || speaker.role === 'both') && speaker.email) {
        try {
          console.log(`Auto-registering moderator: ${speaker.name} (${speaker.email})`);
          const allSessions = await jsonStorage.getSessions(conference.slug);
          const sessionIds = allSessions.map(s => s.id);

          if (sessionIds.length > 0) {
            const result = await batchRegisterSessions({
              conferenceSlug: conference.slug,
              sessionIds,
              fullName: speaker.name,
              email: speaker.email,
              phone: '', // Optional now
              cmeCertificateRequested: false,
              role: 'participant', // Added role
            }, allSessions);

            // Auto-confirm these registrations
            if (result.success && result.registrations) {
              for (const reg of result.registrations) {
                await db.update(registrationsTable)
                  .set({ status: 'confirmed', confirmationToken: null, confirmationTokenExpires: null })
                  .where(eq(registrationsTable.id, reg.id));
              }
              console.log(`Auto-confirmed ${result.registrations.length} registrations for moderator ${speaker.name}.`);
            }
          }
        } catch (regError) {
          console.error(`Failed to auto-register moderator ${speaker.name}:`, regError);
          // We don't re-throw or return an error to the client, 
          // as the speaker creation itself was successful.
          // This is a background task.
        }
      }

      res.json(speaker);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/speakers/:id', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      
      const speakerId = req.params.id;
      const oldSpeaker = await jsonStorage.getSpeakerById(conference.slug, speakerId);

      const updated = await jsonStorage.updateSpeaker(conference.slug, speakerId, req.body);

      if (!updated) {
        return res.status(404).json({ message: "Speaker not found after update." });
      }
      
      const isNowModeratorWithEmail = (updated.role === 'moderator' || updated.role === 'both') && updated.email;
      const wasModeratorWithSameEmail = oldSpeaker && (oldSpeaker.role === 'moderator' || oldSpeaker.role === 'both') && oldSpeaker.email === updated.email;

      if (isNowModeratorWithEmail && !wasModeratorWithSameEmail) {
         try {
          console.log(`Auto-registering updated moderator: ${updated.name} (${updated.email})`);
          const allSessions = await jsonStorage.getSessions(conference.slug);
          const sessionIds = allSessions.map(s => s.id);

          if (sessionIds.length > 0) {
            const result = await batchRegisterSessions({
              conferenceSlug: conference.slug,
              sessionIds,
              fullName: updated.name,
              email: updated.email!,
              phone: '',
              cmeCertificateRequested: false,
              role: 'participant', // Added role
            }, allSessions);
            
            if (result.success && result.registrations) {
              for (const reg of result.registrations) {
                await db.update(registrationsTable)
                  .set({ status: 'confirmed', confirmationToken: null, confirmationTokenExpires: null })
                  .where(eq(registrationsTable.id, reg.id));
              }
              console.log(`Auto-confirmed ${result.registrations.length} registrations for updated moderator ${updated.name}.`);
            }
          }
        } catch (regError) {
          console.error(`Failed to auto-register updated moderator ${updated.name}:`, regError);
        }
      }

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/speakers/:id', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      await jsonStorage.deleteSpeaker(conference.slug, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/admin/speakers/all', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      await jsonStorage.deleteAllSpeakers(conference.slug);
      res.json({ success: true, message: "All speakers deleted." });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/organizers', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.json([]);
      }
      const organizers = await jsonStorage.getOrganizers(conference.slug);
      res.json(organizers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organizers" });
    }
  });

  app.get('/api/organizers/:conferenceSlug', async (req, res) => {
    try {
      const { conferenceSlug } = req.params;
      const organizers = await jsonStorage.getOrganizers(conferenceSlug);
      res.json(organizers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organizers" });
    }
  });

  app.post('/api/organizers', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const data = insertOrganizerSchema.parse(req.body);
      const organizer = await jsonStorage.createOrganizer(conference.slug, { ...data, conferenceId: conference.slug, photoUrl: data.photoUrl || '' });
      res.json(organizer);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/organizers/:id', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const updated = await jsonStorage.updateOrganizer(conference.slug, req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/organizers/:id', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      await jsonStorage.deleteOrganizer(conference.slug, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/admin/organizers/all', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      await jsonStorage.deleteAllOrganizers(conference.slug);
      res.json({ success: true, message: "All organizers deleted." });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/announcements', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.json([]);
      }
      const announcements = await jsonStorage.getAnnouncements(conference.slug);
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.get('/api/announcements/slug/:conferenceSlug', async (req, res) => {
    try {
      const { conferenceSlug } = req.params;
      const announcements = await jsonStorage.getAnnouncements(conferenceSlug);
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.get('/api/announcements/:conferenceSlug/:id', async (req, res) => {
    try {
      let { conferenceSlug, id } = req.params;
      console.log(`Fetching announcement with ID: ${id} for slug ${conferenceSlug}`);

      if (conferenceSlug === 'active') {
        const activeConference = await jsonStorage.getActiveConference();
        if (!activeConference) {
          return res.status(404).json({ message: "No active conference found." });
        }
        conferenceSlug = activeConference.slug;
      }

      const announcement = await jsonStorage.getAnnouncement(conferenceSlug, id);
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      res.json(announcement);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch announcement" });
    }
  });

  app.post('/api/announcements', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const data = insertAnnouncementSchema.parse(req.body);
      const announcement = await jsonStorage.createAnnouncement(conference.slug, { ...data, conferenceId: conference.slug, views: 0, featuredImageUrl: data.featuredImageUrl || '', pdfUrl: data.pdfUrl || '', publishedAt: data.publishedAt || '' });
      res.json(announcement);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/announcements/:id', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const existingAnnouncement = await jsonStorage.getAnnouncement(conference.slug, req.params.id);
      if (!existingAnnouncement) {
        return res.status(404).json({ message: "Announcement not found" });
      }

      if (req.body.featuredImageUrl && existingAnnouncement.featuredImageUrl && req.body.featuredImageUrl !== existingAnnouncement.featuredImageUrl) {
        deleteFile(existingAnnouncement.featuredImageUrl);
      } else if (!req.body.featuredImageUrl && existingAnnouncement.featuredImageUrl) {
        deleteFile(existingAnnouncement.featuredImageUrl);
      }

      if (req.body.pdfUrl && existingAnnouncement.pdfUrl && req.body.pdfUrl !== existingAnnouncement.pdfUrl) {
        deleteFile(existingAnnouncement.pdfUrl);
      } else if (!req.body.pdfUrl && existingAnnouncement.pdfUrl) {
        deleteFile(existingAnnouncement.pdfUrl);
      }

      const updated = await jsonStorage.updateAnnouncement(conference.slug, req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });



  app.post('/api/announcements/:id/view', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const updated = await jsonStorage.incrementAnnouncementViews(conference.slug, req.params.id);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/announcements/:conferenceSlug/:id/view', async (req, res) => {
    try {
      const { conferenceSlug } = req.params;
      const updated = await jsonStorage.incrementAnnouncementViews(conferenceSlug, req.params.id);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/announcements/:id', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      await jsonStorage.deleteAnnouncement(conference.slug, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/admin/announcements/all', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      await jsonStorage.deleteAllAnnouncements(conference.slug);
      res.json({ success: true, message: "All announcements deleted." });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/sightseeing', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.json([]);
      }
      const sightseeing = await jsonStorage.getSightseeing(conference.slug);
      res.json(sightseeing);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sightseeing" });
    }
  });

  app.get('/api/sightseeing/slug/:conferenceSlug', async (req, res) => {
    try {
      const { conferenceSlug } = req.params;
      const sightseeing = await jsonStorage.getSightseeing(conferenceSlug);
      res.json(sightseeing);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sightseeing" });
    }
  });

  app.get('/api/sightseeing/:id', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const sightseeing = await jsonStorage.getSightseeingById(conference.slug, req.params.id);
      if (!sightseeing) {
        return res.status(404).json({ message: "Sightseeing not found" });
      }
      res.json(sightseeing);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch sightseeing" });
    }
  });

  app.get('/api/sightseeing/:conferenceSlug/:id', async (req, res) => {
    try {
      const { conferenceSlug } = req.params;
      const sightseeing = await jsonStorage.getSightseeingById(conferenceSlug, req.params.id);
      if (!sightseeing) {
        return res.status(404).json({ message: "Sightseeing not found" });
      }
      res.json(sightseeing);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch sightseeing" });
    }
  });

  app.post('/api/sightseeing', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const data = insertSightseeingSchema.parse(req.body);
      const sightseeing = await jsonStorage.createSightseeing(conference.slug, { ...data, conferenceId: conference.slug, featuredImageUrl: data.featuredImageUrl || '' });
      res.json(sightseeing);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/sightseeing/:id', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const updated = await jsonStorage.updateSightseeing(conference.slug, req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/sightseeing/:id', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      await jsonStorage.deleteSightseeing(conference.slug, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/admin/registrations', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }

      const registrationData = insertRegistrationSchema.parse({
        ...req.body,
        conferenceSlug: conference.slug,
      });

      const newRegistration = await createAdminRegistration(registrationData);
      res.status(201).json(newRegistration);
    } catch (error: any) {
      console.error("Error adding admin registration:", error);
      res.status(400).json({ message: error.message || "Failed to add registration." });
    }
  });

  app.get('/api/registrations', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.json({ data: [], total: 0 });
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { registrations: regs, total } = await getRegistrationsByConferenceSlug(conference.slug, page, limit);
      res.json({ data: regs, total });
    } catch (error) {
      console.error("Error fetching paginated registrations:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  app.get('/api/registrations/export', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).send("No active conference found.");
      }
      const { registrations } = await getRegistrationsByConferenceSlug(conference.slug, 1, Number.MAX_SAFE_INTEGER);

      const headers = [
        "ID", "Họ và tên", "Email", "Điện thoại", "Tổ chức", "Chức danh",
        "Phiên đăng ký", "Yêu cầu CME", "Trạng thái", "Thời gian đăng ký"
      ];

      const csvRows = [];
      for (const r of registrations) {
        const session = await jsonStorage.getSession(conference.slug, r.sessionId);
        csvRows.push([
          `"${r.id}"`,
          `"${r.fullName}"`, 
          `"${r.email}"`, 
          `"${r.phone}"`, 
          `"${r.organization || ''}"`, 
          `"${r.position || ''}"`, 
          `"${session?.title || ''}"`, 
          `"${r.cmeCertificateRequested ? 'Có' : 'Không'}"`, 
          `"${r.status}"`, 
          `"${r.registeredAt ? new Date(r.registeredAt).toLocaleString() : ''}"`
        ].join(","));
      }

      const csvContent = [headers.join(","), ...csvRows].join("\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=registrations-${conference.slug}.csv`);
      res.send(csvContent);

    } catch (error) {
      console.error("Error exporting registrations:", error);
      res.status(500).send("Failed to export registrations");
    }
  });

  app.get('/api/sponsors', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.json([]);
      }
      const sponsors = await jsonStorage.getSponsors(conference.slug);
      res.json(sponsors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sponsors" });
    }
  });

  app.get('/api/sponsors/:conferenceSlug', async (req, res) => {
    try {
      const { conferenceSlug } = req.params;
      const sponsors = await jsonStorage.getSponsors(conferenceSlug);
      res.json(sponsors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sponsors" });
    }
  });

  app.post('/api/sponsors', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const data = insertSponsorSchema.parse(req.body);
      const sponsor = await jsonStorage.createSponsor(conference.slug, { ...data, conferenceId: conference.slug, logoUrl: data.logoUrl || '', websiteUrl: data.websiteUrl || '' });
      res.json(sponsor);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/sponsors/:id', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const updated = await jsonStorage.updateSponsor(conference.slug, req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/sponsors/:id', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      await jsonStorage.deleteSponsor(conference.slug, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/admin/sponsors/all', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      await jsonStorage.deleteAllSponsors(conference.slug);
      res.json({ success: true, message: "All sponsors deleted." });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/whitelists', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.json([]);
      }
      const whitelists = await jsonStorage.getWhitelists(conference.slug);
      res.json(whitelists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch whitelists" });
    }
  });

  app.post('/api/whitelists', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const whitelist = await jsonStorage.addToWhitelist(conference.slug, req.body.email);
      res.json(whitelist);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/whitelists/:id', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      await jsonStorage.removeFromWhitelist(conference.slug, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/registrations/confirm/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const registration = await db.select().from(registrationsTable).where(eq(registrationsTable.confirmationToken, token)).limit(1);

      if (!registration.length) {
        return res.status(400).send("Invalid confirmation token.");
      }

      const reg = registration[0];

      if (reg.confirmationTokenExpires && new Date(reg.confirmationTokenExpires) < new Date()) {
        return res.status(400).send("Confirmation token has expired.");
      }

      await db.update(registrationsTable).set({ status: 'confirmed', confirmationToken: null, confirmationTokenExpires: null }).where(eq(registrationsTable.id, reg.id));

      const conference = await jsonStorage.getActiveConference();
      if (conference) {
        const userRegistrations = await getRegistrationsByEmail(reg.email, conference.slug);
        const allSessions = await jsonStorage.getSessions(conference.slug);
        const sessionDetails = userRegistrations
          .map((registration) => {
            const session = allSessions.find(s => s.id === registration.sessionId);
            if (!session) return null;
            
            const startTime = new Date(session.startTime);
            const endTime = new Date(session.endTime);
            const sessionTime = `${startTime.toLocaleDateString('vi-VN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} | ${startTime.toLocaleTimeString('vi-VN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })} - ${endTime.toLocaleTimeString('vi-VN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}`;
            
            return {
              title: session.title,
              time: sessionTime,
              room: session.room,
              qrCode: registration.qrCode,
            };
          })
          .filter(Boolean) as Array<{
            title: string;
            time: string;
            room: string;
            qrCode: string;
          }>;

        if (sessionDetails.length > 0) {
          await sendConsolidatedRegistrationEmail(
            reg.email,
            reg.fullName,
            conference.name,
            reg.cmeCertificateRequested,
            sessionDetails
          );
        }
      }

      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Registration Confirmed</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f3f4f6;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
            .container {
              background-color: #ffffff;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              text-align: center;
            }
            h1 {
              color: #335CFF;
              font-size: 28px;
              font-weight: 700;
            }
            p {
              font-size: 16px;
              color: #374151;
            }
            a {
              background-color: #335CFF;
              color: #ffffff;
              padding: 10px 20px;
              border-radius: 5px;
              text-decoration: none;
              font-weight: bold;
              display: inline-block;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Đăng ký thành công!</h1>
            <p>Cảm ơn bạn đã xác nhận đăng ký. Chúng tôi đã gửi một email với mã QR của bạn.</p>
            <p><a href="/">Quay lại trang chủ</a></p>
          </div>
        </body>
        </html>
      `);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });



  app.get('/api/registrations/session/:sessionId', async (req, res) => {
    try {
      const registrations = await getRegistrationsBySession(req.params.sessionId);
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session registrations" });
    }
  });

  app.post('/api/registrations/batch', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }

      const requestData = batchRegistrationRequestSchema.parse({
        ...req.body,
        conferenceSlug: conference.slug,
      });

      const allSessions = await jsonStorage.getSessions(conference.slug);

      const result = await batchRegisterSessions(
        requestData,
        allSessions,
      );

      if (!result.success) {
        return res.status(400).json({ 
          message: result.error,
          failedSessions: result.failedSessions 
        });
      }

      let emailSent = false;
      if (result.confirmationToken) {
        emailSent = await sendRegistrationVerificationEmail(
          requestData.email,
          requestData.fullName,
          conference.name,
          result.confirmationToken!
        );
      }

      res.json({ 
        success: true,
        registrations: result.registrations,
        emailSent: emailSent,
        message: `Successfully registered for ${result.registrations?.length} sessions`
      });
    } catch (error: any) {
      console.error("Batch registration error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/sessions/capacity', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.json([]);
      }
      const sessions = await jsonStorage.getSessions(conference.slug);
      const capacityStatus = await getSessionCapacityStatus(sessions);
      res.json(capacityStatus);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch capacity status" });
    }
  });

  app.get('/api/check-ins/session/:sessionId', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { checkIns, total } = await getCheckInsBySession(req.params.sessionId, page, limit);
      const formattedCheckIns = checkIns.map(result => ({
        ...result.checkIns,
        registration: result.registrations,
      }));
      res.json({ data: formattedCheckIns, total });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch check-ins" });
    }
  });

  app.post('/api/check-ins', checkActiveConference, async (req: any, res) => {
    try {
      const { qrData, sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      const parts = qrData.split('|');
      if (parts.length < 5) {
        return res.status(400).json({ message: "Invalid QR code format" });
      }

      const [, qrConferenceSlug, qrSessionId, email, timestampStr] = parts;
      
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }

      if (qrConferenceSlug !== conference.slug) {
        console.warn(`Check-in failed: QR code conference slug (${qrConferenceSlug}) does not match active conference slug (${conference.slug}).`);
        return res.status(400).json({ message: "QR code is for a different conference." });
      }
      console.log(`Debugging Check-in: qrSessionId=${qrSessionId}, sessionIdFromRequestBody=${sessionId}`);
      if (qrSessionId !== sessionId) {
        console.warn(`Check-in failed: QR code session ID (${parts}) does not match selected session ID (${sessionId}).`);
        return res.status(400).json({ message: "QR code is for a different session than the one selected." });
      }

      const session = await jsonStorage.getSession(conference.slug, sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const registrations = await getRegistrationsByEmail(email, conference.slug);
      const registration = registrations.find(r => r.sessionId === qrSessionId);

      if (!registration) {
        return res.status(404).json({ message: "Registration not found for this session" });
      }

      const alreadyCheckedIn = await isCheckedIn(registration.id, sessionId);
      if (alreadyCheckedIn) {
        return res.status(400).json({ message: "Already checked in for this session" });
      }

      const checkIn = await createCheckIn({
        registrationId: registration.id,
        sessionId,
        method: 'qr',
      });

      if (registration.cmeCertificateRequested && !registration.conferenceCertificateSent) {
        if (session) {
          const certificate = await generateCmeCertificate(registration.fullName);
          await sendCmeCertificateEmail(registration.email, registration.fullName, "", conference.name, certificate);
          
          await db.update(registrationsTable).set({ conferenceCertificateSent: true }).where(eq(registrationsTable.id, registration.id)).run();
        }
      }

      res.json(checkIn);
    } catch (error: any) {
      console.error("Check-in error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/check-ins/manual', checkActiveConference, async (req: any, res) => {
    try {
      const { registrationId } = req.body;
      if (!registrationId) {
        return res.status(400).json({ message: "Registration ID is required" });
      }

      const registration = await db.query.registrations.findFirst({
        where: eq(registrationsTable.id, registrationId),
      });

      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }

      if (registration.status !== "confirmed") {
        return res.status(400).json({ message: "Registration not confirmed" });
      }

      const alreadyCheckedIn = await isCheckedIn(registration.id, registration.sessionId);
      if (alreadyCheckedIn) {
        return res.status(400).json({ message: "Already checked in for this session" });
      }

      const checkIn = await createCheckIn({
        registrationId: registration.id,
        sessionId: registration.sessionId,
        method: 'manual',
      });

      const conference = req.activeConference;
      const session = conference ? await jsonStorage.getSession(conference.slug, registration.sessionId) : null;

      if (registration.cmeCertificateRequested && !registration.conferenceCertificateSent) {
        if (session && conference) {
          const certificate = await generateCmeCertificate(registration.fullName);
          await sendCmeCertificateEmail(registration.email, registration.fullName, "", conference.name, certificate);
          
          await db.update(registrationsTable).set({ conferenceCertificateSent: true }).where(eq(registrationsTable.id, registration.id)).run();
        }
      }

      res.json(checkIn);
    } catch (error: any) {
      console.error("Manual check-in error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/admin/stats', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.json({ 
          totalRegistrations: 0, 
          uniqueAttendees: 0,
          totalCheckIns: 0, 
          uniqueCheckedInAttendees: 0,
          totalSessions: 0, 
          totalSponsors: 0 
        });
      }

      const contentStats = await jsonStorage.getContentStats(conference.slug);

      const regStats = await getRegistrationStats(conference.slug);

      res.json({
        ...contentStats,
        ...regStats,
      });
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/analytics', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.json({});
      }

      const contentStats = await jsonStorage.getContentStats(conference.slug);
      const regStats = await getRegistrationStats(conference.slug);

      res.json({
        ...contentStats,
        ...regStats,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get("/uploads/:filePath(*)", (req, res) => {
    const filePath = req.params.filePath;
    const absolutePath = path.join(uploadDir, filePath);
    if (fs.existsSync(absolutePath)) {
      res.sendFile(absolutePath);
    } else {
      res.status(404).json({ error: "File not found" });
    }
  });

  app.post('/api/contact', async (req, res) => {
    try {
      const { recaptcha, ...data } = contactFormSchema.parse(req.body);
      const message = await createContactMessage(data);
      res.json(message);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/contact-messages', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { messages, total } = await getContactMessages(page, limit);
      res.json({ data: messages, total });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contact messages" });
    }
  });

  app.get('/api/admin/contact-messages/search', async (req, res) => {
    try {
      const query = req.query.query as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required." });
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { messages, total } = await searchContactMessages(query, page, limit);
      res.json({ data: messages, total });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/admin/contact-messages/:id', async (req, res) => {
    try {
      const success = await deleteContactMessage(req.params.id);
      if (success) {
        res.json({ success: true, message: "Contact message deleted." });
      } else {
        res.status(404).json({ message: "Contact message not found." });
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/admin/contact-messages/all', async (req, res) => {
    try {
      await deleteAllContactMessages();
      res.json({ success: true, message: "All contact messages deleted." });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/admin/registrations/:id', async (req, res) => {
    try {
      const success = await deleteRegistration(req.params.id);
      if (success) {
        res.json({ success: true, message: "Registration deleted." });
      } else {
        res.status(404).json({ message: "Registration not found." });
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/upload', async (req, res) => {
    try {
      const { filePath } = req.query;
      if (!filePath || typeof filePath !== 'string') {
        return res.status(400).json({ message: "File path is required as a query parameter." });
      }
      deleteFile(filePath);
      res.json({ success: true, message: `File ${filePath} deleted.` });
    } catch (error: any) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: error.message || "Failed to delete file." });
    }
  });

  app.get('/api/admin/registrations/search', checkActiveConference, async (req: any, res) => {
    try {
      const conference = req.activeConference;
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const query = req.query.query as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required." });
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { registrations, total } = await searchRegistrations(conference.slug, query, page, limit);
      res.json({ data: registrations, total });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/admin/bulk-checkin-registrations', checkActiveConference, async (req: any, res) => {
    try {
      const { registrationIds, sessionId } = req.body;
      if (!Array.isArray(registrationIds) || !sessionId) {
        return res.status(400).json({ message: "registrationIds array and sessionId are required." });
      }

      let successCount = 0;
      let failCount = 0;

      for (const regId of registrationIds) {
        try {
          const registration = await db.query.registrations.findFirst({
            where: eq(registrationsTable.id, regId),
          });

          // Validation checks
          if (!registration || registration.sessionId !== sessionId || registration.status !== 'confirmed') {
            failCount++;
            continue;
          }

          const alreadyCheckedIn = await isCheckedIn(registration.id, sessionId);
          if (alreadyCheckedIn) {
            successCount++; // Already checked in, count as success
            continue;
          }

          await createCheckIn({
            registrationId: registration.id,
            sessionId: sessionId,
            method: 'manual',
          });
          successCount++;
        } catch (e) {
          console.error(`Failed to check in registration ${regId}:`, e);
          failCount++;
        }
      }
      res.json({ successCount, failCount });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}