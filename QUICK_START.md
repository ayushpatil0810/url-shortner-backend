# 🚀 Quick Start Guide

> Get your authentication backend running in 5 minutes!

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
# Sign up
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","email":"demo@test.com","password":"Demo1234"}'

# Sign in (save cookies)
curl -X POST http://localhost:3000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"demo@test.com","password":"Demo1234"}'

# Get profile
curl http://localhost:3000/api/v1/user/profile -b cookies.txt

# Logout
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

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | ❌ | Register user |
| GET | `/auth/verify-email` | ❌ | Verify email |
| POST | `/auth/signin` | ❌ | Login |
| POST | `/auth/refresh-token` | ❌ | Refresh token |
| POST | `/auth/forgot-password` | ❌ | Request reset |
| POST | `/auth/reset-password` | ❌ | Reset password |
| POST | `/auth/logout` | ✅ | Logout |
| GET | `/user/profile` | ✅ | Get profile |
| PATCH | `/user/profile` | ✅ | Update profile |
| POST | `/user/change-password` | ✅ | Change password |
| GET | `/health` | ❌ | Health check |

---

## 🛡️ Security Quick Reference

✅ **Tokens:** 15min access, 7d refresh  
✅ **Cookies:** HTTP-only, Secure (prod), SameSite  
✅ **Password:** bcrypt, 10 rounds, min 8 chars  
✅ **Rate Limits:** 5/15min (auth), 3/hour (password reset)  
✅ **Headers:** Helmet enabled  
✅ **Validation:** Zod schemas  

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

## 📁 Key Files to Customize

```
src/
├── config/env.ts              # Add your env variables
├── models/user.model.ts       # Modify user schema
├── validations/                # Update validation rules
├── middlewares/rateLimiter.ts # Adjust rate limits
└── utils/mail.ts              # Customize email templates
```

---

## 🐛 Troubleshooting

**Server won't start?**
- Check `.env` file exists
- Verify DATABASE_URL is correct
- Ensure all required env vars are set

**Database errors?**
```bash
npm run db:push  # Reset schema
```

**Email not sending?**
- Check MAILTRAP credentials
- Verify APP_BASE_URL is correct
- Check logs in `logs/` folder

**Build failing?**
```bash
rm -rf node_modules dist
npm install
npm run build
```

---

## 📚 Documentation Files

- `README.md` - Complete documentation (you are here!)
- `API_TESTING_GUIDE.md` - Detailed cURL examples
- `IMPLEMENTATION_SUMMARY.md` - What's implemented
- `.env.sample` - Environment template

---

## 🎓 First Time Setup Tutorial

### 1. Get PostgreSQL Database

**Option A: Local PostgreSQL**
```bash
createdb auth_db
# Set DATABASE_URL=postgresql://user:pass@localhost:5432/auth_db
```

**Option B: Neon (Free)**
1. Sign up at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string to `.env`

### 2. Get Email Service

**For Development: Mailtrap**
1. Sign up at [mailtrap.io](https://mailtrap.io)
2. Get SMTP credentials
3. Add to `.env`

**For Production:** Use SendGrid, AWS SES, or Mailgun

### 3. Generate Secrets

```bash
# Generate 2 different secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy these as `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`

### 4. Run & Test

```bash
npm run dev

# In another terminal:
curl http://localhost:3000/api/v1/health
```

You should see:
```json
{
  "success": true,
  "message": "Server is healthy",
  "data": {...}
}
```

---

## 🚀 Deploy to Production

### Railway (Recommended)

1. Connect GitHub repo
2. Add environment variables in dashboard
3. Deploy! ✨

### Vercel

```bash
npm i -g vercel
vercel --prod
```

### Docker

```bash
docker build -t auth-backend .
docker run -p 3000:3000 --env-file .env auth-backend
```

---

## 💡 Pro Tips

1. **Use different databases** for dev/staging/prod
2. **Rotate secrets** regularly in production
3. **Monitor logs** in `logs/` directory
4. **Enable 2FA** in future versions
5. **Add Redis** for session storage (scalability)
6. **Implement webhooks** for user events
7. **Add admin panel** for user management

---

## 🎉 You're Ready!

This template gives you:
- ✅ Complete authentication system
- ✅ Production-ready security
- ✅ Scalable architecture
- ✅ Professional documentation

**Focus on building your product, not reinventing auth!**

---

**Need Help?** Check the full README.md or open an issue on GitHub.

**Happy Building! 🚀**
