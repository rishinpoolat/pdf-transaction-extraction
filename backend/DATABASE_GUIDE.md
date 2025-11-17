# Database Viewing Guide

## Quick Access Commands

### 1. Connect to PostgreSQL

```bash
# Connect to database
psql -U postgres -d pdf_transactions
```

## Common Queries

### View All PDFs

```sql
-- List all uploaded PDFs
SELECT
  id,
  original_name,
  total_pages,
  processed_pages,
  progress_percentage,
  processing_status,
  current_step,
  uploaded_at
FROM pdfs
ORDER BY uploaded_at DESC;
```

### View PDF Processing Status

```sql
-- Check specific PDF status
SELECT
  id,
  original_name,
  processing_status,
  current_step,
  total_pages,
  processed_pages,
  progress_percentage,
  total_transactions,
  error_message
FROM pdfs
WHERE id = 1; -- Change to your PDF ID
```

### View Transactions

```sql
-- View all transactions
SELECT
  id,
  pdf_id,
  page_number,
  LENGTH(original_text) as original_chars,
  LENGTH(translated_text) as translated_chars,
  SUBSTRING(original_text, 1, 100) as original_preview,
  SUBSTRING(translated_text, 1, 100) as translated_preview
FROM transactions
ORDER BY pdf_id, page_number
LIMIT 10;
```

### View Transactions for Specific PDF

```sql
-- Transactions for a specific PDF
SELECT
  id,
  page_number,
  original_text,
  translated_text
FROM transactions
WHERE pdf_id = 8 -- Change to your PDF ID
ORDER BY page_number;
```

### Count Transactions per PDF

```sql
-- Count transactions for each PDF
SELECT
  p.id,
  p.original_name,
  COUNT(t.id) as transaction_count,
  p.processing_status
FROM pdfs p
LEFT JOIN transactions t ON p.id = t.pdf_id
GROUP BY p.id, p.original_name, p.processing_status
ORDER BY p.id DESC;
```

### View Failed PDFs

```sql
-- Show failed PDFs with error messages
SELECT
  id,
  original_name,
  processing_status,
  error_message,
  uploaded_at
FROM pdfs
WHERE processing_status = 'failed'
ORDER BY uploaded_at DESC;
```

### View Processing Progress

```sql
-- Real-time processing status
SELECT
  id,
  original_name,
  processing_status,
  current_step,
  CONCAT(processed_pages, '/', total_pages) as pages_progress,
  progress_percentage || '%' as progress,
  total_transactions as txns
FROM pdfs
WHERE processing_status IN ('processing', 'queued')
ORDER BY uploaded_at DESC;
```

### View Recent Transactions with Full Text

```sql
-- View recent transactions with full content
SELECT
  t.id,
  t.pdf_id,
  p.original_name,
  t.page_number,
  t.original_text,
  t.translated_text,
  t.created_at
FROM transactions t
JOIN pdfs p ON t.pdf_id = p.id
ORDER BY t.created_at DESC
LIMIT 5;
```

### Search Tamil Text

```sql
-- Search for specific Tamil text
SELECT
  id,
  pdf_id,
  page_number,
  SUBSTRING(original_text, 1, 200) as preview
FROM transactions
WHERE original_text LIKE '%தமிழ்%'
LIMIT 10;
```

### Search English Translation

```sql
-- Search in translated text
SELECT
  id,
  pdf_id,
  page_number,
  SUBSTRING(translated_text, 1, 200) as preview
FROM transactions
WHERE translated_text ILIKE '%government%'
LIMIT 10;
```

## Database Statistics

### Overall Stats

```sql
-- Overall database statistics
SELECT
  (SELECT COUNT(*) FROM pdfs) as total_pdfs,
  (SELECT COUNT(*) FROM pdfs WHERE processing_status = 'completed') as completed_pdfs,
  (SELECT COUNT(*) FROM pdfs WHERE processing_status = 'processing') as processing_pdfs,
  (SELECT COUNT(*) FROM pdfs WHERE processing_status = 'failed') as failed_pdfs,
  (SELECT COUNT(*) FROM transactions) as total_transactions,
  (SELECT SUM(total_pages) FROM pdfs) as total_pages_uploaded;
```

### Storage Usage

```sql
-- Check table sizes
SELECT
  relname as table_name,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size,
  pg_size_pretty(pg_relation_size(relid)) as table_size,
  pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) as indexes_size
FROM pg_catalog.pg_statio_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(relid) DESC;
```

## Using TablePlus / pgAdmin

### TablePlus (Recommended GUI)

1. Download: https://tableplus.com/
2. Create connection:
   - Type: PostgreSQL
   - Host: localhost
   - Port: 5432
   - User: postgres
   - Password: postgres
   - Database: pdf_transactions
3. Click "Connect"

### pgAdmin

1. Download: https://www.pgadmin.org/
2. Add New Server:
   - Name: PDF Transactions
   - Host: localhost
   - Port: 5432
   - Username: postgres
   - Password: postgres
3. Browse to: Servers > PDF Transactions > Databases > pdf_transactions > Schemas > public > Tables

## Export Data

### Export to CSV

```sql
-- Export PDFs to CSV
\copy (SELECT * FROM pdfs) TO '/tmp/pdfs.csv' CSV HEADER;

-- Export transactions to CSV
\copy (SELECT * FROM transactions) TO '/tmp/transactions.csv' CSV HEADER;
```

### Export specific PDF transactions

```sql
-- Export transactions for PDF ID 8
\copy (SELECT * FROM transactions WHERE pdf_id = 8) TO '/tmp/pdf_8_transactions.csv' CSV HEADER;
```

## Cleanup

### Delete Failed Jobs

```sql
-- Delete failed PDFs and their transactions
DELETE FROM pdfs WHERE processing_status = 'failed';
```

### Delete Old Test Data

```sql
-- Delete test PDFs
DELETE FROM pdfs WHERE original_name LIKE 'test%';
```

### Clear All Data

```sql
-- CAUTION: This deletes everything!
TRUNCATE TABLE transactions, pdfs RESTART IDENTITY CASCADE;
```

## Monitoring Active Processing

```bash
# Watch processing status (updates every 2 seconds)
watch -n 2 "psql -U postgres -d pdf_transactions -c \"SELECT id, original_name, processing_status, processed_pages, total_pages, progress_percentage FROM pdfs WHERE processing_status IN ('processing', 'queued') ORDER BY id DESC;\""
```

## Common Issues

### Check for Rate-Limited Translations

```sql
-- Find transactions with rate-limited translations
SELECT
  pdf_id,
  COUNT(*) as rate_limited_count
FROM transactions
WHERE translated_text LIKE '%Translation unavailable - rate limited%'
GROUP BY pdf_id;
```

### Find Incomplete Processing

```sql
-- PDFs that started but didn't complete
SELECT
  id,
  original_name,
  processing_status,
  processed_pages,
  total_pages,
  error_message
FROM pdfs
WHERE processing_status = 'processing'
  AND (NOW() - uploaded_at) > INTERVAL '1 hour';
```

## Exit psql

```sql
\q
```

or press `Ctrl+D`
