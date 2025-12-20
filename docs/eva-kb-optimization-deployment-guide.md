# Eva Knowledge Base Optimization - Deployment & Monitoring Guide

**Version:** 1.0 | **Date:** 2025-12-20 20:35 | **Status:** Deployment Ready

---

## Executive Summary

**What:** Deploy optimized Eva configuration with Knowledge Base architecture
**Why:** Reduce operational costs by 48% while maintaining 95%+ quality
**When:** After successful testing validation (6/6 test cases passed)
**Who:** Neero DevOps + Bird Admin
**Duration:** 30-45 minutes deployment + 7 days monitoring

---

## Pre-Deployment Checklist

### 1. Testing Validation ✓

- [ ] All 6 test cases passed (see `eva-kb-optimization-testing-guide.md`)
- [ ] Knowledge Base retrieval working correctly
- [ ] Quality metrics ≥95% (correct responses)
- [ ] No security violations (guardrails active)
- [ ] Rollback plan documented and reviewed

### 2. Backup Current Configuration

**Bird Dashboard Backup:**
```bash
# Download current configuration from Bird Dashboard
curl -X GET "https://api.bird.com/workspaces/{workspace_id}/ai-employees/{employee_id}" \
  -H "Authorization: AccessKey {BIRD_ACCESS_KEY}" \
  -o backup/eva-config-$(date +%Y%m%d).json
```

**Git Backup:**
```bash
# Current state already at commit cbd114b
git log -1 --oneline
# cbd114b feat: optimize Eva Additional Instructions with Knowledge Base architecture

# Pre-optimization state at commit a580a1b
git show a580a1b:feature/eva-valoracion/eva-valoracion.agent.json > backup/eva-pre-optimization.json
```

### 3. Stakeholder Communication

**Email Template:**
```
Subject: [DEPLOYMENT NOTICE] Eva Optimization - Dec 20, 2025

Team,

We're deploying an optimization to Eva's configuration today at [TIME].

WHAT: Move static content to Knowledge Base, reduce prompt tokens by 64%
EXPECTED IMPACT: -48% costs, -22% latency, NO change in user experience
DURATION: 30-45 minutes
ROLLBACK: Available if issues detected within 1 hour

TESTING RESULTS:
- 6/6 test cases passed
- Quality maintained at 95%+
- All critical flows verified

MONITORING:
- Watching metrics for 7 days
- Daily check-ins at 9am
- Alerts configured for anomalies

Any concerns, reply to this email.

Team Neero
```

---

## Deployment Steps

### Step 1: Upload Knowledge Base Files (15 minutes)

**1.1. Access Bird Dashboard**
- URL: https://dashboard.bird.com
- Login with admin credentials
- Navigate to: **AI Employees** → **Eva Valoración** → **Knowledge Base**

**1.2. Upload Documents**

| Order | File | Source Path | Category |
|-------|------|-------------|----------|
| 1 | procedimientos.md | `/knowledge-base/procedimientos.md` | Procedimientos |
| 2 | ubicaciones.md | `/knowledge-base/ubicaciones.md` | Ubicaciones |
| 3 | faqs.md | `/knowledge-base/faqs.md` | FAQs |

**For each file:**
- Click "Add Document"
- Upload file from local path
- Set Category (as per table)
- Enable "Auto-retrieve"
- Click "Save"

**1.3. Configure Knowledge Base Settings**
```
Similarity Threshold: 0.65 (default)
Auto-retrieve: Enabled
Max Results per Query: 3
Language: Spanish (es)
```

**1.4. Verify Upload**
- [ ] 3 documents showing as "Active"
- [ ] Total tokens: ~5,100 (procedimientos 4,200 + ubicaciones 400 + faqs 500)
- [ ] Test query: "Lipo High Tech 3" → Should return procedimientos.md

---

### Step 2: Update Additional Instructions (10 minutes)

**2.1. Extract Optimized Content**
```bash
cd /Users/mercadeo/neero/api-neero
cat feature/eva-valoracion/eva-valoracion.agent.json | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print(data['instructions']['legacy']['additional'])" \
  > temp-additional.txt
```

**2.2. Update in Bird Dashboard**
- Navigate to: **AI Employees** → **Eva Valoración** → **Configuration** → **Additional Instructions**
- Copy content from `temp-additional.txt`
- Paste into "Additional Instructions" field
- **VERIFY:** First line should be: `**INSTRUCCIÓN DE CONSULTA A KNOWLEDGE BASE:**`
- **VERIFY:** Character count: ~13,000 (down from ~36,000)
- Click "Save Draft"

**2.3. Preview Changes**
- Click "Preview" in Bird UI
- Test query: "¿Qué es la Lipo High Tech 3?"
- Expected: Should consult Knowledge Base and respond
- If correct → Click "Publish"
- If incorrect → Click "Discard" and check Step 2.2

---

### Step 3: Verify Deployment (5 minutes)

**3.1. Smoke Test (WhatsApp)**

Send 3 quick messages to Eva's WhatsApp:

| # | Message | Expected Response |
|---|---------|-------------------|
| 1 | "Hola" | Saludo inicial correcto |
| 2 | "Info sobre enzimas" | Macro de Enzimas (no usa KB) |
| 3 | "¿Dónde están en Bogotá?" | Consulta KB ubicaciones.md |

**Success criteria:** All 3 responses correct

**3.2. Check Bird Analytics**
- Navigate to: **Analytics** → **AI Employees** → **Eva Valoración**
- Check last 10 minutes:
  - Knowledge Base Queries: Should be > 0 (from test #3)
  - Average Tokens per Message: Should be ~4,600 (down from ~9,100)
  - Error Rate: Should be 0%

**3.3. Rollback Decision Point**
- If smoke test passed AND analytics look good → **PROCEED**
- If any issues → **EXECUTE ROLLBACK** (see Section: Rollback Procedure)

---

### Step 4: Enable Monitoring (10 minutes)

**4.1. Configure Bird Alerts**

Navigate to: **Settings** → **Alerts** → **Create Alert**

**Alert 1: High Error Rate**
```
Name: Eva - High Error Rate
Condition: Error Rate > 5%
Window: 1 hour
Actions: Email to [email protected], Slack #neero-alerts
```

**Alert 2: High Handover Rate**
```
Name: Eva - High Handover Rate
Condition: Handover Rate > 50%
Window: 1 hour
Actions: Email to [email protected]
```

**Alert 3: Low KB Usage**
```
Name: Eva - Knowledge Base Not Used
Condition: KB Queries < 5 per hour
Window: 2 hours
Actions: Email to [email protected]
```

**4.2. Configure Custom Dashboard**

Create dashboard with 6 widgets:

| Widget | Metric | Goal |
|--------|--------|------|
| Tokens/Message | Average tokens per interaction | ≤4,600 (-50%) |
| Latency | Average response time | ≤2.5s (-20%) |
| Quality | Correct response rate | ≥95% |
| Handover | Escalation to human % | 35-40% |
| KB Queries | Knowledge Base retrieval count | >0 daily |
| Error Rate | % of failed responses | <5% |

**4.3. Set Up Daily Report**
```
Report Name: Eva Daily Metrics
Schedule: Every day at 9:00 AM COT
Recipients: [email protected], [email protected]
Metrics: All 6 from dashboard
Format: Email + CSV attachment
```

---

## Post-Deployment Monitoring

### Day 1-3: Intensive Monitoring

**Check every 4 hours:**
- [ ] Bird Analytics dashboard
- [ ] Slack #neero-alerts for anomalies
- [ ] Sample 5 random conversations manually

**Red Flags (trigger investigation):**
- Error rate >10%
- Handover rate >60%
- KB queries = 0 for >2 hours
- User complaints about quality

**Green Flags (on track):**
- Tokens/message trending down
- Latency stable or improved
- Quality ≥95%
- KB queries >5/hour

### Day 4-7: Standard Monitoring

**Check daily at 9am:**
- Review daily report email
- Check alerts (should be 0)
- Sample 3 random conversations

**Weekly Review (Day 7):**
- Export metrics for full week
- Compare to pre-optimization baseline
- Calculate actual ROI vs projected
- Document lessons learned

---

## Success Metrics (Day 7 Review)

### Primary Metrics (Must Achieve)

| Metric | Baseline | Target | Actual | Status |
|--------|----------|--------|--------|--------|
| Tokens/message | 9,100 | ≤4,600 (-50%) | _____ | ☐ |
| Latency (s) | 3.2s | ≤2.5s (-20%) | _____ | ☐ |
| Quality (%) | 95% | ≥95% (maintain) | _____ | ☐ |
| Handover (%) | 35-40% | 35-40% (maintain) | _____ | ☐ |

**Success Criteria:** 4/4 metrics met → Optimization SUCCESSFUL

### Secondary Metrics (Monitor)

| Metric | Baseline | Target | Actual | Notes |
|--------|----------|--------|--------|-------|
| Cost/1K interactions | $27 | ≤$14 (-48%) | _____ | Calculate from Bird billing |
| KB queries/day | N/A | >50 | _____ | Should be consistent |
| Error rate | <2% | <5% | _____ | Should remain low |

---

## Rollback Procedure

### When to Rollback

**IMMEDIATE ROLLBACK if:**
- Error rate >15% sustained for 30+ minutes
- Quality <85% (significant degradation)
- Critical security violation (Eva gives diagnosis, mentions prices)
- Multiple user complaints about incorrect info

**PLANNED ROLLBACK if:**
- After 7 days, primary metrics not met (3/4 or fewer)
- Business decides costs don't justify risks
- Technical debt too high to maintain

### Rollback Steps (15 minutes)

**Step 1: Restore Previous Additional Instructions**
```bash
# Extract pre-optimization Additional Instructions
git show a580a1b:feature/eva-valoracion/eva-valoracion.agent.json | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print(data['instructions']['legacy']['additional'])" \
  > rollback-additional.txt
```

**Step 2: Update Bird Dashboard**
- Navigate to: **AI Employees** → **Eva** → **Additional Instructions**
- Copy content from `rollback-additional.txt`
- Paste and click "Save Draft"
- Preview with test query
- If correct → Click "Publish"

**Step 3: Disable Knowledge Base (temporary)**
- Navigate to: **Knowledge Base** → **Settings**
- Disable "Auto-retrieve"
- Keep documents uploaded (for future re-attempt)

**Step 4: Verify Rollback**
- Send test message: "¿Cuánto cuesta?"
- Expected: Should work as before (solicit data)
- Check error rate: Should return to <2%

**Step 5: Communicate Rollback**
```
Subject: [ROLLBACK EXECUTED] Eva Optimization

Team,

We've rolled back the Eva optimization due to [REASON].

CURRENT STATE: Back to previous configuration (commit a580a1b)
IMPACT: No user-facing changes, system restored to baseline
NEXT STEPS: [Analysis plan]

Team Neero
```

**Step 6: Post-Mortem**
- Create `/docs/eva-optimization-postmortem.md`
- Document: What happened, Why rollback, Lessons learned, Next attempt plan
- Schedule team review meeting

---

## Cost Analysis

### Pre-Optimization Baseline

**Assumptions:**
- 1,000 conversations/day
- Average 5 messages per conversation
- 9,100 tokens/message (Additional Instructions loaded every message)

**Monthly costs:**
```
1,000 conversations × 5 messages × 9,100 tokens = 45.5M tokens/day
45.5M × 30 days = 1,365M tokens/month
1,365M tokens ÷ 1M × $0.003 = $4,095/month
```

### Post-Optimization Projected

**Assumptions:**
- 1,000 conversations/day (same)
- Average 5 messages per conversation (same)
- 4,600 tokens/message (Additional Instructions 3,260 + KB retrieval 500 + overhead 840)

**Monthly costs:**
```
1,000 conversations × 5 messages × 4,600 tokens = 23M tokens/day
23M × 30 days = 690M tokens/month
690M tokens ÷ 1M × $0.003 = $2,070/month
```

### ROI Calculation

| Item | Amount |
|------|--------|
| Monthly savings | $2,025 ($4,095 - $2,070) |
| Annual savings | $24,300 |
| Implementation cost | ~$800 (12 hours dev @ $65/hr) |
| Payback period | 12 days |
| 12-month ROI | 2,937% |

**Note:** Actual costs may vary based on Bird's pricing model and actual usage patterns.

---

## Maintenance Plan

### Weekly Tasks (15 minutes)
- [ ] Review weekly metrics report
- [ ] Check Knowledge Base documents are still active
- [ ] Sample 10 random conversations for quality
- [ ] Update knowledge-base/ files if procedures change

### Monthly Tasks (30 minutes)
- [ ] Export full month metrics to CSV
- [ ] Compare to baseline and previous months
- [ ] Review and update procedimientos.md if Dr. Durán adds new procedures
- [ ] Check for Bird platform updates that might affect KB

### Quarterly Tasks (1 hour)
- [ ] Full audit of Knowledge Base content accuracy
- [ ] Update ubicaciones.md if office locations change
- [ ] Review faqs.md and add new common questions
- [ ] Re-run all 6 test cases to ensure no regression
- [ ] Update cost analysis with actual billing data

---

## Troubleshooting

### Issue 1: KB Not Being Queried

**Symptoms:** KB Queries = 0 for extended period

**Diagnosis:**
1. Check Bird Dashboard → Knowledge Base → Settings
   - Auto-retrieve should be "Enabled"
2. Check similarity threshold (should be 0.65)
3. Test manual query in Bird UI

**Fix:**
- Re-enable Auto-retrieve if disabled
- Lower similarity threshold to 0.60 if too strict
- Verify documents are still "Active" status

### Issue 2: High Handover Rate (>50%)

**Symptoms:** More escalations to human than before

**Diagnosis:**
1. Sample 20 escalated conversations
2. Identify common patterns (what triggered handover?)
3. Check if KB is returning low-quality matches

**Fix:**
- If KB not finding info → Add missing content to knowledge-base/ files
- If Eva can't interpret KB results → Improve Additional Instructions phrasing
- If legitimate escalations → No fix needed (working as intended)

### Issue 3: Incorrect Responses

**Symptoms:** Eva giving wrong information

**Diagnosis:**
1. Identify which KB document was consulted
2. Check if document content is correct
3. Check if Eva is misinterpreting retrieved content

**Fix:**
- If KB content wrong → Update knowledge-base/ file and re-upload
- If interpretation wrong → Refine Additional Instructions guidance
- If KB not consulted when should be → Check similarity threshold

### Issue 4: Token Reduction Not as Expected

**Symptoms:** Tokens/message still >6,000 (not reaching target 4,600)

**Diagnosis:**
1. Check Bird Analytics → Token breakdown
2. Verify Additional Instructions was actually updated
3. Check if KB overhead is higher than projected

**Fix:**
- If Additional Instructions not updated → Re-deploy Step 2
- If KB overhead high → Review retrieval settings (Max Results per Query)
- If baseline calculation was wrong → Recalculate ROI with actual numbers

---

## Appendix A: File Manifest

### Repository Files

| File | Purpose | Maintenance |
|------|---------|-------------|
| `feature/eva-valoracion/eva-valoracion.agent.json` | Full config (source of truth) | Update when Bird config changes |
| `knowledge-base/procedimientos.md` | 17 procedures (~4,200 tokens) | Update when Dr. Durán adds/changes procedures |
| `knowledge-base/ubicaciones.md` | 2 offices + virtual (~400 tokens) | Update if addresses/hours change |
| `knowledge-base/faqs.md` | 6 common questions (~500 tokens) | Update quarterly with new FAQs |
| `docs/eva-content-classification-analysis.md` | Analysis doc (reference) | Archive, no updates needed |
| `docs/eva-kb-optimization-testing-guide.md` | Testing procedures | Update if test cases change |
| `docs/eva-kb-optimization-deployment-guide.md` | This document | Update with lessons learned |
| `scripts/reduce-additional-text.py` | Reduction script (one-time) | Archive, keep for reference |

### Bird Dashboard Files

| Location | Content | Sync |
|----------|---------|------|
| Additional Instructions | Optimized prompts (3,260 tokens) | From eva-valoracion.agent.json |
| Knowledge Base → procedimientos.md | Procedure descriptions | From knowledge-base/ folder |
| Knowledge Base → ubicaciones.md | Office locations | From knowledge-base/ folder |
| Knowledge Base → faqs.md | Common questions | From knowledge-base/ folder |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| Additional Instructions | Custom prompts that define Eva's behavior (part of Bird config) |
| Knowledge Base (KB) | External documents Eva can retrieve information from |
| Retrieval | Process of searching KB for relevant content based on user query |
| Similarity Threshold | Minimum similarity score (0-1) for KB to return a result |
| HNSW | Hierarchical Navigable Small World (vector search algorithm) |
| Token | Unit of text (~4 characters) used for billing LLM API calls |
| Handover | Escalation from Eva to human agent |
| Guardrails | Safety rules that prevent Eva from certain actions |
| Rollback | Reverting to previous configuration |

---

## Appendix C: Contact Information

**Technical Issues:**
- Neero DevOps: [email protected]
- Bird Support: https://support.bird.com

**Business Escalation:**
- Project Owner: Javier Polo ([email protected])
- Dr. Andrés Durán Team: [contact info]

**Monitoring Alerts:**
- Slack: #neero-alerts
- Email: [email protected]

---

**Document Version:** 1.0 | **Last Updated:** 2025-12-20 20:35 | **Owner:** Neero DevOps Team
