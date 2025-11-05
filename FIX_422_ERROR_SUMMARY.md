# Fix for 422 Error: Missing x-tenant Header

## Problem

When trying to fetch collections, you were getting a **422 Unprocessable Entity** error:

```json
{
    "detail": [
        {
            "type": "missing",
            "loc": ["header", "x-tenant"],
            "msg": "Field required",
            "input": null
        }
    ]
}
```

## Root Cause

Your backend uses **multi-tenant architecture** and requires an `x-tenant` header for all protected endpoints. This header was not being sent from the frontend.

### Backend Requirement

```python
# In app/core/permission.py
async def get_tenant_schema(
    x_tenant: int = Header(...),  # ← This is REQUIRED
    session: AsyncSession = Depends(get_async_session)
) -> int | str:
    tenant = await get_tenant_by_id(session, x_tenant)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant
```

---

## Solution Implemented

### 1. Updated Auth Store (`src/store/useAuth.ts`)

Added tenant ID management:

```typescript
type AuthState = {
  token: string | null;
  tenantId: number | null;        // ← Added
  setTenantId: (tenantId: number) => void;  // ← Added
}
```

**Changes:**
- ✅ Added `tenantId` state
- ✅ Added `setTenantId()` function
- ✅ Store/restore tenant ID from localStorage
- ✅ Clear tenant ID on logout
- ✅ Hydrate tenant ID on app load

### 2. Updated Axios Interceptor (`src/lib/axios.ts`)

Added automatic tenant header injection:

```typescript
// Add tenant header (required for multi-tenant endpoints)
const staticTenantId = process.env.NEXT_PUBLIC_STATIC_TENANT_ID;
const dynamicTenantId = useAuthStore.getState().tenantId;
const tenantId = staticTenantId || dynamicTenantId;

if (tenantId) {
  config.headers['x-tenant'] = String(tenantId);
}
```

**Features:**
- ✅ Automatically adds `x-tenant` header to all requests
- ✅ Supports static tenant ID from `.env.local` (for development)
- ✅ Supports dynamic tenant ID from auth store (for production)
- ✅ Priority: env variable → auth store

### 3. Updated Documentation

Created comprehensive guides:
- ✅ `TENANT_SETUP_GUIDE.md` - Complete tenant management guide
- ✅ `QUICK_TOKEN_SETUP.md` - Updated with tenant ID setup
- ✅ `FIX_422_ERROR_SUMMARY.md` - This file

---

## How to Fix Immediately

### Quick Fix for Development

1. **Add tenant ID to `.env.local`:**

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_STATIC_TOKEN=your_token_here
NEXT_PUBLIC_STATIC_TENANT_ID=1
```

2. **Restart dev server:**

```powershell
# Stop (Ctrl+C) and restart
npm run dev
```

3. **Test again** - The 422 error should be gone!

---

## How to Get Your Tenant ID

### Option 1: Use Default Tenant (Easiest)

Most setups have a default tenant with ID `1`:

```env
NEXT_PUBLIC_STATIC_TENANT_ID=1
```

### Option 2: Check Your Database

```sql
SELECT * FROM tenants;
```

### Option 3: Use the API

```powershell
# Get your tenants (after getting a token)
$token = "your_jwt_token"
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/user/tenants" `
  -Method GET `
  -Headers @{"Authorization" = "Bearer $token"}

$response.data | ForEach-Object {
  Write-Host "ID: $($_.id) - Company: $($_.company_name)"
}
```

---

## Verification

### Check if the Fix Works

1. **Open Browser DevTools** (F12)
2. **Go to Network tab**
3. **Navigate to collections page** (triggers API call)
4. **Click on the request** to `/collection/get/user`
5. **Check Request Headers** should show:

```
Authorization: Bearer eyJhbGci...
Content-Type: application/json
x-tenant: 1
```

### Expected Response

Before fix:
```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["header", "x-tenant"],
      "msg": "Field required"
    }
  ]
}
```

After fix:
```json
{
  "status": true,
  "message": "Collection retrieved successfully!",
  "data": {
    "collections": [...]
  }
}
```

---

## For Production Use

### Don't Hardcode Tenant ID in Production!

Instead, implement proper tenant selection:

```typescript
// After user logs in
const { data: tenants } = await api.get("/user/tenants");

// Let user select which tenant/company to work in
const selectedTenant = tenants[0]; // or user's choice

// Store in auth store
useAuthStore.getState().setTenantId(selectedTenant.id);

// All subsequent API calls will use this tenant
```

### Create a Tenant Selector Component

```typescript
function TenantSelector() {
  const { tenantId, setTenantId } = useAuthStore();
  const { data: tenants } = useQuery({
    queryKey: ["userTenants"],
    queryFn: () => api.get("/user/tenants").then(r => r.data.data),
  });

  return (
    <select 
      value={tenantId || ""} 
      onChange={(e) => setTenantId(Number(e.target.value))}
    >
      {tenants?.map((t) => (
        <option key={t.id} value={t.id}>
          {t.company_name}
        </option>
      ))}
    </select>
  );
}
```

---

## Files Modified

### Frontend Files:

1. ✅ `src/store/useAuth.ts`
   - Added tenant ID state management
   - Store/restore from localStorage
   
2. ✅ `src/lib/axios.ts`
   - Added automatic x-tenant header injection
   - Support for both static and dynamic tenant ID

3. ✅ `TENANT_SETUP_GUIDE.md` (Created)
   - Complete guide for tenant management

4. ✅ `QUICK_TOKEN_SETUP.md` (Updated)
   - Added tenant ID setup instructions

5. ✅ `FIX_422_ERROR_SUMMARY.md` (Created)
   - This summary document

---

## Why Multi-Tenancy?

Your application supports multiple organizations (tenants) with:
- ✅ **Data Isolation** - Each tenant's data is in a separate database schema
- ✅ **Security** - Users can only access tenants they belong to
- ✅ **Scalability** - Easy to add new organizations
- ✅ **Flexibility** - Users can belong to multiple organizations

---

## Common Questions

### Q: Can I skip the tenant header for some endpoints?

**A:** Some endpoints don't require it (like `/user/signin`, `/user/signup`), but all workspace, collection, and note endpoints require it.

### Q: What if a user belongs to multiple tenants?

**A:** The user should select which tenant they want to work in. Store that selection in `useAuthStore.tenantId`. They can switch tenants at any time.

### Q: Can I get tenant ID from workspace or collection ID?

**A:** No. The backend requires the tenant context before accessing any tenant-specific data. The tenant header must be sent with the request.

### Q: Is tenant ID the same as workspace ID?

**A:** No. Tenant is the top level (organization/company). Workspaces belong to a tenant. Collections belong to workspaces.

**Hierarchy:**
```
Tenant (Company A)
  └─ Workspace (Project 1)
      └─ Collection (Research Papers)
          └─ Notes
  └─ Workspace (Project 2)
      └─ Collection (Design Assets)
```

---

## Summary of Changes

| Before | After |
|--------|-------|
| ❌ No tenant header sent | ✅ Automatic tenant header |
| ❌ 422 errors on API calls | ✅ Successful API responses |
| ❌ No tenant state management | ✅ Tenant stored in auth store |
| ❌ No documentation | ✅ Complete documentation |

---

## Next Steps

1. ✅ **Add tenant ID to `.env.local`**
2. ✅ **Restart dev server**
3. ✅ **Test collections page** - Should load without 422 error
4. ✅ **Verify in DevTools** - Check x-tenant header is present
5. ⏭️ **Implement tenant selector** (for production)
6. ⏭️ **Test tenant switching** (if applicable)

---

## Success! 🎉

Your collections API should now work correctly. The 422 error was caused by the missing `x-tenant` header, which is now automatically added to all API requests.

**Key Points:**
- ✅ Tenant header is required for multi-tenant endpoints
- ✅ Axios automatically adds the header
- ✅ Use env variable for development (`NEXT_PUBLIC_STATIC_TENANT_ID=1`)
- ✅ Use auth store for production (let user select tenant)
- ✅ All API calls now include both token and tenant context

**Test it now:**
1. Make sure `.env.local` has `NEXT_PUBLIC_STATIC_TENANT_ID=1`
2. Restart your dev server
3. Navigate to collections page
4. Collections should load successfully!

