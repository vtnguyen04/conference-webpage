import { Router } from "express";
import {
  getAllConferences,
  getActiveConference,
  getConferenceBySlug,
  createConference,
  updateConference,
  cloneConference,
  activateConference,
  deleteConference,
} from "../controllers/conference.controller";
import { checkActiveConference } from "../middlewares/checkActiveConference";
const router = Router();
router.get("/", getAllConferences);
router.get("/active", getActiveConference);
router.get("/:slug", getConferenceBySlug);
router.post("/", createConference);
router.post("/:fromSlug/clone", cloneConference);
router.post("/:conferenceSlug/activate", activateConference);
router.put("/:conferenceSlug", checkActiveConference, updateConference);
router.delete("/:conferenceSlug", deleteConference);
export default router;
