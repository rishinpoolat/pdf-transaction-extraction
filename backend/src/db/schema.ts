import { pgTable, serial, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

/**
 * Users table - stores user authentication and profile information
 */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  otp: varchar('otp', { length: 10 }), // One-time password for verification
  isVerified: boolean('is_verified').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

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
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type BlacklistToken = typeof blacklist.$inferSelect;
export type NewBlacklistToken = typeof blacklist.$inferInsert;
