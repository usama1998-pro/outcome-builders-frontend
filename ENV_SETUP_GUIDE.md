# Environment Variables Setup Guide

## Overview

The application now supports using a **static token from environment variables** for development/testing, or using the **dynamic token from the auth store** for production.

---

## Setup Instructions

### 1. Create `.env.local` file

In your frontend root directory (`E:\PycharmProjects\outcome-builder-frontend`), create a file named `.env.local`:

```bash
# Create the file (Windows PowerShell)
New-Item -Path ".env.local" -ItemType File

# Or using Command Prompt
type nul > .env.local
```

### 2. Add Environment Variables

Open `.env.local` and add the following:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Static Token for Development/Testing (Optional)
NEXT_PUBLIC_STATIC_TOKEN=your_jwt_token_here
```

### 3. Get Your JWT Token

You need to get a valid JWT token from your backend. Here are three ways:

#### Option A: Using Backend Login Endpoint

```bash
# Using curl (PowerShell)
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/user/signin" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email": "usama@acme.com", "password": "your_password"}'

# The token will be in $response.data.token
Write-Host $response.data.token
```

#### Option B: Using Postman/Thunder Client

1. Make a POST request to `http://localhost:8000/api/v1/user/signin`
2. Body (JSON):
```json
{
  "email": "usama@acme.com",
  "password": "your_password"
}
```
3. Copy the token from the response

#### Option C: From Browser Console

1. Login to your app normally through the UI
2. Open browser DevTools (F12)
3. Go to Console tab
4. Type: `localStorage` or check your Zustand store
5. Find and copy the token

### 4. Complete `.env.local` Example

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Your actual JWT token
NEXT_PUBLIC_STATIC_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJ1c2FtYUBhY21lLmNvbSIsImV4cCI6MTc2MjM3MTIzMH0.TwDBqaxRjjFgjshQn17qZ7L9wEZ-lzoRIVciDqwHmdA
```

### 5. Restart Your Development Server

After adding the environment variables, restart your Next.js dev server:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

---

## How It Works

The `axios.ts` interceptor now uses this priority:

```typescript
const staticToken = process.env.NEXT_PUBLIC_STATIC_TOKEN;
const dynamicToken = useAuthStore.getState().token;

const token = staticToken || dynamicToken;
```

**Priority:**
1. **Static Token** (from `.env.local`) - Used first if available
2. **Dynamic Token** (from auth store) - Used if no static token

---

## Use Cases

### For Development/Testing
✅ **Use Static Token**
- Set `NEXT_PUBLIC_STATIC_TOKEN` in `.env.local`
- Skip login process during development
- Faster testing of features
- Good for debugging

### For Production
✅ **Use Dynamic Token**
- Don't set `NEXT_PUBLIC_STATIC_TOKEN` (or leave it empty)
- Users login normally through UI
- Token stored in auth store
- Proper authentication flow

### For Hybrid Development
✅ **Use Both**
- Set static token for quick testing
- Can still test login flow by clearing the env var
- Flexible development workflow

---

## Important Notes

### ⚠️ Security Warning

**DO NOT commit `.env.local` to git!**

The `.env.local` file is automatically gitignored by Next.js. This file should:
- ❌ Never be committed to version control
- ❌ Never be shared publicly
- ❌ Never contain production tokens
- ✅ Only be used for local development

### Token Expiration

JWT tokens typically expire after a certain time. If you get authentication errors:

1. Check if your token expired
2. Get a new token using the methods above
3. Update `NEXT_PUBLIC_STATIC_TOKEN` in `.env.local`
4. Restart your dev server

### Environment Variable Naming

In Next.js, environment variables must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.

- ✅ `NEXT_PUBLIC_STATIC_TOKEN` - Accessible in browser
- ❌ `STATIC_TOKEN` - NOT accessible in browser

---

## Verification

To verify your setup is working:

### 1. Check if the token is loaded:

Add this temporarily to any page:

```typescript
console.log('Static Token:', process.env.NEXT_PUBLIC_STATIC_TOKEN);
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
```

### 2. Check network requests:

1. Open Browser DevTools (F12)
2. Go to Network tab
3. Make an API request (e.g., fetch collections)
4. Click on the request
5. Check Headers → Authorization should show: `Bearer YOUR_TOKEN`

### 3. Test API call:

Navigate to a page that makes API calls (like collections page) and check:
- ✅ No authentication errors
- ✅ Data loads successfully
- ✅ No 401 Unauthorized errors

---

## Troubleshooting

### Issue: "Token not found" or 401 errors

**Solution:**
1. Verify `.env.local` exists in frontend root
2. Check the token format (should be a long string starting with `eyJ`)
3. Verify the token hasn't expired
4. Restart the dev server

### Issue: Environment variable not loading

**Solution:**
1. Ensure file is named `.env.local` (not `.env.local.txt`)
2. Restart the dev server completely
3. Clear Next.js cache: `rm -rf .next`
4. Verify the variable name has `NEXT_PUBLIC_` prefix

### Issue: Token still not working

**Solution:**
1. Check your backend is running
2. Verify the `NEXT_PUBLIC_API_URL` is correct
3. Test the backend endpoint directly with curl/Postman
4. Check backend logs for errors

---

## Example `.env.local` File Structure

```env
# ===========================================
# Outcome Builder Frontend - Local Config
# ===========================================

# Backend API Base URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Static JWT Token (for development only)
# Get this from: POST /api/v1/user/signin
# Format: eyJhbGciOi...
NEXT_PUBLIC_STATIC_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJ1c2FtYUBhY21lLmNvbSIsImV4cCI6MTc2MjM3MTIzMH0.TwDBqaxRjjFgjshQn17qZ7L9wEZ-lzoRIVciDqwHmdA

# ===========================================
# Notes:
# - This file is gitignored (safe for tokens)
# - Restart dev server after changes
# - Token expires based on backend config
# ===========================================
```

---

## Recommended Development Workflow

### For Daily Development:

1. **One-time Setup:**
   ```bash
   # Get a long-lived token (if backend supports it)
   # Set in .env.local
   # Good for days/weeks of development
   ```

2. **Quick Testing:**
   ```bash
   # Use static token
   # No need to login each time
   # Fast iteration
   ```

3. **Login Flow Testing:**
   ```bash
   # Comment out NEXT_PUBLIC_STATIC_TOKEN
   # Test actual login
   # Then uncomment for regular dev
   ```

### For Production Deployment:

1. **DO NOT** set `NEXT_PUBLIC_STATIC_TOKEN` in production
2. Let users login through UI
3. Token managed by auth store
4. Proper security

---

## Quick Commands Reference

```bash
# Create .env.local
New-Item -Path ".env.local" -ItemType File

# Edit .env.local
notepad .env.local

# Restart Next.js dev server
npm run dev

# Clear Next.js cache
Remove-Item -Recurse -Force .next

# View environment variables (in browser console)
console.log(process.env)
```

---

## Summary

✅ **What we did:**
- Updated `axios.ts` to support both static and dynamic tokens
- Static token takes priority (for easy development)
- Falls back to auth store token (for production)

✅ **What you need to do:**
1. Create `.env.local` file
2. Add `NEXT_PUBLIC_STATIC_TOKEN=your_token`
3. Get token from backend login
4. Restart dev server
5. Start developing!

✅ **Benefits:**
- Skip login during development
- Faster testing
- Still works in production
- Flexible workflow

---

**Happy Coding! 🚀**

