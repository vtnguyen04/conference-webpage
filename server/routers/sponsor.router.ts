import { Router } from "express";
import {
    createSponsor,
    deleteAllSponsors,
    deleteSponsor,
    getActiveConferenceSponsors,
    getSponsorsByConferenceSlug,
    updateSponsor,
} from "../controllers/sponsor.controller";
import { checkActiveConference } from "../middlewares/checkActiveConference";
import { isAuthenticated } from "../sessionAuth";
const router = Router();
// Public read routes
router.get("/:conferenceSlug", getSponsorsByConferenceSlug);
router.get("/", checkActiveConference, getActiveConferenceSponsors);
// Protected write routes
router.post("/", isAuthenticated, checkActiveConference, createSponsor);
router.put("/:id", isAuthenticated, checkActiveConference, updateSponsor);
router.delete("/:id", isAuthenticated, checkActiveConference, deleteSponsor);
router.delete("/admin/all", isAuthenticated, checkActiveConference, deleteAllSponsors);
export default router;
