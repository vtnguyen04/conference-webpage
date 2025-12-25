import * as schema from "@shared/schema";
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import fs from "fs";
import path from "path";
const dataDir = path.join(process.cwd(), "server", "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, "main.db");
console.log(`Database path: ${dbPath}`);
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
