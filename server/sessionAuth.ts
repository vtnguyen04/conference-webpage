import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectSqlite3 from "connect-sqlite3";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const SQLiteStore = connectSqlite3(session);
  const sessionStore = new SQLiteStore({
    db: 'sessions.db',
    table: 'sessions',
    dir: './server/data', // Store session file in server/data
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore as any,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : process.env.NODE_ENV === 'production', // Use secure cookies in production
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