import { Router } from "express";
import {
    createSpeaker,
    deleteAllSpeakers,
    deleteSpeaker,
    getActiveConferenceSpeakers,
    getSpeakersByConferenceSlug,
    updateSpeaker,
} from "../controllers/speaker.controller";
import { checkActiveConference } from "../middlewares/checkActiveConference";
import { isAuthenticated } from "../sessionAuth";
const router = Router();
// Public read routes
router.get("/:conferenceSlug", getSpeakersByConferenceSlug);
router.get("/", checkActiveConference, getActiveConferenceSpeakers);
// Protected write routes
router.post("/", isAuthenticated, checkActiveConference, createSpeaker);
router.put("/:id", isAuthenticated, checkActiveConference, updateSpeaker);
router.delete("/:id", isAuthenticated, checkActiveConference, deleteSpeaker);
router.delete("/admin/all", isAuthenticated, checkActiveConference, deleteAllSpeakers);
export default router;
