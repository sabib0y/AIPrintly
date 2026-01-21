# AIPrintly Accessibility Audit Report

**Date**: 2026-01-21
**Status**: Issues identified, remediation in progress

---

## Severity Summary

| Severity | Count | Status |
|----------|-------|--------|
| **CRITICAL** | 2 | 🟡 1 fixed, 1 remaining (canvas keyboard nav) |
| **HIGH** | 6 | 🟢 4 fixed, 2 remaining |
| **MEDIUM** | 10 | 🟡 Later |
| **LOW** | 5 | 🟢 Nice to have |

---

## Critical Issues

### 1. Modal Focus Trap Management
**File**: `app/components/ui/alert-dialog.tsx`, `app/routes/build.$productType.tsx:677`
- No explicit focus restoration verification
- Missing `aria-labelledby` on dialog content

### 2. Canvas Keyboard Navigation
**File**: `app/components/builder/Canvas.tsx`
- Design elements cannot be reached via Tab key
- Keyboard shortcuts not discoverable (no `aria-keyshortcuts`)
- No keyboard alternative to drag/pinch gestures

---

## High Priority Issues

### 3. Form Error Announcements Missing `role="alert"`
**Files**:
- `app/routes/login.tsx:133` - form error div
- `app/routes/register.tsx:139` - form error div
- Field-level errors in login/register pages

### 4. Heading Hierarchy Broken in Builder
**File**: `app/routes/build.$productType.tsx`
- Line 530: `<h3>` should be `<h2>`
- Line 653: `<h4>` should be `<h2>`

### 5. Product Image Alt Text Minimal
**Files**: Cart items, product cards
- Alt text like "Mug" should include variant info

### 6. Skip to Main Content Link Missing
**File**: `app/components/layout/Header.tsx`
- No skip link for keyboard users

---

## Medium Priority Issues

1. Mobile menu keyboard trap not fully managed
2. Checkbox terms missing `aria-describedby`
3. Dark mode focus ring offset colour
4. Transform Controls only accessible via mouse
5. Dialog title not connected with `aria-labelledby`

---

## Positive Findings

- Button and Input components have proper focus rings
- Shipping form has excellent accessibility (role="alert" on errors)
- QuantityControl component is model accessibility
- Navigation uses semantic `<nav>` elements
- Layout uses proper `<main>` element
- ARIA labels on most icon-only buttons

---

## Remediation Plan

### Phase 1 (This Session) - COMPLETE
1. ✅ Add `role="alert"` to form errors (login.tsx, register.tsx)
2. ✅ Fix heading hierarchy in builder (h3/h4 → h2)
3. ✅ Add skip link to header (Header.tsx) + main-content id (Layout.tsx)
4. ✅ Add `aria-labelledby` to alert dialogs (build.$productType.tsx)

### Phase 2 (Future)
5. Canvas keyboard navigation improvements (CRITICAL - still outstanding)
6. Enhanced alt text for product images
7. Mobile menu aria-hidden handling

---

*Full detailed audit available in conversation history*
