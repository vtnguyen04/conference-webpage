import { type Response } from "express";
import { authService } from "../services/authService";

export const login = async (req: any, res: Response) => {
    try {
        const { email, password } = req.body;
        const isAdminValid = await authService.validateAdmin(email, password);
        
        if (isAdminValid) {
            req.session.userId = "admin";
            req.session.save(() => res.json({ message: "Login successful" }));
        } else { 
            res.status(401).json({ message: "Invalid credentials" }); 
        }
    } catch (error) { 
        res.status(500).json({ message: "Failed" }); 
    }
};

export const logout = (req: any, res: Response) => {
    if (!req.session) return res.json({ message: "Logged out" });
    req.session.destroy(() => { 
        res.clearCookie('connect.sid'); 
        res.json({ message: "Logged out" }); 
    });
};

export const getUser = async (req: any, res: Response) => {
    try {
        if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
        const user = await authService.findUserById(req.session.userId);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) { 
        res.status(500).json({ message: "Failed" }); 
    }
};
