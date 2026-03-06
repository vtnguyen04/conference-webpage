import { Router } from "express";
import {
    activateConference,
    cloneConference,
    createConference,
    deleteConference,
    getActiveConference,
    getAllConferences,
    getConferenceBySlug,
    updateConference,
} from "../controllers/conference.controller";
import { checkActiveConference } from "../middlewares/checkActiveConference";
import { isAuthenticated } from "../sessionAuth";
const router = Router();
// Public read routes
router.get("/", getAllConferences);
router.get("/active", getActiveConference);
router.get("/:slug", getConferenceBySlug);
// Protected write routes
router.post("/", isAuthenticated, createConference);
router.post("/:fromSlug/clone", isAuthenticated, cloneConference);
router.post("/:conferenceSlug/activate", isAuthenticated, activateConference);
router.put("/:conferenceSlug", isAuthenticated, checkActiveConference, updateConference);
router.delete("/:conferenceSlug", isAuthenticated, deleteConference);
export default router;
