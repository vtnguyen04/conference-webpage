import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import 'dotenv/config';

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "client", "src"),
      "@shared": path.resolve(process.cwd(), "shared"),
      "@assets": path.resolve(process.cwd(), "attached_assets"),
    },
  },
  root: path.resolve(process.cwd(), "client"),
  build: {
    outDir: path.resolve(process.cwd(), "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(process.cwd(), "client/index.html"),
        admin: path.resolve(process.cwd(), "client/admin.html"),
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_BASE_URL,
        changeOrigin: true,
      },
      "/uploads": {
        target: process.env.VITE_BASE_URL,
        changeOrigin: true,
      },
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
