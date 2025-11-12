import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

/**
 * Blacklist table - stores invalidated JWT tokens for logout functionality
 * Tokens added here are considered invalid even if not expired
 */
export const blacklist = pgTable('blacklist', {
  id: serial('id').primaryKey(),
  token: varchar('token', { length: 500 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Type exports for use in application code
export type BlacklistToken = typeof blacklist.$inferSelect;
export type NewBlacklistToken = typeof blacklist.$inferInsert;
