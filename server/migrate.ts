import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import path from 'path';

const dataDir = path.join(process.cwd(), "server", "data");
const dbPath = path.join(dataDir, "main.db");

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

console.log("Running migrations...");

migrate(db, { migrationsFolder: './migrations' });

console.log("Migrations finished.");
