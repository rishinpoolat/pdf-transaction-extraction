import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create postgres connection with error handling
let connection: ReturnType<typeof postgres>;

try {
  connection = postgres(process.env.DATABASE_URL, {
    max: 10, // Maximum number of connections in the pool
    idle_timeout: 20, // Close idle connections after 20 seconds
    connect_timeout: 10, // Connection timeout in seconds
  });
} catch (error) {
  console.error('Failed to create database connection:', error);
  throw new Error('Database connection failed');
}

// Create drizzle instance with schema
export const db = drizzle(connection, { schema });

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    await connection`SELECT 1`;
    console.log('✓ Database connection established successfully');
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown handler
export async function closeConnection(): Promise<void> {
  try {
    await connection.end();
    console.log('✓ Database connection closed');
  } catch (error) {
    console.error('✗ Error closing database connection:', error);
  }
}
