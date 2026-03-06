import { Router } from "express";
import {
    createOrganizer,
    deleteAllOrganizers,
    deleteOrganizer,
    getActiveConferenceOrganizers,
    getOrganizersByConferenceSlug,
    updateOrganizer,
} from "../controllers/organizer.controller";
import { checkActiveConference } from "../middlewares/checkActiveConference";
import { isAuthenticated } from "../sessionAuth";
const router = Router();
// Public read routes
router.get("/:conferenceSlug", getOrganizersByConferenceSlug);
router.get("/", checkActiveConference, getActiveConferenceOrganizers);
// Protected write routes
router.post("/", isAuthenticated, checkActiveConference, createOrganizer);
router.put("/:id", isAuthenticated, checkActiveConference, updateOrganizer);
router.delete("/:id", isAuthenticated, checkActiveConference, deleteOrganizer);
router.delete("/admin/all", isAuthenticated, checkActiveConference, deleteAllOrganizers);
export default router;
