# URL Shortener Backend Service

> A production-ready URL shortening service built with Node.js, Express, TypeScript, PostgreSQL, Redis, and BullMQ.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.0+-lightgrey.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

---

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Project](#running-the-project)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Security Features](#security-features)
- [Rate Limiting](#rate-limiting)
- [License](#license)

---

## Architecture

```mermaid
flowchart TD
    Client([HTTP Client])

    subgraph API ["Express API (port 8000)"]
        Auth[Auth Controller]
        URL[URL Controller]
        User[User Controller]
    end

    subgraph Queue ["Async Layer"]
        EQ[BullMQ Email Queue]
        EW[Email Worker]
    end

    subgraph Storage ["Storage"]
        PG[(PostgreSQL\nUsers / URLs)]
        RD[(Redis\nAnalytics / Queue)]
    end

    SMTP[Mailtrap / SMTP]

    Client -->|POST /auth/signup| Auth
    Client -->|POST /auth/signin| Auth
    Client -->|POST /url/shorten| URL
    Client -->|GET /:shortCode| URL

    Auth -->|Create user / tokens| PG
    Auth -->|Enqueue welcome email| EQ

    URL -->|Read / Write URLs| PG
    URL -->|recordClick on redirect| RD
    URL -->|getRedisAnalytics| RD

    EQ --> RD
    EW -->|Poll jobs| EQ
    EW -->|Send email| SMTP
```

### Request Flows

**Signup**
```
POST /auth/signup
  -> validate input
  -> create user in PostgreSQL
  -> store email verification token
  -> enqueue welcome email (fire-and-forget, does not block response)
  <- 201 Account created
```

**Redirect + Click Tracking**
```
GET /:shortCode
  -> look up URL in PostgreSQL
  -> recordClick() in Redis (total counter + daily counter + lastAccessed)
  -> increment DB click count (async, fire-and-forget)
  <- 302 redirect
```

**Analytics**
```
GET /url/analytics/:shortCode
  -> verify ownership in PostgreSQL
  -> getRedisAnalytics() pipeline (total, 7-day daily breakdown, lastAccessed)
  <- merged Redis + DB data
```

---

## Features

### URL Management

- Shorten URLs with auto-generated or custom short codes
- Redirect with real-time click tracking
- CRUD: create, read, update, delete your own URLs
- Per-URL analytics: total clicks, 7-day daily breakdown, last accessed timestamp

### Authentication

- User registration with background email verification (non-blocking)
- Sign in immediately after signup — email verification is optional and can be done later
- JWT access and refresh tokens stored in HTTP-only cookies
- Token rotation on every refresh
- Forgot password / reset password flow
- Logout with token invalidation

### Async Email Delivery

- All transactional emails (welcome, resend verification, password reset) are processed through a BullMQ queue
- 3 retry attempts with exponential backoff (1s, 2s, 4s)
- Email queue failures never crash the HTTP response

### Redis Analytics

- Real-time click counter per URL
- Per-day click counters with 30-day TTL
- Last-accessed timestamp
- All reads done in a single Redis pipeline

---

## Tech Stack

| Category       | Technology                       |
| -------------- | -------------------------------- |
| Runtime        | Node.js (v18+)                   |
| Framework      | Express.js 5.x                   |
| Language       | TypeScript 6.x                   |
| Database       | PostgreSQL (Neon compatible)     |
| ORM            | Drizzle ORM                      |
| Cache / Queue  | Redis + ioredis                  |
| Job Queue      | BullMQ                           |
| Authentication | JWT (jsonwebtoken)               |
| URL Generation | Nanoid                           |
| Email          | Nodemailer + Mailgen             |
| Logging        | Winston                          |
| Validation     | Zod                              |
| Security       | Helmet, CORS, express-rate-limit |

---

## Prerequisites

- Node.js v18+
- PostgreSQL v14+ or a [Neon](https://neon.tech/) account
- Redis (local or managed — no password required for local development)
- SMTP credentials (development: [Mailtrap](https://mailtrap.io/))

---

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd url-shortener
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment

```bash
cp .env.sample .env
```

---

## Environment Configuration

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Server
PORT=8000
NODE_ENV=development

# JWT
ACCESS_TOKEN_SECRET=your_access_token_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Application
APP_BASE_URL=http://localhost:8000
APP_NAME=URL Shortener
APP_WEBSITE=https://yourapp.com
CORS_ORIGIN=http://localhost:3000

# Redis (no password required for local Redis)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (Mailtrap example)
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_mailtrap_username
MAILTRAP_PASS=your_mailtrap_password

# Security
SALT_ROUNDS=10
```

---

## Database Setup

```bash
# Generate migration files
npm run db:generate

# Apply migrations
npm run db:push

# Open Drizzle Studio (optional)
npm run db:studio
```

---

## Running the Project

```bash
# Development (tsx watch, auto-reload)
npm run dev

# Production build
npm run build
npm start
```

The email worker starts automatically alongside the HTTP server.

---

## API Documentation

### Base URL

```
http://localhost:8000/api/v1
```

### URL Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/url/shorten` | Required | Shorten a URL |
| GET | `/url/` | Required | List all user URLs |
| GET | `/url/analytics/:shortCode` | Required | Get analytics for a URL |
| PATCH | `/url/:id` | Required | Update original URL |
| DELETE | `/url/:id` | Required | Delete a URL |
| GET | `/:shortCode` | Public | Redirect to original URL |

**Shorten URL body:**
```json
{
  "originalUrl": "https://www.example.com/very/long/url",
  "shortCode": "my-code"
}
```

**Analytics response:**
```json
{
  "analytics": {
    "totalClicks": 42,
    "dbClicks": 40,
    "redisClicks": 42,
    "lastAccessed": "2026-06-06T10:35:00.000Z",
    "dailyStats": [
      { "date": "2026-06-06", "clicks": 15 },
      { "date": "2026-06-05", "clicks": 27 }
    ],
    "url": { "id": 1, "shortCode": "abc123", "originalUrl": "..." }
  }
}
```

### Auth Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | No | Register — returns immediately, email sent in background |
| POST | `/auth/signin` | No | Sign in — returns `isEmailVerified` flag |
| GET | `/auth/verify-email?token=` | No | Verify email address |
| POST | `/auth/resend-verification` | No | Resend verification email |
| POST | `/auth/refresh-token` | No | Rotate access + refresh tokens |
| POST | `/auth/forgot-password` | No | Request password reset email |
| POST | `/auth/reset-password?token=` | No | Set new password |
| POST | `/auth/logout` | Required | Invalidate tokens |

**Signin response includes:**
```json
{
  "userId": 1,
  "isEmailVerified": false
}
```
Use `isEmailVerified` to show a non-blocking verification prompt in the frontend.

### User Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/user/profile` | Required | Get current user profile |
| PATCH | `/user/profile` | Required | Update username or email |
| POST | `/user/change-password` | Required | Change password |

---

## Project Structure

```
src/
├── config/
│   ├── bullmq.ts         # BullMQ connection options factory
│   ├── constants.ts      # App-wide constants
│   ├── database.ts       # Drizzle + PostgreSQL connection
│   ├── env.ts            # Environment variable parsing and validation
│   └── redis.ts          # ioredis client (analytics + cache)
├── controllers/
│   ├── auth.controller.ts
│   ├── url.controller.ts
│   └── user.controller.ts
├── middlewares/
├── models/
│   ├── url.model.ts      # URLs table schema
│   └── user.model.ts     # Users table schema
├── queues/
│   └── email.queue.ts    # BullMQ queue + EmailJobData type
├── routes/
├── services/
│   ├── analytics.service.ts  # Redis click tracking and reads
│   ├── auth.service.ts       # JWT helpers, password hashing
│   └── user.service.ts       # User DB queries
├── types/
├── utils/
│   ├── mail.ts           # Nodemailer + Mailgen email builder
│   └── logger.ts         # Winston logger
├── validations/
├── workers/
│   └── email.worker.ts   # BullMQ worker — processes email jobs
├── app.ts                # Express app setup
└── server.ts             # Entry point — starts server + worker
```

---

## Security Features

- JWT authentication with token rotation on every refresh
- HTTP-only cookies to prevent XSS token theft
- bcrypt hashing for password storage
- Helmet security headers
- Zod input validation on all endpoints
- Rate limiting per route tier

---

## Rate Limiting

| Route tier | Limit |
|---|---|
| Auth routes | 5 requests / 15 minutes |
| Password reset | 3 requests / 1 hour |
| General API | 100 requests / 15 minutes |

---

## License

ISC License.

---

Built for learning and portfolio purposes. Architecture and implementation by the author, with AI assistance for explanation quality in comments.
