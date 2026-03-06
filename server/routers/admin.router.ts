import { Router } from "express";
import {
    deleteAllAnnouncements,
} from "../controllers/announcement.controller";
import {
    deleteAdminContactMessage,
    deleteAllAdminContactMessages,
    getContactMessagesPaginated,
    searchAdminContactMessages
} from "../controllers/misc.controller";
import {
    deleteAllOrganizers,
} from "../controllers/organizer.controller";
import {
    addAdminRegistration,
    bulkCheckIn,
    deleteRegistrationById,
    exportRegistrations,
    getPaginatedRegistrations,
    searchForRegistrations
} from "../controllers/registration.controller";
import {
    deleteAllSessions,
} from "../controllers/session.controller";
import {
    deleteAllSpeakers,
} from "../controllers/speaker.controller";
import {
    deleteAllSponsors,
} from "../controllers/sponsor.controller";
import { checkActiveConference } from "../middlewares/checkActiveConference";
import { isAuthenticated } from "../sessionAuth";
const router = Router();
// All admin routes require authentication
router.use(isAuthenticated);
router.get("/registrations", checkActiveConference, getPaginatedRegistrations);
router.post("/registrations", checkActiveConference, addAdminRegistration);
router.get("/registrations/search", checkActiveConference, searchForRegistrations);
router.delete("/registrations/:id", deleteRegistrationById);
router.get("/registrations/export", checkActiveConference, exportRegistrations);
router.post("/bulk-checkin-registrations", checkActiveConference, bulkCheckIn);
router.get("/contact-messages", getContactMessagesPaginated);
router.get("/contact-messages/search", searchAdminContactMessages);
router.delete("/contact-messages/:id", deleteAdminContactMessage);
router.delete("/contact-messages/all", deleteAllAdminContactMessages);
router.delete("/sessions/all", checkActiveConference, deleteAllSessions);
router.delete("/speakers/all", checkActiveConference, deleteAllSpeakers);
router.delete("/organizers/all", checkActiveConference, deleteAllOrganizers);
router.delete("/announcements/all", checkActiveConference, deleteAllAnnouncements);
router.delete("/sponsors/all", checkActiveConference, deleteAllSponsors);
export default router;
