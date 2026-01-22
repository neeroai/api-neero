# Data Recovery Scripts - Bird CRM Contact Damage

**Incident Date**: 2026-01-20 11:21-11:31 AM
**Affected**: ~100 patient contacts with incorrect names
**Root Cause**: GPT-4o-mini extracted bot/agent names instead of patient names

---

## Quick Start

### Phase 1: Identify Damaged Contacts

```bash
# Run triage script to identify potentially damaged contacts
tsx scripts/triage-damaged-contacts.ts

# Output: damaged-contacts.csv
# Review this file to understand scope of damage
```

### Phase 2: Find Previous Correct Names

**REALISTIC APPROACH**: Las conversaciones de WhatsApp médico rara vez contienen nombres. En su lugar, buscamos en fuentes de datos estructuradas:

```bash
# Busca nombres correctos en normalizaciones ANTERIORES al incidente
tsx scripts/find-previous-names.ts damaged-contacts.csv

# Estrategias de búsqueda (en orden):
# 1. Base de datos: Normalizaciones exitosas ANTES de 2026-01-20 11:21
# 2. Bird attributes: firstName, lastName, name, patientName, etc.
# 3. Manual review: Marca para revisión manual si no se encuentra

# Outputs:
# - previous-names-analysis.csv (análisis completo)
# - corrections-auto.csv (correcciones automáticas)
```

**Resultados esperados:**
- 30-50% auto-recuperables (tienen normalización previa correcta)
- 50-70% requieren revisión manual en Bird CRM

### Phase 3: Apply Corrections

```bash
# DRY RUN - Preview changes without applying
tsx scripts/correct-damaged-contacts.ts corrections.csv

# EXECUTE - Apply corrections to Bird CRM
tsx scripts/correct-damaged-contacts.ts corrections.csv --execute
```

### Phase 4: Verify Corrections

```bash
# Verify all corrections were applied successfully
tsx scripts/verify-corrections.ts

# Output: verification-results.csv
# Should show 100% match rate
```

---

## Files Created

| File | Purpose |
|------|---------|
| `identify-damaged-contacts.sql` | SQL query to find damaged records |
| `triage-damaged-contacts.ts` | TypeScript script to identify and export damaged contacts |
| `find-previous-names.ts` | **PRIMARY: Searches database and Bird attributes for correct names** |
| `inspect-damaged-contacts.ts` | OPTIONAL: Interactive tool to review conversations (for manual cases) |
| `correct-damaged-contacts.ts` | Script to apply manual corrections with dry-run mode |
| `verify-corrections.ts` | Script to verify corrections were applied |
| `corrections.csv.example` | Template for manual corrections |
| `lib/normalization/validators.ts` | Validation functions to prevent future incidents |

---

## Prevention Measures Applied

The cron job (`app/api/cron/normalize-contacts/route.ts`) has been updated with:

1. **Before/After Capture**: All normalization operations now capture contact state before and after updates
2. **Increased Confidence Threshold**: Raised from 0.6 to 0.75
3. **Pre-Update Validation**: Added validation to detect:
   - Conversation fragments
   - Generic bot names
   - Names too short (<5 chars)
   - Missing surname
   - Invalid characters
4. **Error Logging**: Failed validations now log specific error messages

---

## Safety Features

- **Dry-Run Mode**: All correction scripts support preview without applying changes
- **Rate Limiting**: 600ms delay between requests (100 req/min safe)
- **Audit Trail**: All corrections logged to `contact_normalizations` table
- **Verification**: Post-correction verification script to confirm success
- **Rollback**: `before` state captured for all operations

---

## Execution Timeline

| Phase | Time | Description |
|-------|------|-------------|
| Phase 1 | 30 min | Identify damaged contacts (~100 expected) |
| Phase 2 | 2-3 hours | Manual verification and corrections.csv creation |
| Phase 3 | 30-45 min | Apply corrections with dry-run + execute |
| Phase 4 | 15 min | Verify corrections applied successfully |

**Total**: 3-4 hours

---

## Success Criteria

- [x] Triage identifies all damaged contacts
- [ ] User manually verifies and creates corrections.csv
- [ ] Dry-run preview shows expected changes
- [ ] Execute applies all corrections successfully
- [ ] Verification shows 100% match rate
- [x] Prevention measures deployed (cron job updated)

---

## Rollback Plan

If corrections fail or produce incorrect results:

1. Query `contact_normalizations` for `method='manual_correction'`
2. Use `before` field to restore previous state
3. Create new corrections.csv with correct values
4. Re-run correction script

---

## Support

For issues or questions:
- Review logs in console output
- Check `contact_normalizations` table for audit trail
- Verify Bird API access and rate limits
- Contact Javier Polo for manual intervention if needed

---

**Last Updated**: 2026-01-20
**Status**: READY FOR EXECUTION
