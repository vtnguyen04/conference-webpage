
import dotenv from 'dotenv';
dotenv.config();

import { sql } from "drizzle-orm";
import express from "express";
import { createServer } from 'http';
import path from "path";
import { db } from "./db";
import { errorHandler } from "./middlewares/errorHandler";
import mainRouter from "./routers";
import { setupAuth } from './sessionAuth';
import { log, serveStatic, setupVite } from "./vite";

import { confirmationReminderService } from "./services/confirmationReminderService";
import { reminderService } from "./services/reminderService";

const app = express();
const server = createServer(app);

app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

(async () => {
  try { db.run(sql`SELECT 1`); log("Database connection successful"); } catch (error) { process.exit(1); }

  setupAuth(app);
  app.use('/api', mainRouter);

  // Start background services
  reminderService.start();
  confirmationReminderService.start();

  app.use(errorHandler);

  if (app.get("env") === "development") await setupVite(app, server); else serveStatic(app);

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({ port, host: "0.0.0.0" }, () => log(`serving on port ${port}`));
})();
