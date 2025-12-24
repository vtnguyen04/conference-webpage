
import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import path from "path";
import { createServer } from 'http';
import mainRouter from "./routers";
import { setupAuth } from './sessionAuth';
import { setupVite, serveStatic, log } from "./vite";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { errorHandler } from "./middlewares/errorHandler";

// Import services from the services folder
import { reminderService } from "./services/reminderService";
import { confirmationReminderService } from "./services/confirmationReminderService";

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
