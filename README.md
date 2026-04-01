# 🔗 URL Shortener Backend Service

> A production-ready, feature-complete URL shortening service built with Node.js, Express, TypeScript, and PostgreSQL. Secure, scalable, and easy to deploy.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.0+-lightgrey.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Configuration](#-environment-configuration)
- [Database Setup](#-database-setup)
- [Running the Project](#-running-the-project)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Security Features](#-security-features)
- [Rate Limiting](#-rate-limiting)
- [Error Handling](#-error-handling)
- [Logging](#-logging)
- [Testing](#-testing)
- [License](#-license)

---

## ✨ Features

### URL Shortening
- 🔗 **Shorten URLs** - Create short, manageable links from long URLs
- 🆔 **Custom Short Codes** - Users can provide their own short codes (if available)
- 📊 **Click Analytics** - Track how many times each short link has been clicked
- 🔄 **Redirection** - Fast, public redirection from short links to original URLs
- 📝 **URL Management** - Authenticated users can view, update, and delete their URLs

### Authentication & Authorization
- 🔐 **User Registration** with email verification
- 🔑 **Secure Login** with JWT access & refresh tokens
- 🔄 **Token Rotation** for enhanced security
- 🔓 **Password Reset** flow (forgot/reset password)
- 🚪 **Logout** with token invalidation

### User Management
- 👤 **User Profile** - View and update user information
- 🔒 **Password Change** - Secure password update for logged-in users

### Security & Performance
- 🛡️ **Rate Limiting** - Multiple tiers based on endpoint sensitivity
- 🔐 **HTTP-only Cookies** - Secure token storage
- 🔒 **bcrypt Hashing** - Industry-standard password encryption
- 🛡️ **Helmet** - Security headers
- ✅ **Input Validation** - Zod schema validation

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js (v18+) |
| **Framework** | Express.js 5.x |
| **Language** | TypeScript 6.x |
| **Database** | PostgreSQL (Neon compatible) |
| **ORM** | Drizzle ORM |
| **Authentication** | JWT (jsonwebtoken) |
| **URL Generation**| Nanoid |
| **Email Service** | Nodemailer + Mailgen |
| **Logging** | Winston |
| **Validation** | Zod |
| **Security** | Helmet, CORS, express-rate-limit |

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **PostgreSQL** (v14+) or a [Neon](https://neon.tech/) account
- **SMTP Server** for emails:
  - Development: [Mailtrap](https://mailtrap.io/)
  - Production: SendGrid, AWS SES, or similar

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd url-shortener
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the sample environment file:

```bash
cp .env.sample .env
```

---

## ⚙️ Environment Configuration

Open `.env` and configure the following variables:

### Required Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Server
PORT=3000
NODE_ENV=development

# JWT Secrets (use strong random strings)
ACCESS_TOKEN_SECRET=your_access_token_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here

# Token Expiry
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Application URLs
APP_BASE_URL=http://localhost:3000
APP_NAME=URL Shortener
APP_WEBSITE=https://yourapp.com

# CORS Origins (comma-separated)
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Email Configuration (Mailtrap example)
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_mailtrap_username
MAILTRAP_PASS=your_mailtrap_password

# Security
SALT_ROUNDS=10
```

---

## 🗄️ Database Setup

### 1. Generate Migrations

```bash
npm run db:generate
```

### 2. Apply Migrations

```bash
npm run db:push
```

### 3. View Database (Optional)

```bash
npm run db:studio
```

---

## 🏃 Running the Project

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Build

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

---

## 📖 API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### 🔗 URL Endpoints

#### 1. Shorten URL
**Endpoint:** `POST /url/shorten` (Auth Required)
**Body:**
```json
{
  "originalUrl": "https://www.example.com/very/long/url",
  "shortCode": "custom-code" (optional)
}
```

#### 2. Redirect to Original URL
**Endpoint:** `GET /url/:shortCode` (Public)
**Description:** Redirects to the original URL and increments click count.

#### 3. Get User's URLs
**Endpoint:** `GET /url/` (Auth Required)
**Description:** List all URLs shortened by the current user.

#### 4. Get URL Analytics
**Endpoint:** `GET /url/analytics/:shortCode` (Auth Required)
**Description:** Get click count for a specific short link.

#### 5. Update URL
**Endpoint:** `PATCH /url/:id` (Auth Required)
**Body:**
```json
{
  "originalUrl": "https://www.example.com/updated/long/url"
}
```

#### 6. Delete URL
**Endpoint:** `DELETE /url/:id` (Auth Required)

### 🔐 Authentication Endpoints

- `POST /auth/signup` - Register a new account
- `GET /auth/verify-email?token={token}` - Verify email address
- `POST /auth/signin` - Authenticate and get tokens
- `POST /auth/refresh-token` - Get new access token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password?token={token}` - Reset password
- `POST /auth/logout` - Invalidate tokens

### 👤 User Endpoints

- `GET /user/profile` - Get current user profile
- `PATCH /user/profile` - Update profile information
- `POST /user/change-password` - Change account password

---

## 📁 Project Structure

```
url-shortener/
├── src/
│   ├── config/           # Database & environment configuration
│   ├── controllers/      # Route controllers (URL, Auth, User)
│   ├── middlewares/      # Express middlewares (Auth, Errors, Rate Limiting)
│   ├── models/           # Drizzle schema definitions
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic layer
│   ├── utils/            # Shared utility functions
│   ├── validations/      # Zod request validation schemas
│   ├── app.ts            # App configuration
│   └── server.ts         # Server entry point
```

---

## 🛡️ Security Features

- **JWT-based** authentication with token rotation
- **HTTP-only cookies** to prevent XSS attacks
- **bcrypt hashing** for secure password storage
- **Helmet headers** for standard security protections
- **Input Validation** via Zod to prevent malicious data
- **Rate Limiting** to prevent brute-force attacks and abuse

---

## ⚡ Rate Limiting

- **Auth Routes:** 5 requests / 15 minutes
- **Password Reset:** 3 requests / 1 hour
- **General API:** 100 requests / 15 minutes

---

## 📄 License

This project is licensed under the ISC License.

---

**Built with ❤️ for secure and fast URL shortening.**
