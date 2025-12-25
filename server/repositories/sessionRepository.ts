import { BaseJsonRepository } from "./baseJsonRepository";
import { Session } from "@shared/schema";
export class SessionRepository extends BaseJsonRepository<Session> {
  constructor() {
    super("sessions");
  }
}
export const sessionRepository = new SessionRepository();
