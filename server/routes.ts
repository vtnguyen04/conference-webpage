import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage as dbStorage } from "./storage";
import { jsonStorage } from "./jsonStorage";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { registrations as registrationsTable } from "@shared/schema"; // Renamed import to avoid conflict
import {
  getRegistrationsByYear,
  getRegistrationsBySession,
  getRegistrationsByEmail,
  batchRegisterSessions,
  createCheckIn,
  getCheckInsBySession,
  isCheckedIn,
  getRegistrationStats,
  getSessionCapacityStatus,
  deleteRegistrationsByYear,
  deleteRegistration,
  searchRegistrations,
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

import { insertConferenceSchema, insertSessionSchema, insertSpeakerSchema, insertSponsorSchema, insertAnnouncementSchema, insertSightseeingSchema, batchRegistrationRequestSchema, contactFormSchema } from "@shared/schema";
console.log('insertSponsorSchema:', insertSponsorSchema);
import multer from "multer";
import path from "path";
import fs from "fs";

// Set up multer for local file uploads
const uploadDir = path.join(process.cwd(), "public", "uploads");
// Ensure upload directory exists
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

// Helper function to delete files
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
  // Setup authentication
  setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      const userId = req.session.userId; // Assuming userId is stored in session
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // For the simple admin login, if userId is "admin", return a dummy user
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
      res.clearCookie('connect.sid'); // Clear session cookie
      res.json({ message: "Logged out successfully" });
    });
  });

  app.post('/api/login', async (req: any, res) => {
    try {
      const { email, password } = req.body;

      // For now, a very basic admin login
      if (email === "admin@example.com" && password === process.env.ADMIN_PASSWORD) {
        req.session.userId = "admin"; // Set a dummy user ID for the session
        req.session.save((err: any) => {
          if (err) {
            console.error("Error saving session after login:", err);
            return res.status(500).json({ message: "Failed to save session" });
          }
          return res.json({ message: "Login successful" });
        });
      } else {
        return res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Local image upload route
  app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded." });
      }

      const imagePath = `/uploads/${req.file.filename}`;

      // Handle oldImagePath for deletion if provided
      const oldImagePath = req.body.oldImagePath;
      if (oldImagePath) {
        const oldFilePath = path.join(process.cwd(), "public", oldImagePath);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath); // Delete old file
          console.log(`Deleted old image: ${oldFilePath}`);
        }
      }

      res.json({ imagePath });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: error.message || "Failed to upload image." });
    }
  });

  // Local PDF upload route
  app.post('/api/upload-pdf', upload.single('pdf'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded." });
      }

      const pdfPath = `/uploads/${req.file.filename}`;

      // Handle oldPdfPath for deletion if provided
      const oldPdfPath = req.body.oldPdfPath;
      if (oldPdfPath) {
        deleteFile(oldPdfPath); // Use the generic deleteFile function
      }

      res.json({ pdfPath });
    } catch (error: any) {
      console.error("Error uploading PDF:", error);
      res.status(500).json({ message: error.message || "Failed to upload PDF." });
    }
  });

  // Local multiple banner upload route
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

  // Conference routes
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

  app.post('/api/conferences', async (req, res) => {
    try {
      const data = insertConferenceSchema.parse(req.body);
      const conference = await jsonStorage.createConference(data);
      res.json(conference);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/conferences/active', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference found" });
      }
      
      const { filesToDelete, ...updates } = req.body;

      // Handle deletion of banners marked for deletion
      if (Array.isArray(filesToDelete)) {
        filesToDelete.forEach(filePath => {
          deleteFile(filePath);
        });
      }

      const updated = await jsonStorage.updateConference(conference.year, updates);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/conferences/clone', async (req, res) => {
    try {
      const { toYear } = req.body;
      const activeConf = await jsonStorage.getActiveConference();
      if (!activeConf) {
        return res.status(404).json({ message: "No active conference to clone" });
      }
      const cloned = await jsonStorage.cloneConference(activeConf.year, toYear);
      res.json(cloned);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/conferences/:year/activate', async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      await jsonStorage.setActiveConference(year);
      res.json({ success: true, message: `Conference ${year} activated.` });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/conferences/:year', async (req, res) => {
    try {
      const year = parseInt(req.params.year);

      // First, delete related data from the database
      await deleteRegistrationsByYear(year);

      // Then, delete the JSON file and associated assets
      await jsonStorage.deleteConference(year);

      res.json({ success: true, message: `Conference ${year} and all its data deleted.` });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Session routes
  app.get('/api/sessions/:year', async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const sessions = await jsonStorage.getSessions(year);
      console.log(`API /api/sessions/${year}: Fetched sessions:`, sessions);
      res.json(sessions);
    } catch (error) {
      console.error(`API /api/sessions/${req.params.year}: Failed to fetch sessions:`, error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.get('/api/sessions', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      console.log("API /api/sessions: Active conference:", conference);
      if (!conference) {
        console.log("API /api/sessions: No active conference found, returning empty array.");
        return res.json([]);
      }
      const sessions = await jsonStorage.getSessions(conference.year);
      console.log("API /api/sessions: Fetched sessions:", sessions);
      res.json(sessions);
    } catch (error) {
      console.error("API /api/sessions: Failed to fetch sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.post('/api/sessions', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const data = insertSessionSchema.parse(req.body);
      const session = await jsonStorage.createSession(conference.year, { ...data, conferenceId: conference.id });
      res.json(session);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/sessions/:id', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const updated = await jsonStorage.updateSession(conference.year, req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/sessions/:id', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      await jsonStorage.deleteSession(conference.year, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/admin/sessions/all', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      await jsonStorage.deleteAllSessions(conference.year);
      res.json({ success: true, message: "All sessions deleted." });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Speaker routes
  app.get('/api/speakers', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.json([]);
      }
      const speakers = await jsonStorage.getSpeakers(conference.year);
      res.json(speakers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch speakers" });
    }
  });

  app.post('/api/speakers', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const data = insertSpeakerSchema.parse(req.body);
      const speaker = await jsonStorage.createSpeaker(conference.year, { ...data, conferenceId: conference.id, photoUrl: data.photoUrl || '' });
      res.json(speaker);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/speakers/:id', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const updated = await jsonStorage.updateSpeaker(conference.year, req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/speakers/:id', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      await jsonStorage.deleteSpeaker(conference.year, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/admin/speakers/all', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      await jsonStorage.deleteAllSpeakers(conference.year);
      res.json({ success: true, message: "All speakers deleted." });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Announcement routes
  app.get('/api/announcements', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.json([]);
      }
      const announcements = await jsonStorage.getAnnouncements(conference.year);
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.get('/api/announcements/:id', async (req, res) => {
    try {
      console.log(`Fetching announcement with ID: ${req.params.id}`);
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const announcement = await jsonStorage.getAnnouncement(conference.year, req.params.id);
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      res.json(announcement);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch announcement" });
    }
  });

  app.post('/api/announcements', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const data = insertAnnouncementSchema.parse(req.body);
      const announcement = await jsonStorage.createAnnouncement(conference.year, { ...data, conferenceId: conference.id, views: 0, featuredImageUrl: data.featuredImageUrl || '', pdfUrl: data.pdfUrl || '', publishedAt: data.publishedAt || '' });
      res.json(announcement);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/announcements/:id', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const existingAnnouncement = await jsonStorage.getAnnouncement(conference.year, req.params.id);
      if (!existingAnnouncement) {
        return res.status(404).json({ message: "Announcement not found" });
      }

      // Handle featuredImageUrl replacement
      if (req.body.featuredImageUrl && existingAnnouncement.featuredImageUrl && req.body.featuredImageUrl !== existingAnnouncement.featuredImageUrl) {
        deleteFile(existingAnnouncement.featuredImageUrl);
      } else if (!req.body.featuredImageUrl && existingAnnouncement.featuredImageUrl) {
        deleteFile(existingAnnouncement.featuredImageUrl);
      }

      // Handle pdfUrl replacement
      if (req.body.pdfUrl && existingAnnouncement.pdfUrl && req.body.pdfUrl !== existingAnnouncement.pdfUrl) {
        deleteFile(existingAnnouncement.pdfUrl);
      } else if (!req.body.pdfUrl && existingAnnouncement.pdfUrl) {
        deleteFile(existingAnnouncement.pdfUrl);
      }

      const updated = await jsonStorage.updateAnnouncement(conference.year, req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/announcements/:id/view', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const updated = await jsonStorage.incrementAnnouncementViews(conference.year, req.params.id);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/announcements/:id', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      await jsonStorage.deleteAnnouncement(conference.year, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/admin/announcements/all', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      await jsonStorage.deleteAllAnnouncements(conference.year);
      res.json({ success: true, message: "All announcements deleted." });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Sightseeing routes
  app.get('/api/sightseeing', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.json([]);
      }
      const sightseeing = await jsonStorage.getSightseeing(conference.year);
      res.json(sightseeing);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sightseeing" });
    }
  });

  app.get('/api/sightseeing/:id', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const sightseeing = await jsonStorage.getSightseeingById(conference.year, req.params.id);
      if (!sightseeing) {
        return res.status(404).json({ message: "Sightseeing not found" });
      }
      res.json(sightseeing);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch sightseeing" });
    }
  });

  app.post('/api/sightseeing', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const data = insertSightseeingSchema.parse(req.body);
      const sightseeing = await jsonStorage.createSightseeing(conference.year, { ...data, conferenceId: conference.id, featuredImageUrl: data.featuredImageUrl || '' });
      res.json(sightseeing);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/sightseeing/:id', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const updated = await jsonStorage.updateSightseeing(conference.year, req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/sightseeing/:id', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      await jsonStorage.deleteSightseeing(conference.year, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get all registrations for current conference year (Paginated for frontend)
  app.get('/api/registrations', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.json({ data: [], total: 0 });
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { registrations: regs, total } = await getRegistrationsByYear(conference.year, page, limit);
      res.json({ data: regs, total }); // Correct response for paginated data
    } catch (error) {
      console.error("Error fetching paginated registrations:", error); // Added specific error logging
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  app.get('/api/registrations/export', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).send("No active conference found.");
      }
      const { registrations } = await getRegistrationsByYear(conference.year, 1, Number.MAX_SAFE_INTEGER);

      // CSV Headers
      const headers = [
        "ID", "Họ và tên", "Email", "Điện thoại", "Tổ chức", "Chức danh",
        "Phiên đăng ký", "Yêu cầu CME", "Trạng thái", "Thời gian đăng ký"
      ];

      // Map registrations to CSV rows
      const csvRows = [];
      for (const r of registrations) {
        const session = await jsonStorage.getSession(conference.year, r.sessionId);
        csvRows.push([
          `"${r.id}"`, // Wrap in quotes to handle commas in IDs if any
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
      res.setHeader("Content-Disposition", `attachment; filename=registrations-${conference.year}.csv`);
      res.send(csvContent);

    } catch (error) {
      console.error("Error exporting registrations:", error);
      res.status(500).send("Failed to export registrations");
    }
  });

  // Sponsor routes
  app.get('/api/sponsors', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.json([]);
      }
      const sponsors = await jsonStorage.getSponsors(conference.year);
      res.json(sponsors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sponsors" });
    }
  });

  app.post('/api/sponsors', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const data = insertSponsorSchema.parse(req.body);
      const sponsor = await jsonStorage.createSponsor(conference.year, { ...data, conferenceId: conference.id, logoUrl: data.logoUrl || '', websiteUrl: data.websiteUrl || '' });
      res.json(sponsor);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/sponsors/:id', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const updated = await jsonStorage.updateSponsor(conference.year, req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/sponsors/:id', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      await jsonStorage.deleteSponsor(conference.year, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/admin/sponsors/all', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      await jsonStorage.deleteAllSponsors(conference.year);
      res.json({ success: true, message: "All sponsors deleted." });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Whitelist management routes
  app.get('/api/whitelists', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.json([]);
      }
      const whitelists = await jsonStorage.getWhitelists(conference.year);
      res.json(whitelists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch whitelists" });
    }
  });

  app.post('/api/whitelists', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const whitelist = await jsonStorage.addToWhitelist(conference.year, req.body.email);
      res.json(whitelist);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/whitelists/:id', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      await jsonStorage.removeFromWhitelist(conference.year, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // SESSION-BASED REGISTRATION ROUTES
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

      // Send success email with QR codes
      const conference = await jsonStorage.getActiveConference();
      if (conference) {
        const userRegistrations = await getRegistrationsByEmail(reg.email, conference.year);
        const allSessions = await jsonStorage.getSessions(conference.year);
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
              color: #335CFF;
              text-decoration: none;
              font-weight: bold;
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

  // Get all registrations for current conference year
  app.get('/api/registrations', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.json([]);
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { registrations: regs, total } = await getRegistrationsByYear(conference.year, page, limit);
      res.json({ data: regs, total });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  app.get('/api/registrations/export', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).send("No active conference found.");
      }
      const { registrations } = await getRegistrationsByYear(conference.year, 1, Number.MAX_SAFE_INTEGER);

      // CSV Headers
      const headers = [
        "ID", "Họ và tên", "Email", "Điện thoại", "Tổ chức", "Chức danh",
        "Phiên đăng ký", "Yêu cầu CME", "Trạng thái", "Thời gian đăng ký"
      ];

      // Map registrations to CSV rows
      const csvRows = [];
      for (const r of registrations) {
        const session = await jsonStorage.getSession(conference.year, r.sessionId);
        csvRows.push([
          `"${r.id}"`, // Wrap in quotes to handle commas in IDs if any
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
      res.setHeader("Content-Disposition", `attachment; filename=registrations-${conference.year}.csv`);
      res.send(csvContent);

    } catch (error) {
      console.error("Error exporting registrations:", error);
      res.status(500).send("Failed to export registrations");
    }
  });

  // Get registrations for a specific session
  app.get('/api/registrations/session/:sessionId', async (req, res) => {
    try {
      const registrations = await getRegistrationsBySession(req.params.sessionId);
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session registrations" });
    }
  });

  // Batch register for multiple sessions
  app.post('/api/registrations/batch', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }

      // Validate request body
      const requestData = batchRegistrationRequestSchema.parse({
        ...req.body,
        conferenceYear: conference.year,
      });

      // Check whitelist validation (skip in development mode)
      // const isDevelopment = process.env.NODE_ENV === 'development';
      // const isWhitelisted = isDevelopment || await jsonStorage.checkWhitelist(conference.year, requestData.email);
      // if (!isWhitelisted) {
      //   return res.status(403).json({ 
      //     message: "Email not on the approved whitelist. Please contact the organizers." 
      //   });
      // }

      // Get all sessions for the conference
      const allSessions = await jsonStorage.getSessions(conference.year);

      // Perform batch registration (validates capacity, overlap, creates QR codes)
      const result = await batchRegisterSessions(
        requestData,
        allSessions,
        // isWhitelisted
      );

      if (!result.success) {
        return res.status(400).json({ 
          message: result.error,
          failedSessions: result.failedSessions 
        });
      }

      // Send ONE verification email
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

  // Get session capacity status
  app.get('/api/sessions/capacity', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.json([]);
      }
      const sessions = await jsonStorage.getSessions(conference.year);
      const capacityStatus = await getSessionCapacityStatus(sessions);
      res.json(capacityStatus);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch capacity status" });
    }
  });

  // SESSION-BASED CHECK-IN ROUTES
  // Get check-ins for a specific session
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

  // Create check-in for a session registration
  app.post('/api/check-ins', async (req, res) => {
    try {
      const { qrData, sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      // Parse QR code data: CONF|{year}|{sessionId}|{email}|{timestamp}
      const parts = qrData.split('|'); // <--- CHANGED FROM ',' TO '|'
      if (parts.length < 5) {
        return res.status(400).json({ message: "Invalid QR code format" });
      }

      const [, qrYearStr, qrSessionId, email, timestampStr] = parts; // Directly extract email and timestamp
      const qrYear = parseInt(qrYearStr);
      // No need to rejoin emailParts as email is now directly extracted
      // const emailWithTimestamp = emailParts.join('-');
      // const email = emailWithTimestamp.substring(0, emailWithTimestamp.lastIndexOf('-'));
      
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }

      // Validate QR code data against current conference and selected session
      if (qrYear !== conference.year) {
        console.warn(`Check-in failed: QR code year (${qrYear}) does not match conference year (${conference.year}).`);
        return res.status(400).json({ message: "QR code is for a different conference year." });
      }
      // Log values for debugging
      console.log(`Debugging Check-in: qrSessionId=${qrSessionId}, sessionIdFromRequestBody=${sessionId}`);
      if (qrSessionId !== sessionId) {
        console.warn(`Check-in failed: QR code session ID (${parts}) does not match selected session ID (${sessionId}).`);
        return res.status(400).json({ message: "QR code is for a different session than the one selected." });
      }

      // Find the session to check its time
      const session = await jsonStorage.getSession(conference.year, sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Find the registration for this email and session
      const registrations = await getRegistrationsByEmail(email, conference.year);
      const registration = registrations.find(r => r.sessionId === qrSessionId); // Use qrSessionId here

      if (!registration) {
        return res.status(404).json({ message: "Registration not found for this session" });
      }

      // Check for duplicate check-in
      const alreadyCheckedIn = await isCheckedIn(registration.id, sessionId);
      if (alreadyCheckedIn) {
        return res.status(400).json({ message: "Already checked in for this session" });
      }

      // Create check-in record
      const checkIn = await createCheckIn({
        registrationId: registration.id,
        sessionId,
        method: 'qr',
      });

      if (registration.cmeCertificateRequested && !registration.conferenceCertificateSent) { // NEW CONDITION
        if (session) {
          const certificate = await generateCmeCertificate(registration.fullName);
          await sendCmeCertificateEmail(registration.email, registration.fullName, "", conference.name, certificate); // Pass empty string
          
          // Update registration to mark certificate as sent
          await db.update(registrationsTable).set({ conferenceCertificateSent: true }).where(eq(registrationsTable.id, registration.id)).run(); // NEW UPDATE
        }
      }

      res.json(checkIn);
    } catch (error: any) {
      console.error("Check-in error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/check-ins/manual', async (req, res) => {
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

      // Check for duplicate check-in
      const alreadyCheckedIn = await isCheckedIn(registration.id, registration.sessionId);
      if (alreadyCheckedIn) {
        return res.status(400).json({ message: "Already checked in for this session" });
      }

      // Create check-in record
      const checkIn = await createCheckIn({
        registrationId: registration.id,
        sessionId: registration.sessionId,
        method: 'manual',
      });

      // Fetch conference and session details for certificate generation
      const conference = await jsonStorage.getActiveConference();
      const session = conference ? await jsonStorage.getSession(conference.year, registration.sessionId) : null;

      if (registration.cmeCertificateRequested && !registration.conferenceCertificateSent) { // NEW CONDITION
        if (session && conference) { // Ensure both session and conference are available
          const certificate = await generateCmeCertificate(registration.fullName);
          await sendCmeCertificateEmail(registration.email, registration.fullName, "", conference.name, certificate); // Pass empty string
          
          // Update registration to mark certificate as sent
          await db.update(registrationsTable).set({ conferenceCertificateSent: true }).where(eq(registrationsTable.id, registration.id)).run(); // NEW UPDATE
        }
      }

      res.json(checkIn);
    } catch (error: any) {
      console.error("Manual check-in error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // ANALYTICS ROUTES
  app.get('/api/admin/stats', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
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

      // Get content stats from JSON storage
      const contentStats = await jsonStorage.getContentStats(conference.year);

      // Get registration/check-in stats from PostgreSQL
      const regStats = await getRegistrationStats(conference.year);

      res.json({
        ...contentStats,
        ...regStats,
      });
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/analytics', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.json({});
      }

      // Get combined stats
      const contentStats = await jsonStorage.getContentStats(conference.year);
      const regStats = await getRegistrationStats(conference.year);

      res.json({
        ...contentStats,
        ...regStats,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Public object serving from local filesystem
  app.get("/uploads/:filePath(*)", (req, res) => {
    const filePath = req.params.filePath;
    const absolutePath = path.join(uploadDir, filePath);
    if (fs.existsSync(absolutePath)) {
      res.sendFile(absolutePath);
    } else {
      res.status(404).json({ error: "File not found" });
    }
  });

  // Contact Message Routes
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

  app.get('/api/admin/registrations/search', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const query = req.query.query as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required." });
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { registrations, total } = await searchRegistrations(conference.year, query, page, limit);
      res.json({ data: registrations, total });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}