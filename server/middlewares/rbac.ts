import { Request, Response, NextFunction } from "express";
import { authService } from "../services/authService";

export const requireRole = (allowedRoles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req.session as any)?.userId;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const user = await authService.findUserById(userId);
            if (!user) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({ message: "Forbidden: You do not have the necessary permissions" });
            }

            // Attach user to req for downstream usage
            (req as any).user = user;
            next();
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    };
};
