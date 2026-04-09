import { db } from "../db";
import { users, User } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export class AuthService {
    async validateAdmin(email: string, password: string): Promise<User | null> {
        // Fallback superadmin if db is empty or just matched directly
        if (email === "admin@example.com" && password === process.env.ADMIN_PASSWORD) {
            return { 
                id: "admin", 
                email: "admin@example.com", 
                firstName: "Super", 
                lastName: "Admin", 
                role: "superadmin",
                passwordHash: null,
                profileImageUrl: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                assignedSessionIds: [],
            } as User;
        }

        const [user] = await db.select().from(users).where(eq(users.email, email));
        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return user;
    }

    async findUserById(id: string): Promise<User | undefined> {
        if (id === "admin") {
            return { 
                id: "admin", 
                email: "admin@example.com", 
                firstName: "Super", 
                lastName: "Admin", 
                role: "superadmin",
                passwordHash: null,
                profileImageUrl: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                assignedSessionIds: [],
            } as User;
        }
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
    }
}

export const authService = new AuthService();
