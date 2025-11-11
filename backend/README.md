# PDF Transaction Extraction API - Backend

## 🚀 Quick Setup

### 1. Setup Gmail App Password (Required for OTP emails)

1. Go to: https://myaccount.google.com/security
2. Enable **2-Step Verification**
3. Go to: https://myaccount.google.com/apppasswords
4. Select **Mail** → **Other** → Type "PDF Transactions"
5. Click **Generate** and copy the 16-character password

### 2. Start Backend

```bash
# Navigate to backend
cd backend

# Install dependencies (first time only)
npm install

# Start PostgreSQL
docker-compose up -d

# Create .env file
cp .env.example .env
```

### 3. Configure .env

Edit `.env` and add your Gmail credentials:

```env
EMAIL=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password-no-spaces
```

### 4. Initialize Database & Start

```bash
# Push schema to database
npm run db:push

# Start development server
npm run dev
```

Server will start at: `http://localhost:5000`

---

## 📮 Testing with Postman

### Test 1: Health Check ✅

**Create new request:**
- Method: `GET`
- URL: `http://localhost:5000/health`
- Click **Send**

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-11T...",
  "uptime": 123.456,
  "environment": "development"
}
```

---

### Test 2: Signup 📧

**Create new request:**
- Method: `POST`
- URL: `http://localhost:5000/api/auth/signup`
- Headers:
  - `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "name": "Test User",
  "email": "YOUR_REAL_EMAIL@gmail.com",
  "password": "Test@1234",
  "confirmPassword": "Test@1234"
}
```
- Click **Send**

**Expected:** Check your email for 6-digit OTP!

---

### Test 3: Verify OTP 🔐

**Create new request:**
- Method: `POST`
- URL: `http://localhost:5000/api/auth/verify-otp`
- Headers:
  - `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "email": "YOUR_REAL_EMAIL@gmail.com",
  "otp": "123456"
}
```
- Replace `123456` with OTP from email
- Click **Send**

**Expected response:**
```json
{
  "message": "OTP verified successfully",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**IMPORTANT:** Copy the `accessToken` - you'll need it for protected routes!

---

### Test 4: Get User Details 👤

**Create new request:**
- Method: `GET`
- URL: `http://localhost:5000/api/auth/me`
- Headers:
  - `Authorization: Bearer YOUR_ACCESS_TOKEN_HERE`
- Click **Send**

**Expected response:**
```json
{
  "message": "User details fetched successfully",
  "data": {
    "id": 1,
    "name": "Test User",
    "email": "YOUR_REAL_EMAIL@gmail.com",
    "isVerified": true
  }
}
```

---

### Test 5: Logout 🚪

**Create new request:**
- Method: `POST`
- URL: `http://localhost:5000/api/auth/logout`
- Headers:
  - `Authorization: Bearer YOUR_ACCESS_TOKEN_HERE`
- Click **Send**

**Expected:** Token is now blacklisted (try Test 4 again - should fail!)

---

### Test 6: Login 🔑

**Create new request:**
- Method: `POST`
- URL: `http://localhost:5000/api/auth/login`
- Headers:
  - `Content-Type: application/json`
- Body (raw JSON):
```json
{
  "email": "YOUR_REAL_EMAIL@gmail.com",
  "password": "Test@1234"
}
```
- Click **Send**

**Expected:** New access token (copy it for future requests!)

---

## 📋 All Available Endpoints

### Public Routes
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/verify-otp` - Verify email with OTP
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Request password reset
- `GET /api/auth/reset-password/:token` - Validate reset token
- `POST /api/auth/reset-password/:token` - Reset password

### Protected Routes (require Authorization header)
- `GET /api/auth/me` - Get user details
- `POST /api/auth/logout` - Logout

---

## 🧪 Testing with cURL (Command Line Alternative)

### 1. Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "your-email@gmail.com",
    "password": "Test@1234",
    "confirmPassword": "Test@1234"
  }'
```

### 2. Verify OTP
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@gmail.com",
    "otp": "123456"
  }'
```

### 3. Get User (Protected)
```bash
curl -X GET http://localhost:5000/api/auth/me \
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

### No OTP email received?
- Check spam folder
- Verify `.env` has correct Gmail credentials
- Ensure using **App Password**, not regular password

### 401 Unauthorized?
- Token expires after 15 minutes
- Login again to get new token
- Check `Authorization: Bearer <token>` header format

### Database connection failed?
```bash
docker ps                    # Check if PostgreSQL is running
docker-compose up -d         # Start PostgreSQL
docker logs pdf_transactions_db  # Check logs
```

### "Email already in use"?
- Use different email OR
- Delete existing user from database

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
