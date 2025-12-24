import { readConferenceData, writeConferenceData, deleteFile, ConferenceData } from "../dataContext";

type ResourceKeys = keyof Omit<ConferenceData, 'conference'>;

export class BaseJsonRepository<T extends { id: string, [key: string]: any }> {
  protected resourceKey: ResourceKeys;

  constructor(resourceKey: ResourceKeys) {
    this.resourceKey = resourceKey;
  }

  async getAll(slug: string): Promise<T[]> {
    const data = await readConferenceData(slug);
    return (data ? (data[this.resourceKey] as any) : []) as T[];
  }

  async getById(slug: string, id: string): Promise<T | undefined> {
    const items = await this.getAll(slug);
    return items.find((item) => item.id === id);
  }

  async create(slug: string, item: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T> {
    const data = await readConferenceData(slug);
    if (!data) throw new Error("Conference not found");

    const idPrefix = this.resourceKey.slice(0, -1);
    const newItem = {
      ...item,
      id: `${idPrefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conferenceId: data.conference.slug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any as T;

    if (!data[this.resourceKey]) (data[this.resourceKey] as any) = [];
    (data[this.resourceKey] as any[]).push(newItem);
    await writeConferenceData(slug, data);
    return newItem;
  }

  async update(slug: string, id: string, updates: Partial<T>): Promise<T | undefined> {
    const data = await readConferenceData(slug);
    if (!data) return undefined;

    const items = data[this.resourceKey] as any[];
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return undefined;

    const oldItem = items[index];
    items[index] = { ...oldItem, ...updates, updatedAt: new Date().toISOString() };

    await writeConferenceData(slug, data);
    return items[index] as T;
  }

  async delete(slug: string, id: string): Promise<void> {
    const data = await readConferenceData(slug);
    if (!data) return;

    (data[this.resourceKey] as any[]) = (data[this.resourceKey] as any[]).filter((item) => item.id !== id);
    await writeConferenceData(slug, data);
  }

  async deleteAll(slug: string): Promise<void> {
    const data = await readConferenceData(slug);
    if (!data) return;
    (data[this.resourceKey] as any[]) = [];
    await writeConferenceData(slug, data);
  }
}