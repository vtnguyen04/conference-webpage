
import { Router } from "express";
import {
    getOrganizersByConferenceSlug,
    getActiveConferenceOrganizers,
    createOrganizer,
    updateOrganizer,
    deleteOrganizer,
    deleteAllOrganizers,
} from "../controllers/organizer.controller";
import { checkActiveConference } from "../middlewares/checkActiveConference";

const router = Router();

router.get("/:conferenceSlug", getOrganizersByConferenceSlug);
router.get("/", checkActiveConference, getActiveConferenceOrganizers);
router.post("/", checkActiveConference, createOrganizer);
router.put("/:id", checkActiveConference, updateOrganizer);
router.delete("/:id", checkActiveConference, deleteOrganizer);
router.delete("/admin/all", checkActiveConference, deleteAllOrganizers);

export default router;
