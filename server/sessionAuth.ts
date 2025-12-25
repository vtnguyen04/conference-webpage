import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectSqlite3 from "connect-sqlite3";
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const SQLiteStore = connectSqlite3(session);
  const sessionStore = new SQLiteStore({
    db: 'sessions.db',
    table: 'sessions',
    dir: './server/data',
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore as any,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
}
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (req.session && (req.session as any).userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};