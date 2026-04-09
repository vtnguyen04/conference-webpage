import { type Request, type Response } from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";

export const getStaffAccounts = async (req: Request, res: Response) => {
    try {
        const staffList = await db.select().from(users).where(eq(users.role, "staff"));
        // Remove passwordHash from output
        const safeList = staffList.map(({ passwordHash: _passwordHash, ...user }) => user);
        res.json(safeList);
    } catch (_e) {
        res.status(500).json({ message: "Failed to fetch staff accounts" });
    }
};

export const createStaffAccount = async (req: Request, res: Response) => {
    try {
        const { email, password, firstName, lastName, assignedSessionIds } = req.body;
        
        // check if email exists
        const existing = await db.select().from(users).where(eq(users.email, email));
        if (existing.length > 0) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        
        const [newUser] = await db.insert(users).values({
            id: randomUUID(),
            email,
            passwordHash,
            firstName,
            lastName,
            role: "staff",
            assignedSessionIds: assignedSessionIds || [],
        }).returning();

        const { passwordHash: _, ...safeUser } = newUser;
        res.status(201).json(safeUser);
    } catch (_e) {
        res.status(500).json({ message: "Failed to create staff account" });
    }
};

export const updateStaffAccount = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { email, password, firstName, lastName, assignedSessionIds } = req.body;

        const updateData: any = {
            email,
            firstName,
            lastName,
            assignedSessionIds: assignedSessionIds || [],
            updatedAt: new Date(),
        };

        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 10);
        }

        const [updatedUser] = await db.update(users)
            .set(updateData)
            .where(and(eq(users.id, id), eq(users.role, "staff")))
            .returning();

        if (!updatedUser) {
            return res.status(404).json({ message: "Staff not found" });
        }

        const { passwordHash: _, ...safeUser } = updatedUser;
        res.json(safeUser);
    } catch (_e) {
        res.status(500).json({ message: "Failed to update staff account" });
    }
};

export const deleteStaffAccount = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await db.delete(users).where(and(eq(users.id, id), eq(users.role, "staff")));
        res.json({ message: "Deleted successfully" });
    } catch (_e) {
        res.status(500).json({ message: "Failed to delete staff account" });
    }
};
