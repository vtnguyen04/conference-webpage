
import { Router } from "express";
import {
    getSponsorsByConferenceSlug,
    getActiveConferenceSponsors,
    createSponsor,
    updateSponsor,
    deleteSponsor,
    deleteAllSponsors,
} from "../controllers/sponsor.controller";
import { checkActiveConference } from "../middlewares/checkActiveConference";

const router = Router();

router.get("/:conferenceSlug", getSponsorsByConferenceSlug);
router.get("/", checkActiveConference, getActiveConferenceSponsors);
router.post("/", checkActiveConference, createSponsor);
router.put("/:id", checkActiveConference, updateSponsor);
router.delete("/:id", checkActiveConference, deleteSponsor);
router.delete("/admin/all", checkActiveConference, deleteAllSponsors);

export default router;
