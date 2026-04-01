# 🧪 API Testing Guide

Quick reference for testing all endpoints with cURL or your favorite API client.

## Base URL
```
http://localhost:3000/api/v1
```

## 1. Health Check

### Check Server Health
```bash
curl http://localhost:3000/api/v1/health
```

---

## 2. Authentication Flow

### Sign Up
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### Sign In (save cookies)
```bash
curl -X POST http://localhost:3000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

---

## 3. URL Shortener (Authenticated)

### Shorten a URL
```bash
curl -X POST http://localhost:3000/api/v1/url/shorten \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "originalUrl": "https://www.google.com"
  }'
```

### Shorten a URL with Custom Code
```bash
curl -X POST http://localhost:3000/api/v1/url/shorten \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "originalUrl": "https://www.github.com",
    "shortCode": "my-git"
  }'
```

### List Your URLs
```bash
curl http://localhost:3000/api/v1/url/ \
  -b cookies.txt
```

### Get URL Analytics
```bash
curl http://localhost:3000/api/v1/url/analytics/my-git \
  -b cookies.txt
```

### Update a URL
```bash
curl -X PATCH http://localhost:3000/api/v1/url/1 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "originalUrl": "https://www.microsoft.com"
  }'
```

### Delete a URL
```bash
curl -X DELETE http://localhost:3000/api/v1/url/1 \
  -b cookies.txt
```

---

## 4. Redirection (Public)

### Redirect to Original URL
```bash
# This will return a 302 redirect
curl -i http://localhost:3000/api/v1/url/my-git
```

---

## 5. User Profile Management

### Get Profile
```bash
curl http://localhost:3000/api/v1/user/profile \
  -b cookies.txt
```

### Update Profile
```bash
curl -X PATCH http://localhost:3000/api/v1/user/profile \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "username": "johndoe_updated"
  }'
```

---

## 6. Logout

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -b cookies.txt \
  -c cookies.txt
```

---

## 🔍 Testing Rate Limits

### Test API Rate Limit (100 requests/15min)
```bash
for i in {1..101}; do
  echo "Request $i:"
  curl http://localhost:3000/api/v1/url/ -b cookies.txt
  echo "\n---"
done
```

---

## 🛠️ Common Error Responses

- **400 Bad Request:** Invalid URL or missing fields
- **401 Unauthorized:** Missing or invalid session cookie
- **404 Not Found:** Short code doesn't exist
- **409 Conflict:** Custom short code already taken
- **429 Too Many Requests:** Rate limit exceeded

---

Happy Testing! 🚀
