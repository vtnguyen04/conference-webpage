import { BaseJsonRepository } from "./baseJsonRepository";
import { Announcement } from "@shared/schema";
import { readConferenceData, writeConferenceData } from "../dataContext";
export class AnnouncementRepository extends BaseJsonRepository<Announcement> {
  constructor() {
    super("announcements");
  }
  /**
   * Tăng lượt xem một cách an toàn (Atomic Operation)
   * Cơ chế Lock bên trong dataContext đảm bảo tính nhất quán tuyệt đối.
   */
  async incrementViews(slug: string, id: string): Promise<Announcement | undefined> {
    const data = await readConferenceData(slug);
    if (!data) return undefined;
    const announcements = data.announcements;
    const index = announcements.findIndex((a) => a.id === id);
    if (index === -1) return undefined;
    announcements[index].views = (announcements[index].views || 0) + 1;
    await writeConferenceData(slug, data);
    return announcements[index];
  }
}
export const announcementRepository = new AnnouncementRepository();