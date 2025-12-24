
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
router.get("/:conferenceSlug/:id", getAnnouncementById);

// Khôi phục các API tăng view chuyên biệt
router.post("/:conferenceSlug/:id/view", incrementAnnouncementViewsBySlug);
router.post("/:id/view", checkActiveConference, incrementAnnouncementViews);

router.get("/", checkActiveConference, getActiveConferenceAnnouncements);
router.post("/", checkActiveConference, createAnnouncement);
router.put("/:id", checkActiveConference, updateAnnouncement);
router.delete("/:id", checkActiveConference, deleteAnnouncement);
router.delete("/admin/all", checkActiveConference, deleteAllAnnouncements);

export default router;
