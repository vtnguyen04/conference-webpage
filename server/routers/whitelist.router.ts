import { Router } from "express";
import {
    addToWhitelist,
    getWhitelists,
    removeFromWhitelist
} from "../controllers/registration.controller";
import { checkActiveConference } from "../middlewares/checkActiveConference";
import { isAuthenticated } from "../sessionAuth";
const router = Router();
// All whitelist operations require authentication
router.use(isAuthenticated);
router.get("/", checkActiveConference, getWhitelists);
router.post("/", checkActiveConference, addToWhitelist);
router.delete("/:id", checkActiveConference, removeFromWhitelist);
export default router;
