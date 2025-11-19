# Nirnai - Tamil Property Transaction Extraction System

A full-stack application for extracting, translating, and managing Tamil property transaction data from PDF documents. The system automatically parses Tamil Encumbrance Certificate PDFs, translates the content to English, extracts structured transaction data, and provides a user-friendly interface for searching and viewing transactions.

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Tech Stack & Libraries](#-tech-stack--libraries)
- [Architecture Overview](#-architecture-overview)
- [Setup & Installation](#-setup--installation)
- [Running the Application](#-running-the-application)
- [Features](#-features)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Assumptions & Limitations](#-assumptions--limitations)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)

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
cd backend
docker-compose up -d

# 3. Install backend dependencies
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
cd ../frontend
npm install
npm run dev
# Frontend runs at http://localhost:3000
```

**Login Credentials:**
- Email: `admin@nirnai.com`
- Password: `admin123`

---

## 🛠 Tech Stack & Libraries

### Technology Stack Overview

```
Frontend:
├─ Framework:      Next.js 16.0.1 (React 19.2.0)
├─ Language:       TypeScript 5.x
├─ Styling:        Tailwind CSS 4.0
├─ Forms:          react-hook-form 7.66.0 + Zod 4.1.12
├─ Notifications:  Sonner 2.0.7
└─ State:          React Hooks (useState, useEffect)

Backend:
├─ Runtime:        Node.js v18+
├─ Language:       TypeScript 5.9.3
├─ Framework:      Express.js 5.1.0
├─ Database:       PostgreSQL 15+
├─ ORM:            Drizzle ORM 0.44.7
├─ Cache/Queue:    Redis 7+ + BullMQ 5.63.2
├─ Auth:           JWT (jsonwebtoken 9.0.2)
├─ Security:       Helmet 8.1.0 + CORS 2.8.5
├─ PDF:            pdf-parse 2.4.5 + pdf-lib 1.17.1
├─ Translation:    @vitalets/google-translate-api 9.2.1
├─ Validation:     Zod 4.1.12
└─ File Upload:    Multer 2.0.2

Infrastructure:
├─ Database:       PostgreSQL 15 (Docker)
├─ Cache:          Redis 7 (Docker)
├─ Orchestration:  Docker Compose
└─ Development:    tsx (TypeScript execution)
```

---

### Backend Stack

| Layer | Technology | Version | Purpose | Limitations & Notes |
|-------|-----------|---------|---------|-------------------|
| **Runtime** | Node.js | v18+ | JavaScript runtime | - |
| **Language** | TypeScript | 5.9.3 | Type safety | - |
| **Framework** | Express.js | 5.1.0 | REST API server | - |
| **Database** | PostgreSQL | 15+ | Relational database | Required for transactions |
| **ORM** | Drizzle ORM | 0.44.7 | Type-safe database queries | - |
| **Cache/Queue** | Redis + BullMQ | 5.8.2 / 5.63.2 | Job queue & caching | Required for background processing |

#### Backend Libraries by Phase

**1. PDF Processing**
- **pdf-parse** (2.4.5): Extract text from PDF pages
  - *Limitation*: Cannot handle image-based/scanned PDFs (requires OCR)
  - *Use case*: Text-based Tamil PDFs only
- **pdf-lib** (1.17.1): PDF metadata extraction
  - *Purpose*: Get page count, file info

**2. Translation**
- **@vitalets/google-translate-api** (9.2.1): Free Tamil → English translation
  - *Limitation*: **IP-based rate limiting** (~10-20 requests before 1-24h ban)
  - *Mitigation*: 15s delays, Redis caching (30 days), exponential backoff
  - *Production Alternative*: Google Cloud Translation API ($20 per 1M chars, ~$0.004/PDF)
  - *Why chosen*: Free for development, easy integration
  - *Risks*: Unreliable for production, unpredictable bans, slow processing

**3. Data Parsing & Validation**
- **Zod** (4.1.12): Schema validation
  - *Purpose*: Validate API inputs, environment variables

**4. Background Jobs**
- **BullMQ** (5.63.2): Job queue management
  - *Purpose*: Process PDFs asynchronously
  - *Config*: 1 hour lock duration (due to slow translation)
- **ioredis** (5.8.2): Redis client
  - *Purpose*: Cache translations, job queue storage

**5. Authentication & Security**
- **jsonwebtoken** (9.0.2): JWT token generation/verification
  - *Config*: Access token: 24h, Refresh token: 30d
- **helmet** (8.1.0): Security headers
- **cors** (2.8.5): Cross-origin requests
- **express-rate-limit** (8.2.1): API rate limiting

**6. File Handling**
- **multer** (2.0.2): File upload middleware
  - *Config*: PDF files only, max 50MB

**7. Utilities**
- **dotenv** (17.2.3): Environment variables
- **morgan** (1.10.1): HTTP request logging
- **uuid** (13.0.0): Unique identifiers

---

### Frontend Stack

| Layer | Technology | Version | Purpose | Notes |
|-------|-----------|---------|---------|-------|
| **Framework** | Next.js | 16.0.1 | React framework with App Router | Server-side rendering, file-based routing |
| **UI Library** | React | 19.2.0 | Component library | Latest stable with concurrent features |
| **Language** | TypeScript | 5.x | Type safety | Full type coverage across components |
| **Styling** | Tailwind CSS | 4.0 | Utility-first CSS framework | Just-in-Time compilation, custom design system |
| **Forms** | react-hook-form | 7.66.0 | Form state management | Performant, uncontrolled components |
| **Validation** | Zod | 4.1.12 | Schema validation | Shared schemas with backend for consistency |
| **Notifications** | Sonner | 2.0.7 | Toast notifications | Accessible, customizable alerts |
| **HTTP Client** | Fetch API | Native | API requests | Built-in, no external dependencies |

#### Frontend Libraries by Feature

**1. UI Framework & Routing**
- **Next.js** (16.0.1): Full-stack React framework
  - *Features*: App Router, Server Components, SSR, API routes
  - *Why chosen*: Production-ready, excellent DX, built-in optimizations
  - *Limitations*: Server components learning curve

**2. Styling System**
- **Tailwind CSS** (4.0): Utility-first CSS
  - *Features*: Pre-built utilities, responsive design, custom configuration
  - *Why chosen*: Fast development, consistent design, small bundle size
  - *Config*: Custom colors, spacing, breakpoints

**3. Form Management**
- **react-hook-form** (7.66.0): Form state management
  - *Features*: Uncontrolled inputs, validation, error handling
  - *Why chosen*: Performance (minimal re-renders), easy integration with Zod
  - *Use case*: Login form, PDF upload form

**4. State Management**
- **React Hooks** (useState, useEffect, useCallback): Local state
  - *Features*: Built-in React state management
  - *Why chosen*: Sufficient for simple app, no global state needed
  - *Limitations*: Manual prop drilling for deeply nested components

**5. Data Fetching**
- **Server Actions** (Next.js): Server-side data mutations
  - *Features*: Type-safe API calls, automatic revalidation
  - *Why chosen*: Integrated with Next.js, simplified data flow
  - *Use case*: Login, fetch transactions, upload PDF

**6. UI Components**
- **Custom Components**: Built from scratch
  - *Features*: Modals, tables, sidebars, progress bars
  - *Why chosen*: Full control, no dependency bloat
  - *Alternative*: Could use shadcn/ui or Radix UI for production

---

### Infrastructure

| Component | Technology | Version | Purpose | Notes |
|-----------|-----------|---------|---------|-------|
| **Database** | PostgreSQL | 15+ | Primary data store | Docker container |
| **Cache** | Redis | 7+ | Translation cache & job queue | Docker container |
| **Job Processing** | BullMQ Workers | 5.63.2 | Background PDF processing | Runs in Node.js process |
| **Containerization** | Docker Compose | - | Local development setup | PostgreSQL + Redis |

---

## 🏗 Architecture Overview

### Complete System Architecture

```
┌───────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                 │
│                         Browser (http://localhost:3000)                   │
└───────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/HTTPS
                                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND APPLICATION                            │
│                          Next.js 16 + React 19                            │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                         App Router (Pages)                          │ │
│  │  ┌────────────┐  ┌────────────┐  ┌─────────────┐  ┌─────────────┐ │ │
│  │  │ /login     │  │ /trans-    │  │ Components  │  │   Server    │ │ │
│  │  │ page.tsx   │  │  actions   │  │  - Modals   │  │   Actions   │ │ │
│  │  │            │  │ page.tsx   │  │  - Tables   │  │  (Auth,     │ │ │
│  │  │            │  │            │  │  - Sidebar  │  │   Upload)   │ │ │
│  │  └────────────┘  └────────────┘  └─────────────┘  └─────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                          UI Layer                                   │ │
│  │  • Tailwind CSS 4.0 (Styling)                                      │ │
│  │  • React Hook Form (Form State)                                    │ │
│  │  • Zod (Validation)                                                │ │
│  │  • Sonner (Toast Notifications)                                    │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ REST API (JSON)
                                    │ Authorization: Bearer JWT
                                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                          BACKEND APPLICATION                              │
│                    Express.js 5.1.0 + TypeScript 5.9.3                   │
│                      (http://localhost:5001/api)                          │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                      Middleware Layer                               │ │
│  │  • CORS (Cross-Origin)  • Helmet (Security Headers)                │ │
│  │  • Morgan (Logging)     • Express Rate Limit (API Protection)      │ │
│  │  • JWT Auth Middleware  • Multer (File Upload - 50MB limit)        │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                         API Routes                                  │ │
│  │  ┌──────────────────┐         ┌─────────────────────────────────┐  │ │
│  │  │  /api/auth/*     │         │  /api/transactions/*            │  │ │
│  │  │  - POST /login   │         │  - POST /upload                 │  │ │
│  │  │  - GET  /me      │         │  - GET  / (with filters)        │  │ │
│  │  │  - POST /logout  │         │  - GET  /:id                    │  │ │
│  │  └──────────────────┘         │  - GET  /pdfs                   │  │ │
│  │                                │  - GET  /progress/:pdfId (SSE)  │  │ │
│  │                                └─────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                        │                                  │               │
│                        ▼                                  ▼               │
│  ┌──────────────────────────┐         ┌────────────────────────────────┐ │
│  │   Auth Controller        │         │   Transactions Controller      │ │
│  │  • Login (hardcoded)     │         │  • Upload PDF → Queue job      │ │
│  │  • JWT generation        │         │  • Fetch with filters          │ │
│  │  • Token blacklist       │         │  • SSE progress updates        │ │
│  └──────────────────────────┘         └────────────────────────────────┘ │
│              │                                        │                   │
│              │                                        │                   │
│  ┌───────────▼────────────────────────────────────────▼────────────────┐ │
│  │                        Service Layer                                │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐ │ │
│  │  │ Token Service│  │ PDF Parser   │  │ Transaction Parser        │ │ │
│  │  │ (JWT)        │  │ (pdf-parse)  │  │ (Regex extraction)        │ │ │
│  │  └──────────────┘  └──────────────┘  └───────────────────────────┘ │ │
│  │                    ┌──────────────┐                                 │ │
│  │                    │ Translation  │                                 │ │
│  │                    │ Service      │                                 │ │
│  │                    │ (@vitalets)  │                                 │ │
│  │                    └──────────────┘                                 │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                    │                                      │
│  ┌─────────────────────────────────▼───────────────────────────────────┐ │
│  │                         Data Access Layer                           │ │
│  │                      Drizzle ORM 0.44.7                             │ │
│  │  • Type-safe queries  • Schema definitions  • Migrations            │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────┘
         │                                              │
         │                                              │
         ▼                                              ▼
┌──────────────────────┐                    ┌──────────────────────────────┐
│   PostgreSQL 15+     │                    │      Redis 7+                │
│   (Port: 5432)       │                    │    (Port: 6379)              │
│                      │                    │                              │
│  ┌────────────────┐  │                    │  ┌────────────────────────┐  │
│  │ Tables:        │  │                    │  │ Uses:                  │  │
│  │ • users        │  │                    │  │ • Translation cache    │  │
│  │ • pdfs         │  │                    │  │   (30-day TTL)         │  │
│  │ • transactions │  │                    │  │ • Token blacklist      │  │
│  │                │  │                    │  │ • BullMQ job queue     │  │
│  │ Indexes:       │  │                    │  │ • Session storage      │  │
│  │ • buyer_name   │  │                    │  └────────────────────────┘  │
│  │ • seller_name  │  │                    │                              │
│  │ • survey_no    │  │                    └──────────────────────────────┘
│  │ • village      │  │                                  │
│  │ • document_no  │  │                                  │
│  └────────────────┘  │                                  ▼
│                      │                    ┌──────────────────────────────┐
│  Docker Container    │                    │   BullMQ Queue Manager       │
│  pdf_transactions_db │                    │                              │
└──────────────────────┘                    │  Queue: pdf-processing       │
                                            │  Concurrency: 1 job at a time│
                                            │  Lock Duration: 1 hour       │
                                            └──────────────────────────────┘
                                                          │
                                                          │ Job Dispatch
                                                          ▼
                                            ┌──────────────────────────────┐
                                            │    WORKER PROCESS            │
                                            │  (Background Job Processor)  │
                                            │                              │
                                            │  ┌────────────────────────┐  │
                                            │  │ PDF Processing Worker  │  │
                                            │  │                        │  │
                                            │  │ 1. Extract metadata    │  │
                                            │  │ 2. Parse pages (5/btch)│  │
                                            │  │ 3. Translate Tamil→Eng │  │
                                            │  │    (15s delays)        │  │
                                            │  │ 4. Extract fields      │  │
                                            │  │ 5. Save to PostgreSQL  │  │
                                            │  │ 6. Update progress     │  │
                                            │  └────────────────────────┘  │
                                            │                              │
                                            │  Libraries Used:             │
                                            │  • pdf-parse (text extract)  │
                                            │  • pdf-lib (metadata)        │
                                            │  • @vitalets/translate       │
                                            │  • Drizzle ORM (DB ops)      │
                                            └──────────────────────────────┘
                                                          │
                                                          │ Updates
                                                          ▼
                                            ┌──────────────────────────────┐
                                            │  External API                │
                                            │  Google Translate (Free)     │
                                            │                              │
                                            │  Limitations:                │
                                            │  • 10-20 req before IP ban   │
                                            │  • 1-24h ban duration        │
                                            │  • No SLA or guarantees      │
                                            │                              │
                                            │  Mitigation:                 │
                                            │  • 15s delays                │
                                            │  • Redis caching (30 days)   │
                                            │  • Exponential backoff       │
                                            └──────────────────────────────┘

DEPLOYMENT ENVIRONMENT:
┌─────────────────────────────────────────────────────────────────────────┐
│  Docker Compose (docker-compose.yml)                                   │
│  ├─ Service: PostgreSQL 15 (pdf_transactions_db)                       │
│  ├─ Service: Redis 7 (pdf_transactions_redis)                          │
│  └─ Network: Bridge (containers can communicate)                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: PDF Processing Pipeline

```
1. Upload PDF
   ↓
2. Create job in BullMQ queue → Store PDF metadata in DB
   ↓
3. Worker picks up job
   ↓
4. Extract PDF metadata (pages, size)
   ↓
5. Process pages in batches (5 pages at a time)
   │
   ├─→ Extract text from page (pdf-parse)
   ├─→ Translate Tamil → English (Google Translate API)
   │   └─→ Check Redis cache first (30-day TTL)
   │   └─→ If not cached: API call with 15s delay
   │   └─→ Store in cache
   ├─→ Parse transaction fields (regex patterns)
   │   └─→ Extract: names, dates, survey nos., etc.
   └─→ Save to PostgreSQL
   ↓
6. Update progress in real-time (SSE)
   ↓
7. Mark job complete → Update PDF status
```

### Key Design Decisions

1. **Background Processing**: Large PDFs processed asynchronously to avoid blocking API requests
2. **Batch Processing**: Pages processed in batches of 5 to optimize memory usage
3. **Translation Caching**: Redis caching reduces API calls by 80%+ on repeated content
4. **English-Only Storage**: Tamil text is translated; only English data stored for consistency
5. **Smart Extraction**: Regex patterns extract English names from translated text
6. **Graceful Degradation**: Processing continues even if translation fails

---

## 📦 Setup & Installation

### Option 1: Docker Setup (Recommended)

This is the easiest method for local development.

```bash
# 1. Clone repository
git clone <repository-url>
cd nirnai

# 2. Navigate to backend
cd backend

# 3. Start PostgreSQL and Redis containers
docker-compose up -d

# Verify containers are running
docker ps
# You should see: pdf_transactions_db and pdf_transactions_redis

# 4. Install backend dependencies
npm install

# 5. Configure environment variables
cp .env.example .env

# Edit .env (optional - defaults work for local development)
# PORT=5001
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pdf_transactions
# REDIS_HOST=localhost
# REDIS_PORT=6379
```

### Option 2: Manual Setup (Without Docker)

If you prefer to install PostgreSQL and Redis manually:

**Install PostgreSQL:**
```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb pdf_transactions

# Linux (Ubuntu/Debian)
sudo apt install postgresql-15
sudo systemctl start postgresql
sudo -u postgres createdb pdf_transactions
```

**Install Redis:**
```bash
# macOS
brew install redis
brew services start redis

# Linux (Ubuntu/Debian)
sudo apt install redis-server
sudo systemctl start redis
```

Then follow steps 4-5 from Option 1, and update `.env` with your database credentials.

---

### Initialize Database Schema

```bash
# Make sure you're in the backend directory
cd backend

# Run schema migration
PGPASSWORD=postgres psql -h localhost -U postgres -d pdf_transactions -f migrations/schema.sql

# Verify tables were created
PGPASSWORD=postgres psql -h localhost -U postgres -d pdf_transactions -c "\dt"
# Should show: pdfs, transactions, users
```

---

### Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Create environment file (optional)
echo "NEXT_PUBLIC_API_URL=http://localhost:5001" > .env.local
```

---

## ▶️ Running the Application

### Start Backend (Development)

```bash
cd backend

# Start development server with hot reload
npm run dev
```

**Expected output:**
```
🚀 Server running on port 5001
✅ Database connected successfully
✅ Redis connected successfully
📦 Worker registered and listening for jobs
```

Backend will be available at: `http://localhost:5001`

---

### Start Frontend (Development)

```bash
cd frontend

# Start Next.js development server
npm run dev
```

**Expected output:**
```
▲ Next.js 16.0.1
- Local:        http://localhost:3000
- Ready in 2.1s
```

Frontend will be available at: `http://localhost:3000`

---

### Production Build

**Backend:**
```bash
cd backend
npm run build      # Compile TypeScript to JavaScript
npm start          # Run compiled code
```

**Frontend:**
```bash
cd frontend
npm run build      # Build Next.js production bundle
npm start          # Run production server
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
- Rate limiting protection with automatic retry logic (2min, 4min, 8min backoff)
- **⚠️ Free API Limitations**: IP-based rate limiting (~10-20 requests before 1-24h ban)

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

---

## 🔧 Environment Variables

### Backend (.env)

**Required Variables:**
```env
# Server
NODE_ENV=development
PORT=5001

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pdf_transactions

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Secrets (REQUIRED - Use strong random strings)
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
SECRET=your-super-secret-jwt-key-change-this-in-production

# Token Expiry
ACCESS_TOKEN_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=30d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

**Optional Variables:**
```env
# Optional: Google Cloud Translation API key for production
# GOOGLE_CLOUD_API_KEY=your-api-key-here
```

---

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

---

## 🗄 Database Schema

### Table: `pdfs`
Stores uploaded PDF metadata and processing status.

```sql
CREATE TABLE pdfs (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,           -- Unique filename on server
  original_name VARCHAR(255) NOT NULL,      -- Original upload name
  file_path VARCHAR(500) NOT NULL,          -- Full path to PDF
  file_size BIGINT,                         -- Size in bytes

  -- Processing metadata
  processing_status VARCHAR(50) DEFAULT 'pending',
    -- Values: pending, queued, processing, completed, failed
  total_pages INT,
  processed_pages INT DEFAULT 0,
  total_transactions INT DEFAULT 0,
  progress_percentage INT DEFAULT 0,
  current_step VARCHAR(100),
  job_id VARCHAR(255),

  -- Timestamps
  uploaded_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  error_message TEXT
);
```

---

### Table: `transactions`
Stores extracted transaction data (English-only).

```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  pdf_id INT REFERENCES pdfs(id) ON DELETE CASCADE,
  page_number INT,

  -- Document details
  document_number VARCHAR(100),
  document_year VARCHAR(10),

  -- Dates
  execution_date VARCHAR(50),
  presentation_date VARCHAR(50),
  registration_date VARCHAR(50),

  -- Transaction type
  transaction_nature VARCHAR(100),

  -- Parties (English names extracted from translated text)
  buyer_name VARCHAR(500),
  seller_name VARCHAR(500),

  -- Property details
  survey_number VARCHAR(200),
  plot_number VARCHAR(200),
  village VARCHAR(200),
  street VARCHAR(200),
  property_type VARCHAR(100),
  property_extent VARCHAR(100),

  -- Financial values
  consideration_value VARCHAR(50),
  market_value VARCHAR(50),

  -- Reference information
  previous_document_number VARCHAR(200),
  volume_number VARCHAR(50),
  page_number_ref VARCHAR(50),

  -- Metadata
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

## 🤔 Assumptions & Limitations

### PDF Format Assumptions

1. **Text-based PDFs Only**
   - Assumption: PDFs contain selectable text (not scanned images)
   - Limitation: Cannot process image-based/scanned PDFs without OCR
   - Reason: pdf-parse library extracts text directly

2. **Tamil Encumbrance Certificate Format**
   - Assumption: Consistent field labeling (bilingual Tamil/English)
   - Format: `Field Name / தமிழ் : Value`
   - Example: `Survey No./புல எண் : 329, 330`

3. **Document Number Format**
   - Assumption: Format is `123/2023` (number/year)
   - Pattern: `/(\d+)\/(\d{4})/`

4. **Date Format**
   - Assumption: Dates in `DD-Mon-YYYY` format (e.g., `06-Feb-2013`)
   - Pattern: `/\d{2}-[A-Za-z]{3}-\d{4}/`

5. **Field Structure**
   - Assumption: Each transaction contains standard fields:
     - Document number, dates (execution, presentation, registration)
     - Parties: Executant (seller), Claimant (buyer)
     - Property: Survey no., plot no., village, extent
     - Financial: Consideration value, market value

---

### Data Extraction Assumptions

1. **English Name Extraction**
   - Strategy: Extract from translated text first
   - Fallback 1: Extract English words from mixed Tamil/English text
   - Fallback 2: Use Tamil text if no English found
   - Limitation: Translated names may not match official spelling

2. **Number Extraction**
   - Assumption: Numbers (survey, plot, document) work without translation
   - Pattern: Extract digits, commas, slashes from mixed text
   - Tamil Unicode removed: U+0B80 to U+0BFF range

3. **Multiple Transactions Per Page**
   - Assumption: Some pages contain multiple transactions
   - Split pattern: Document number followed by date
   - Minimum length: 100 characters for valid transaction

---

### Translation Service Limitations

**Current Implementation: @vitalets/google-translate-api**

**Limitations:**
1. **IP-based rate limiting**: ~10-20 requests before temporary ban (1-24 hours)
2. **Unpredictable bans**: Ban duration varies, no official quota
3. **Slow processing**: 15-second delays between requests (required to avoid bans)
4. **Processing time**:
   - Small PDF (10 pages): ~5 minutes
   - Medium PDF (50 pages): ~25 minutes
   - Large PDF (100 pages): ~50 minutes
5. **Free API**: No SLA, no support, can break anytime

**Why chosen:**
- Free for development and testing
- Easy integration, no API key required
- Good translation quality (Google Translate backend)

**Production recommendations:**
- **Must upgrade** for production use
- **Google Cloud Translation API**: $20 per 1M chars (~$0.004 per PDF)
- **AWS Translate** or **Azure Translator**: Similar pricing
- **DeepL API**: Higher quality, more expensive

**Mitigations in place:**
- 15-second delay between API calls
- 30-day Redis caching (reduces repeat calls by 80%+)
- Exponential backoff retry (2min, 4min, 8min)
- Graceful degradation (processing continues on failure)

---

### Authentication Assumptions

1. **Stub Authentication**
   - Current: Hardcoded credentials (`admin@nirnai.com` / `admin123`)
   - Limitation: Single user, no registration, no password reset
   - Production: Requires proper user management, database-backed auth

2. **JWT Tokens**
   - Access token: 24 hours (short-lived for security)
   - Refresh token: 30 days (for seamless re-auth)
   - Token blacklisting on logout (Redis-based)

---

### PDF Layout Variations

**Handled Cases:**
- Bilingual field labels (Tamil + English)
- Mixed English/Tamil in data fields
- Multiple transactions per page
- Varying number of parties (1-5 executants/claimants)
- Optional fields (some transactions missing certain data)

**Not Handled:**
- Different certificate types (only Encumbrance Certificates)
- Completely different layouts
- Hand-written annotations
- Rotated or skewed text
- Image-based PDFs (scanned documents)

---

## 📁 Project Structure

```
nirnai/
├── backend/
│   ├── src/
│   │   ├── config/              # Configuration files
│   │   │   ├── queue.config.ts  # BullMQ queue setup
│   │   │   ├── redis.config.ts  # Redis connection
│   │   │   └── upload.config.ts # Multer file upload
│   │   │
│   │   ├── controllers/         # Request handlers
│   │   │   ├── auth.controller.ts
│   │   │   └── transactions.controller.ts
│   │   │
│   │   ├── db/                  # Database
│   │   │   ├── index.ts         # Drizzle connection
│   │   │   └── schema.ts        # Table schemas
│   │   │
│   │   ├── middlewares/         # Express middlewares
│   │   │   └── authMiddleware.ts
│   │   │
│   │   ├── routes/              # API routes
│   │   │   ├── auth.routes.ts
│   │   │   └── transactions.routes.ts
│   │   │
│   │   ├── services/            # Business logic
│   │   │   ├── pdf-parser.service.ts       # Extract text from PDF
│   │   │   ├── translation.service.ts      # Tamil → English
│   │   │   ├── transaction-parser.service.ts # Regex field extraction
│   │   │   └── token.services.ts
│   │   │
│   │   ├── validators/          # Zod schemas
│   │   │   └── auth.validator.ts
│   │   │
│   │   ├── workers/             # Background workers
│   │   │   └── pdf-processor.worker.ts
│   │   │
│   │   ├── utils/               # Utilities
│   │   │   ├── jwt.ts
│   │   │   └── constants.ts
│   │   │
│   │   └── index.ts             # Server entry point
│   │
│   ├── migrations/              # SQL migrations
│   │   └── schema.sql           # Database schema
│   │
│   ├── uploads/                 # Uploaded PDFs (gitignored)
│   │
│   ├── docker-compose.yml       # PostgreSQL + Redis setup
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md
│
├── frontend/
│   ├── app/                     # Next.js App Router
│   │   ├── login/
│   │   │   └── page.tsx         # Login page
│   │   ├── transactions/
│   │   │   └── page.tsx         # Main transactions page
│   │   ├── layout.tsx           # Root layout
│   │   └── globals.css          # Global styles
│   │
│   ├── components/              # React components
│   │   ├── transactions/
│   │   │   ├── transactions-table.tsx    # Table with search/filter
│   │   │   ├── transaction-details-modal.tsx
│   │   │   ├── pdf-list-sidebar.tsx
│   │   │   └── upload-pdf-modal.tsx
│   │   └── ui/                  # Reusable UI components
│   │
│   ├── lib/                     # Utilities
│   │   ├── actions/
│   │   │   ├── auth.ts          # Auth actions
│   │   │   └── transactions.ts  # Transaction actions
│   │   └── utils.ts
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── .env.local
│
└── README.md                    # This file
```

---

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check if PostgreSQL is running
docker ps | grep pdf_transactions_db

# If not running, start containers
cd backend
docker-compose up -d

# Check logs
docker logs pdf_transactions_db

# Test connection manually
PGPASSWORD=postgres psql -h localhost -U postgres -d pdf_transactions -c "SELECT 1"
```

---

### Redis Connection Failed
```bash
# Check if Redis is running
docker ps | grep pdf_transactions_redis

# If not running
docker-compose up -d

# Test Redis connection
redis-cli ping
# Should return: PONG

# Check logs
docker logs pdf_transactions_redis
```

---

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

**Why it happens:**
- Free Google Translate API has aggressive IP-based limits
- ~10-20 requests before temporary ban
- Sharing IP with others using Google Translate increases risk

---

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

---

### 401 Unauthorized Error
**Possible causes:**
1. Token expired (24h lifetime)
   - Solution: Log in again to get new token
2. Invalid token format
   - Check `Authorization: Bearer <token>` header
3. Token blacklisted (after logout)
   - Log in again

---

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

### TypeScript Errors After npm install
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Rebuild TypeScript
npm run build
```

---

## 📄 License

ISC

---

## 👤 Author

Mohammed Rishin Poolat

---

## 🙏 Acknowledgments

- **Google Translate API**: For free translation service (with limitations)
- **Drizzle ORM**: For excellent TypeScript-first ORM
- **BullMQ**: For robust job queue management
- **Next.js Team**: For amazing React framework
