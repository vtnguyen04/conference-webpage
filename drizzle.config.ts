import { defineConfig } from "drizzle-kit";
import path from 'path';

export default defineConfig({
  out: "./migrations",
  schema: path.join(__dirname, 'shared', 'schema.ts'),
  dialect: "sqlite",
  dbCredentials: {
    url: 'server/data/main.db',
  },
});
