# Nirnai - Tamil Property Transaction Extraction System

A full-stack application for extracting, translating, and managing Tamil property transaction data from PDF documents. The system automatically parses Tamil Encumbrance Certificate PDFs, translates the content to English, extracts structured transaction data, and provides a user-friendly interface for searching and viewing transactions.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v18 or higher
- **Docker & Docker Compose**: For PostgreSQL and Redis
- **npm**: v8 or higher

### Quick Setup (5 minutes)

```bash
# 1. Clone repository
git clone <repository-url>
cd nirnai

# 2. Start Docker containers (PostgreSQL + Redis)
docker-compose up -d

# 3. Install backend dependencies
cd backend
npm install

# 4. Configure environment
cp .env.example .env
# Edit .env if needed (defaults work for local development)

# 5. Initialize database
PGPASSWORD=postgres psql -h localhost -U postgres -d pdf_transactions -f migrations/schema.sql

# 6. Start backend server
npm run dev
# Backend runs at http://localhost:5001

# 7. In a new terminal: Install and start frontend
cd frontend
npm install
npm run dev
# Frontend runs at http://localhost:3000
```

**Login Credentials:**
- Email: `admin@nirnai.com`
- Password: `admin123`

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 16.0.1 (React 19.2.0)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4.0
- **Forms**: react-hook-form + Zod validation
- **Notifications**: Sonner

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js 5.1.0
- **Database**: PostgreSQL 15+ (with Drizzle ORM)
- **Cache/Queue**: Redis 7+ + BullMQ
- **PDF Processing**: pdf-parse 2.4.5 + pdf-lib 1.17.1
- **Translation**: @vitalets/google-translate-api 9.2.1
- **Auth**: JWT (jsonwebtoken)
- **Security**: Helmet + CORS + express-rate-limit
- **File Upload**: Multer (max 50MB)

---

## 🏗 Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                      │
│                     http://localhost:3000                       │
│                                                                 │
│  • Login & Authentication                                       │
│  • PDF Upload Interface                                         │
│  • Transaction Search & Filtering                               │
│  • Real-time Progress Tracking (SSE)                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ REST API + JWT Auth
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (Express.js)                       │
│                     http://localhost:5001                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ API Layer                                                │  │
│  │  • /api/auth/* - Login, logout, user management         │  │
│  │  • /api/transactions/* - Upload, search, fetch data     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
│  ┌──────────────────────────┼───────────────────────────────┐  │
│  │ Services                 │                               │  │
│  │  • PDF Parser ───────────┼─→ pdf-parse (text extract)   │  │
│  │  • Translator ───────────┼─→ Google Translate API       │  │
│  │  • Transaction Parser ───┼─→ Regex field extraction     │  │
│  └──────────────────────────┼───────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
    ┌─────────────┐  ┌──────────────┐  ┌─────────────┐
    │ PostgreSQL  │  │    Redis     │  │   BullMQ    │
    │   Database  │  │    Cache     │  │    Queue    │
    │             │  │              │  │             │
    │ • users     │  │ • Translated │  │ • PDF jobs  │
    │ • pdfs      │  │   text cache │  │ • Progress  │
    │ • trans-    │  │   (30 days)  │  │   tracking  │
    │   actions   │  │ • Token      │  │             │
    │             │  │   blacklist  │  │             │
    └─────────────┘  └──────────────┘  └──────┬──────┘
                                              │
                                              │ Job Dispatch
                                              ▼
                                    ┌──────────────────┐
                                    │  Worker Process  │
                                    │                  │
                                    │ 1. Extract PDF   │
                                    │ 2. Translate     │
                                    │ 3. Parse fields  │
                                    │ 4. Save to DB    │
                                    └──────────────────┘
```

### Data Flow: PDF Processing Pipeline

```
1. User uploads PDF via frontend
   ↓
2. Backend saves PDF & creates BullMQ job
   ↓
3. Worker picks up job from queue
   ↓
4. Extract metadata (pages, size) using pdf-lib
   ↓
5. Process pages in batches (5 at a time)
   │
   ├─→ Extract text from page (pdf-parse)
   │
   ├─→ Translate Tamil → English (Google Translate API)
   │   ├─→ Check Redis cache first (30-day TTL)
   │   ├─→ If not cached: API call with 15s delay
   │   └─→ Store result in cache
   │
   ├─→ Parse transaction fields using regex
   │   └─→ Extract: names, dates, survey numbers, etc.
   │
   └─→ Save to PostgreSQL
   ↓
6. Update progress (SSE to frontend)
   ↓
7. Mark job complete
```

### Key Design Decisions

1. **Async Processing**: Large PDFs processed in background using BullMQ to avoid blocking API requests
2. **Batch Processing**: Pages processed in groups of 5 to optimize memory usage
3. **Aggressive Caching**: Redis stores translations for 30 days, reducing API calls by 80%+
4. **Text Extraction**: pdf-parse for fast, accurate text extraction from digital PDFs
5. **Real-time Updates**: Server-Sent Events (SSE) provide live progress updates to frontend
6. **Single Queue Worker**: One job at a time to respect translation API rate limits

---

## 📄 PDF Processing: pdf-parse vs OCR

### Why pdf-parse?

This application uses **pdf-parse** instead of OCR for the following reasons:

**pdf-parse (Text Extraction):**
- Extracts embedded text directly from PDFs
- **Fast** - no image processing required
- **Accurate** - preserves exact text and Tamil Unicode perfectly
- **Best for**: Digitally created PDFs (MS Word, government portals) where text is selectable

**OCR (Optical Character Recognition):**
- Reads text from images by converting pixels to text
- **Slower** - requires image processing and ML models
- **Less accurate** - especially for Tamil script
- **Best for**: Scanned documents, photos, image-based PDFs

### When to Use Each Approach

**Use pdf-parse (current approach)** if:
- You can select and copy text from your PDFs
- PDFs are generated from digital sources
- You need fast, accurate extraction with proper Tamil encoding

**Use OCR** if:
- PDFs are scanned documents or images
- Text is not selectable in the PDF
- PDFs are photos of physical documents

**Hybrid approach** (pdf-parse + OCR fallback):
- Try pdf-parse first
- If no text found or gibberish, fall back to OCR
- Best for mixed document types

### How to Test Your PDFs

```bash
# Check if your PDF has embedded text
# If you get readable output, pdf-parse will work
pdftotext your-document.pdf -

# Or open the PDF and try to select/copy text
# If you can copy text → use pdf-parse
# If text is not selectable → use OCR
```

---

## ⚠️ Translation Rate Limiting & Solutions

### Current Implementation

The application uses **@vitalets/google-translate-api** (free, unofficial Google Translate API).

**Known Limitations:**
- **IP-based rate limiting**: ~10-20 requests before temporary ban
- **Ban duration**: 1-24 hours (unpredictable)
- **Processing speed**: 15-second delays required between requests
- **Processing time**:
  - Small PDF (10 pages): ~5 minutes
  - Medium PDF (50 pages): ~25 minutes
  - Large PDF (100 pages): ~50 minutes
- **No SLA**: Free service, can break anytime

### How We Mitigate Rate Limits

1. **Redis Caching**: 30-day cache for translated text (reduces repeat API calls by 80%+)
2. **Delays**: 15-second wait between translation requests
3. **Exponential Backoff**: Automatic retry with 2min, 4min, 8min delays
4. **Graceful Degradation**: Processing continues even if translation fails

### Solutions for Production

**Option 1: Google Cloud Translation API (Recommended)**
```bash
# Pricing: $20 per 1 million characters
# Average cost: ~$0.004 per PDF
# Benefits: Fast, reliable, official API, no rate limits

# Setup:
# 1. Create Google Cloud account
# 2. Enable Cloud Translation API
# 3. Get API key
# 4. Add to .env:
GOOGLE_CLOUD_API_KEY=your-api-key-here
```

**Option 2: AWS Translate**
```bash
# Pricing: $15 per 1 million characters
# Benefits: Good for AWS-hosted apps, pay-as-you-go
# Setup: Similar to Google Cloud, requires AWS account
```

**Option 3: Azure Translator**
```bash
# Pricing: $10 per 1 million characters
# Benefits: Good for Microsoft stack, free tier available
# Setup: Requires Azure account
```

**Option 4: DeepL API**
```bash
# Pricing: Higher than alternatives
# Benefits: Best translation quality, especially for European languages
# Note: Tamil support may be limited
```

**Option 5: Self-hosted Translation**
```bash
# Use open-source models like:
# - LibreTranslate (free, self-hosted)
# - Opus-MT (multilingual translation)
# Benefits: No external API dependency, no rate limits
# Drawbacks: Requires GPU for good performance, lower quality
```

### Troubleshooting Rate Limits

**If you hit rate limits:**

1. **Wait it out**: Ban typically lifts in 1-24 hours
2. **Change IP address**: Use VPN or different network
3. **Re-upload same PDF**: Cached translations are reused (much faster)
4. **Upgrade immediately**: Switch to paid API (recommended)

**Check translation status:**
```bash
# View Redis cache
redis-cli
> KEYS translate:*
> TTL translate:your-key

# Check worker logs for rate limit errors
# Look for: "Too Many Requests" or "429" errors
```

---

## ✨ Features

### 1. PDF Ingestion & Parsing
- Upload Tamil-language PDF documents (Encumbrance Certificates)
- Automatic extraction of transaction fields:
  - Buyer and Seller names (English extracted from translated Tamil)
  - Survey numbers and Plot numbers
  - Document numbers and dates
  - Property details (village, street, type, extent)
  - Financial values (consideration value, market value)
- Background job processing with real-time progress tracking
- Batch processing support for large PDFs

### 2. Translation Service
- Automatic translation of Tamil text to English using Google Translate API
- Smart extraction of English names and locations from translated text
- Mixed English/Tamil text extraction (extracts English even when embedded in Tamil)
- Redis caching mechanism (30-day TTL) to reduce API calls
- Rate limiting protection with automatic retry logic

### 3. Filtering & Search
**Server-side query parameters:**
- `buyerName` - Filter by buyer name (partial match, case-insensitive)
- `sellerName` - Filter by seller name (partial match, case-insensitive)
- `surveyNumber` - Filter by survey number
- `documentNumber` - Filter by document number
- `village` - Filter by village name
- `plotNumber` - Filter by plot number
- `pdfId` - Filter by specific PDF

**Client-side filtering:**
- Real-time search across all transaction fields
- Filter by transaction type (Conveyance, Mortgage, Gift Deed)

**Sorting:**
- Sort by date (execution/registration date)
- Sort by document number
- Ascending/descending toggle

**Pagination:**
- 20 items per page
- First/Previous/Next/Last navigation
- Page number quick jump

### 4. RESTful API
- JWT-based authentication
- Rate limiting and security middleware (Helmet, CORS)
- Comprehensive error handling
- Type-safe database operations (Drizzle ORM)

### 5. Web UI
- Login screen with JWT authentication
- PDF upload interface with drag-and-drop
- Real-time processing progress indicator
- PDF list sidebar for easy navigation
- **PDF preview panel** with side-by-side view of PDF and transactions
- Toggle to show/hide PDF preview
- Interactive transactions table with sorting
- Advanced search and filter capabilities
- Transaction details modal with full information
- Responsive design for mobile and desktop

---

## 📡 API Documentation

Base URL: `http://localhost:5001`

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@nirnai.com",
  "password": "admin123"
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "user": {
      "id": 1,
      "email": "admin@nirnai.com",
      "name": "Admin"
    }
  }
}
```

#### Get User Details
```http
GET /api/auth/me
Authorization: Bearer <token>

Response:
{
  "message": "User details fetched successfully",
  "data": {
    "id": 1,
    "name": "Admin",
    "email": "admin@nirnai.com"
  }
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>

Response: Token is blacklisted
```

---

### Transactions

#### Upload PDF
```http
POST /api/transactions/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
  pdf: <file>

Response:
{
  "success": true,
  "message": "PDF uploaded and queued for processing",
  "data": {
    "pdfId": 1,
    "jobId": "job-123",
    "status": "queued"
  }
}
```

#### Get Transactions with Filters
```http
GET /api/transactions?buyerName=John&sellerName=Jane&surveyNumber=329&page=1&limit=50
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "transactions": [...],
    "total": 100,
    "page": 1,
    "limit": 50,
    "totalPages": 2
  }
}
```

#### Get Transaction by ID
```http
GET /api/transactions/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "buyerName": "John Doe",
    "sellerName": "Jane Smith",
    ...
  }
}
```

#### Get All Uploaded PDFs
```http
GET /api/transactions/pdfs
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "originalName": "document.pdf",
      "processingStatus": "completed",
      "totalPages": 100,
      "totalTransactions": 250,
      "uploadedAt": "2025-11-19T10:00:00Z"
    }
  ]
}
```

#### Get Processing Progress (Server-Sent Events)
```http
GET /api/transactions/progress/:pdfId
Authorization: Bearer <token>

Response: (Stream of events)
data: {"step":"processing_pages","progress":25,"processedPages":25,"totalPages":100}
data: {"step":"completed","progress":100}
```

#### Get PDF File for Preview
```http
GET /api/transactions/pdf/:pdfId
Authorization: Bearer <token>

Response: PDF file (application/pdf)
Content-Disposition: inline; filename="document.pdf"
```

---

## 🗄 Database Schema

### Table: `pdfs`
Stores uploaded PDF metadata and processing status.

```sql
CREATE TABLE pdfs (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT,
  processing_status VARCHAR(50) DEFAULT 'pending',
  total_pages INT,
  processed_pages INT DEFAULT 0,
  total_transactions INT DEFAULT 0,
  progress_percentage INT DEFAULT 0,
  current_step VARCHAR(100),
  job_id VARCHAR(255),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  error_message TEXT
);
```

### Table: `transactions`
Stores extracted transaction data (English-only).

```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  pdf_id INT REFERENCES pdfs(id) ON DELETE CASCADE,
  page_number INT,
  document_number VARCHAR(100),
  document_year VARCHAR(10),
  execution_date VARCHAR(50),
  presentation_date VARCHAR(50),
  registration_date VARCHAR(50),
  transaction_nature VARCHAR(100),
  buyer_name VARCHAR(500),
  seller_name VARCHAR(500),
  survey_number VARCHAR(200),
  plot_number VARCHAR(200),
  village VARCHAR(200),
  street VARCHAR(200),
  property_type VARCHAR(100),
  property_extent VARCHAR(100),
  consideration_value VARCHAR(50),
  market_value VARCHAR(50),
  previous_document_number VARCHAR(200),
  volume_number VARCHAR(50),
  page_number_ref VARCHAR(50),
  extraction_confidence VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast querying
CREATE INDEX idx_transactions_pdf_id ON transactions(pdf_id);
CREATE INDEX idx_transactions_buyer_name ON transactions(buyer_name);
CREATE INDEX idx_transactions_seller_name ON transactions(seller_name);
CREATE INDEX idx_transactions_survey_number ON transactions(survey_number);
CREATE INDEX idx_transactions_document_number ON transactions(document_number);
CREATE INDEX idx_transactions_village ON transactions(village);
```

---

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check if PostgreSQL is running
docker ps | grep pdf_transactions_db

# If not running, start containers (from project root)
docker-compose up -d

# Check logs
docker logs pdf_transactions_db

# Test connection manually
PGPASSWORD=postgres psql -h localhost -U postgres -d pdf_transactions -c "SELECT 1"
```

### Redis Connection Failed
```bash
# Check if Redis is running
docker ps | grep pdf_transactions_redis

# If not running (from project root)
docker-compose up -d

# Test Redis connection
redis-cli ping
# Should return: PONG

# Check logs
docker logs pdf_transactions_redis
```

### Translation Rate Limited
**Symptoms:**
- Logs show "Too Many Requests" errors
- Jobs retry with 2min, 4min, 8min delays
- Processing is very slow or stuck

**Solutions:**
1. **Wait it out**: Ban typically lasts 1-24 hours
2. **Use different IP**: VPN or different network
3. **Use cached data**: Re-upload same PDF (cache helps)
4. **Upgrade to paid API**: Google Cloud Translation API (recommended for production)

### PDF Processing Stuck or Slow
**Check worker logs:**
```bash
# Backend terminal should show progress
📄 Page 5/100 - Starting processing...
🌐 Translating page 5...
⏱️ Waiting 15s before next translation API call...
```

**Normal behavior:**
- 15-second delays between translations (required)
- ~1 minute per page on first upload
- Faster on re-upload (cached translations)

**If genuinely stuck:**
```bash
# Check Redis queue
redis-cli
> KEYS bull:pdf-processing:*
> HGETALL bull:pdf-processing:1

# Restart backend (will retry failed jobs)
cd backend
# Ctrl+C to stop
npm run dev
```

### 401 Unauthorized Error
**Possible causes:**
1. Token expired (24h lifetime) - Log in again
2. Invalid token format - Check `Authorization: Bearer <token>` header
3. Token blacklisted (after logout) - Log in again

### Port Already in Use
```bash
# Find process using port
lsof -i :5001    # Backend
lsof -i :3000    # Frontend

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=5002
```

---

## 📄 License

ISC

---

## 👤 Author

Mohammed Rishin Poolat
