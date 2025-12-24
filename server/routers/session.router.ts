
import { Router } from "express";
import {
  getSessionsByConferenceSlug,
  getActiveConferenceSessions,
  createSession,
  updateSession,
  deleteSession,
  deleteAllSessions,
  getSessionsCapacity,
} from "../controllers/session.controller";
import { checkActiveConference } from "../middlewares/checkActiveConference";

const router = Router();

router.get("/:conferenceSlug", getSessionsByConferenceSlug);
router.get("/", checkActiveConference, getActiveConferenceSessions);
router.post("/", checkActiveConference, createSession);
router.get("/capacity", checkActiveConference, getSessionsCapacity);
router.delete("/admin/all", checkActiveConference, deleteAllSessions);
router.put("/:id", checkActiveConference, updateSession);
router.delete("/:id", checkActiveConference, deleteSession);

export default router;
