# PDF Transaction Extraction API - Backend

## 🚀 Quick Setup

### 1. Start Backend

```bash
# Navigate to backend
cd backend

# Install dependencies (first time only)
npm install

# Start PostgreSQL and Redis
docker-compose up -d

# Create .env file
cp .env.example .env
```

### 2. Initialize Database & Start

```bash
# Run database migrations
PGPASSWORD=postgres psql -h localhost -U postgres -d pdf_transactions -f migrations/001_english_only_schema.sql

# Start development server
npm run dev
```

Server will start at: `http://localhost:5001`

---

## 📮 Testing with Postman

### Test 1: Login 🔑

**Create new request:**
- Method: `POST`
- URL: `http://localhost:5001/api/auth/login`
- Headers:
  - `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "email": "admin@nirnai.com",
  "password": "admin123"
}
```
- Click **Send**

**Expected response:**
```json
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

**IMPORTANT:** Copy the `accessToken` - you'll need it for protected routes!

---

### Test 2: Upload PDF 📄

**Create new request:**
- Method: `POST`
- URL: `http://localhost:5001/api/transactions/upload`
- Headers:
  - `Authorization: Bearer YOUR_ACCESS_TOKEN_HERE`
- Body (form-data):
  - Key: `pdf`, Type: File, Value: Select your PDF file
- Click **Send**

**Expected response:**
```json
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

---

### Test 3: Get Transactions 📋

**Create new request:**
- Method: `GET`
- URL: `http://localhost:5001/api/transactions?pdfId=1&limit=50`
- Headers:
  - `Authorization: Bearer YOUR_ACCESS_TOKEN_HERE`
- Click **Send**

**Expected response:**
```json
{
  "success": true,
  "data": {
    "transactions": [...],
    "total": 22,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

---

### Test 4: Get User Details 👤

**Create new request:**
- Method: `GET`
- URL: `http://localhost:5001/api/auth/me`
- Headers:
  - `Authorization: Bearer YOUR_ACCESS_TOKEN_HERE`
- Click **Send**

**Expected response:**
```json
{
  "message": "User details fetched successfully",
  "data": {
    "id": 1,
    "name": "Admin",
    "email": "admin@nirnai.com"
  }
}
```

---

### Test 5: Logout 🚪

**Create new request:**
- Method: `POST`
- URL: `http://localhost:5001/api/auth/logout`
- Headers:
  - `Authorization: Bearer YOUR_ACCESS_TOKEN_HERE`
- Click **Send**

**Expected:** Token is now blacklisted

---

## 📋 All Available Endpoints

### Public Routes
- `POST /api/auth/login` - Login with email/password

### Protected Routes (require Authorization header)
- `GET /api/auth/me` - Get user details
- `POST /api/auth/logout` - Logout
- `POST /api/transactions/upload` - Upload PDF for processing
- `GET /api/transactions` - Get transactions with filters
- `GET /api/transactions/:id` - Get single transaction
- `GET /api/transactions/pdfs` - Get all uploaded PDFs
- `GET /api/transactions/progress/:pdfId` - Real-time progress (SSE)

---

## 🧪 Testing with cURL (Command Line Alternative)

### 1. Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nirnai.com",
    "password": "admin123"
  }'
```

### 2. Upload PDF
```bash
curl -X POST http://localhost:5001/api/transactions/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "pdf=@/path/to/your/file.pdf"
```

### 3. Get Transactions
```bash
curl -X GET "http://localhost:5001/api/transactions?pdfId=1&limit=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🛠️ Common Commands

```bash
npm run dev          # Start dev server
npm run build        # Build TypeScript
npm run db:push      # Push schema to database
npm run db:studio    # Open database GUI
docker-compose up -d # Start PostgreSQL
docker-compose down  # Stop PostgreSQL
```

---

## 🆘 Troubleshooting

### 401 Unauthorized?
- Token may have expired
- Login again to get new token
- Check `Authorization: Bearer <token>` header format
- Ensure using correct credentials: `admin@nirnai.com` / `admin123`

### Database connection failed?
```bash
docker ps                    # Check if PostgreSQL is running
docker-compose up -d         # Start PostgreSQL
docker logs pdf_transactions_db  # Check logs
```

### Redis connection failed?
```bash
docker ps                    # Check if Redis is running
docker-compose up -d         # Start Redis
docker logs pdf_transactions_redis  # Check logs
```

### Translation rate limited?
- Your IP has hit Google Translate's rate limit
- Wait 1-24 hours for ban to reset
- Consider using Google Cloud Translation API for production

### PDF processing stuck or slow?
- Check backend logs for errors
- Translation delays: 15 seconds between requests (normal)
- Large PDFs take time: ~1 minute per page without cache
- Check Redis queue: Worker may be waiting for translation

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/        # Request handlers
│   ├── middlewares/        # Auth, validation
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── utils/             # Helpers, email, JWT
│   ├── db/                # Database schema
│   └── index.ts           # Server entry
├── docker-compose.yml     # PostgreSQL setup
├── package.json
├── tsconfig.json
└── .env                   # Your credentials
```

---

## 🔐 Security Features

- ✅ Password hashing (Bcrypt)
- ✅ JWT tokens (Access: 15m, Refresh: 7d)
- ✅ Token blacklisting
- ✅ OTP email verification (10 minutes expiry)
- ✅ Zod schema validation
- ✅ CORS & Helmet security
- ✅ Password requirements: Min 7 chars, uppercase, lowercase, number, special char

---

## 🌐 Translation Service

### Current Implementation

The application uses **@vitalets/google-translate-api** for free Tamil to English translation. This is a community-maintained wrapper around Google Translate's free web interface.

### ⚠️ Important Limitations & Risks

#### Rate Limiting
- **IP-based limits**: Google Translate's free API has aggressive rate limiting per IP address
- **Typical limit**: ~10-20 requests before IP gets temporarily banned (1-24 hours)
- **Current mitigation**:
  - 15-second delay between translation requests
  - Redis caching to avoid re-translating same content
  - Automatic retry with exponential backoff (2min, 4min, 8min)
  - Translation skipped after 3 failed attempts (processing continues)

#### When You Might Get Rate Limited
- Processing multiple large PDFs in succession
- Re-uploading PDFs that aren't cached
- Sharing IP with other users of Google Translate

#### What Happens When Rate Limited
The system will:
1. Wait and retry up to 3 times (with increasing delays)
2. Log translation failures but continue processing
3. Mixed English/Tamil fields will have English extracted when possible

### 🚀 Production Alternatives

For reliable production use, consider these alternatives:

#### Option 1: Google Cloud Translation API (Recommended)
**Setup:**
1. Create Google Cloud account
2. Enable Cloud Translation API
3. Get API key from console
4. Add to `.env`:
```env
GOOGLE_CLOUD_API_KEY=your-api-key-here
```

**Pricing:**
- $20 per 1 million characters
- Much higher rate limits
- Enterprise-grade reliability

**Estimated cost for this app:**
- Average PDF: ~100 pages × 2000 chars/page = 200,000 chars
- Cost per PDF: ~$0.004 (less than half a cent)
- 1000 PDFs: ~$4

#### Option 2: Azure Translator Text API
Similar pricing and reliability to Google Cloud

#### Option 3: AWS Translate
Slightly cheaper but similar features

#### Option 4: Self-hosted Translation
- **LibreTranslate**: Open-source, self-hosted
- **Argos Translate**: Offline translation
- Requires more setup and resources

### 📊 Current Configuration

Translation settings in `backend/src/services/translation.service.ts`:

```typescript
delayBetweenRequests: 15000,  // 15 seconds between API calls
maxRequests: 5,                // 5 requests per minute max
initialBackoff: 120000,        // 2 minutes wait on rate limit
cacheExpiry: 30 days,          // Long-term caching
```

### 💡 Recommendations

**Development/Testing:**
- Use current free implementation with caution
- Wait 24 hours for IP ban to reset if rate-limited
- Consider using VPN or different IP if needed

**Production:**
- Upgrade to Google Cloud Translation API
- Cost is negligible (~$0.004 per PDF)
- Guaranteed reliability and no rate limits

**High Volume (100+ PDFs/day):**
- **Must use** paid API service
- Free service will not handle this volume

---

## 📧 Email Templates

The system sends two types of emails:

1. **OTP Verification** - After signup
2. **Password Reset** - When user forgets password

Both use HTML templates with professional styling.

---

## ✅ Testing Checklist

- [ ] Gmail App Password created
- [ ] `.env` configured with real email
- [ ] PostgreSQL running (`docker ps`)
- [ ] Database schema pushed (`npm run db:push`)
- [ ] Server running on port 5000 (`npm run dev`)
- [ ] Postman installed
- [ ] Signup works & OTP received
- [ ] OTP verification works
- [ ] Login works
- [ ] Protected routes work with token
- [ ] Logout blacklists token

---

**Ready to test? Open Postman and follow the manual testing steps above!** 🚀
