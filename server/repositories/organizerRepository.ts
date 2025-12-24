import { BaseJsonRepository } from "./baseJsonRepository";
import { Organizer } from "@shared/schema";

export class OrganizerRepository extends BaseJsonRepository<Organizer> {
  constructor() {
    super("organizers");
  }
}
export const organizerRepository = new OrganizerRepository();
