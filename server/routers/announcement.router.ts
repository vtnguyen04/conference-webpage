import { Router } from "express";
import {
    createAnnouncement,
    deleteAllAnnouncements,
    deleteAnnouncement,
    getActiveConferenceAnnouncements,
    getAnnouncementById,
    getAnnouncementsByConferenceSlug,
    incrementAnnouncementViews,
    incrementAnnouncementViewsBySlug,
    updateAnnouncement,
} from "../controllers/announcement.controller";
import { checkActiveConference } from "../middlewares/checkActiveConference";
import { isAuthenticated } from "../sessionAuth";
const router = Router();
// Public read routes
router.get("/slug/:conferenceSlug", getAnnouncementsByConferenceSlug);
router.get("/:id", checkActiveConference, (req: any, res) => {
    req.params.conferenceSlug = req.activeConference.slug;
    return getAnnouncementById(req, res);
});
router.get("/:conferenceSlug/:id", getAnnouncementById);
router.post("/:conferenceSlug/:id/view", incrementAnnouncementViewsBySlug);
router.post("/:id/view", checkActiveConference, incrementAnnouncementViews);
router.get("/", checkActiveConference, getActiveConferenceAnnouncements);
// Protected write routes
router.post("/", isAuthenticated, checkActiveConference, createAnnouncement);
router.put("/:id", isAuthenticated, checkActiveConference, updateAnnouncement);
router.delete("/:id", isAuthenticated, checkActiveConference, deleteAnnouncement);
router.delete("/admin/all", isAuthenticated, checkActiveConference, deleteAllAnnouncements);
export default router;
