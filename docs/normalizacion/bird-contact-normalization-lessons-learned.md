# Bird Contact Normalization - Lessons Learned

**Date**: 2026-01-14
**Context**: Contact name normalization using Bird CRM API
**Execution**: 43% success rate (43/100 contacts) → Emojis still visible in Bird UI

---

## Critical Errors Committed

### Error 1: NOT Updating `attributes.displayName` ❌

**What happened**: Script updated only `firstName` and `lastName` (top-level fields) but NOT `attributes.displayName`.

**Evidence**: After successful execution with 43% success rate, Bird UI inbox still showed emojis:
- "Melissa Martinez 💕"
- "Margui 🌺"

**Code that was WRONG**:
```typescript
// ❌ WRONG - Only updates firstName/lastName
await updateContact(contact.id, {
  firstName,
  lastName,
});
```

**Why it failed**: Bird UI displays `attributes.displayName` which has **PRIORITY** over computed displayName from firstName+lastName. Since we didn't update `attributes.displayName`, emojis remained visible.

**Root cause**: Misunderstanding of Bird CRM's display name priority system.

---

### Error 2: NOT Updating Country Attributes ❌

**What happened**: Script didn't update `attributes.country` (ISO code) or `attributes.countryName` (full name) from phone numbers.

**Missing data**: Country information that could be inferred from phone codes (+57 → "Colombia", "CO").

**Code that was WRONG**: No country extraction logic at all.

---

### Error 3: Suggesting Prohibited Models (Gemini/OpenAI) ❌

**What happened**: Initial plan suggested using Gemini AI as fallback for name extraction.

**User feedback**:
> "te queda completamente prohibido volver a sugerir para la normalizacion directa otros modelos, tienes que hacerlo directamente tu a cero costo"

**Clarification**:
> "prohibido usar gemini o openai"
> "el modelo que deberias usar para ejecutar es haiku"

**Policy violation**: Suggested using paid third-party models when user required zero-cost direct execution OR Claude Haiku only.

---

### Error 4: NOT Documenting Previous Learnings ❌

**What happened**: Same mistake repeated from previous sessions - not updating `attributes.displayName`.

**User feedback**:
> "ya habiamos pasado por esto antes y parece que no documentas los aprendizajes"

**Root cause**: Lack of persistent documentation of errors and solutions.

---

## Correct Solution

### Always Update 5 Fields Together

**CORRECT code pattern**:
```typescript
// Extract phone for country inference
const phoneNumber = contact.featuredIdentifiers.find(i => i.key === 'phonenumber')?.value || '';

// Infer country from phone code
const countryName = inferCountryFromPhone(phoneNumber); // "Colombia"
const countryCode = phoneToCountryCode(phoneNumber);    // "CO"

// CRITICAL: Must update firstName + lastName + displayName + country + countryName
// displayName has PRIORITY in Bird UI - if not updated, emojis remain visible
await updateContact(contact.id, {
  firstName,                          // ✅ CRITICAL 1 - Top-level field
  lastName,                           // ✅ CRITICAL 2 - Top-level field
  attributes: {
    displayName: `${firstName} ${lastName}`.trim(), // ✅ CRITICAL 3 - Visible in UI
    country: countryCode,              // ✅ CRITICAL 4 - ISO code (CO, MX, ES)
    countryName: countryName           // ✅ CRITICAL 5 - Full name (Colombia, México)
  }
});
```

---

## Why Each Field Matters

| Field | Purpose | Example | Consequence if Missing |
|-------|---------|---------|------------------------|
| `firstName` | Top-level field for Bird system | "María" | May affect computed displayName |
| `lastName` | Top-level field for Bird system | "González" | May affect computed displayName |
| `attributes.displayName` | **PRIORITY** field visible in UI | "María González" | **Emojis remain visible** |
| `attributes.country` | ISO 3166-1 alpha-2 code | "CO" | Missing country data |
| `attributes.countryName` | Full country name | "Colombia" | Missing human-readable country |

**KEY**: `attributes.displayName` has **absolute priority** - if not updated, UI shows old value with emojis.

---

## Model Usage Policy

### PROHIBITED Models ❌

- **Gemini** (Google AI) - NEVER use for normalization
- **OpenAI** (GPT models) - NEVER use for normalization

### PERMITTED Models ✅

- **Claude Haiku** - ONLY permitted AI model for NER
- **Regex extraction** - Zero cost, use first
- **Heuristic extraction** - Zero cost, use second

### Recommended Strategy

```
1. Try regex patterns (gratis) → extractNameWithRegex()
2. Try heuristic extraction (gratis) → extractNameHeuristic()
3. Fallback to Claude Haiku (low cost, PERMITTED) → extractNameWithHaiku()
4. Fallback to displayName cleaning (always works)
```

**Never suggest Gemini/OpenAI** - User has explicitly prohibited them.

---

## Phone Code Mappings

### Country Name Mapping (Already Existed)

```typescript
const PHONE_CODE_TO_COUNTRY: Record<string, string> = {
  '+57': 'Colombia',
  '+52': 'México',
  '+54': 'Argentina',
  // ... (full mapping in lib/normalization/extractors.ts)
};
```

### ISO Code Mapping (Newly Added)

```typescript
const PHONE_CODE_TO_ISO: Record<string, string> = {
  '+57': 'CO',
  '+52': 'MX',
  '+54': 'AR',
  '+56': 'CL',
  '+51': 'PE',
  '+58': 'VE',
  '+593': 'EC',
  '+591': 'BO',
  '+595': 'PY',
  '+598': 'UY',
  '+507': 'PA',
  '+506': 'CR',
  '+503': 'SV',
  '+502': 'GT',
  '+504': 'HN',
  '+505': 'NI',
  '+1': 'US',
  '+34': 'ES',
};
```

---

## Prevention Strategies

### 1. Code Review Checklist

Before committing any Bird contact update script, verify:

- [ ] Updates `firstName` (top-level)
- [ ] Updates `lastName` (top-level)
- [ ] Updates `attributes.displayName` (PRIORITY - visible in UI)
- [ ] Updates `attributes.country` (ISO code from phone)
- [ ] Updates `attributes.countryName` (full name from phone)
- [ ] CRITICAL comment present explaining displayName priority
- [ ] Uses ONLY permitted models (Haiku or zero-cost)
- [ ] NEVER suggests Gemini/OpenAI

### 2. Mandatory Comments in Code

All normalization scripts MUST include this comment:

```typescript
// CRITICAL: Must update firstName + lastName + displayName + country + countryName
// displayName has PRIORITY in Bird UI - if not updated, emojis remain visible
```

### 3. Standard Functions

Always use standardized functions from `lib/normalization/extractors.ts`:

```typescript
import {
  cleanDisplayName,        // Remove emojis
  splitFullName,           // Split with LATAM 2-surname support
  inferCountryFromPhone,   // Get full country name
  phoneToCountryCode,      // Get ISO code
} from '@/lib/normalization/extractors';
```

**NEVER** create local phone mapping functions - use the standardized ones.

### 4. Documentation

This document exists to prevent repeating these errors. Review before:
- Creating new normalization scripts
- Modifying existing normalization logic
- Code reviewing contact update PRs

---

## Verification Steps

After running normalization scripts:

1. **Check script output**: Success rate, fields updated
2. **Check Bird UI inbox**: Verify names appear WITHOUT emojis
3. **Check contact details**: Verify all 5 fields were updated
4. **Take screenshots**: Before/after evidence

**RED FLAG**: If script reports success but Bird UI still shows emojis → `attributes.displayName` was NOT updated.

---

## Summary

| Error | Solution | Prevention |
|-------|----------|------------|
| Not updating `attributes.displayName` | Always update 5 fields together | CRITICAL comment + checklist |
| Not updating country attributes | Use `inferCountryFromPhone()` + `phoneToCountryCode()` | Standardized functions |
| Suggesting Gemini/OpenAI | Use ONLY Haiku or zero-cost methods | Explicit prohibition in docs |
| Not documenting learnings | This document | Review before normalization work |

---

## References

- **Corrected scripts**: `scripts/quick-normalize.ts`, `scripts/update-latest-100-contacts.ts`
- **Standard functions**: `lib/normalization/extractors.ts`
- **Bird types**: `lib/bird/types.ts` (BirdContactUpdate interface)
- **Plan file**: `.claude/plans/linear-shimmying-seal.md`

---

**Remember**: Bird UI displays `attributes.displayName` with **absolute priority**. If you don't update it, emojis WILL remain visible no matter what else you update.
