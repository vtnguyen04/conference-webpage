import { BaseJsonRepository } from "./baseJsonRepository";
import { Whitelist } from "@shared/schema";
import { readConferenceData } from "../dataContext";
export class WhitelistRepository extends BaseJsonRepository<Whitelist> {
  constructor() {
    super("whitelists");
  }
  async isWhitelisted(slug: string, email: string): Promise<boolean> {
    const data = await readConferenceData(slug);
    return data?.whitelists.some((w) => w.email === email) || false;
  }
}
export const whitelistRepository = new WhitelistRepository();
