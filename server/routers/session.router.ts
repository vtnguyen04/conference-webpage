import { Router } from "express";
import {
    createSession,
    deleteAllSessions,
    deleteSession,
    getActiveConferenceSessions,
    getSessionsByConferenceSlug,
    getSessionsCapacity,
    updateSession,
} from "../controllers/session.controller";
import { checkActiveConference } from "../middlewares/checkActiveConference";
import { isAuthenticated } from "../sessionAuth";
const router = Router();
// Public read routes
router.get("/capacity", checkActiveConference, getSessionsCapacity);
router.get("/", checkActiveConference, getActiveConferenceSessions);
router.get("/:conferenceSlug", getSessionsByConferenceSlug);
// Protected write routes
router.post("/", isAuthenticated, checkActiveConference, createSession);
router.put("/:id", isAuthenticated, checkActiveConference, updateSession);
router.delete("/:id", isAuthenticated, checkActiveConference, deleteSession);
router.delete("/admin/all", isAuthenticated, checkActiveConference, deleteAllSessions);
export default router;
