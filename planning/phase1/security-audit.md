# AIPrintly Security Audit Report

**Date**: 2026-01-21
**Status**: Audit complete, remediation priorities identified

---

## Severity Summary

| Severity | Count | Status |
|----------|-------|--------|
| **CRITICAL** | 3 | 🟡 Documented for production |
| **HIGH** | 6 | 🟢 2 fixed, 4 documented for production |
| **MEDIUM** | 6 | 🟢 Acceptable for MVP |
| **LOW** | 5 | 🟢 Nice to have |

---

## Critical Issues (Production Blockers)

### 1. In-Memory Rate Limiter (Not Distributed)
**File**: `app/services/rate-limiter.server.ts`
- Rate limiting stored in `Map<string, RateLimitEntry>()`
- Won't work in multi-instance deployments
- **Fix for production**: Migrate to Redis

### 2. X-Forwarded-For Header Spoofing
**File**: `app/services/rate-limiter.server.ts:117-133`
- Client IP extracted without validation
- Can be spoofed to bypass rate limits
- **Fix for production**: Only trust headers from load balancer

### 3. Metadata Exposure in Stripe
**File**: `app/services/stripe.server.ts:129`
- Shipping address in plaintext in Stripe metadata
- **Fix for production**: Store address in database, reference by ID in Stripe

---

## High Severity Issues

### 4. CSRF Protection Limited - FIXED
**File**: `app/services/session.server.ts`
- ~~Uses `sameSite: 'lax'` which allows some CSRF~~
- **Fixed**: Upgraded to `sameSite: 'strict'`

### 5. Blurb Webhook - Bearer Token Only
**File**: `app/routes/api.webhooks.blurb.ts`
- No HMAC signature verification unlike Stripe
- **Fix**: Add HMAC verification or IP allowlisting

### 6. File Upload MIME Type Client-Trusted
**File**: `app/routes/api.assets.upload.ts:136-145`
- MIME type from `file.type` can be spoofed
- Sharp validates actual content, so risk is mitigated

### 7. No Registration Rate Limiting - FIXED
**Files**: `app/routes/register.tsx`, `app/routes/login.tsx`
- ~~Can spam registrations and login attempts~~
- **Fixed**: Added `checkAuthRateLimit()` - 5 attempts per 15 minutes per IP

### 8. No Audit Logging
- No logging for failed logins, webhook failures, refunds
- **Fix**: Add structured logging for security events

### 9. Order Access Timing
**File**: `app/routes/api.orders.$id.ts`
- Tracking token comparison could leak timing info
- Low risk with random tokens

---

## Positive Findings

- ✅ Bcrypt password hashing (cost 12)
- ✅ Zod schema validation on all inputs
- ✅ Prisma ORM (no SQL injection)
- ✅ Session tokens use nanoid(32)
- ✅ Stripe webhook signature verified correctly
- ✅ Cookie flags correct (httpOnly, sameSite)
- ✅ Image processing strips EXIF metadata
- ✅ No dangerouslySetInnerHTML usage
- ✅ Environment variables validated at startup

---

## MVP vs Production

### Acceptable for MVP
- In-memory rate limiting (single instance)
- Current CSRF protection (lax)
- No audit logging

### Required for Production
1. Redis-based rate limiting
2. Proper X-Forwarded-For handling
3. Encrypted shipping address storage
4. Audit logging for security events
5. CSRF token validation

---

## Recommendations Priority

| Priority | Issue | Effort | Status |
|----------|-------|--------|--------|
| P1 (Prod) | Redis rate limiting | Medium | Pending |
| P1 (Prod) | Audit logging | Medium | Pending |
| ~~P2 (Prod)~~ | ~~CSRF tokens~~ | ~~Low~~ | ✅ Fixed (sameSite strict) |
| ~~P2 (Prod)~~ | ~~Registration rate limit~~ | ~~Low~~ | ✅ Fixed |
| P3 | Blurb HMAC verification | Low | Pending |
| P3 | CSP headers | Low | Pending |

---

*Full detailed audit available in conversation history*
