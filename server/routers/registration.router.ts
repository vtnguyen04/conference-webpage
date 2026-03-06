import { Router } from "express";
import {
    batchRegister,
    confirmRegistration,
    exportRegistrations,
    getPaginatedRegistrations,
    getRegistrationsBySessionId
} from "../controllers/registration.controller";
import { checkActiveConference } from "../middlewares/checkActiveConference";
import { isAuthenticated } from "../sessionAuth";
const router = Router();
// Protected: viewing/exporting registration data requires auth (PII)
router.get("/", isAuthenticated, checkActiveConference, getPaginatedRegistrations);
router.get("/export", isAuthenticated, checkActiveConference, exportRegistrations);
router.get("/session/:sessionId", isAuthenticated, getRegistrationsBySessionId);
// Public: confirmation via token and batch registration
router.get("/confirm/:token", confirmRegistration);
router.post("/batch", checkActiveConference, batchRegister);
export default router;
