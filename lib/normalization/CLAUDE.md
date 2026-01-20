---
title: "Contact Normalization - Semantic Map"
summary: "Contact data extraction: phone numbers (regex+AI), names, addresses, emails. Hybrid extraction with validation."
description: "Contact data normalization and validation"
version: "1.0"
date: "2026-01-18"
updated: "2026-01-19 11:45"
tags: ["normalization","contact-data","validation"]
scope: "project"
module: "lib/normalization"
---

## Purpose

Contact data normalization and validation

**IMPORTANT**: This is a semantic map of the `lib/normalization/` codebase. All files are documented with @file headers. Claude Code should read this map to understand the module structure without exploring individual files.

---

## Files (Auto-generated from headers)

| File | @file | @exports | Lines |
|------|-------|----------|-------|
| extractors.ts | Bird CRM Contact Normalization - Data Extraction | extractNameWithRegex, extractNameHeuristic, extractNameHybrid, extractEmail, inferCountryFromPhone, phoneToCountryCode, cleanDisplayName, isInstagramUsername, isOnlyEmojis, splitFullName, isValidName | 467 |
| gemini-ner.ts | Gemini NER for Contact Normalization | extractNameWithGemini | 198 |
| schemas.ts | Normalization Schemas | ContactInputSchema, ContactInput, NormalizedContactSchema, NormalizedContact, AIExtractionSchema, AIExtraction | 65 |
| tracking.ts | Contact Normalization Tracking | saveNormalizationResult, getNeedsReview, getNormalizationHistory, markAsReviewed, getNormalizationStats, NormalizationInput | 167 |
| types.ts | Normalization Types | NameExtractionResult, GenderInferenceResult, CountryInferenceResult, PhoneValidationResult | 61 |
| utils/cleaning.ts | Display Name Cleaning Utilities | cleanDisplayName, removeEmojis, EMOJI_PATTERN | 61 |
| utils/index.ts | Normalization Utilities - Barrel Export | cleanDisplayName, removeEmojis, EMOJI_PATTERN, isValidName, isOnlyEmojis, isInstagramUsername, splitFullName | 11 |
| utils/splitting.ts | Name Splitting Utilities | splitFullName | 75 |
| utils/validation.ts | Name and Display Name Validation Utilities | isValidName, isOnlyEmojis, isInstagramUsername | 93 |

**Read headers**: All files have complete @file/@description/@module/@exports headers. Read file headers before reading full file contents.

---

## Quick Start

Patterns



---

**Token Budget**: ~520 tokens
**Last Updated**: 2026-01-19
