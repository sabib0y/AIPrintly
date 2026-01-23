# Data Retention Legal Requirements for AIPrintly

## Executive Summary

As a UK-based e-commerce platform, AIPrintly must balance customers' **right to erasure under UK GDPR** with mandatory retention periods required by:
- **HMRC (Tax law):** 6 years + current year
- **Consumer Protection (Limitations Act 1980):** 6 years
- **Anti-Money Laundering:** 5 years (likely not applicable)

**Recommendation: Anonymisation, not deletion** - This preserves legal compliance whilst protecting user privacy and maintaining business analytics.

---

## 1. UK GDPR / Data Protection Act 2018

### Right to Erasure - Key Exceptions for E-commerce

The right to erasure (Article 17) is **not absolute**. You can refuse deletion when:

- **Legal Obligations** - Required by law to keep data (HMRC tax requirements, VAT records)
- **Legal Claims** - Needed to establish, exercise, or defend potential legal claims
- **Multiple Legal Bases** - Same data needed for different lawful purposes

### Response Timeframe
- **1 month** to respond to erasure requests
- Can extend by 2 months for complex cases (with explanation)

---

## 2. HMRC Tax/Financial Records

### Mandatory Retention: 6 years + current year

| Business Type | Retention Period |
|--------------|------------------|
| Limited Companies | 6 years from end of financial year |
| Sole Traders/Partnerships | 5 years after 31 January tax deadline |
| VAT-Registered | 6 years minimum |

### What Must Be Retained for E-commerce
- Type of goods/services sold
- Buyer information
- VAT rate applied
- Cross-border transaction details
- Invoices and payment records

---

## 3. Consumer Protection / Contract Law

### Limitations Act 1980
Documents should be kept for **6 years after expiry** to ensure availability if a civil case is brought against the company.

---

## 4. Anti-Money Laundering (AML)

### Is AIPrintly Subject to AML?
**Likely NO** for standard e-commerce operations.

AML requirements (MLR 2017) apply to:
- Financial institutions
- Payment service providers
- High-value dealers (€10,000+ per transaction)
- Art market participants (€10,000+ transactions)

AIPrintly's typical products fall well below these thresholds.

---

## 5. Data Retention Policy for AIPrintly

| Data Category | Retention Period | Action on Deletion Request | Legal Basis |
|---------------|------------------|----------------------------|-------------|
| Account credentials | Until deletion | Delete | N/A |
| Profile information | Until deletion | Delete | N/A |
| Marketing preferences | Until withdrawal | Delete | Consent |
| Order transaction records | 6 years + current | Anonymise | HMRC |
| Order customer details | 6 years | Anonymise | Limitations Act 1980 |
| Payment records | 6 years + current | Anonymise amounts/dates | HMRC |
| Product configurations | 6 years | Anonymise creator | Fulfilment proof |
| AI generation metadata (with order) | 6 years | Anonymise | Cost accounting |
| AI generation metadata (no order) | 30 days | Delete | N/A |
| Uploaded photos (with order) | Per storage tier | Anonymise owner | Fulfilment proof |
| Uploaded photos (no order) | 30 days | Delete | N/A |
| Support tickets | 6 years | Anonymise | Legal claims |
| Session/cookie data | End of session | Delete | N/A |
| Active disputes/chargebacks | Until resolved + 6 years | Retain | Legal claims exception |

---

## 6. Implementation: "Delete My Account" Flow

### What to Delete Immediately
- Account credentials (password hashes, tokens)
- Profile information (bio, preferences)
- Marketing preferences/consent records
- Saved addresses (not linked to orders)
- Session/cookie data
- AI generation history (not linked to orders)
- Uploaded photos (not linked to orders)
- Unused AI credits (with refund if appropriate)

### What to Anonymise
- **Order history:** Replace name/email with `ANON_[unique_id]`
- **Transaction records:** Keep amounts/dates, anonymise customer details
- **Product configurations:** Remove creator association, retain design data
- **Payment records:** Anonymise customer details, retain transaction metadata
- **Generated assets:** Remove user association, retain for cost accounting

### What to Retain (exceptions only)
- Active disputes/chargebacks (until resolved + 6 years)
- Ongoing warranty claims (until resolved + 6 years)
- Active investigations (until complete + legal requirement period)

---

## 7. Database Schema Recommendations

```prisma
model User {
  id              String    @id @default(cuid())
  email           String?   @unique  // Nullable after anonymisation
  name            String?              // Nullable after anonymisation
  deletedAt       DateTime?            // Soft delete timestamp
  anonymisedAt    DateTime?            // Anonymisation timestamp
  anonymisedId    String?   @unique    // e.g., "ANON_abc123"
}
```

---

## 8. UI/UX for "Delete My Account"

### Warning Screen Content
```
Delete Your Account

This will permanently delete:
✓ Your account credentials and login access
✓ Your profile information
✓ Your saved addresses
✓ Your AI generation history (not linked to orders)
✓ Your uploaded photos (not linked to orders)

This will anonymise (for legal/tax requirements):
⚠️ Order history (anonymised for 6 years)
⚠️ Transaction records (anonymised for 6 years)

This cannot be undone.
```

### Exception Handling
- "You have an active dispute on Order #12345. We must retain your data until resolved."

### Confirmation
- Require password re-entry or email confirmation link
- Final "Delete My Account" button

---

## Sources

### UK GDPR
- [Right to erasure | ICO](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-erasure/)

### HMRC Tax Records
- [How long to keep tax records in the UK | Simply Business](https://www.simplybusiness.co.uk/knowledge/business-tax/how-long-to-keep-tax-records/)

### Consumer Protection
- [Legal requirements for document retention in the UK | Archive Vault](https://www.archive-vault.co.uk/legal-requirements-for-document-retention-in-the-uk-do-you-know-how-long-you-need-to-keep-your-documents/)

### Anti-Money Laundering
- [Money Laundering Regulations 2017 | Legislation.gov.uk](https://www.legislation.gov.uk/uksi/2017/692/regulation/40/made?view=plain)

---

*Research conducted: January 2026*
