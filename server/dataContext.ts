import { join, extname } from "path";
import { existsSync, mkdirSync } from "fs";
import { readFile, writeFile, unlink, copyFile } from "fs/promises";
import type {
  Conference,
  Session,
  Speaker,
  Organizer,
  Sponsor,
  Announcement,
  Sightseeing,
  Whitelist,
} from "@shared/schema";

export interface ConferenceData {
  conference: Conference;
  sessions: Session[];
  speakers: Speaker[];
  organizers: Organizer[];
  sponsors: Sponsor[];
  announcements: Announcement[];
  sightseeing: Sightseeing[];
  whitelists: Whitelist[];
}

export const DATA_DIR = join(process.cwd(), "server", "data");
export const CONFIG_FILE_PATH = join(DATA_DIR, "config.json");

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const fileLocks = new Map<string, Promise<any>>();

async function acquireLock(key: string): Promise<() => void> {
    let release: () => void;
    const promise = new Promise<void>((resolve) => {
        release = resolve;
    });
    const previousLock = fileLocks.get(key) || Promise.resolve();
    fileLocks.set(key, promise);
    await previousLock;
    return release!;
}

export function slugify(text: string): string {
  return text.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
}

export function getConferenceFilePath(slug: string): string {
  return join(DATA_DIR, `${slug}.json`);
}

export async function readConferenceData(slug: string): Promise<ConferenceData | null> {
  const release = await acquireLock(slug);
  try {
    const filePath = getConferenceFilePath(slug);
    if (!existsSync(filePath)) return null;
    const content = await readFile(filePath, "utf-8");
    const data = JSON.parse(content);
    if (data?.conference?.startDate) data.conference.startDate = new Date(data.conference.startDate);
    if (data?.conference?.endDate) data.conference.endDate = new Date(data.conference.endDate);
    return data;
  } catch (error) {
    console.error(`Error reading ${slug}:`, error);
    return null;
  } finally {
    release();
  }
}

export async function writeConferenceData(slug: string, data: ConferenceData): Promise<void> {
  const release = await acquireLock(slug);
  try {
    const filePath = getConferenceFilePath(slug);
    await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error(`Error writing ${slug}:`, error);
    throw error;
  } finally {
    release();
  }
}

export async function deleteFile(filePathRelative: string) {
  if (filePathRelative && filePathRelative.startsWith('/uploads/')) {
    const absolutePath = join(process.cwd(), "public", filePathRelative);
    if (existsSync(absolutePath)) {
      await unlink(absolutePath);
    }
  }
}

export async function cloneFile(filePathRelative: string | null | undefined): Promise<string | undefined> {
  if (!filePathRelative || !filePathRelative.startsWith('/uploads/')) return filePathRelative ?? undefined;
  const sourcePath = join(process.cwd(), "public", filePathRelative);
  if (!existsSync(sourcePath)) return filePathRelative;
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const extension = extname(filePathRelative);
  const newFilename = `image-${uniqueSuffix}${extension}`;
  const destinationPath = join(process.cwd(), "public", "uploads", newFilename);
  try {
    await copyFile(sourcePath, destinationPath);
    return `/uploads/${newFilename}`;
  } catch (error) {
    return filePathRelative;
  }
}

export interface Config { activeConferenceSlug: string | null; }

export async function readConfig(): Promise<Config> {
  const release = await acquireLock('config');
  try {
    if (!existsSync(CONFIG_FILE_PATH)) return { activeConferenceSlug: null };
    const content = await readFile(CONFIG_FILE_PATH, "utf-8");
    return JSON.parse(content);
  } finally {
    release();
  }
}

export async function writeConfig(config: Config): Promise<void> {
  const release = await acquireLock('config');
  try {
    await writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), "utf-8");
  } finally {
    release();
  }
}
