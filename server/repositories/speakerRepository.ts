import { BaseJsonRepository } from "./baseJsonRepository";
import { Speaker } from "@shared/schema";

export class SpeakerRepository extends BaseJsonRepository<Speaker> {
  constructor() {
    super("speakers");
  }
}
export const speakerRepository = new SpeakerRepository();
