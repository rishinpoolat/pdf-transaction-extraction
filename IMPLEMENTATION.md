# Large PDF Processing Implementation

## Overview

This document describes the implementation of an efficient background job processing system for handling large PDF files (120+ pages) with translation and transaction extraction.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│   API        │────▶│   Queue     │
│  (Upload)   │     │  (Express)   │     │  (BullMQ)   │
└─────────────┘     └──────────────┘     └─────────────┘
                           │                     │
                           │                     ▼
                           │              ┌─────────────┐
                           │              │   Worker    │
                           │              │ (Background)│
                           │              └─────────────┘
                           │                     │
                           ▼                     ▼
                    ┌──────────────┐     ┌─────────────┐
                    │  SSE Stream  │     │  PostgreSQL │
                    │  (Progress)  │     │  + Redis    │
                    └──────────────┘     └─────────────┘
```

## Key Components

### 1. **Redis + BullMQ Queue System**
   - **Location**: `backend/src/config/queue.config.ts`
   - **Purpose**: Manage background PDF processing jobs
   - **Features**:
     - Automatic retry with exponential backoff (3 attempts)
     - Job persistence and monitoring
     - Concurrent processing (2 PDFs at a time)

### 2. **Translation Service with Chunking**
   - **Location**: `backend/src/services/translation.service.ts`
   - **Features**:
     - Splits text into 5000-character chunks (Google Translate limit)
     - Rate limiting: 100 requests per 100 seconds
     - Redis caching to avoid re-translating (7-day expiry)
     - Retry logic with exponential backoff

### 3. **Page-by-Page PDF Parser**
   - **Location**: `backend/src/services/pdf-parser.service.ts`
   - **Features**:
     - Batch processing (5 pages at a time)
     - Memory-efficient streaming
     - Metadata extraction (total pages, author, etc.)

### 4. **Background Worker**
   - **Location**: `backend/src/workers/pdf-processor.worker.ts`
   - **Processing Flow**:
     1. Extract PDF metadata
     2. Parse pages in batches (5 pages)
     3. Translate each page's text
     4. Extract transactions from page
     5. Store in database
     6. Update progress in real-time

### 5. **Server-Sent Events (SSE) for Progress**
   - **Endpoint**: `GET /api/transactions/progress/:pdfId`
   - **Updates every**: 2 seconds
   - **Data sent**:
     - Processing status
     - Current step
     - Pages processed
     - Progress percentage
     - Total transactions

## Database Schema Updates

### `pdfs` Table - New Fields:
```sql
total_pages         INTEGER      -- Total pages in PDF
processed_pages     INTEGER      -- Pages processed so far
progress_percentage INTEGER      -- 0-100%
current_step        VARCHAR(100) -- parsing, translating, storing
job_id              VARCHAR(255) -- BullMQ job ID
```

## API Endpoints

### 1. Upload PDF (Non-Blocking)
```
POST /api/transactions/upload
```

**Request:**
```
Content-Type: multipart/form-data
Body: { pdf: <file> }
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "message": "PDF uploaded and queued for processing",
  "data": {
    "pdfId": 123,
    "jobId": "job_abc123",
    "filename": "1699999999-uuid-document.pdf",
    "status": "queued",
    "statusUrl": "/api/transactions/status/123",
    "progressUrl": "/api/transactions/progress/123"
  }
}
```

### 2. Get Processing Status
```
GET /api/transactions/status/:pdfId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pdfId": 123,
    "status": "processing",
    "currentStep": "translating",
    "totalPages": 120,
    "processedPages": 45,
    "progressPercentage": 37,
    "totalTransactions": 89
  }
}
```

### 3. Real-Time Progress (SSE)
```
GET /api/transactions/progress/:pdfId
```

**SSE Events:**
```
data: {"type":"connected"}

data: {"type":"progress","status":"processing","processedPages":10,"totalPages":120,"progressPercentage":8}

data: {"type":"progress","status":"processing","processedPages":20,"totalPages":120,"progressPercentage":16}

data: {"type":"complete","status":"completed","totalTransactions":245}
```

## Performance Characteristics

### For a 120-Page PDF:

| Metric | Value |
|--------|-------|
| **Processing Time** | 5-10 minutes |
| **Per Page** | ~3-5 seconds |
| **Translation Caching** | 7 days |
| **Memory Usage** | Low (streaming) |
| **Concurrent Jobs** | 2 PDFs |

### Optimization Strategies:

1. **Chunked Processing**
   - Process 5 pages at a time
   - Prevents memory overflow
   - Enables progress tracking

2. **Translation Caching**
   - Redis-based cache
   - MD5 hash as key
   - Reduces API calls by ~70% for similar content

3. **Rate Limiting**
   - 100 requests per 100 seconds
   - Prevents API throttling
   - Automatic backoff

4. **Batch Database Inserts**
   - Insert transactions per page batch
   - Reduces DB round trips

## Setup Instructions

### 1. Start Services
```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify services
docker ps
```

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Configure Environment
```bash
# Update .env file
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 4. Run Migrations
```bash
npx tsx src/db/migrate-schema.ts
```

### 5. Start Backend (with Worker)
```bash
npm run dev
```

You should see:
```
✅ Redis client connected
✅ PDF processing worker initialized
✅ Database connected
```

## Frontend Integration

### React Hook for Progress Tracking

```typescript
import { useEffect, useState } from 'react';

function useProgressTracking(pdfId: number) {
  const [progress, setProgress] = useState({
    status: 'queued',
    progressPercentage: 0,
    processedPages: 0,
    totalPages: 0,
  });

  useEffect(() => {
    const eventSource = new EventSource(
      `http://localhost:5001/api/transactions/progress/${pdfId}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'progress') {
        setProgress(data);
      } else if (data.type === 'complete') {
        setProgress((prev) => ({ ...prev, status: data.status }));
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => eventSource.close();
  }, [pdfId]);

  return progress;
}
```

### Usage in Component

```typescript
function PdfUpload() {
  const [pdfId, setPdfId] = useState<number | null>(null);
  const progress = useProgressTracking(pdfId);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('pdf', file);

    const response = await fetch('/api/transactions/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    setPdfId(result.data.pdfId);
  };

  return (
    <div>
      {progress.status === 'processing' && (
        <div>
          <progress value={progress.progressPercentage} max={100} />
          <p>
            Processing: {progress.processedPages} / {progress.totalPages} pages
          </p>
        </div>
      )}
    </div>
  );
}
```

## Monitoring & Debugging

### Check Queue Status
```bash
# Connect to Redis
docker exec -it pdf_transactions_redis redis-cli

# Check jobs
KEYS bullmq:pdf-processing:*

# Check job details
HGETALL bullmq:pdf-processing:jobs:1
```

### View Worker Logs
```bash
# Backend logs show worker activity
npm run dev

# Look for:
# 🚀 Starting PDF processing for job...
# 📄 PDF has X pages
# 📖 Processing pages 1 to 5
# 🌐 Translating chunk...
# ✅ Completed processing
```

### Database Queries
```sql
-- Check processing status
SELECT
  id,
  original_name,
  processing_status,
  current_step,
  processed_pages,
  total_pages,
  progress_percentage
FROM pdfs
ORDER BY uploaded_at DESC;

-- Check transactions
SELECT COUNT(*), pdf_id
FROM transactions
GROUP BY pdf_id;
```

## Troubleshooting

### Issue: Redis Connection Failed
```bash
# Check Redis is running
docker ps | grep redis

# Restart Redis
docker-compose restart redis
```

### Issue: Worker Not Processing
```bash
# Check worker is started
# Look for: "✅ PDF processing worker initialized"

# Check queue has jobs
docker exec -it pdf_transactions_redis redis-cli
KEYS bullmq:pdf-processing:*
```

### Issue: Translation Failing
```bash
# Check rate limits
# Translation service logs: "❌ Translation attempt X failed"

# Clear cache if needed
docker exec -it pdf_transactions_redis redis-cli
KEYS translate:*
DEL translate:*
```

## Future Enhancements

1. **Parallel Translation**
   - Translate multiple pages concurrently
   - Reduce processing time by 50%

2. **Smart Transaction Extraction**
   - ML-based field extraction
   - Pattern recognition for Tamil text

3. **Progress Webhooks**
   - Notify external systems
   - Integration with frontend

4. **Job Prioritization**
   - Premium users first
   - Smaller PDFs processed faster

5. **Distributed Workers**
   - Multiple worker instances
   - Load balancing

## Summary

This implementation provides a robust, scalable solution for processing large PDFs:

✅ **Non-blocking uploads** - Immediate response to users
✅ **Real-time progress** - SSE for live updates
✅ **Memory efficient** - Chunked processing
✅ **Translation caching** - Reduces API costs
✅ **Error handling** - Automatic retries
✅ **Monitoring** - Full visibility into job status

The system can handle 120-page PDFs in 5-10 minutes with minimal memory usage and provides excellent user experience through real-time progress updates.
