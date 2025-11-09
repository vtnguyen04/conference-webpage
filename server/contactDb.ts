import { db } from "./db";
import { contactMessages } from "@shared/schema";
import type { ContactMessage, InsertContactMessage } from "@shared/schema";
import { eq, sql, or, like, ilike } from "drizzle-orm";

/**
 * Create a new contact message
 */
import { randomUUID } from "crypto";

// ...

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

/**
 * Get all contact messages
 */
export async function getContactMessages(): Promise<ContactMessage[]> {
  return await db.select().from(contactMessages).orderBy(contactMessages.submittedAt);
}

/**
 * Get the total count of contact messages
 */
export async function getContactMessagesCount(): Promise<number> {
  const result = await db
    .select({ count: sql`count(*)` })
    .from(contactMessages);
  
  return Number(result[0]?.count || 0);
}

/**
 * Delete a single contact message by ID
 */
export async function deleteContactMessage(id: string): Promise<boolean> {
  const result = await db
    .delete(contactMessages)
    .where(eq(contactMessages.id, id));

  return result.changes > 0;
}

/**
 * Delete all contact messages
 */
export async function deleteAllContactMessages(): Promise<void> {
  await db.delete(contactMessages);
}

/**
 * Search contact messages by name, email, or subject
 */
export async function searchContactMessages(query: string): Promise<ContactMessage[]> {
  const lowerCaseQuery = query.toLowerCase();
  return await db
    .select()
    .from(contactMessages)
    .where(
      or(
        like(contactMessages.name, `%${lowerCaseQuery}%`),
        like(contactMessages.email, `%${lowerCaseQuery}%`)
      )
    )
    .orderBy(contactMessages.submittedAt);
}
