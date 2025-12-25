
import dotenv from 'dotenv';
dotenv.config();

import { sql } from "drizzle-orm";
import express from "express";
import { createServer } from 'http';
import path from "path";
import helmet from "helmet";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import { db } from "./db";
import { errorHandler } from "./middlewares/errorHandler";
import mainRouter from "./routers";
import { setupAuth } from './sessionAuth';
import { log, serveStatic, setupVite } from "./vite";

import { confirmationReminderService } from "./services/confirmationReminderService";
import { reminderService } from "./services/reminderService";

const app = express();
const server = createServer(app);

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for now as it might conflict with Vite during development
}));
app.use(cors());

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Increased limit
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET', // Skip rate limiting for GET requests
  message: "Too many requests from this IP, please try again after 15 minutes",
});

// More restrictive limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 login attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many login attempts, please try again after an hour",
});

app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

(async () => {
  try { db.run(sql`SELECT 1`); log("Database connection successful"); } catch (error) { process.exit(1); }

  setupAuth(app);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/login', authLimiter);
  app.use('/api', apiLimiter); // Apply general rate limiting to all API routes
  app.use('/api', mainRouter);

  // Start background services
  reminderService.start();
  confirmationReminderService.start();

  app.use(errorHandler);

  if (app.get("env") === "development") await setupVite(app, server); else serveStatic(app);

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({ port, host: "0.0.0.0" }, () => log(`serving on port ${port}`));
})();
