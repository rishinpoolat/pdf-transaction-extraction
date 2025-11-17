import { sql } from 'drizzle-orm';
import { db, closeConnection } from './index';

async function migrateSchema() {
  try {
    console.log('🚀 Starting schema migration...');

    // Add new columns to pdfs table
    await db.execute(sql`
      ALTER TABLE pdfs
      ADD COLUMN IF NOT EXISTS total_pages INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS processed_pages INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS current_step VARCHAR(100),
      ADD COLUMN IF NOT EXISTS job_id VARCHAR(255);
    `);

    // Create index on job_id
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_pdfs_job_id ON pdfs(job_id);
    `);

    console.log('✅ Schema migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await closeConnection();
  }
}

migrateSchema();
