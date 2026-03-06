import compression from "compression";
import cors from "cors";
import dotenv from 'dotenv';
import { sql } from "drizzle-orm";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { createServer } from 'http';
import path from "path";
import { db } from "./db";
import { errorHandler } from "./middlewares/errorHandler";
import mainRouter from "./routers";
import { confirmationReminderService } from "./services/confirmationReminderService";
import { reminderService } from "./services/reminderService";
import { setupAuth } from './sessionAuth';
import { log, serveStatic, setupVite } from "./vite";
dotenv.config();
const app = express();
app.set('trust proxy', 1); // Trust the first proxy (Nginx/Docker)
const server = createServer(app);
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(compression());
app.use(cors());
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET',
  message: "Too many requests from this IP, please try again after 15 minutes",
});
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many login attempts, please try again after an hour",
});
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
(async () => {
  try { db.run(sql`SELECT 1`); log("Database connection successful"); } catch (error) { process.exit(1); }
  setupAuth(app);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/login', authLimiter);
  app.use('/api', apiLimiter);
  app.use('/api', mainRouter);
  reminderService.start();
  confirmationReminderService.start();
  app.use(errorHandler);
  if (app.get("env") === "development") await setupVite(app, server); else serveStatic(app);
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({ port, host: "0.0.0.0" }, () => log(`serving on port ${port}`));
})();
