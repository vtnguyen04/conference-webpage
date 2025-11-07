import { defineConfig } from "drizzle-kit";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env' });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: path.join(__dirname, 'shared', 'schema.ts'),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
