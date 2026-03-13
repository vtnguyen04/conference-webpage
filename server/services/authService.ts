import { db } from "../db";
import { users, User } from "@shared/schema";
import { eq } from "drizzle-orm";

export class AuthService {
    async validateAdmin(email: string, password: string): Promise<boolean> {
        return email === "admin@example.com" && password === process.env.ADMIN_PASSWORD;
    }

    async findUserById(id: string): Promise<User | { id: string; email: string; firstName: string; lastName: string; role: string } | undefined> {
        if (id === "admin") {
            return { id: "admin", email: "admin@example.com", firstName: "Admin", lastName: "User", role: "admin" };
        }
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
    }
}

export const authService = new AuthService();
