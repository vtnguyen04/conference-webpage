import { db } from "./db";
import { contactMessages } from "@shared/schema";
import type { ContactMessage, InsertContactMessage } from "@shared/schema";
import { sql } from "drizzle-orm";

/**
 * Create a new contact message
 */
export async function createContactMessage(
  data: Omit<InsertContactMessage, "id" | "submittedAt">
): Promise<ContactMessage> {
  const [message] = await db
    .insert(contactMessages)
    .values(data)
    .returning();

  return message;
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
    .select({ count: sql<number>`count(*)::int` })
    .from(contactMessages);
  
  return result[0]?.count || 0;
}
