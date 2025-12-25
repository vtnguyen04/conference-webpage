import { Router } from "express";
import {
    getWhitelists,
    addToWhitelist,
    removeFromWhitelist
} from "../controllers/registration.controller";
import { checkActiveConference } from "../middlewares/checkActiveConference";
const router = Router();
router.get("/", checkActiveConference, getWhitelists);
router.post("/", checkActiveConference, addToWhitelist);
router.delete("/:id", checkActiveConference, removeFromWhitelist);
export default router;
