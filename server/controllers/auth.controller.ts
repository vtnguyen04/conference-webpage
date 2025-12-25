import { type Response } from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
export const login = async (req: any, res: Response) => {
    try {
        const { email, password } = req.body;
        if (email === "admin@example.com" && password === process.env.ADMIN_PASSWORD) {
            req.session.userId = "admin";
            req.session.save(() => res.json({ message: "Login successful" }));
        } else { res.status(401).json({ message: "Invalid credentials" }); }
    } catch (error) { res.status(500).json({ message: "Failed" }); }
};
export const logout = (req: any, res: Response) => {
    if (!req.session) return res.json({ message: "Logged out" });
    req.session.destroy(() => { res.clearCookie('connect.sid'); res.json({ message: "Logged out" }); });
};
export const getUser = async (req: any, res: Response) => {
    try {
        if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
        if (req.session.userId === "admin") return res.json({ id: "admin", email: "admin@example.com", firstName: "Admin", lastName: "User", role: "admin" });
        const [user] = await db.select().from(users).where(eq(users.id, req.session.userId));
        res.json(user);
    } catch (error) { res.status(500).json({ message: "Failed" }); }
};
