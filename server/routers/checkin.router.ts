import { Router } from "express";
import {
    getCheckIns,
    manualCheckIn,
    qrCheckIn
} from "../controllers/registration.controller";
import { checkActiveConference } from "../middlewares/checkActiveConference";
import { isAuthenticated } from "../sessionAuth";
const router = Router();
// Protected: check-in operations require authentication
router.post("/", isAuthenticated, checkActiveConference, qrCheckIn);
router.post("/manual", isAuthenticated, checkActiveConference, manualCheckIn);
router.get("/session/:sessionId", isAuthenticated, getCheckIns);
export default router;
