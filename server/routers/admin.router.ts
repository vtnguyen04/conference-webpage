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

// --- Registration Admin Routes ---
router.get("/registrations", checkActiveConference, getPaginatedRegistrations); // GET /api/admin/registrations
router.post("/registrations", checkActiveConference, addAdminRegistration);    // POST /api/admin/registrations
router.get("/registrations/search", checkActiveConference, searchForRegistrations);
router.delete("/registrations/:id", deleteRegistrationById);
router.get("/registrations/export", checkActiveConference, exportRegistrations);
router.post("/bulk-checkin-registrations", checkActiveConference, bulkCheckIn);

// --- Contact Messages Admin Routes ---
router.get("/contact-messages", getContactMessagesPaginated); // GET /api/admin/contact-messages
router.get("/contact-messages/search", searchAdminContactMessages);
router.delete("/contact-messages/:id", deleteAdminContactMessage);
router.delete("/contact-messages/all", deleteAllAdminContactMessages);

// --- Bulk Delete Routes (Cleanup) ---
router.delete("/sessions/all", checkActiveConference, deleteAllSessions);
router.delete("/speakers/all", checkActiveConference, deleteAllSpeakers);
router.delete("/organizers/all", checkActiveConference, deleteAllOrganizers);
router.delete("/announcements/all", checkActiveConference, deleteAllAnnouncements);
router.delete("/sponsors/all", checkActiveConference, deleteAllSponsors);

export default router;