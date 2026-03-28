# 🔐 Authentication Backend Service

> A production-ready, feature-complete authentication backend template built with Node.js, Express, TypeScript, and PostgreSQL. Perfect for kickstarting your next backend project.

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
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Authentication & Authorization
- 🔐 **User Registration** with email verification
- 🔑 **Secure Login** with JWT access & refresh tokens
- 🔄 **Token Rotation** for enhanced security
- 🔓 **Password Reset** flow (forgot/reset password)
- 🚪 **Logout** with token invalidation

### User Management
- 👤 **User Profile** - View and update user information
- 🔒 **Password Change** - Secure password update for logged-in users
- ✉️ **Email Verification** - Required before account access

### Security & Performance
- 🛡️ **Rate Limiting** - Multiple tiers based on endpoint sensitivity
- 🔐 **HTTP-only Cookies** - Secure token storage
- 🔒 **bcrypt Hashing** - Industry-standard password encryption
- 🛡️ **Helmet** - Security headers
- 🌐 **CORS** - Configured with credentials support
- ✅ **Input Validation** - Zod schema validation

### Developer Experience
- 📝 **Structured Logging** - Winston logger with file rotation
- 🏥 **Health Checks** - Database connectivity monitoring
- 🚀 **TypeScript** - Full type safety
- 📚 **API Documentation** - Comprehensive route documentation
- 🧪 **Testing Ready** - Organized structure for easy testing

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
| **Password Hashing** | bcrypt |
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
cd auth-rev
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
APP_NAME=Your App Name
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

### Generating Secure Secrets

Use Node.js to generate secure random secrets:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🗄️ Database Setup

### 1. Create Database

If using local PostgreSQL:

```bash
createdb auth_db
```

If using Neon or hosted PostgreSQL, create a database through their dashboard.

### 2. Generate Migrations

```bash
npm run db:generate
```

This creates migration files based on your schema in `src/models/user.model.ts`.

### 3. Apply Migrations

```bash
npm run db:push
```

This applies the schema to your database.

### 4. View Database (Optional)

```bash
npm run db:studio
```

Opens Drizzle Studio to view your database visually.

---

## 🏃 Running the Project

### Development Mode (with auto-reload)

```bash
npm run dev
```

Server starts at `http://localhost:3000`

### Production Build

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

### Verify Server is Running

```bash
curl http://localhost:3000/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is healthy",
  "data": {
    "status": "healthy",
    "timestamp": "2024-03-28T12:00:00.000Z",
    "uptime": 123.45,
    "database": "connected"
  }
}
```

---

## 📖 API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

---

## 🔐 Authentication Endpoints

### 1. Sign Up

**Endpoint:** `POST /auth/signup`

**Description:** Register a new user account. Sends verification email.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Validation Rules:**
- `username`: 3-20 characters, lowercase
- `email`: Valid email format, lowercase
- `password`: Minimum 8 characters

**Success Response (201):**
```json
{
  "success": true,
  "message": "Account created. Please check your email to verify your account before signing in.",
  "data": {
    "userId": 1
  }
}
```

**Rate Limit:** 5 requests per 15 minutes

---

### 2. Verify Email

**Endpoint:** `GET /auth/verify-email?token={token}`

**Description:** Verify user email address using token sent via email.

**Query Parameters:**
- `token` (required): Verification token from email

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully. You can now sign in.",
  "data": null
}
```

**Rate Limit:** 10 requests per 15 minutes

---

### 3. Sign In

**Endpoint:** `POST /auth/signin`

**Description:** Authenticate user and receive access/refresh tokens.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

OR using username:

```json
{
  "username": "johndoe",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "userId": 1,
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Notes:**
- Tokens are also set as HTTP-only cookies
- Email must be verified before signin

**Rate Limit:** 5 requests per 15 minutes

---

### 4. Refresh Token

**Endpoint:** `POST /auth/refresh-token`

**Description:** Get new access token using refresh token. Implements token rotation.

**Authentication:** Refresh token (cookie or body)

**Request Body (optional):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Notes:**
- Old refresh token is invalidated
- New tokens are set as cookies

**No Rate Limit**

---

### 5. Forgot Password

**Endpoint:** `POST /auth/forgot-password`

**Description:** Request password reset email with reset token.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "If that email exists, a password reset link has been sent.",
  "data": null
}
```

**Notes:**
- Always returns success to prevent email enumeration
- Reset token expires in 15 minutes

**Rate Limit:** 3 requests per hour (strict)

---

### 6. Reset Password

**Endpoint:** `POST /auth/reset-password?token={token}`

**Description:** Reset password using token from email.

**Query Parameters:**
- `token` (required): Reset token from email

**Request Body:**
```json
{
  "password": "NewSecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully. You can now sign in with your new password.",
  "data": null
}
```

**Rate Limit:** 3 requests per hour

---

### 7. Logout

**Endpoint:** `POST /auth/logout`

**Description:** Logout user and invalidate refresh token.

**Authentication:** Required (access token)

**Success Response (200):**
```json
{
  "success": true,
  "message": "User logged out successfully",
  "data": null
}
```

**Notes:**
- Clears authentication cookies
- Removes refresh token from database

---

## 👤 User Management Endpoints

### 8. Get Profile

**Endpoint:** `GET /user/profile`

**Description:** Get current user's profile information.

**Authentication:** Required (access token)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "isEmailVerified": true,
    "createdAt": "2024-03-28T10:00:00.000Z",
    "updatedAt": "2024-03-28T10:00:00.000Z"
  }
}
```

**Notes:**
- Password is never included in response

**Rate Limit:** 100 requests per 15 minutes

---

### 9. Update Profile

**Endpoint:** `PATCH /user/profile`

**Description:** Update username and/or email.

**Authentication:** Required (access token)

**Request Body:**
```json
{
  "username": "johndoe_updated",
  "email": "newemail@example.com"
}
```

**Notes:**
- At least one field required
- Username and email must be unique

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "username": "johndoe_updated",
    "email": "newemail@example.com",
    "isEmailVerified": true,
    "createdAt": "2024-03-28T10:00:00.000Z",
    "updatedAt": "2024-03-28T12:30:00.000Z"
  }
}
```

**Rate Limit:** 100 requests per 15 minutes

---

### 10. Change Password

**Endpoint:** `POST /user/change-password`

**Description:** Change password for authenticated user.

**Authentication:** Required (access token)

**Request Body:**
```json
{
  "currentPassword": "SecurePass123",
  "newPassword": "NewSecurePass456"
}
```

**Validation:**
- `newPassword`: Minimum 8 characters

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": null
}
```

**Rate Limit:** 100 requests per 15 minutes

---

## 🏥 System Endpoints

### 11. Health Check

**Endpoint:** `GET /health`

**Description:** Check server and database health status.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Server is healthy",
  "data": {
    "status": "healthy",
    "timestamp": "2024-03-28T12:00:00.000Z",
    "uptime": 3600.5,
    "database": "connected"
  }
}
```

**Unhealthy Response (503):**
```json
{
  "success": false,
  "message": "Service unhealthy",
  "errors": {
    "status": "unhealthy",
    "timestamp": "2024-03-28T12:00:00.000Z",
    "uptime": 3600.5,
    "database": "disconnected"
  }
}
```

**No Rate Limit**

---

## 🔒 Authentication

### Using Cookies (Recommended for Web)

Tokens are automatically set as HTTP-only cookies on signin. Include credentials in requests:

```javascript
fetch('http://localhost:3000/api/v1/user/profile', {
  credentials: 'include'
});
```

### Using Authorization Header (For Mobile/API clients)

```bash
curl http://localhost:3000/api/v1/user/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📁 Project Structure

```
auth-rev/
├── src/
│   ├── config/
│   │   ├── database.ts          # Database connection & health check
│   │   └── env.ts                # Environment variables & validation
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts    # Authentication logic
│   │   └── user.controller.ts    # User management logic
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts    # JWT verification middleware
│   │   ├── errorHandler.ts       # Global error handler
│   │   └── rateLimiter.ts        # Rate limiting configurations
│   │
│   ├── models/
│   │   ├── index.ts              # Model exports
│   │   └── user.model.ts         # User schema (Drizzle)
│   │
│   ├── routes/
│   │   ├── auth.route.ts         # Authentication routes
│   │   ├── user.route.ts         # User routes
│   │   ├── healthCheck.route.ts  # Health check route
│   │   └── index.ts              # Route exports
│   │
│   ├── services/
│   │   ├── auth.service.ts       # Auth business logic
│   │   └── user.service.ts       # User database operations
│   │
│   ├── utils/
│   │   ├── asyncHandler.ts       # Async error wrapper
│   │   ├── logger.ts             # Winston logger config
│   │   ├── mail.ts               # Email sending utility
│   │   ├── msConverter.ts        # Time string converter
│   │   └── response.ts           # Standardized responses
│   │
│   ├── validations/
│   │   └── request.validation.ts # Zod validation schemas
│   │
│   ├── app.ts                    # Express app setup
│   └── server.ts                 # Server entry point
│
├── logs/                         # Log files (auto-generated)
├── public/                       # Static files
├── dist/                         # Compiled JavaScript (build)
├── drizzle/                      # Database migrations (generated)
│
├── .env                          # Environment variables (create from .env.sample)
├── .env.sample                   # Environment template
├── .gitignore                    # Git ignore rules
├── drizzle.config.ts             # Drizzle ORM configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies & scripts
│
├── README.md                     # This file
├── API_TESTING_GUIDE.md          # cURL testing examples
└── IMPLEMENTATION_SUMMARY.md     # Feature implementation details
```

---

## 🛡️ Security Features

### 1. Password Security
- **bcrypt hashing** with 10 salt rounds
- **Minimum 8 characters** required
- Passwords **never exposed** in API responses

### 2. Token Security
- **JWT-based** authentication
- **Separate secrets** for access & refresh tokens
- **Short-lived access tokens** (15 minutes default)
- **Long-lived refresh tokens** (7 days default)
- **Token rotation** on refresh
- **HTTP-only cookies** prevent XSS attacks
- **Secure flag** in production

### 3. CORS Configuration
- **Credentials support** enabled
- **Origin whitelist** from environment
- **Proper headers** configured

### 4. Security Headers (Helmet)
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security
- And more...

### 5. Input Validation
- **Zod schemas** for all inputs
- **Email normalization** (lowercase)
- **SQL injection protection** via ORM
- **XSS prevention** via validation

### 6. Email Enumeration Protection
- Forgot password **always returns success**
- No indication if email exists

### 7. Environment Validation
- **Required variables** checked on startup
- **Server fails fast** if misconfigured

---

## ⚡ Rate Limiting

Different rate limits for different endpoint sensitivity:

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Authentication (signup, signin) | 5 requests | 15 minutes |
| Password Reset | 3 requests | 1 hour |
| Email Verification | 10 requests | 15 minutes |
| General API | 100 requests | 15 minutes |
| Token Refresh | Unlimited | - |
| Health Check | Unlimited | - |

Rate limit headers included in responses:
- `RateLimit-Limit`: Total requests allowed
- `RateLimit-Remaining`: Requests remaining
- `RateLimit-Reset`: Time when limit resets

---

## 🚨 Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field": ["error detail"]
  }
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Login successful |
| 201 | Created | User registered |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Invalid credentials |
| 403 | Forbidden | Email not verified |
| 409 | Conflict | Email already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Database connection failed |
| 503 | Service Unavailable | Database unhealthy |

---

## 📝 Logging

### Winston Logger Configuration

Logs are written to multiple transports:

**Console** (Development):
- Colorized output
- All log levels
- Timestamps

**Files**:
- `logs/combined.log` - All logs
- `logs/error.log` - Error level and below
- `logs/exceptions.log` - Uncaught exceptions
- `logs/rejections.log` - Unhandled promise rejections

### Log Levels

```
error: 0
warn: 1
info: 2
http: 3
verbose: 4
debug: 5
silly: 6
```

### Environment Variable

Set log level via environment:

```env
LOG_LEVEL=debug  # For development
LOG_LEVEL=info   # For production
```

---

## 🧪 Testing

### Manual Testing with cURL

See detailed examples in [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md)

Quick test flow:

```bash
# 1. Health Check
curl http://localhost:3000/api/v1/health

# 2. Sign Up
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"Test1234"}'

# 3. Sign In (save cookies)
curl -X POST http://localhost:3000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"Test1234"}'

# 4. Get Profile (with cookies)
curl http://localhost:3000/api/v1/user/profile -b cookies.txt
```

### Automated Testing

*Coming soon: Unit tests with Jest and integration tests with Supertest*

---

## 🚀 Deployment

### Prerequisites for Production

- [ ] PostgreSQL database (managed service recommended)
- [ ] SMTP service for emails (SendGrid, AWS SES, etc.)
- [ ] Node.js hosting (Vercel, Railway, Render, AWS, etc.)
- [ ] Environment variables configured
- [ ] Domain name (for production URL)

### Deployment Steps

#### 1. Build the Application

```bash
npm run build
```

#### 2. Set Environment Variables

Ensure all production environment variables are set:

```env
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:pass@host:5432/prod_db
ACCESS_TOKEN_SECRET=<strong-random-secret>
REFRESH_TOKEN_SECRET=<strong-random-secret>
APP_BASE_URL=https://api.yourapp.com
CORS_ORIGIN=https://yourapp.com,https://www.yourapp.com
# ... other variables
```

#### 3. Run Database Migrations

```bash
npm run db:migrate
```

#### 4. Start the Server

```bash
npm start
```

### Platform-Specific Guides

#### Vercel

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/server.js"
    }
  ]
}
```

#### Railway

- Connect GitHub repository
- Set environment variables in dashboard
- Railway auto-detects build commands

#### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🔧 Development Scripts

```bash
# Development with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start

# Generate Drizzle migrations
npm run db:generate

# Apply migrations
npm run db:migrate

# Push schema to database (dev)
npm run db:push

# Open Drizzle Studio
npm run db:studio
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Coding Standards

- Follow existing code style
- Write meaningful commit messages
- Update documentation for new features
- Add tests for new functionality

---

## 📄 License

This project is licensed under the ISC License.

---

## 📞 Support

For questions or issues:

- 📧 Email: your-email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/auth-rev/issues)
- 📖 Docs: [Full Documentation](./docs)

---

## 🙏 Acknowledgments

Built with:
- [Express.js](https://expressjs.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Winston](https://github.com/winstonjs/winston)
- [Zod](https://zod.dev/)
- And many other amazing open-source projects

---

## 📊 Project Status

- ✅ **Production Ready**
- ✅ **Fully Documented**
- ✅ **Type Safe**
- ✅ **Security Hardened**
- ✅ **Actively Maintained**

---

**Made with ❤️ for developers who want to focus on building, not boilerplate.**
