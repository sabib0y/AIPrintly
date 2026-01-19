# Storage Policy – AI-Generated Merchandise Platform

## Purpose

To minimise long-term storage costs while preserving a seamless user experience, this document defines clear retention rules, deletion workflows, and optimisation strategies for handling:

- Uploaded photos
- AI-generated images
- Generated story content
- Product mockups (mugs, books, prints, etc.)

The platform deals with high-resolution media assets, so managing storage cost and data hygiene is critical to long-term scalability.

---

## MVP Storage Principles

| Goal                            | Rule                                                                 |
|---------------------------------|----------------------------------------------------------------------|
| Minimise unused assets          | Store only what users save, download, or order                      |
| Defer costs for cold assets     | Move older files to cheaper long-term storage (e.g. S3 IA/Glacier)  |
| Be transparent with users       | Show expiry timers or alerts for deletions                          |
| Balance speed with cost         | Use CDN caching or session-based delivery for in-session assets     |
| Respect privacy expectations    | Auto-delete personal uploads after session timeout or 30 days max   |

---

## Retention Rules by Asset Type

### 1. AI-Generated Images (not ordered)
- Stored temporarily (max 7 days unless favourited)
- Auto-deleted after 7 days if:
  - Not added to cart
  - Not manually saved
  - Not linked to an order
- Users shown warning ("This image will auto-expire in X days")

### 2. AI-Generated Stories / Story PDFs
- Save only the final version (not every regeneration attempt)
- Archive final story PDFs to cold storage after 30 days (if ordered)
- Delete unpurchased/generated stories after 14 days

### 3. Mockups / Product Previews
- Generate dynamically in-session (don't persist unless ordered)
- Save one final mockup per product on successful order
- Archive or compress older mockups monthly

### 4. User Uploads (Photos, Artwork)
- Store for 24 hours if unauthenticated
- Store for 30 days if user is logged in and asset isn't linked to an order
- Clearly disclose retention time and auto-deletion in upload UI
- Give user ability to delete at any time

---

## Cold Storage Policy

- Assets tied to completed orders (e.g. print-ready PDFs, final images) moved to **cold storage after 30 days**
- Retrieval is possible (e.g. for reorders or refunds)
- Use S3 IA or equivalent "infrequent access" class to reduce costs

---

## Technical Implementation Suggestions

| Platform | Action                                      |
|----------|---------------------------------------------|
| Firebase | Use Cloud Functions + Storage triggers for timed deletes |
| S3       | Apply object lifecycle rules + Glacier archiving |
| Supabase | Leverage RLS and cron job purge logic        |
| CDN      | Set short TTLs for previews not marked "saved" |

---

## UX Guidelines

- Show expiry timers clearly in user dashboard: "Expires in 6 days"
- Send reminder emails: "Download your art before it disappears!"
- Allow export/download of:
  - Generated stories
  - AI artwork
  - Order-ready mockups

---

## Optional Enhancements (Phase 2+)

- Storage quota per user (tiered by plan)
- Let users "extend storage" for assets by +30 days (freemium upsell)
- Preview-only CDN for unlogged-in guests (nothing persisted)
- On-demand re-generation from prompt + seed (instead of file retention)

---

## Risk Management

- Add warning modals before permanent deletion
- Don't auto-delete assets tied to active orders
- Log deletions to avoid accidental loss (especially for premium users)

---

## Summary

| Asset Type     | Unused Auto-Delete | Ordered Archive | Notes                      |
|----------------|---------------------|------------------|-----------------------------|
| Gen. Images    | 7 days              | 30+ days (cold)  | Compress + flag low DPI     |
| Gen. Stories   | 14 days             | 30+ days (cold)  | Delete drafts, keep finals  |
| Mockups        | 3–7 days            | 30+ days         | Only save final order       |
| Uploads        | 24h guest / 30d user| 30+ days (cold)  | GDPR-compliant purge tools  |
