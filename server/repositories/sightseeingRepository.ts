import { BaseJsonRepository } from "./baseJsonRepository";
import { Sightseeing } from "@shared/schema";
export class SightseeingRepository extends BaseJsonRepository<Sightseeing> {
  constructor() {
    super("sightseeing");
  }
}
export const sightseeingRepository = new SightseeingRepository();
