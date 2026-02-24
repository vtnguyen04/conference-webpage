import { Router } from "express";
import {
    getAnnouncementsByConferenceSlug,
    getActiveConferenceAnnouncements,
    getAnnouncementById,
    createAnnouncement,
    updateAnnouncement,
    incrementAnnouncementViews,
    incrementAnnouncementViewsBySlug,
    deleteAnnouncement,
    deleteAllAnnouncements,
} from "../controllers/announcement.controller";
import { checkActiveConference } from "../middlewares/checkActiveConference";
const router = Router();
router.get("/slug/:conferenceSlug", getAnnouncementsByConferenceSlug);
router.get("/:id", checkActiveConference, (req: any, res) => {
    req.params.conferenceSlug = req.activeConference.slug;
    return getAnnouncementById(req, res);
});
router.get("/:conferenceSlug/:id", getAnnouncementById);
router.post("/:conferenceSlug/:id/view", incrementAnnouncementViewsBySlug);
router.post("/:id/view", checkActiveConference, incrementAnnouncementViews);
router.get("/", checkActiveConference, getActiveConferenceAnnouncements);
router.post("/", checkActiveConference, createAnnouncement);
router.put("/:id", checkActiveConference, updateAnnouncement);
router.delete("/:id", checkActiveConference, deleteAnnouncement);
router.delete("/admin/all", checkActiveConference, deleteAllAnnouncements);
export default router;
