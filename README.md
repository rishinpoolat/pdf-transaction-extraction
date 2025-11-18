# Nirnai - Tamil Property Transaction Extraction System

A full-stack application for extracting, translating, and managing Tamil property transaction data from PDF documents. The system automatically parses Tamil Encumbrance Certificate PDFs, translates the content to English, extracts structured transaction data, and provides a user-friendly interface for searching and viewing transactions.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture Overview](#-architecture-overview)
- [Prerequisites](#-prerequisites)
- [Setup & Installation](#-setup--installation)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [Assumptions](#-assumptions)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### 1. **PDF Ingestion & Parsing**
- Upload Tamil-language PDF documents (Encumbrance Certificates)
- Automatic extraction of transaction fields:
  - Buyer and Seller names
  - Survey numbers and Plot numbers
  - Document numbers and dates
  - Property details (village, street, type, extent)
  - Financial values (consideration value, market value)
- Background job processing with real-time progress tracking
- Batch processing support for large PDFs

### 2. **Translation**
- Automatic translation of Tamil text to English using Google Translate API
- Smart extraction of English names and locations from translated text
- Caching mechanism to reduce API calls and improve performance
- Rate limiting protection with automatic retry logic

### 3. **Filtering & Search**
- **Server-side query parameters**:
  - `buyerName` - Filter by buyer name (partial match, case-insensitive)
  - `sellerName` - Filter by seller name (partial match, case-insensitive)
  - `surveyNumber` - Filter by survey number
  - `documentNumber` - Filter by document number
  - `village` - Filter by village name
  - `plotNumber` - Filter by plot number
  - `pdfId` - Filter by specific PDF
- **Client-side filtering**:
  - Real-time search across all transaction fields
  - Filter by transaction type (Conveyance, Mortgage, Gift Deed)
- Pagination support with configurable page size

### 4. **RESTful API**
- Built with Node.js and Express
- Drizzle ORM for type-safe database operations
- Authentication with JWT tokens
- Rate limiting and security middleware (Helmet, CORS)
- Comprehensive error handling

**Key Endpoints**:
- `POST /api/auth/login` - User authentication
- `POST /api/transactions/upload` - Upload and process PDF
- `GET /api/transactions` - Get transactions with filters
- `GET /api/transactions/:id` - Get single transaction details
- `GET /api/transactions/status/:pdfId` - Get processing status
- `GET /api/transactions/progress/:pdfId` - Real-time progress (SSE)

### 5. **Web UI**
- Built with Next.js 14 (App Router) and Tailwind CSS
- **Features**:
  - Login screen with JWT authentication
  - PDF upload interface with drag-and-drop
  - Real-time processing progress indicator
  - PDF list sidebar for easy navigation
  - Interactive transactions table with sorting
  - Advanced search and filter capabilities
  - Transaction details modal with full information
  - Responsive design for mobile and desktop

---

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js (TypeScript)
- **Framework**: Express.js 5
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL 15
- **Cache/Queue**: Redis + BullMQ
- **PDF Processing**: pdf-parse, pdf-lib
- **Translation**: @vitalets/google-translate-api
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, express-rate-limit
- **Development**: tsx (TypeScript execution)

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS 4
- **Forms**: react-hook-form
- **Notifications**: Sonner
- **Validation**: Zod
- **TypeScript**: Full type safety

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database Migrations**: Drizzle Kit
- **Process Management**: BullMQ Workers

---

## 🏗 Architecture Overview

### System Flow

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │────────▶│   Backend   │────────▶│  PostgreSQL │
│  (Next.js)  │◀────────│  (Express)  │◀────────│  Database   │
└─────────────┘         └─────────────┘         └─────────────┘
                              │
                              │
                        ┌─────▼─────┐
                        │   Redis   │
                        │  + BullMQ │
                        └─────┬─────┘
                              │
                        ┌─────▼─────┐
                        │   Worker  │
                        │  Process  │
                        └───────────┘
```

### Processing Pipeline

1. **Upload**: User uploads PDF via frontend
2. **Queue**: PDF job added to BullMQ queue
3. **Parse**: Worker extracts text from PDF pages (batch processing)
4. **Translate**: Tamil text translated to English (with caching)
5. **Extract**: Smart extraction of structured data from translated text
6. **Store**: Transactions saved to PostgreSQL with indexes
7. **Notify**: Real-time progress updates via Server-Sent Events (SSE)

### Key Design Decisions

- **Background Processing**: Large PDFs are processed asynchronously to avoid blocking requests
- **Batch Processing**: Pages processed in batches of 5 to optimize memory usage
- **Translation Caching**: Redis caching reduces API calls by 80%+ on repeated content
- **English-Only Storage**: Tamil text is translated and only English data is stored for consistency
- **Smart Extraction**: Regex patterns extract English names and locations from translated text
- **Fallback Mechanism**: If English extraction fails, falls back to Tamil data

---

## 📦 Prerequisites

- **Node.js**: v18 or higher
- **PostgreSQL**: v15 or higher
- **Redis**: v7 or higher
- **Docker & Docker Compose**: (optional, for containerized setup)
- **npm**: v8 or higher

---

## 🚀 Setup & Installation

### Option 1: Using Docker (Recommended)

1. **Clone the repository**
```bash
git clone <repository-url>
cd nirnai
```

2. **Start PostgreSQL and Redis containers**
```bash
cd backend
docker-compose up -d
```

3. **Install backend dependencies**
```bash
npm install
```

4. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Run database migrations**
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d pdf_transactions -f migrations/001_english_only_schema.sql
```

6. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

7. **Configure frontend environment**
```bash
# Create .env.local if needed
echo "NEXT_PUBLIC_API_URL=http://localhost:5001" > .env.local
```

### Option 2: Manual Setup

1. **Install PostgreSQL**
```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb pdf_transactions
```

2. **Install Redis**
```bash
# macOS
brew install redis
brew services start redis
```

3. **Follow steps 1, 3-7 from Option 1**

---

## ▶️ Running the Application

### Start Backend (Development)

```bash
cd backend
npm run dev
```

Backend will start on `http://localhost:5001`

### Start Frontend (Development)

```bash
cd frontend
npm run dev
```

Frontend will start on `http://localhost:3000`

### Production Build

**Backend**:
```bash
cd backend
npm run build
npm start
```

**Frontend**:
```bash
cd frontend
npm run build
npm start
```

---

## 📡 API Documentation

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
    "accessToken": "jwt-token",
    "user": { "id": 1, "email": "admin@nirnai.com", "name": "Admin" }
  }
}
```

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
GET /api/transactions?buyerName=John&sellerName=Jane&surveyNumber=329&documentNumber=200&village=Thiruvennainallur&plotNumber=57&page=1&limit=50
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

---

## 🔧 Environment Variables

### Backend (.env)

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

# JWT Secrets
SECRET=your-secret-key-here
ACCESS_TOKEN_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=30d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

---

## 🗄 Database Schema

### Tables

#### **pdfs**
```sql
- id, filename, original_name, file_path, file_size
- processing_status (pending, queued, processing, completed, failed)
- total_pages, processed_pages, total_transactions
- progress_percentage, current_step, job_id
- uploaded_at, processed_at, error_message
```

#### **transactions** (English-only)
```sql
- id, pdf_id, buyer_name, seller_name
- document_number, document_year
- execution_date, presentation_date, registration_date
- transaction_nature, survey_number, plot_number
- village, street, property_type, property_extent
- consideration_value, market_value
- previous_document_number, volume_number, page_number_ref
- page_number, extraction_confidence
- created_at, updated_at
```

---

## 🤔 Assumptions

### PDF Format
- Tamil Encumbrance Certificate documents
- Consistent field labeling (bilingual Tamil/English)
- Document numbers: `123/2023` format
- Dates: `DD-Mon-YYYY` format

### Translation
- Google Translate free tier with rate limits
- Caching reduces repeated API calls
- English names extracted from translated text
- Fallback to Tamil if English extraction fails

### Authentication
- Stub authentication with hardcoded credentials
- Production requires proper user management

---

## 📁 Project Structure

```
nirnai/
├── backend/
│   ├── src/
│   │   ├── config/          # Queue, Redis, Upload configs
│   │   ├── controllers/     # Auth, Transactions controllers
│   │   ├── db/              # Database & schema
│   │   ├── middlewares/     # Auth, Rate limit
│   │   ├── routes/          # API routes
│   │   ├── services/        # PDF, Translation, Parser services
│   │   ├── workers/         # Background workers
│   │   └── index.ts
│   ├── migrations/          # SQL migrations
│   └── uploads/             # Uploaded PDFs
│
├── frontend/
│   ├── app/                 # Next.js pages
│   ├── components/          # React components
│   └── lib/                 # Actions & utilities
│
└── README.md
```

---

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
docker ps
# Check DATABASE_URL in .env
```

### Redis Connection Failed
```bash
# Check Redis is running
docker ps
# Test: redis-cli ping
```

### Translation Rate Limited
- Wait 1-2 minutes
- System auto-retries with backoff
- Cache reduces repeated calls

### PDF Processing Stuck
- Check worker logs
- Check Redis queue
- Restart backend

---

## 📄 Default Credentials

```
Email: admin@nirnai.com
Password: admin123
```

---

## 👤 Author

Mohammed Rishin Poolat

---
