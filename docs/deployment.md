# Deployment Guide

**Platform:** Vercel | **Updated:** 2025-11-12

---

## Prerequisites

- GitHub/GitLab/Bitbucket account
- Vercel account (free tier available)
- Meta Business Manager account (WhatsApp)
- OpenAI API key

---

## Quick Deploy

### 1. Clone Template

```bash
git clone /Users/mercadeo/neero/ai-sdk-wp your-project
cd your-project
rm -rf .git
git init
git add .
git commit -m "Initial commit"
```

### 2. Push to GitHub

```bash
gh repo create your-project --private --source=. --push
# Or use GitHub web UI
```

### 3. Import to Vercel

1. Go to vercel.com/new
2. Import your GitHub repository
3. Configure environment variables (see below)
4. Click "Deploy"

**Done!** Your app deploys in ~2 minutes.

---

## Environment Variables

### Required Variables

Add in Vercel Dashboard → Project Settings → Environment Variables:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# WhatsApp
WHATSAPP_TOKEN=EAA...         # From Meta Business Manager
WHATSAPP_PHONE_ID=123...      # Phone number ID
WHATSAPP_VERIFY_TOKEN=...     # You create this (random string)
WHATSAPP_APP_SECRET=...       # App secret for HMAC validation

# App
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

### Optional Variables

```bash
# AI Model Override
OPENAI_MODEL=gpt-4o           # Default: gpt-4o-mini

# Database (if using)
DATABASE_URL=postgresql://...
```

### Environment Scopes

- **Production:** Main branch deploys
- **Preview:** All other branches
- **Development:** Local `.env.local`

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:192-202

---

## WhatsApp Webhook Setup

### 1. Get Webhook URL

After Vercel deployment:
```
https://your-project.vercel.app/api/whatsapp/webhook
```

### 2. Configure in Meta Business Manager

1. Go to developers.facebook.com/apps
2. Select your app → WhatsApp → Configuration
3. Webhook URL: `https://your-project.vercel.app/api/whatsapp/webhook`
4. Verify Token: Match your `WHATSAPP_VERIFY_TOKEN`
5. Click "Verify and Save"
6. Subscribe to `messages` field

### 3. Test

Send message to your WhatsApp number → Should receive echo response

---

## Deployment Strategies

### Automatic Deployments

**Production (main branch):**
```bash
git checkout main
git merge feature-branch
git push origin main
```
→ Automatically deploys to production

**Preview (other branches):**
```bash
git checkout feature-branch
git push origin feature-branch
```
→ Creates unique preview URL for testing

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:20-31

---

## Monitoring

### Vercel Analytics

View at vercel.com/[team]/[project]/analytics

**Key Metrics:**
- Request volume
- Response time (target: <100ms for webhooks)
- Error rate (target: <1%)
- Edge Function duration

### Custom Logging

```typescript
// Structured logging
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'info',
  message: 'Webhook processed',
  duration: Date.now() - startTime
}))
```

View logs: `vercel logs`

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:607-674

---

## Rollback

### Instant Rollback (Vercel Dashboard)

1. Go to Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

**Time:** <1 minute

### Git Rollback

```bash
# Revert last commit
git revert HEAD
git push origin main

# Or: Reset to specific commit
git reset --hard <commit-hash>
git push --force origin main  # Use with caution
```

**Time:** ~2 minutes (rebuild + deploy)

---

## Performance Optimization

### Edge Function Optimization

**Target Metrics:**
- Cold start: <10ms
- Execution time: <100ms (webhooks)
- Memory usage: <64MB (of 128MB limit)

**Optimization Checklist:**
- Cache clients (OpenAI, Supabase)
- Use static imports only
- Minimize bundle size
- Set aggressive timeouts
- Monitor memory usage

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:319-397

### Bundle Size

Check Edge Function bundle size:
```bash
npm run build
# Check .next/server/edge output
```

**Target:** <1MB (Hobby), <2MB (Pro)

---

## Scaling

### Automatic Scaling

Vercel Edge Functions scale automatically:
- No configuration needed
- Pay per request
- No idle costs

### Rate Limiting

Template includes token bucket rate limiter:
- 250 msg/sec capacity
- Prevents API abuse
- Protects against cost spikes

---

## Cost Estimation

### Vercel Pricing (2025)

| Plan | Price | Bandwidth | Execution |
|------|-------|-----------|-----------|
| Hobby | Free | 100GB/mo | 100 GB-hours/mo |
| Pro | $20/mo | 1TB/mo | 1000 GB-hours/mo |

**Edge Function Cost:**
- ~$0.65 per 1M requests (100ms avg)

**Example:** 10K messages/day = 300K/mo = ~$0.20

### OpenAI Pricing (2025)

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| gpt-4o-mini | $0.15 | $0.60 |
| gpt-4o | $2.50 | $10.00 |

**Example:** 10K messages/day with gpt-4o-mini:
- Input: 300K tokens = $0.045
- Output: 300K tokens = $0.18
- Total: ~$0.23/day = ~$7/month

### WhatsApp Pricing (2025)

**After July 1, 2025:**
- Utility messages (24h window): FREE
- Marketing messages: $0.0667 each
- SERVICE templates: FREE

**Example:** 10K messages/day (utility) = FREE

**Total Monthly Cost:** ~$20 (Vercel Pro) + ~$7 (OpenAI) = ~$27

**Validated Source:** docs-global/platforms/whatsapp/api-v23-guide.md:180-192

---

## Troubleshooting

### Common Issues

**504 Gateway Timeout:**
- Cause: Function >25s
- Solution: Optimize or use streaming

**507 Out of Memory:**
- Cause: >128MB memory usage
- Solution: Optimize caching, limit in-memory data

**401 Unauthorized (webhook):**
- Cause: Invalid HMAC signature
- Solution: Verify `WHATSAPP_APP_SECRET` matches Meta

**500 Internal Error:**
- Cause: Various (check logs)
- Solution: `vercel logs --follow`

**Validated Source:** docs-global/platforms/vercel/platform-vercel.md:755-763

---

## Security Checklist

### Before Going Live

- [ ] Environment variables in Vercel Dashboard (not code)
- [ ] HMAC validation enabled
- [ ] Rate limiting configured
- [ ] Input sanitization applied
- [ ] Error messages sanitized
- [ ] Secrets rotated from template defaults
- [ ] HTTPS enforced (automatic)
- [ ] Webhook verification token set

### After Launch

- [ ] Monitor error rates
- [ ] Review logs weekly
- [ ] Rotate secrets every 90 days
- [ ] Update dependencies monthly
- [ ] Test backup/rollback procedure

---

## CI/CD Best Practices

### Branch Strategy

```
main (production)
  ├── staging (optional)
  └── feature/* (preview deployments)
```

### Pull Request Workflow

1. Create feature branch: `git checkout -b feature/new-feature`
2. Push: `git push origin feature/new-feature`
3. Vercel creates preview deployment automatically
4. Test preview URL
5. Create PR → Review → Merge to main
6. Auto-deploy to production

### Environment-Specific Configs

Use Vercel environment scopes:
- Production: Prod database, prod API keys
- Preview: Staging database, test API keys
- Development: Local `.env.local`

---

## References

**Validated Against:**
- docs-global/platforms/vercel/platform-vercel.md (Deployment, monitoring, costs)
- docs-global/platforms/whatsapp/api-v23-guide.md (Pricing model 2025)

**External:**
- Vercel Docs: https://vercel.com/docs
- Vercel Pricing: https://vercel.com/pricing
- OpenAI Pricing: https://openai.com/pricing
