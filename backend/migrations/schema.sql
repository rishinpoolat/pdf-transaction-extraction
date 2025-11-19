-- Migration 001: English-only schema migration
-- Date: 2025-11-18
-- Description: Restructure transactions table to store only English data extracted from Tamil documents
-- This migration removes duplicate Tamil/English columns and optimizes the schema for English-only storage

-- Drop existing transactions table
DROP TABLE IF EXISTS transactions CASCADE;

-- Recreate transactions table with English-only columns
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  pdf_id INTEGER NOT NULL REFERENCES pdfs(id) ON DELETE CASCADE,

  -- Party names (English)
  buyer_name TEXT,
  seller_name TEXT,

  -- Document details
  document_number VARCHAR(100),
  document_year VARCHAR(10),
  execution_date VARCHAR(50),
  presentation_date VARCHAR(50),
  registration_date VARCHAR(50),
  transaction_nature VARCHAR(100),

  -- Property details (English)
  survey_number VARCHAR(100),
  plot_number VARCHAR(100),
  village VARCHAR(200),
  street VARCHAR(200),
  property_type VARCHAR(100),
  property_extent VARCHAR(100),

  -- Financial
  consideration_value VARCHAR(50),
  market_value VARCHAR(50),

  -- Reference
  previous_document_number VARCHAR(200),
  volume_number VARCHAR(50),
  page_number_ref VARCHAR(50),

  -- Metadata
  page_number INTEGER,
  extraction_confidence DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_transactions_pdf_id ON transactions(pdf_id);
CREATE INDEX idx_transactions_buyer ON transactions(buyer_name);
CREATE INDEX idx_transactions_seller ON transactions(seller_name);
CREATE INDEX idx_transactions_survey_number ON transactions(survey_number);
CREATE INDEX idx_transactions_document_number ON transactions(document_number);
CREATE INDEX idx_transactions_date ON transactions(execution_date);
CREATE INDEX idx_transactions_village ON transactions(village);

-- Note: This migration will delete all existing transaction data
-- Make sure to backup data if needed before running this migration
