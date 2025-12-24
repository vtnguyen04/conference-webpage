
import { Router } from "express";
import {
    getSpeakersByConferenceSlug,
    getActiveConferenceSpeakers,
    createSpeaker,
    updateSpeaker,
    deleteSpeaker,
    deleteAllSpeakers,
} from "../controllers/speaker.controller";
import { checkActiveConference } from "../middlewares/checkActiveConference";

const router = Router();

router.get("/:conferenceSlug", getSpeakersByConferenceSlug);
router.get("/", checkActiveConference, getActiveConferenceSpeakers);
router.post("/", checkActiveConference, createSpeaker);
router.put("/:id", checkActiveConference, updateSpeaker);
router.delete("/:id", checkActiveConference, deleteSpeaker);
router.delete("/admin/all", checkActiveConference, deleteAllSpeakers);

export default router;
