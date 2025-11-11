import { db } from "./db";
import { contactMessages } from "@shared/schema";
import type { ContactMessage, InsertContactMessage } from "@shared/schema";
import { eq, sql, or, like, ilike } from "drizzle-orm";

import { randomUUID } from "crypto";

export async function createContactMessage(
  data: Omit<InsertContactMessage, "id" | "submittedAt">
): Promise<ContactMessage> {
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

export async function getContactMessages(page: number = 1, limit: number = 10): Promise<{ messages: ContactMessage[], total: number }> {
  const offset = (page - 1) * limit;

  const messages = await db
    .select()
    .from(contactMessages)
    .orderBy(contactMessages.submittedAt)
    .limit(limit)
    .offset(offset);

  const totalResult = await db
    .select({ count: sql`count(*)` })
    .from(contactMessages);
  
  const total = Number(totalResult[0]?.count || 0);

  return { messages, total };
}

export async function getContactMessagesCount(): Promise<number> {
  const result = await db
    .select({ count: sql`count(*)` })
    .from(contactMessages);
  
  return Number(result[0]?.count || 0);
}

export async function deleteContactMessage(id: string): Promise<boolean> {
  const result = await db
    .delete(contactMessages)
    .where(eq(contactMessages.id, id));

  return result.changes > 0;
}

export async function deleteAllContactMessages(): Promise<void> {
  await db.delete(contactMessages);
}

export async function searchContactMessages(query: string, page: number = 1, limit: number = 10): Promise<{ messages: ContactMessage[], total: number }> {
  const lowerCaseQuery = query.toLowerCase();
  const offset = (page - 1) * limit;

  const whereClause = or(
    like(contactMessages.name, `%${lowerCaseQuery}%`),
    like(contactMessages.email, `%${lowerCaseQuery}%`)
  );

  const messages = await db
    .select()
    .from(contactMessages)
    .where(whereClause)
    .orderBy(contactMessages.submittedAt)
    .limit(limit)
    .offset(offset);

  const totalResult = await db
    .select({ count: sql`count(*)` })
    .from(contactMessages)
    .where(whereClause);
  
  const total = Number(totalResult[0]?.count || 0);

  return { messages, total };
}
