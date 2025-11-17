import { sql } from 'drizzle-orm';
import { db, closeConnection } from './index';

async function createSchema() {
  try {
    console.log('🚀 Creating database schema...');

    // Create blacklist table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS blacklist (
        id SERIAL PRIMARY KEY,
        token VARCHAR(500) NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ Created blacklist table');

    // Create pdfs table with all fields
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pdfs (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(512) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
        processing_status VARCHAR(50) DEFAULT 'pending',
        total_pages INTEGER DEFAULT 0,
        processed_pages INTEGER DEFAULT 0,
        total_transactions INTEGER DEFAULT 0,
        progress_percentage INTEGER DEFAULT 0,
        current_step VARCHAR(100),
        job_id VARCHAR(255),
        uploaded_at TIMESTAMP DEFAULT NOW(),
        processed_at TIMESTAMP,
        error_message TEXT
      )
    `);
    console.log('✅ Created pdfs table');

    // Create indexes for pdfs table
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_pdfs_status ON pdfs(processing_status)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_pdfs_uploaded_at ON pdfs(uploaded_at)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_pdfs_job_id ON pdfs(job_id)
    `);
    console.log('✅ Created indexes for pdfs table');

    // Create transactions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        pdf_id INTEGER NOT NULL REFERENCES pdfs(id) ON DELETE CASCADE,
        buyer_name_tamil TEXT,
        seller_name_tamil TEXT,
        house_number_tamil VARCHAR(100),
        survey_number_tamil VARCHAR(100),
        document_number_tamil VARCHAR(100),
        buyer_name_english TEXT,
        seller_name_english TEXT,
        house_number_english VARCHAR(100),
        survey_number_english VARCHAR(100),
        document_number_english VARCHAR(100),
        transaction_date TIMESTAMP,
        transaction_value DECIMAL(15, 2),
        original_text TEXT NOT NULL,
        translated_text TEXT,
        page_number INTEGER,
        extraction_confidence DECIMAL(3, 2),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created transactions table');

    // Create indexes for transactions table
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_transactions_pdf_id ON transactions(pdf_id)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_transactions_buyer_tamil ON transactions(buyer_name_tamil)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_transactions_buyer_english ON transactions(buyer_name_english)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_transactions_seller_tamil ON transactions(seller_name_tamil)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_transactions_seller_english ON transactions(seller_name_english)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_transactions_house_number ON transactions(house_number_tamil, house_number_english)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_transactions_survey_number ON transactions(survey_number_tamil, survey_number_english)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_transactions_document_number ON transactions(document_number_tamil, document_number_english)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date)
    `);
    console.log('✅ Created indexes for transactions table');

    console.log('✅ Schema creation completed successfully!');
  } catch (error) {
    console.error('❌ Schema creation failed:', error);
    throw error;
  } finally {
    await closeConnection();
  }
}

createSchema();
