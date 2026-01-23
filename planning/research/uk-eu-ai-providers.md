# UK/EU AI Image Generation Providers Research

## Executive Summary

AIPrintly requires UK/EU data residency for processing user-uploaded photos (including children's photos) under GDPR. This research evaluates alternatives to Replicate (US-based).

**Key Finding:** Stability AI (UK-headquartered) processes data on US servers. Self-hosted solutions on EU infrastructure are recommended.

---

## Provider Comparison

| Provider | Location | Data Residency | Type | Cost/Image | GDPR Risk |
|----------|----------|----------------|------|------------|-----------|
| ~~Replicate~~ | US | US only | API | £0.003-0.04 | High |
| ~~Stability AI API~~ | UK (US servers) | **US processing** | API | £0.014-0.08 | High |
| Stability AI Enterprise | UK | TBC (contact sales) | API/Private | TBC | TBC |
| **OVHcloud** | France | EU guaranteed | Self-hosted | £0.003-0.008 | Very Low |
| **Scaleway** | France | EU guaranteed | Self-hosted | £0.003-0.008 | Very Low |
| **Hetzner** | Germany | EU guaranteed | Self-hosted | £0.001-0.003 | Very Low |
| AWS Bedrock (EU) | US (EU regions) | EU regions | API | £0.014-0.064 | Medium* |
| Azure OpenAI | US (EU regions) | EU Data Zones | API | £0.035 | Medium* |

*US companies subject to CLOUD Act regardless of data location

---

## Critical Finding: Stability AI

Despite being UK-headquartered, Stability AI's Privacy Policy states:

> "Stability AI processes personal data on servers located outside of the European Economic Area ("EEA"), Switzerland, and the UK, including processing personal data on servers in the US."

**Source:** [Stability AI Privacy Policy](https://stability.ai/privacypolicy)

**Recommendation:** Contact Stability AI enterprise sales to ask about UK/EU-only private deployment options. If unavailable, use self-hosted alternative.

---

## Recommended: Self-Hosted on EU Infrastructure

### OVHcloud (France) — Primary Recommendation

| GPU | Price/Hour | Cost/Image* | Notes |
|-----|------------|-------------|-------|
| L4 (24GB) | €0.75 (~£0.64) | £0.002-0.004 | Entry-level, good for SDXL |
| L40S (48GB) | €1.40-2.05 (~£1.19-1.75) | £0.004-0.008 | Fast inference |
| H100 PCIe | €2.80 (~£2.38) | £0.006-0.012 | High throughput |

*At 10-20 seconds per image

**Pros:**
- True EU sovereignty (French company, no CLOUD Act)
- No data egress fees
- €300 free credits for new customers
- 99.99% SLA

**Cons:**
- Requires self-hosting/DevOps
- No managed image generation API

### Scaleway (France) — Alternative

Similar pricing and capabilities to OVHcloud. French company with Paris and Amsterdam data centres.

**Pros:**
- Minute-based billing (cost-efficient)
- Pre-built AI containers available
- EU sovereignty

### Hetzner (Germany) — High Volume

| Server | GPU | Price/Month | Cost/Image at 2000/day |
|--------|-----|-------------|------------------------|
| GEX44 | RTX 4000 SFF (20GB) | €184 (~£156) | £0.0026 |
| GEX130 | Professional GPU | €838 (~£712) | £0.012 |

**Pros:**
- Lowest cost at high volume
- Dedicated hardware
- German sovereignty

**Cons:**
- Dedicated servers (minimum commitment)
- Best economics only at 1000+ images/day

---

## Not Recommended

| Provider | Reason |
|----------|--------|
| **Replicate** | US-based, no EU data residency |
| **Stability AI (public API)** | Processes data in US |
| **AWS Bedrock** | US company, CLOUD Act applies |
| **Azure OpenAI** | US company, CLOUD Act applies |
| **RunPod** | US company despite EU regions |
| **Leonardo.ai** | Australian company, no EU guarantee |

---

## Implementation Recommendation

### Phase 1: Contact Stability AI Enterprise
- Ask about UK/EU-only API deployment
- Request DPA with explicit data residency guarantees
- Evaluate private deployment options

### Phase 2 (if Stability unavailable): Self-Hosted SDXL

1. Deploy SDXL on OVHcloud L4 GPU instance
2. Containerise with Docker
3. Implement auto-scaling based on demand
4. Store all assets in EU-only object storage (OVHcloud or Scaleway)

**Estimated setup time:** 1-2 weeks
**Estimated cost:** £0.003-0.008 per image

---

## Action Items

- [ ] Email Stability AI enterprise sales re: UK/EU deployment
- [ ] Sign up for OVHcloud trial (€300 free credits)
- [ ] Test SDXL deployment on L4 GPU
- [ ] Benchmark performance and quality
- [ ] Sign DPA with chosen provider

---

*Research conducted: January 2026*
