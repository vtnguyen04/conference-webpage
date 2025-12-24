
import { db } from "../db";
import { contactMessages } from "@shared/schema";
import type { ContactMessage, InsertContactMessage } from "@shared/schema";
import { eq, sql, or, like, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export class ContactRepository {
  async create(data: Omit<InsertContactMessage, "id" | "submittedAt">): Promise<ContactMessage> {
    const id = randomUUID();
    const newMessage = {
      ...data,
      id,
      submittedAt: new Date(),
    };

    await db
      .insert(contactMessages)
      .values(newMessage);

    return newMessage as ContactMessage;
  }

  async getAllPaginated(page: number = 1, limit: number = 10): Promise<{ data: ContactMessage[], total: number }> {
    const offset = (page - 1) * limit;

    const data = await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.submittedAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(contactMessages);
    
    const total = Number(totalResult[0]?.count || 0);

    return { data, total };
  }

  async count(): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(contactMessages);
    
    return Number(result[0]?.count || 0);
  }

  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(contactMessages)
      .where(eq(contactMessages.id, id));

    return result.changes > 0;
  }

  async deleteAll(): Promise<void> {
    await db.delete(contactMessages);
  }

  async search(query: string, page: number = 1, limit: number = 10): Promise<{ data: ContactMessage[], total: number }> {
    const offset = (page - 1) * limit;
    let whereClause: any; // Allow undefined whereClause

    if (query) {
        const lowerCaseQuery = query.toLowerCase();
        whereClause = or(
          like(contactMessages.name, `%${lowerCaseQuery}%`),
          like(contactMessages.email, `%${lowerCaseQuery}%`)
        );
    }

    const data = await db
      .select()
      .from(contactMessages)
      .where(whereClause) // Drizzle handles undefined whereClause
      .orderBy(desc(contactMessages.submittedAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(contactMessages)
      .where(whereClause);
    
    const total = Number(totalResult[0]?.count || 0);

    return { data, total };
  }
}

export const contactRepository = new ContactRepository();
