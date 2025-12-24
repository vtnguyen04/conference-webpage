
import { Router } from "express";
import {
    getCheckIns,
    qrCheckIn,
    manualCheckIn
} from "../controllers/registration.controller";
import { checkActiveConference } from "../middlewares/checkActiveConference";

const router = Router();

router.post("/", checkActiveConference, qrCheckIn);
router.post("/manual", checkActiveConference, manualCheckIn);
router.get("/session/:sessionId", getCheckIns);

export default router;
