# 🚀 Quick Start Guide

> Get your URL shortener running in 5 minutes!

## ⚡ Super Quick Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.sample .env
# Edit .env with your database URL and secrets

# 3. Setup database
npm run db:generate
npm run db:push

# 4. Start server
npm run dev

# 5. Test it
curl http://localhost:3000/api/v1/health
```

---

## 🎯 Quick Testing Flow

```bash
# 1. Sign up
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","email":"demo@test.com","password":"Demo1234"}'

# 2. Sign in (save cookies)
curl -X POST http://localhost:3000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"demo@test.com","password":"Demo1234"}'

# 3. Shorten a URL
curl -X POST http://localhost:3000/api/v1/url/shorten \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"originalUrl":"https://google.com"}'

# 4. Get your URLs
curl http://localhost:3000/api/v1/url/ -b cookies.txt

# 5. Logout
curl -X POST http://localhost:3000/api/v1/auth/logout -b cookies.txt
```

---

## 📋 Environment Checklist

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `ACCESS_TOKEN_SECRET` - Random 64-char string
- [ ] `REFRESH_TOKEN_SECRET` - Different random 64-char string
- [ ] `APP_BASE_URL` - Your backend URL (e.g., http://localhost:3000)
- [ ] `CORS_ORIGIN` - Frontend URLs (comma-separated)
- [ ] `MAILTRAP_*` - Email service credentials

**Generate secrets:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🔑 All Routes at a Glance

| Method | Endpoint               | Auth | Description          |
| ------ | ---------------------- | ---- | -------------------- |
| POST   | `/url/shorten`         | ✅   | Shorten a URL        |
| GET    | `/url/:shortCode`      | ❌   | Redirect to original |
| GET    | `/url/`                | ✅   | List user's URLs     |
| GET    | `/url/analytics/:code` | ✅   | Get click count      |
| POST   | `/auth/signup`         | ❌   | Register user        |
| POST   | `/auth/signin`         | ❌   | Login                |
| GET    | `/user/profile`        | ✅   | Get profile          |
| GET    | `/health`              | ❌   | Health check         |

---

## 🔧 Useful Commands

```bash
# Development
npm run dev              # Start with hot reload

# Production
npm run build            # Compile TypeScript
npm start                # Run production build

# Database
npm run db:generate      # Create migrations
npm run db:push          # Apply to database
npm run db:migrate       # Run migrations
npm run db:studio        # Visual database editor
```

---

## 📚 Documentation Files

- `README.md` - Complete documentation
- `API_TESTING_GUIDE.md` - Detailed cURL examples
- `.env.sample` - Environment template

---

**Built with ❤️ for secure and fast URL shortening.**
