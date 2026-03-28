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

**Expected Response:**
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

**Expected Response:**
```json
{
  "success": true,
  "message": "Account created. Please check your email to verify your account before signing in.",
  "data": {
    "userId": 1
  }
}
```

### Verify Email
```bash
# Get token from email, then:
curl http://localhost:3000/api/v1/auth/verify-email?token=YOUR_TOKEN_HERE
```

### Sign In
```bash
curl -X POST http://localhost:3000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "userId": 1,
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

> Note: Tokens are also set as HTTP-only cookies

### Refresh Token
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh-token \
  -b cookies.txt \
  -c cookies.txt
```

---

## 3. Password Management

### Forgot Password
```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

### Reset Password
```bash
# Get token from email, then:
curl -X POST "http://localhost:3000/api/v1/auth/reset-password?token=YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "NewSecurePass123"
  }'
```

### Change Password (Authenticated)
```bash
curl -X POST http://localhost:3000/api/v1/user/change-password \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "currentPassword": "SecurePass123",
    "newPassword": "NewSecurePass456"
  }'
```

---

## 4. User Profile Management

### Get Profile
```bash
curl http://localhost:3000/api/v1/user/profile \
  -b cookies.txt
```

**Expected Response:**
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

### Update Profile
```bash
curl -X PATCH http://localhost:3000/api/v1/user/profile \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "username": "johndoe_updated",
    "email": "newemail@example.com"
  }'
```

---

## 5. Logout

### Logout
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -b cookies.txt \
  -c cookies.txt
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User logged out successfully",
  "data": null
}
```

---

## 📝 Testing with Authorization Header

If you prefer Bearer tokens over cookies:

```bash
# Get the access token from signin response, then:
curl http://localhost:3000/api/v1/user/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

---

## 🧪 Postman Collection

Import this into Postman:

```json
{
  "info": {
    "name": "Auth Backend API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api/v1"
    }
  ]
}
```

---

## 🔍 Testing Rate Limits

### Test Auth Rate Limit (5 requests/15min)
```bash
for i in {1..6}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/v1/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrong"}'
  echo "\n---"
done
```

On 6th request, you should get:
```json
{
  "message": "Too many authentication attempts, please try again later."
}
```

### Test Password Reset Rate Limit (3 requests/hour)
```bash
for i in {1..4}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com"}'
  echo "\n---"
done
```

---

## 🛠️ Common Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid request data",
  "errors": {
    "email": ["Invalid email"]
  }
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Please verify your email before signing in. Check your inbox for the verification link."
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "User already exists"
}
```

### 429 Too Many Requests
```json
{
  "message": "Too many authentication attempts, please try again later."
}
```

### 503 Service Unavailable
```json
{
  "success": false,
  "message": "Service unhealthy",
  "errors": {
    "status": "unhealthy",
    "database": "disconnected"
  }
}
```

---

## 🎯 Testing Checklist

- [ ] Sign up new user
- [ ] Verify email works
- [ ] Sign in returns tokens
- [ ] Access protected route with token
- [ ] Refresh token works
- [ ] Logout clears tokens
- [ ] Forgot password sends email
- [ ] Reset password works
- [ ] Change password (authenticated)
- [ ] Get profile works
- [ ] Update profile works
- [ ] Rate limits trigger correctly
- [ ] Health check returns DB status
- [ ] Invalid credentials rejected
- [ ] Unverified email cannot login

---

## 📦 Save Cookies in Files

For testing flows that require multiple requests:

```bash
# Login and save cookies
curl -X POST http://localhost:3000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email": "john@example.com", "password": "SecurePass123"}'

# Use saved cookies
curl http://localhost:3000/api/v1/user/profile -b cookies.txt

# Logout (clears cookies)
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -b cookies.txt \
  -c cookies.txt
```

---

Happy Testing! 🚀
