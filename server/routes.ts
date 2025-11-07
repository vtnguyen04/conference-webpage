import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { jsonStorage } from "./jsonStorage";
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
} from "./registrationDb";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import nodemailer from "nodemailer";
import { insertConferenceSchema, insertSessionSchema, insertSpeakerSchema, insertSponsorSchema, insertAnnouncementSchema, batchRegistrationRequestSchema } from "@shared/schema";
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

// Helper function to delete image files
function deleteImageFile(imagePath: string) {
  if (imagePath && imagePath.startsWith('/uploads/')) {
    const filePath = path.join(process.cwd(), "public", imagePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted image file: ${filePath}`);
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
) {
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
  } catch (error) {
    console.error("Failed to send email:", error);
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
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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
      const session = await jsonStorage.createSession(conference.year, data);
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
      const speaker = await jsonStorage.createSpeaker(conference.year, data);
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
      const sponsor = await jsonStorage.createSponsor(conference.year, data);
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

  app.post('/api/announcements', async (req, res) => {
    try {
      const conference = await jsonStorage.getActiveConference();
      if (!conference) {
        return res.status(404).json({ message: "No active conference" });
      }
      const data = insertAnnouncementSchema.parse(req.body);
      const announcement = await jsonStorage.createAnnouncement(conference.year, data);
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

  // SESSION-BASED REGISTRATION ROUTES
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
      const csvRows = registrations.map(r => {
        const session = jsonStorage.getSession(conference.year, r.sessionId); // Assuming jsonStorage has getSession
        return [
          `"${r.id}"`, // Wrap in quotes to handle commas in IDs if any
          `"${r.fullName}"`, 
          `"${r.email}"`, 
          `"${r.phone}"`, 
          `"${r.organization || ''}"`, 
          `"${r.position || ''}"`, 
          `"${session?.title || ''}"`, 
          `"${r.cmeCertificateRequested ? 'Có' : 'Không'}"`, 
          `"${r.status}"`, 
          `"${new Date(r.registeredAt).toLocaleString()}"`
        ].join(",");
      });

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
          await sendConsolidatedRegistrationEmail(
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

  // Public object serving
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Protected object serving with ACL check
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const userId = (req.session as any).userId;
    const userEmail = (req.session as any).userEmail;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        userEmail: userEmail,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Object storage upload URL generation
  app.post('/api/objects/upload', async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const url = await objectStorageService.getObjectEntityUploadURL();
      res.json({ url, method: "PUT" as const });
    } catch (error: any) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Face photo upload with ACL
  app.put('/api/face-photos', async (req, res) => {
    if (!req.body.facePhotoURL) {
      return res.status(400).json({ error: "facePhotoURL is required" });
    }

    const userId = (req.session as any).userId;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.facePhotoURL,
        {
          owner: userId,
          visibility: "private",
        },
      );

      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error setting face photo:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Logo upload with ACL
  app.put('/api/logos', async (req, res) => {
    if (!req.body.logoURL) {
      return res.status(400).json({ error: "logoURL is required" });
    }

    const userId = (req.session as any).userId;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.logoURL,
        {
          owner: userId,
          visibility: "public",
        },
      );

      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error setting logo:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Banner upload with ACL
  app.put('/api/banners', async (req, res) => {
    if (!req.body.bannerURL) {
      return res.status(400).json({ error: "bannerURL is required" });
    }

    const userId = (req.session as any).userId;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.bannerURL,
        {
          owner: userId,
          visibility: "public",
        },
      );

      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error setting banner:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}