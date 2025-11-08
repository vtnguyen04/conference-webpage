import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage as dbStorage } from "./storage";
import { jsonStorage } from "./jsonStorage";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { registrations } from "@shared/schema";
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
import { sendCmeCertificateEmail } from "./emailService";
import {
  createContactMessage,
  getContactMessages,
  getContactMessagesCount,
  deleteContactMessage,
  deleteAllContactMessages,
  searchContactMessages,
} from "./contactDb";
import { setupAuth } from "./sessionAuth";

import nodemailer from "nodemailer";
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

// Email transporter setup
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
});

// Helper function to send consolidated session registration email
async function sendConsolidatedRegistrationEmail(
  email: string,
  fullName: string,
  conferenceName: string,
  cmeCertificateRequested: boolean,
  sessions: Array<{
    title: string;
    time: string;
    room: string;
    qrCode: string;
  }>
): Promise<boolean> {
  try {
    const sessionRows = sessions.map((session, index) => `
      <tr>
        <td colspan="2" style="padding: 20px 0; ${index > 0 ? 'border-top: 2px solid #e5e7eb;' : ''}">
          <h3 style="margin: 0 0 10px 0; color: #335CFF;">${session.title}</h3>
          <p style="margin: 5px 0; color: #666;">
            <strong>Thời gian:</strong> ${session.time}<br/>
            <strong>Địa điểm:</strong> ${session.room}
          </p>
          <div style="margin-top: 15px;">
            <img src="${session.qrCode}" alt="QR Code - ${session.title}" style="width: 200px; height: 200px; border: 2px solid #335CFF; border-radius: 8px;" />
          </div>
        </td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px; background: linear-gradient(135deg, #FFC857 0%, #FF6B6B 50%, #335CFF 100%);">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                      Đăng ký thành công!
                    </h1>
                  </td>
                </tr>
                
                <!-- Greeting -->
                <tr>
                  <td style="padding: 30px 40px 20px;">
                    <p style="margin: 0 0 15px; font-size: 16px; color: #374151;">
                      Kính gửi <strong>${fullName}</strong>,
                    </p>
                    <p style="margin: 0 0 15px; font-size: 16px; color: #374151;">
                      Chúc mừng bạn đã đăng ký thành công <strong>${sessions.length} phiên</strong> tại <strong>${conferenceName}</strong>!
                    </p>
                    ${cmeCertificateRequested ? `
                      <div style="padding: 12px; background-color: #FEF3C7; border-left: 4px solid #FFC857; margin: 15px 0;">
                        <p style="margin: 0; color: #92400E; font-size: 14px;">
                          <strong>Lưu ý:</strong> Bạn đã yêu cầu chứng chỉ CME cho các phiên đã đăng ký.
                        </p>
                      </div>
                    ` : ''}
                  </td>
                </tr>
                
                <!-- Session Details -->
                <tr>
                  <td style="padding: 0 40px 30px;">
                    <table style="width: 100%; border-collapse: collapse;">
                      ${sessionRows}
                    </table>
                  </td>
                </tr>
                
                <!-- Instructions -->
                <tr>
                  <td style="padding: 0 40px 30px;">
                    <div style="background-color: #EFF6FF; border-radius: 8px; padding: 20px;">
                      <h3 style="margin: 0 0 10px; color: #1E40AF; font-size: 18px;">Hướng dẫn check-in</h3>
                      <ul style="margin: 10px 0; padding-left: 20px; color: #1E40AF;">
                        <li style="margin: 8px 0;">Vui lòng mang theo mã QR khi tham dự hội nghị</li>
                        <li style="margin: 8px 0;">Mỗi phiên có mã QR riêng - vui lòng check-in đúng phiên</li>
                        <li style="margin: 8px 0;">Bạn có thể lưu email này hoặc chụp ảnh mã QR</li>
                      </ul>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">
                      Trân trọng,<br/>
                      <strong>Ban tổ chức ${conferenceName}</strong>
                    </p>
                    <p style="margin: 10px 0 0; font-size: 12px; color: #9ca3af;">
                      Email này được gửi tự động. Vui lòng không trả lời email này.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await emailTransporter.sendMail({
      from: process.env.SMTP_FROM || '"Conference System" <noreply@conference.edu.vn>',
      to: email,
      subject: `Xác nhận đăng ký ${sessions.length} phiên - ${conferenceName}`,
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
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
      const updated = await jsonStorage.updateConference(conference.year, req.body);
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
  app.get('/api/sessions', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.json([]);
      }
      const sessions = await jsonStorage.getSessions(conference.year);
      res.json(sessions);
    } catch (error) {
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

  // Note: Session-Speaker association is now managed via agendaItems array in Session JSON
  // No separate junction table needed

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

  app.delete('/api/admin/sightseeing/all', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      await jsonStorage.deleteAllSightseeing(conference.year);
      res.json({ success: true, message: "All sightseeing items deleted." });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // SESSION-BASED REGISTRATION ROUTES
  app.get('/api/registrations/confirm/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const registration = await db.select().from(registrations).where(eq(registrations.confirmationToken, token)).limit(1);

      if (!registration.length) {
        return res.status(400).send("Invalid confirmation token.");
      }

      const reg = registration[0];

      if (reg.confirmationTokenExpires && new Date(reg.confirmationTokenExpires) < new Date()) {
        return res.status(400).send("Confirmation token has expired.");
      }

      await db.update(registrations).set({ status: 'confirmed', confirmationToken: null, confirmationTokenExpires: null }).where(eq(registrations.id, reg.id));

      res.send("Registration confirmed successfully!");
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
      const registrations = await getRegistrationsByYear(conference.year);
      res.json(registrations);
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
      const registrations = await getRegistrationsByYear(conference.year);

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
      const isDevelopment = process.env.NODE_ENV === 'development';
      const isWhitelisted = isDevelopment || await jsonStorage.checkWhitelist(conference.year, requestData.email);
      if (!isWhitelisted) {
        return res.status(403).json({ 
          message: "Email not on the approved whitelist. Please contact the organizers." 
        });
      }

      // Get all sessions for the conference
      const allSessions = await jsonStorage.getSessions(conference.year);

      // Perform batch registration (validates capacity, overlap, creates QR codes)
      const result = await batchRegisterSessions(
        requestData,
        allSessions,
        isWhitelisted
      );

      if (!result.success) {
        return res.status(400).json({ 
          message: result.error,
          failedSessions: result.failedSessions 
        });
      }

      // Send ONE consolidated confirmation email with all sessions
      let emailSent = false;
      if (result.registrations && result.registrations.length > 0) {
        const sessionDetails = result.registrations
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
          emailSent = await sendConsolidatedRegistrationEmail(
            requestData.email,
            requestData.fullName,
            conference.name,
            requestData.cmeCertificateRequested,
            sessionDetails
          );
        }
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
      const checkIns = await getCheckInsBySession(req.params.sessionId);
      res.json(checkIns);
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

      // Parse QR code data: CONF-{year}-{sessionId}-{email}-{timestamp}
      const parts = qrData.split('-');
      if (parts.length < 4) {
        return res.status(400).json({ message: "Invalid QR code format" });
      }

      const [, year, qrSessionId, ...emailParts] = parts;
      // Email might contain dashes, so rejoin
      const emailWithTimestamp = emailParts.join('-');
      const email = emailWithTimestamp.substring(0, emailWithTimestamp.lastIndexOf('-'));
      
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }

      // Find the registration for this email and session
      const registrations = await getRegistrationsByEmail(email, conference.year);
      const registration = registrations.find(r => r.sessionId === sessionId);

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

      if (registration.cmeCertificateRequested) {
        const session = await jsonStorage.getSession(conference.year, sessionId);
        if (session) {
          const certificate = await generateCmeCertificate(registration.fullName, session.title);
          await sendCmeCertificateEmail(registration.email, registration.fullName, session.title, certificate);
        }
      }

      res.json(checkIn);
    } catch (error: any) {
      console.error("Check-in error:", error);
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



// ... (rest of the file)

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
      // This should be a protected route in a real app
      const messages = await getContactMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contact messages" });
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

  // Note: Session-Speaker association is now managed via agendaItems array in Session JSON
  // No separate junction table needed

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
    } catch (error) {
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
    } catch (error) {
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

  // SESSION-BASED REGISTRATION ROUTES
  app.get('/api/registrations/confirm/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const registration = await db.select().from(registrations).where(eq(registrations.confirmationToken, token)).limit(1);

      if (!registration.length) {
        return res.status(400).send("Invalid confirmation token.");
      }

      const reg = registration[0];

      if (reg.confirmationTokenExpires && new Date(reg.confirmationTokenExpires) < new Date()) {
        return res.status(400).send("Confirmation token has expired.");
      }

      await db.update(registrations).set({ status: 'confirmed', confirmationToken: null, confirmationTokenExpires: null }).where(eq(registrations.id, reg.id));

      res.send("Registration confirmed successfully!");
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
      const registrations = await getRegistrationsByYear(conference.year);
      res.json(registrations);
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
      const registrations = await getRegistrationsByYear(conference.year);

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
      const isDevelopment = process.env.NODE_ENV === 'development';
      const isWhitelisted = isDevelopment || await jsonStorage.checkWhitelist(conference.year, requestData.email);
      if (!isWhitelisted) {
        return res.status(403).json({ 
          message: "Email not on the approved whitelist. Please contact the organizers." 
        });
      }

      // Get all sessions for the conference
      const allSessions = await jsonStorage.getSessions(conference.year);

      // Perform batch registration (validates capacity, overlap, creates QR codes)
      const result = await batchRegisterSessions(
        requestData,
        allSessions,
        isWhitelisted
      );

      if (!result.success) {
        return res.status(400).json({ 
          message: result.error,
          failedSessions: result.failedSessions 
        });
      }

      // Send ONE consolidated confirmation email with all sessions
      let emailSent = false;
      if (result.registrations && result.registrations.length > 0) {
        const sessionDetails = result.registrations
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
          emailSent = await sendConsolidatedRegistrationEmail(
            requestData.email,
            requestData.fullName,
            conference.name,
            requestData.cmeCertificateRequested,
            sessionDetails
          );
        }
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
      const checkIns = await getCheckInsBySession(req.params.sessionId);
      res.json(checkIns);
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

      // Parse QR code data: CONF-{year}-{sessionId}-{email}-{timestamp}
      const parts = qrData.split('-');
      if (parts.length < 4) {
        return res.status(400).json({ message: "Invalid QR code format" });
      }

      const [, year, qrSessionId, ...emailParts] = parts;
      // Email might contain dashes, so rejoin
      const emailWithTimestamp = emailParts.join('-');
      const email = emailWithTimestamp.substring(0, emailWithTimestamp.lastIndexOf('-'));
      
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }

      // Find the registration for this email and session
      const registrations = await getRegistrationsByEmail(email, conference.year);
      const registration = registrations.find(r => r.sessionId === sessionId);

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

      if (registration.cmeCertificateRequested) {
        const session = await jsonStorage.getSession(conference.year, sessionId);
        if (session) {
          const certificate = await generateCmeCertificate(registration.fullName, session.title);
          await sendCmeCertificateEmail(registration.email, registration.fullName, session.title, certificate);
        }
      }

      res.json(checkIn);
    } catch (error: any) {
      console.error("Check-in error:", error);
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



// ... (rest of the file)

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
      // This should be a protected route in a real app
      const messages = await getContactMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contact messages" });
    }
  });

  app.get('/api/stats/contact-messages', async (req, res) => {
    try {
      const count = await getContactMessagesCount();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contact messages count" });
    }
  });

  app.get('/api/admin/contact-messages/search', async (req, res) => {
    try {
      const query = req.query.query as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required." });
      }
      const messages = await searchContactMessages(query);
      res.json(messages);
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
      const registrations = await searchRegistrations(conference.year, query);
      res.json(registrations);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}