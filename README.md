# PDF Transaction Extraction - Authentication System

A simplified authentication system for PDF transaction extraction web application with hardcoded admin credentials.

## Tech Stack

### Backend
- Express.js + TypeScript
- Drizzle ORM + PostgreSQL (Docker)
- JWT for tokens
- Zod for validation
- Cors, Helmet, dotenv

### Frontend
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Zustand for state management
- Axios with interceptors
- React Hook Form + Zod

## Features

- ✅ Hardcoded login (email: `admin`, password: `admin123`)
- ✅ JWT-based session management
  - Access token: 15 minutes
  - Refresh token: 7 days
- ✅ Automatic token refresh with Axios interceptors
- ✅ Token blacklisting on logout
- ✅ Protected dashboard route
- ✅ No email verification, no password reset, no user registration

## Database Schema

Only ONE table:
```sql
-- Blacklist table for logged-out tokens
CREATE TABLE blacklist (
  id SERIAL PRIMARY KEY,
  token VARCHAR(500) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | Login with hardcoded credentials | No |
| POST | `/api/auth/refresh-token` | Refresh access token | No |
| POST | `/api/auth/logout` | Logout and blacklist token | Yes |
| GET | `/api/auth/me` | Get user details | Yes |

## Setup Instructions

### 1. Prerequisites
- Node.js 18+ installed
- Docker and Docker Compose installed
- npm or yarn package manager

### 2. Clone and Setup

```bash
# Navigate to project
cd nirnai

# Setup Backend
cd backend
npm install
cp .env.example .env  # Update if needed

# Setup Frontend
cd ../frontend
npm install
# .env.local is already configured
```

### 3. Start PostgreSQL with Docker

```bash
# From project root
docker-compose up -d

# Verify database is running
docker ps
```

### 4. Run Database Migrations

```bash
cd backend
npm run db:push
```

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Backend runs on http://localhost:5001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pdf_transactions
SECRET=your-super-secret-jwt-key-change-this-in-production
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

## Testing Checklist

### ✅ Basic Authentication
1. [ ] Open http://localhost:3000
2. [ ] Should redirect to /login
3. [ ] Enter credentials: `admin` / `admin123`
4. [ ] Click "Sign in"
5. [ ] Should redirect to /dashboard
6. [ ] Dashboard shows "Administrator" user info

### ✅ Invalid Credentials
1. [ ] Try logging in with wrong email or password
2. [ ] Should show error message
3. [ ] Should stay on login page

### ✅ Protected Routes
1. [ ] Open http://localhost:3000/dashboard in incognito/private window
2. [ ] Should redirect to /login (not authenticated)
3. [ ] Login successfully
4. [ ] Should redirect to /dashboard

### ✅ Logout Functionality
1. [ ] Login successfully
2. [ ] Go to dashboard
3. [ ] Click "Logout" button
4. [ ] Should redirect to /login
5. [ ] Token should be blacklisted (cannot reuse)

### ✅ Token Refresh (15 minute test)
1. [ ] Login successfully
2. [ ] Wait 15 minutes (or change ACCESS_TOKEN_EXPIRY to 1m for faster testing)
3. [ ] Make an API call (refresh the dashboard page)
4. [ ] Token should auto-refresh silently
5. [ ] No logout/redirect should occur

### ✅ Token Blacklisting
1. [ ] Login and copy the accessToken from localStorage
2. [ ] Logout
3. [ ] Try using the same token in a request
4. [ ] Should get 401 Unauthorized
5. [ ] Check database: `SELECT * FROM blacklist;`

## Project Structure

```
nirnai/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── auth.controller.ts       # Login, logout, refresh, me
│   │   ├── db/
│   │   │   ├── index.ts                 # Database connection
│   │   │   └── schema.ts                # Blacklist table only
│   │   ├── middlewares/
│   │   │   └── authMiddleware.ts        # JWT + blacklist check
│   │   ├── routes/
│   │   │   ├── auth.routes.ts           # Auth endpoints
│   │   │   └── index.ts                 # Route aggregator
│   │   ├── services/
│   │   │   └── token.services.ts        # Token blacklist operations
│   │   ├── utils/
│   │   │   ├── constants.ts             # Error/success messages
│   │   │   ├── error.ts                 # Error handling
│   │   │   └── jwt.ts                   # JWT sign/verify
│   │   └── index.ts                     # Express app entry
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── app/
│   │   ├── login/
│   │   │   └── page.tsx                 # Login page
│   │   ├── dashboard/
│   │   │   └── page.tsx                 # Protected dashboard
│   │   ├── layout.tsx
│   │   └── page.tsx                     # Root redirect
│   ├── lib/
│   │   └── axios.ts                     # Axios + interceptors
│   ├── store/
│   │   └── authStore.ts                 # Zustand auth state
│   ├── .env.local
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml                   # PostgreSQL setup
└── README.md
```

## Hardcoded Credentials

```
Email: admin
Password: admin123
```

**User Data:**
```json
{
  "id": 1,
  "email": "admin",
  "name": "Administrator"
}
```

## API Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "status": 0,
  "statusCode": 401,
  "message": "Invalid credentials",
  "errorDetails": null
}
```

## Common Issues & Solutions

### Backend won't start
- Check if PostgreSQL is running: `docker ps`
- Check if port 5001 is available: `lsof -i :5001`
- Verify DATABASE_URL in .env

### Frontend won't start
- Check if port 3000 is available: `lsof -i :3000`
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### CORS errors
- Verify FRONTEND_URL in backend .env matches frontend URL
- Check browser console for exact error

### Token refresh not working
- Check browser Network tab for /auth/refresh-token calls
- Verify refreshToken exists in localStorage
- Check backend logs for errors

## Next Steps (Phase 2)

After authentication is working perfectly:
1. PDF upload functionality
2. PDF parsing and transaction extraction
3. Transaction list view
4. Export transactions to CSV/Excel
5. Transaction filtering and search

## License

Private project - All rights reserved

## Author

Mohammed Rishin Poolat
