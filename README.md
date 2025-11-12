# Nirnai - PDF Transaction Extraction Application

A full-stack authentication system for PDF transaction extraction web application with user authentication, dashboard, and token management.

## Tech Stack

### Backend
- Express.js + TypeScript
- Drizzle ORM + PostgreSQL (Docker)
- JWT for tokens
- Cors, Helmet, Morgan

### Frontend
- Next.js 16 (App Router) + TypeScript
- React 19
- Tailwind CSS 4
- Zustand for state management
- Axios with interceptors
- React Hook Form + Zod
- Sonner for toast notifications

## Features

- ✅ User authentication (login/logout)
- ✅ JWT-based session management
  - Access token: 15 minutes
  - Refresh token: 7 days
- ✅ Automatic token refresh with Axios interceptors
- ✅ Token blacklisting on logout
- ✅ Protected dashboard route
- ✅ Responsive UI with Tailwind CSS

## Project Structure

```
nirnai/
├── backend/                      # Express.js API server
│   ├── src/
│   │   ├── controllers/          # Request handlers
│   │   │   └── auth.controller.ts
│   │   ├── db/                   # Database configuration
│   │   │   ├── index.ts
│   │   │   └── schema.ts
│   │   ├── middlewares/          # Custom middlewares
│   │   │   └── authMiddleware.ts
│   │   ├── routes/               # API routes
│   │   │   ├── auth.routes.ts
│   │   │   └── index.ts
│   │   ├── services/             # Business logic
│   │   │   └── token.services.ts
│   │   ├── utils/                # Utilities
│   │   │   ├── constants.ts
│   │   │   ├── error.ts
│   │   │   └── jwt.ts
│   │   └── index.ts              # Entry point
│   ├── .env                      # Environment variables
│   ├── .env.example              # Environment template
│   ├── package.json
│   └── tsconfig.json
├── frontend/                     # Next.js application
│   ├── app/
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   ├── dashboard/
│   │   │   ├── layout.tsx        # Dashboard layout
│   │   │   └── page.tsx          # Dashboard page
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Home page
│   ├── components/               # React components
│   │   └── dashboard/            # Dashboard components
│   ├── lib/
│   │   └── axios.ts              # Axios + interceptors
│   ├── store/
│   │   └── authStore.ts          # Zustand auth state
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml            # PostgreSQL setup
└── README.md
```

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Docker and Docker Compose installed

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd nirnai
```

### 2. Setup Backend

#### Install Dependencies

```bash
cd backend
npm install
```

#### Configure Environment Variables

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
# Environment
NODE_ENV=development

# Server
PORT=5000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pdf_transactions

# JWT Secrets (Use strong random strings in production)
SECRET=your-super-secret-jwt-key-change-this-in-production

# Token Expiry
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 3. Setup Frontend

#### Install Dependencies

```bash
cd frontend
npm install
```

The frontend is configured to connect to `http://localhost:5000` by default. If you need to change this, create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Setup Database

#### Start PostgreSQL with Docker

From the **root directory** of the project:

```bash
docker-compose up -d
```

This will start PostgreSQL with:
- **Host:** localhost:5432
- **Username:** postgres
- **Password:** postgres
- **Database:** pdf_transactions

#### Verify Database is Running

```bash
docker ps
```

You should see a container named `pdf_transactions_db` running.

#### Run Database Migrations

```bash
cd backend
npm run db:push
```

Alternatively, you can generate and run migrations:

```bash
npm run db:generate
npm run db:migrate
```

#### Access Database Studio (Optional)

To visually inspect your database:

```bash
cd backend
npm run db:studio
```

## Running the Application

You need to run the backend and frontend in separate terminal windows.

### Terminal 1 - Start Backend

```bash
cd backend
npm run dev
```

Backend will start on: **http://localhost:5000**

You should see:
```
Server running on port 5000
Database connected successfully
```

### Terminal 2 - Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will start on: **http://localhost:3000**

You should see:
```
▲ Next.js 16.0.1
- Local: http://localhost:3000
```

### Access the Application

Open your browser and navigate to:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api

## Default Ports

| Service    | Port | URL |
|------------|------|-----|
| Frontend   | 3000 | http://localhost:3000 |
| Backend    | 5000 | http://localhost:5000 |
| PostgreSQL | 5432 | localhost:5432 |

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | Login with credentials | No |
| POST | `/api/auth/refresh-token` | Refresh access token | No |
| POST | `/api/auth/logout` | Logout and blacklist token | Yes |
| GET | `/api/auth/me` | Get user details | Yes |

## Available Scripts

### Backend Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run db:generate` | Generate database migrations |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open Drizzle Studio for database management |

### Frontend Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build Next.js application for production |
| `npm start` | Start Next.js production server |
| `npm run lint` | Run ESLint |

## Stopping the Application

### Stop Backend and Frontend

Press `Ctrl + C` in each terminal window running the backend and frontend.

### Stop PostgreSQL Database

```bash
# Stop database (keeps data)
docker-compose down

# Stop database and remove all data
docker-compose down -v
```

## Production Build

### Build Backend

```bash
cd backend
npm run build
npm start
```

### Build Frontend

```bash
cd frontend
npm run build
npm start
```

## Database Schema

### Blacklist Table

Token blacklist for logged-out tokens:

```sql
CREATE TABLE blacklist (
  id SERIAL PRIMARY KEY,
  token VARCHAR(500) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## Troubleshooting

### Port Already in Use

If you get an error that ports 3000 or 5000 are already in use:

```bash
# Find and kill process on port 3000 (Frontend)
lsof -ti :3000 | xargs kill -9

# Find and kill process on port 5000 (Backend)
lsof -ti :5000 | xargs kill -9

# Find and kill both ports
lsof -ti :3000 :5000 | xargs kill -9
```

### Database Connection Issues

1. **Check if Docker is running:**
   ```bash
   docker ps
   ```

2. **Check if PostgreSQL container is running:**
   ```bash
   docker-compose ps
   ```

3. **Restart the database:**
   ```bash
   docker-compose restart
   ```

4. **View database logs:**
   ```bash
   docker-compose logs postgres
   ```

5. **Verify database connection:**
   ```bash
   docker exec -it pdf_transactions_db psql -U postgres -d pdf_transactions
   ```

### Backend Won't Start

- Verify `.env` file exists in backend directory
- Check if PostgreSQL is running: `docker ps`
- Verify DATABASE_URL in `.env` is correct
- Check backend logs for detailed error messages

### Frontend Won't Start

- Check if port 3000 is available
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules package-lock.json && npm install`

### CORS Errors

- Verify `FRONTEND_URL` in backend `.env` matches frontend URL
- Check browser console for exact error
- Ensure backend is running before frontend

### Token Refresh Not Working

- Check browser Network tab for `/auth/refresh-token` calls
- Verify `refreshToken` exists in localStorage
- Check backend logs for errors
- Ensure `ACCESS_TOKEN_EXPIRY` and `REFRESH_TOKEN_EXPIRY` are set correctly

### Environment Variables Not Loading

- Ensure `.env` file exists in backend directory
- Restart the backend server after changing `.env`
- Check for typos in environment variable names

## Testing Checklist

### ✅ Basic Authentication
1. [ ] Open http://localhost:3000
2. [ ] Should redirect to /login
3. [ ] Enter valid credentials
4. [ ] Click "Sign in"
5. [ ] Should redirect to /dashboard
6. [ ] Dashboard shows user info

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
5. [ ] Token should be blacklisted

### ✅ Token Refresh
1. [ ] Login successfully
2. [ ] Wait 15 minutes (or change ACCESS_TOKEN_EXPIRY to 1m)
3. [ ] Make an API call (refresh dashboard)
4. [ ] Token should auto-refresh silently
5. [ ] No logout/redirect should occur

## Development Workflow

1. **Start Database:**
   ```bash
   docker-compose up -d
   ```

2. **Start Backend (Terminal 1):**
   ```bash
   cd backend
   npm run dev
   ```

3. **Start Frontend (Terminal 2):**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Access Application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

5. **Stop Everything:**
   - Press `Ctrl + C` in both terminals
   - Run `docker-compose down` to stop database

## Next Steps (Future Features)

- [ ] PDF upload functionality
- [ ] PDF parsing and transaction extraction
- [ ] Transaction list view
- [ ] Export transactions to CSV/Excel
- [ ] Transaction filtering and search

## License

ISC

## Author

Mohammed Rishin Poolat
