---
title: "AI Processing - Semantic Map"
summary: "Multimodal AI processing: image classification/routing, audio transcription, embeddings, timeouts. Gemini 2.0/2.5 Flash, Groq Whisper v3."
description: "AI processing pipeline for images, audio, and text embeddings"
version: "1.0"
date: "2026-01-18"
updated: "2026-01-18 22:31"
tags: ["ai","multimodal","gemini","whisper","embeddings"]
scope: "project"
module: "lib/ai"
---

## Purpose

AI processing pipeline for images, audio, and text embeddings

**IMPORTANT**: This is a semantic map of the `lib/ai/` codebase. All files are documented with @file headers. Claude Code should read this map to understand the module structure without exploring individual files.

---

## Files (Auto-generated from headers)

| File | @file | @exports | Lines |
|------|-------|----------|-------|
| classify.ts | Image Classification | classifyImage | 86 |
| embeddings.ts | Embeddings | generateEmbedding, generateEmbeddingsBatch | 65 |
| gateway.ts | Gemini AI Gateway | GeminiModelConfig, GeminiModelId, GeminiModelIdType, getDefaultGeminiModel, getGeminiModel, getModelConfig | 93 |
| groq-text.ts | Groq Text Model Gateway | GenerateTextOptions, GroqTextModel, GroqTextModels, generateTextWithGroq | 93 |
| groq.ts | Groq Audio Transcription | GroqWhisperModel, TranscriptionOptions, TranscriptionResult, transcribeAudio, transcribeAudioDetailed | 167 |
| openai-whisper.ts | OpenAI Whisper Audio Transcription | OpenAIWhisperModel, TranscriptionOptions, TranscriptionResult, transcribeAudioOpenAI, transcribeAudioOpenAIDetailed | 167 |
| pipeline.ts | Two-Stage Image Processing Pipeline | PipelineOptions, PipelineResult, isDocumentData, isInvoiceData, isPhotoAnalysis, processImage | 219 |
| post-process.ts | Transcript Post-Processing | AudioIntent, PostProcessOptions, PostProcessedTranscript, isPostProcessingEnabled, postProcessTranscript | 192 |
| processors/document.ts | Document Processor | processDocument | 62 |
| processors/index.ts | Image Processors | DocumentData, DocumentField, InvoiceData, InvoiceLineItem, PhotoAnalysis, processDocument, processInvoice, processPhoto | 19 |
| processors/invoice.ts | Invoice Processor | processInvoice | 62 |
| processors/photo.ts | Photo Processor | processPhoto | 60 |
| prompts/classify.ts | Classification Prompt | getClassificationPrompt | 51 |
| prompts/document.ts | Document Extraction Prompt | getDocumentExtractionPrompt | 124 |
| prompts/invoice.ts | Invoice Extraction Prompt | getInvoiceExtractionPrompt | 90 |
| prompts/photo.ts | Photo Analysis Prompt | getPhotoAnalysisPrompt | 72 |
| router.ts | Image Routing Table | ROUTE_TABLE, RouteConfig, adjustTimeoutForRemaining, getAllRoutes, getRouteForType | 102 |
| schemas/classification.ts | Classification | ClassificationResult, ClassificationResultSchema, ImageType, ImageTypeSchema | 32 |
| schemas/document.ts | Document | DocumentData, DocumentDataSchema, DocumentField, DocumentFieldSchema | 67 |
| schemas/invoice.ts | Invoice | InvoiceData, InvoiceDataSchema, InvoiceLineItem, InvoiceLineItemSchema | 54 |
| schemas/photo.ts | Photo | PhotoAnalysis, PhotoAnalysisSchema | 41 |
| timeout.ts | 9-Second Budget Management | AudioPhase, TimeBudget, TimeTracker, TimeoutBudgetError, checkTimeout, formatElapsed, getAudioTimeout, getElapsed, getRemaining, shouldAttemptAudioFallback, shouldAttemptPostProcessing, startTimeTracking | 259 |
| transcribe.ts | Audio Transcription with Fallback | TranscribeResult, TranscriptionMetrics, transcribeWithFallback | 180 |

**Read headers**: All files have complete @file/@description/@module/@exports headers. Read file headers before reading full file contents.

---

## Quick Start

```typescript
// Import from module
import { ... } from '@/lib/ai';

// Basic usage example
// TODO: Add specific usage examples
```



---

**Token Budget**: ~879 tokens
**Last Updated**: 2026-01-18
