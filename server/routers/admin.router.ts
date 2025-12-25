import { Router } from "express";
import {
    getPaginatedRegistrations,
    exportRegistrations,
    addAdminRegistration,
    searchForRegistrations,
    deleteRegistrationById,
    bulkCheckIn
} from "../controllers/registration.controller";
import {
    searchAdminContactMessages,
    deleteAdminContactMessage,
    deleteAllAdminContactMessages,
    getContactMessagesPaginated
} from "../controllers/misc.controller";
import { 
    deleteAllSessions,
} from "../controllers/session.controller";
import { 
    deleteAllSpeakers,
} from "../controllers/speaker.controller";
import { 
    deleteAllOrganizers,
} from "../controllers/organizer.controller";
import { 
    deleteAllAnnouncements,
} from "../controllers/announcement.controller";
import { 
    deleteAllSponsors,
} from "../controllers/sponsor.controller";
import { checkActiveConference } from "../middlewares/checkActiveConference";
const router = Router();
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