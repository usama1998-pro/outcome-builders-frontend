# Quick Token Setup Guide

## ⚡ 3-Minute Setup

### Step 1: Create `.env.local` file

In your frontend root folder, create a file named `.env.local`:

**Windows (PowerShell):**
```powershell
cd E:\PycharmProjects\outcome-builder-frontend
New-Item -Path ".env.local" -ItemType File
notepad .env.local
```

### Step 2: Add these lines to `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_STATIC_TOKEN=your_token_here
NEXT_PUBLIC_STATIC_TENANT_ID=1
```

**Note:** The tenant ID is required for multi-tenant API endpoints. Use `1` for your default tenant or get it from your backend.

### Step 3: Get Your Token

**Option A: Use the PowerShell Script (Easiest)**
```powershell
.\get-token.ps1
```
Then copy the token it gives you.

**Option B: Use curl/Postman**

Make a POST request:
- URL: `http://localhost:8000/api/v1/user/signin`
- Body: 
```json
{
  "email": "usama@acme.com",
  "password": "your_password"
}
```
- Copy the token from response

**Option C: Manual PowerShell**
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/user/signin" -Method POST -ContentType "application/json" -Body '{"email": "usama@acme.com", "password": "your_password"}'
Write-Host $response.data.token
```

### Step 4: Update `.env.local`

Replace `your_token_here` with your actual token:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_STATIC_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJ1c2FtYUBhY21lLmNvbSIsImV4cCI6MTc2MjM3MTIzMH0.TwDBqaxRjjFgjshQn17qZ7L9wEZ-lzoRIVciDqwHmdA
NEXT_PUBLIC_STATIC_TENANT_ID=1
```

### Step 5: Restart Dev Server

```powershell
# Stop server (Ctrl+C), then restart:
npm run dev
```

### ✅ Done!

Now all your API requests will automatically use the token from `.env.local`.

---

## How It Works

The updated `axios.ts` will:
1. First check for `NEXT_PUBLIC_STATIC_TOKEN` (from .env.local)
2. If not found, use token from auth store (after login)
3. Add `x-tenant` header for multi-tenant API endpoints

```typescript
// Token
const staticToken = process.env.NEXT_PUBLIC_STATIC_TOKEN;
const dynamicToken = useAuthStore.getState().token;
const token = staticToken || dynamicToken;

// Tenant ID
const staticTenantId = process.env.NEXT_PUBLIC_STATIC_TENANT_ID;
const dynamicTenantId = useAuthStore.getState().tenantId;
const tenantId = staticTenantId || dynamicTenantId;
```

---

## When to Use Each Method

### Use Static Token (`.env.local`) When:
- ✅ Developing new features
- ✅ Testing API endpoints
- ✅ Don't want to login every time
- ✅ Debugging backend issues

### Use Auth Store Token When:
- ✅ Testing login flow
- ✅ Production deployment
- ✅ Testing user authentication
- ✅ Final testing before release

---

## Troubleshooting

**Problem: Token not working**
```powershell
# Check if .env.local exists
Test-Path .env.local

# View the content
Get-Content .env.local

# Restart dev server completely
```

**Problem: 401 Unauthorized**
- Token might be expired, get a new one
- Check backend is running on port 8000
- Verify email/password are correct

**Problem: Environment variable not loading**
- Restart dev server completely
- Clear Next.js cache: `Remove-Item -Recurse .next`
- Check file is named `.env.local` (not `.env.local.txt`)

---

## Quick Reference

```powershell
# Create .env.local
New-Item .env.local

# Edit .env.local  
notepad .env.local

# Get token (interactive)
.\get-token.ps1

# Restart dev server
npm run dev

# Check backend is running
Invoke-WebRequest http://localhost:8000/docs
```

---

**That's it! You're ready to go! 🚀**

Your axios interceptor will now automatically use the token from `.env.local` for all API requests.

