# Bird Documentation Archive

**Date Archived**: 2026-01-22
**Reason**: Superseded by v3.0 multimodal configuration guide

---

## Overview

This directory contains obsolete Bird.com integration documentation that has been superseded by newer architecture versions or consolidated into comprehensive guides.

**Active Documentation**: See [../README.md](../README.md) for current documentation.

---

## v1-webhook-patterns/

Webhook-based integration patterns (NOT USED in current architecture).

**Files**:
- bird-integration-patterns.md
- bird-api-reference.md
- bird-whatsapp-media-flow.md
- bird-flow-templates.md

**Why Archived**:
- Current architecture uses Bird Actions (HTTP requests), NOT webhooks
- HMAC validation not needed in Actions pattern
- Webhook payload structures not applicable
- Replaced by synchronous HTTP request/response pattern

**Historical Context**: v1.0 architecture used webhooks to receive messages from Bird. This required webhook endpoints, HMAC signature validation, and asynchronous processing. v2.0+ shifted to Bird Actions, where the AI employee makes HTTP requests to our API, eliminating webhook complexity.

---

## v1-v2-actions/

Early versions of Actions pattern (v1.0 - v2.0).

**Files**:
- bird-actions-architecture.md
- bird-api-endpoints.md
- bird-ai-employees-setup-guide.md (merged into comprehensive guide)
- bird-actions-process-media.md (merged into comprehensive guide)

**Why Archived**:
- v3.0 breaking changes: mediaUrl extraction via conversationId API
- Outdated schema examples (v1.0 required explicit arguments)
- Superseded by bird-multimodal-config-guide.md
- Variable mapping patterns changed in v3.0

**Historical Context**: v1.0/v2.0 required explicit function arguments (mediaUrl, mediaType, etc.) in Action configuration. v3.0 simplified this to zero arguments with auto-detection via conversationId and Context variables.

---

## Migration Path

**If using archived patterns**:

1. **Webhook-based (v1.0)** → See [../bird-multimodal-config-guide.md](../bird-multimodal-config-guide.md) Appendix A
2. **Actions v1.0/v2.0** → See [../bird-multimodal-config-guide.md](../bird-multimodal-config-guide.md) Appendix A

**Current Architecture**: v3.0 (multimodal with auto-detection)

---

## Accessing Archived Content

Archived files remain accessible via git history:

```bash
# View file history
git log --follow docs/bird/archived-docs/v1-webhook-patterns/bird-integration-patterns.md

# View file at specific commit
git show COMMIT_HASH:docs/bird/bird-integration-patterns.md
```

---

**Last Updated**: 2026-01-22
