import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage"; // Assuming storage is still needed for user data

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies only in production
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  // No passport.initialize() or passport.session() for now
  // No login/callback/logout routes for now
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // For now, a very basic check. This will need to be replaced with actual authentication logic.
  if (req.session && (req.session as any).userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};