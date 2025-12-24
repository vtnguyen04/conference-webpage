
import { Router } from "express";
import { login, logout, getUser } from "../controllers/auth.controller";

const router = Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/user", getUser);

export default router;
