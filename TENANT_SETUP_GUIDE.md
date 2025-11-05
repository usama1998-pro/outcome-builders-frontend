# Tenant Setup Guide

## Understanding Multi-Tenancy

Your application uses a **multi-tenant architecture** where:
- Each company/organization is a **tenant**
- Users can belong to multiple tenants
- Data is isolated per tenant using separate database schemas
- API requests require both authentication (token) and tenant context (tenant ID)

---

## Required Headers for API Calls

All protected API endpoints require two headers:

```
Authorization: Bearer <your_jwt_token>
x-tenant: <tenant_id>
```

Without the `x-tenant` header, you'll get a **422 Unprocessable Entity** error.

---

## Quick Setup for Development

### 1. Add Tenant ID to `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_STATIC_TOKEN=your_token_here
NEXT_PUBLIC_STATIC_TENANT_ID=1
```

### 2. Get Your Tenant ID

**Option A: Use Default Tenant (Quickest)**
```env
NEXT_PUBLIC_STATIC_TENANT_ID=1
```
Most setups have a default tenant with ID `1`.

**Option B: Get Your User's Tenants**

After logging in, call the tenants endpoint:

```powershell
# Get your tenants list
$token = "your_jwt_token_here"
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/user/tenants" `
  -Method GET `
  -Headers @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
  }

Write-Host "Your tenants:"
$response.data | ForEach-Object {
  Write-Host "ID: $($_.id) - Company: $($_.company_name) - Role: $($_.role)"
}
```

**Option C: Check Your Database**

```sql
SELECT * FROM tenants;
```

---

## How the Frontend Stores Tenant ID

### Auth Store

The `useAuthStore` now includes tenant management:

```typescript
type AuthState = {
  token: string | null;
  tenantId: number | null;  // ← New!
  setTenantId: (tenantId: number) => void;  // ← New!
}
```

### Storage Locations

1. **localStorage**: Persists across page refreshes
   ```javascript
   localStorage.setItem("tenant_id", "1");
   ```

2. **Zustand Store**: In-memory state
   ```javascript
   useAuthStore.getState().tenantId
   ```

### Usage in Components

```typescript
import { useAuthStore } from "@/src/store/useAuth";

function MyComponent() {
  const { tenantId, setTenantId } = useAuthStore();
  
  // Set tenant when user selects it
  const handleTenantSelect = (id: number) => {
    setTenantId(id);
  };
  
  return <div>Current Tenant: {tenantId}</div>;
}
```

---

## Automatic Tenant Header Injection

The axios interceptor automatically adds the tenant header:

```typescript
// In axios.ts
api.interceptors.request.use((config) => {
  // Get tenant from env or auth store
  const staticTenantId = process.env.NEXT_PUBLIC_STATIC_TENANT_ID;
  const dynamicTenantId = useAuthStore.getState().tenantId;
  const tenantId = staticTenantId || dynamicTenantId;
  
  if (tenantId) {
    config.headers['x-tenant'] = String(tenantId);
  }
  
  return config;
});
```

---

## For Production

### Multi-Tenant User Flow

1. **User Signs In**
   - POST `/user/signin` → Get token
   - Store token in auth store

2. **Fetch User's Tenants**
   - GET `/user/tenants` → Get list of tenants user belongs to
   - Store in state

3. **User Selects Tenant**
   - User chooses which company/organization to work in
   - Call `setTenantId(selectedId)`
   - All subsequent API calls use this tenant

4. **Switch Tenant**
   - User can switch between tenants
   - Call `setTenantId(newId)` again
   - Data automatically switches to new tenant's schema

### Example: Tenant Selector Component

```typescript
import { useAuthStore } from "@/src/store/useAuth";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

function TenantSelector() {
  const { tenantId, setTenantId } = useAuthStore();
  
  // Fetch user's tenants
  const { data: tenants } = useQuery({
    queryKey: ["userTenants"],
    queryFn: async () => {
      const { data } = await api.get("/user/tenants");
      return data.data;
    },
  });
  
  return (
    <select 
      value={tenantId || ""} 
      onChange={(e) => setTenantId(Number(e.target.value))}
    >
      <option value="">Select Company</option>
      {tenants?.map((tenant) => (
        <option key={tenant.id} value={tenant.id}>
          {tenant.company_name} ({tenant.role})
        </option>
      ))}
    </select>
  );
}
```

---

## Backend: How Tenant Isolation Works

### 1. Tenant Header Validation

```python
# In permission.py
async def get_tenant_schema(
    x_tenant: int = Header(...),  # ← Required header
    session: AsyncSession = Depends(get_async_session)
) -> int | str:
    tenant = await get_tenant_by_id(session, x_tenant)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant
```

### 2. Schema Switching

```python
# In services
schema_name = tenant.schema_name  # e.g., "acme_corp"
Collection.with_schema(schema_name)
```

### 3. User Access Verification

```python
# Verify user has access to this tenant
result = await session.execute(
    select(UserRole)
    .where(UserRole.user_id == user_id)
    .where(UserRole.tenant_id == tenant_id)
)
```

---

## Troubleshooting

### Error: 422 "Field required" for x-tenant

**Problem:** Tenant header is missing

**Solutions:**

1. **For Development:**
   ```env
   # Add to .env.local
   NEXT_PUBLIC_STATIC_TENANT_ID=1
   ```

2. **For Production:**
   ```typescript
   // After login, set tenant
   const { setTenantId } = useAuthStore();
   setTenantId(1); // or user's selected tenant
   ```

3. **Verify it's being sent:**
   - Open DevTools → Network tab
   - Make an API request
   - Check Request Headers → Should see `x-tenant: 1`

### Error: 403 "You do not have access to this tenant"

**Problem:** User doesn't have a role in that tenant

**Solutions:**

1. Check user's tenants:
   ```
   GET /api/v1/user/tenants
   ```

2. Create user role:
   ```
   POST /api/v1/user/role/create
   {
     "user_email": "user@example.com",
     "tenant_id": 1,
     "role_name": "member"
   }
   ```

### Error: 404 "Tenant not found"

**Problem:** Tenant ID doesn't exist in database

**Solutions:**

1. Check tenants table:
   ```sql
   SELECT * FROM tenants;
   ```

2. Create tenant if needed (via backend admin)

---

## Complete Setup Example

### `.env.local` for Development

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Authentication Token
NEXT_PUBLIC_STATIC_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Tenant ID (use your default tenant)
NEXT_PUBLIC_STATIC_TENANT_ID=1
```

### Restart and Test

```powershell
# Restart dev server
npm run dev

# Test API call
# Open browser DevTools → Network
# Navigate to collections page
# Check request headers should include:
#   Authorization: Bearer <token>
#   x-tenant: 1
```

---

## Production Checklist

- [ ] Don't hardcode tenant ID in production
- [ ] Fetch user's tenants after login
- [ ] Let user select tenant
- [ ] Store selected tenant in auth store
- [ ] Provide UI to switch tenants
- [ ] Handle tenant switching gracefully
- [ ] Clear tenant on logout

---

## Summary

✅ **For Development:**
- Set `NEXT_PUBLIC_STATIC_TENANT_ID=1` in `.env.local`
- Quick and easy testing

✅ **For Production:**
- Fetch tenants from `/user/tenants`
- Let user select tenant
- Use `setTenantId()` to store selection
- Axios automatically includes header

✅ **Backend:**
- Requires `x-tenant` header
- Validates user has access
- Switches database schema per tenant

---

**Your collections API should now work! 🎉**

The 422 error was because the `x-tenant` header was missing. Now it's automatically added to all requests.

