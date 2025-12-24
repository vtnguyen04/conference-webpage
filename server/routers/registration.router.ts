
import { Router } from "express";
import {
    getPaginatedRegistrations,
    exportRegistrations,
    confirmRegistration,
    getRegistrationsBySessionId,
    batchRegister
} from "../controllers/registration.controller";
import { checkActiveConference } from "../middlewares/checkActiveConference";

const router = Router();

router.get("/", checkActiveConference, getPaginatedRegistrations);
router.get("/export", checkActiveConference, exportRegistrations);
router.get("/confirm/:token", confirmRegistration);
router.get("/session/:sessionId", getRegistrationsBySessionId);
router.post("/batch", checkActiveConference, batchRegister);

export default router;
