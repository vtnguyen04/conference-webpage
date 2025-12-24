import { BaseJsonRepository } from "./baseJsonRepository";
import { Sponsor } from "@shared/schema";

export class SponsorRepository extends BaseJsonRepository<Sponsor> {
  constructor() {
    super("sponsors");
  }
}
export const sponsorRepository = new SponsorRepository();
