import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { log } from "./vite-utils";

const viteLogger = createLogger();
export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      let templatePath: string;
      let entryPoint: string;
      if (url.startsWith("/admin")) {
        templatePath = path.resolve(import.meta.dirname, "..", "client", "admin.html");
        entryPoint = "/src/admin.tsx";
      } else {
        templatePath = path.resolve(import.meta.dirname, "..", "client", "index.html");
        entryPoint = "/src/main.tsx";
      }
      let template = await fs.promises.readFile(templatePath, "utf-8");
      template = template.replace(
        `src="${entryPoint}"`,
        `src="${entryPoint}?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}