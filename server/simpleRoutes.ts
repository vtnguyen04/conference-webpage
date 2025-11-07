import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { jsonStorage } from "./jsonStorage";
import QRCode from "qrcode";
import session from "express-session";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Extend Express Request to include session
declare module 'express-session' {
  interface SessionData {
    isAuthenticated?: boolean;
  }
}

// Helper function to generate QR code
async function generateQRCode(data: string): Promise<string> {
  return await QRCode.toDataURL(data);
}

// Helper to get active year
async function getActiveYear(): Promise<number> {
  const conf = await jsonStorage.getActiveConference();
  return conf?.year || new Date().getFullYear();
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Setup session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "conference-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Session-based auth middleware
  const isAuthenticated = (req: Request, res: any, next: any) => {
    if (!req.session.isAuthenticated) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Auth routes
  app.post('/api/login', async (req: Request, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      req.session.isAuthenticated = true;
      res.json({ success: true });
    } else {
      res.status(401).json({ message: "Invalid password" });
    }
  });

  app.post('/api/logout', async (req: Request, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get('/api/auth/check', async (req: Request, res) => {
    res.json({ isAuthenticated: req.session.isAuthenticated || false });
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

  app.post('/api/conferences', isAuthenticated, async (req, res) => {
    try {
      const conference = await jsonStorage.createConference(req.body);
      res.json(conference);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/conferences/active', isAuthenticated, async (req, res) => {
    try {
      const year = await getActiveYear();
      const updated = await jsonStorage.updateConference(year, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/conferences/clone', isAuthenticated, async (req, res) => {
    try {
      const { toYear } = req.body;
      const fromYear = await getActiveYear();
      const cloned = await jsonStorage.cloneConference(fromYear, toYear);
      res.json(cloned);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Session routes
  app.get('/api/sessions', async (req, res) => {
    try {
      const year = await getActiveYear();
      const sessions = await jsonStorage.getSessions(year);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.post('/api/sessions', isAuthenticated, async (req, res) => {
    try {
      const year = await getActiveYear();
      const session = await jsonStorage.createSession(year, req.body);
      res.json(session);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/sessions/:id', isAuthenticated, async (req, res) => {
    try {
      const year = await getActiveYear();
      const updated = await jsonStorage.updateSession(year, req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/sessions/:id', isAuthenticated, async (req, res) => {
    try {
      const year = await getActiveYear();
      await jsonStorage.deleteSession(year, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Speaker routes
  app.get('/api/speakers', async (req, res) => {
    try {
      const year = await getActiveYear();
      const speakers = await jsonStorage.getSpeakers(year);
      res.json(speakers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch speakers" });
    }
  });

  app.post('/api/speakers', isAuthenticated, async (req, res) => {
    try {
      const year = await getActiveYear();
      const speaker = await jsonStorage.createSpeaker(year, req.body);
      res.json(speaker);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/speakers/:id', isAuthenticated, async (req, res) => {
    try {
      const year = await getActiveYear();
      const updated = await jsonStorage.updateSpeaker(year, req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/speakers/:id', isAuthenticated, async (req, res) => {
    try {
      const year = await getActiveYear();
      await jsonStorage.deleteSpeaker(year, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Sponsor routes
  app.get('/api/sponsors', async (req, res) => {
    try {
      const year = await getActiveYear();
      const sponsors = await jsonStorage.getSponsors(year);
      res.json(sponsors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sponsors" });
    }
  });

  app.post('/api/sponsors', isAuthenticated, async (req, res) => {
    try {
      const year = await getActiveYear();
      const sponsor = await jsonStorage.createSponsor(year, req.body);
      res.json(sponsor);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/sponsors/:id', isAuthenticated, async (req, res) => {
    try {
      const year = await getActiveYear();
      const updated = await jsonStorage.updateSponsor(year, req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/sponsors/:id', isAuthenticated, async (req, res) => {
    try {
      const year = await getActiveYear();
      await jsonStorage.deleteSponsor(year, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Announcement routes
  app.get('/api/announcements', async (req, res) => {
    try {
      const year = await getActiveYear();
      const announcements = await jsonStorage.getAnnouncements(year);
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post('/api/announcements', isAuthenticated, async (req, res) => {
    try {
      const year = await getActiveYear();
      const announcement = await jsonStorage.createAnnouncement(year, req.body);
      res.json(announcement);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/announcements/:id', isAuthenticated, async (req, res) => {
    try {
      const year = await getActiveYear();
      const updated = await jsonStorage.updateAnnouncement(year, req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/announcements/:id', isAuthenticated, async (req, res) => {
    try {
      const year = await getActiveYear();
      await jsonStorage.deleteAnnouncement(year, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Registration routes
  app.get('/api/registrations', isAuthenticated, async (req, res) => {
    try {
      const year = await getActiveYear();
      const registrations = await jsonStorage.getRegistrations(year);
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  app.post('/api/registrations', async (req, res) => {
    try {
      const year = await getActiveYear();
      const { email } = req.body;

      // Check if already registered
      const existing = await jsonStorage.getRegistrationByEmail(year, email);
      if (existing) {
        return res.status(400).json({ message: "Email đã đăng ký cho hội nghị này" });
      }

      // Check whitelist if exists
      const whitelists = await jsonStorage.getWhitelists(year);
      if (whitelists.length > 0) {
        const isWhitelisted = await jsonStorage.checkWhitelist(year, email);
        if (!isWhitelisted) {
          return res.status(403).json({ message: "Email không nằm trong danh sách được phép đăng ký" });
        }
      }

      // Generate QR code
      const qrData = `${year}:${email}:${Date.now()}`;
      const qrCode = await generateQRCode(qrData);

      // Create registration
      const registration = await jsonStorage.createRegistration(year, {
        ...req.body,
        qrCode,
      });

      res.json({ ...registration, qrCode });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Whitelist routes
  app.get('/api/whitelists', isAuthenticated, async (req, res) => {
    try {
      const year = await getActiveYear();
      const whitelists = await jsonStorage.getWhitelists(year);
      res.json(whitelists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch whitelists" });
    }
  });

  app.post('/api/whitelists', isAuthenticated, async (req, res) => {
    try {
      const year = await getActiveYear();
      const whitelist = await jsonStorage.addToWhitelist(year, req.body.email);
      res.json(whitelist);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/whitelists/:id', isAuthenticated, async (req, res) => {
    try {
      const year = await getActiveYear();
      await jsonStorage.removeFromWhitelist(year, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Check-in routes
  app.get('/api/check-ins', isAuthenticated, async (req, res) => {
    try {
      const year = await getActiveYear();
      const checkIns = await jsonStorage.getCheckIns(year);
      res.json(checkIns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch check-ins" });
    }
  });

  app.post('/api/check-ins', isAuthenticated, async (req, res) => {
    try {
      const { qrData } = req.body;
      
      // Parse QR: year:email:timestamp
      const [yearStr, email] = qrData.split(':');
      const year = parseInt(yearStr);
      
      const registration = await jsonStorage.getRegistrationByEmail(year, email);
      if (!registration) {
        return res.status(404).json({ message: "Không tìm thấy thông tin đăng ký" });
      }

      // Check for duplicate
      const checkIns = await jsonStorage.getCheckIns(year);
      const duplicate = checkIns.find(c => c.registrationId === registration.id);
      if (duplicate) {
        return res.status(400).json({ message: "Đã check-in trước đó" });
      }

      const checkIn = await jsonStorage.createCheckIn(year, {
        registrationId: registration.id,
        sessionId: null,
        method: 'qr',
      });

      res.json({ ...checkIn, registration });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Analytics routes
  app.get('/api/admin/stats', isAuthenticated, async (req, res) => {
    try {
      const year = await getActiveYear();
      const stats = await jsonStorage.getStats(year);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/analytics', isAuthenticated, async (req, res) => {
    try {
      const year = await getActiveYear();
      const stats = await jsonStorage.getStats(year);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // CSV export
  app.get('/api/registrations/export', isAuthenticated, async (req, res) => {
    try {
      const year = await getActiveYear();
      const registrations = await jsonStorage.getRegistrations(year);
      
      // Create CSV
      const headers = ['Họ tên', 'Email', 'Số điện thoại', 'Vai trò', 'Đơn vị', 'Ngày đăng ký'];
      const rows = registrations.map(r => [
        r.fullName,
        r.email,
        r.phone || '',
        r.role || '',
        r.organization || '',
        new Date(r.registeredAt).toLocaleString('vi-VN')
      ]);
      
      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="registrations-${year}.csv"`);
      res.send('\uFEFF' + csv); // Add BOM for Excel UTF-8 support
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
