import { tool } from 'ai';
import { z } from 'zod';
import { processImage } from '@/lib/ai/pipeline';
import { transcribeWithFallback } from '@/lib/ai/transcribe';
import { downloadMedia } from '@/lib/bird/media';
import { fetchLatestMediaFromConversation } from '@/lib/bird/fetch-latest-media';
import { db } from '@/lib/db/client';
import { consents, leads } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { ConsentType } from '../types';

const mediaToolParams = z.object({
  conversationId: z.string().uuid().describe('UUID de la conversación en Bird'),
  checkConsent: z
    .boolean()
    .default(true)
    .describe('Si debe verificar consentimiento antes de procesar'),
});

/**
 * Check if user has granted consent for media processing
 *
 * @param conversationId - Conversation UUID
 * @param consentType - Type of consent required
 * @returns True if consent granted, false otherwise
 */
async function hasConsent(conversationId: string, consentType: ConsentType): Promise<boolean> {
  const leadData = await db
    .select()
    .from(leads)
    .where(eq(leads.conversationId, conversationId))
    .limit(1);

  if (leadData.length === 0 || !leadData[0]) {
    return false;
  }

  const consent = await db
    .select()
    .from(consents)
    .where(
      and(eq(consents.leadId, leadData[0].leadId), eq(consents.consentType, consentType))
    )
    .limit(1);

  return consent.length > 0 && (consent[0]?.granted || false);
}

/**
 * Analyze Photo Tool
 * Analyzes quality of medical photos (NOT medical diagnosis)
 *
 * IMPORTANT: This tool ONLY analyzes photo quality (lighting, blur, angle)
 * It does NOT provide medical diagnosis or recommendations
 */
export const analyzePhotoTool = tool({
  description:
    'Analiza calidad técnica de foto médica (luz, blur, ángulo). NO diagnóstico médico. Requiere consentimiento del usuario.',
  inputSchema: mediaToolParams,
  execute: async (params) => {
    const { conversationId, checkConsent } = params;
    try {
      // 1. Check consent if required
      if (checkConsent) {
        const granted = await hasConsent(conversationId, 'photo_analysis');
        if (!granted) {
          return {
            success: false,
            error: 'consent_required',
            message:
              'Necesito tu consentimiento para analizar la foto. ¿Puedo proceder? (Sí/No)',
          };
        }
      }

      // 2. Fetch latest media from conversation
      const media = await fetchLatestMediaFromConversation(conversationId);

      if (!media || !media.mediaUrl) {
        return {
          success: false,
          error: 'no_media_found',
          message: 'No encontré ninguna foto en la conversación reciente.',
        };
      }

      if (media.mediaType !== 'image') {
        return {
          success: false,
          error: 'invalid_media_type',
          message: `El archivo adjunto es de tipo ${media.mediaType}, no una imagen.`,
        };
      }

      // 3. Process image through pipeline
      const startTime = Date.now();
      const result = await processImage(media.mediaUrl, {
        forceType: 'photo', // Skip classification for medical photos
        budgetMs: 6000, // 6 seconds max (tool has buffer)
      });

      const processingTime = Date.now() - startTime;

      // 4. Return quality analysis (NOT medical advice)
      return {
        success: true,
        type: result.type,
        data: result.data,
        processingTime,
        model: 'gemini-2.0-flash',
        message:
          'Foto analizada. Recuerda: este es un análisis de calidad técnica, NO un diagnóstico médico.',
      };
    } catch (error) {
      console.error('[analyzePhotoTool] Error:', error);
      return {
        success: false,
        error: 'processing_failed',
        message:
          error instanceof Error
            ? `Error al procesar la foto: ${error.message}`
            : 'Error desconocido al procesar la foto.',
      };
    }
  },
});

/**
 * Transcribe Audio Tool
 * Transcribes WhatsApp voice notes using Groq Whisper v3 (primary) with OpenAI fallback
 *
 * Optimized for Spanish language (LATAM patients)
 */
export const transcribeAudioTool = tool({
  description:
    'Transcribe notas de voz de WhatsApp a texto. Optimizado para español (Colombia). Requiere consentimiento.',
  inputSchema: mediaToolParams,
  execute: async (params) => {
    const { conversationId, checkConsent } = params;
    try {
      // 1. Check consent if required
      if (checkConsent) {
        const granted = await hasConsent(conversationId, 'audio_transcription');
        if (!granted) {
          return {
            success: false,
            error: 'consent_required',
            message:
              'Necesito tu consentimiento para transcribir el audio. ¿Puedo proceder? (Sí/No)',
          };
        }
      }

      // 2. Fetch latest media from conversation
      const media = await fetchLatestMediaFromConversation(conversationId);

      if (!media || !media.mediaUrl) {
        return {
          success: false,
          error: 'no_media_found',
          message: 'No encontré ningún audio en la conversación reciente.',
        };
      }

      if (media.mediaType !== 'audio') {
        return {
          success: false,
          error: 'invalid_media_type',
          message: `El archivo adjunto es de tipo ${media.mediaType}, no un audio.`,
        };
      }

      // 3. Download audio
      const audioBuffer = await downloadMedia(media.mediaUrl);

      // 4. Transcribe with fallback
      const startTime = Date.now();
      const result = await transcribeWithFallback(audioBuffer, {
        language: 'es', // Spanish (Colombia)
        prompt: 'Conversación sobre cirugía plástica, procedimientos estéticos, consultas médicas.',
      });

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        text: result.text,
        provider: result.provider,
        fallbackUsed: result.fallbackUsed,
        processingTime,
        message: `Audio transcrito correctamente (${result.provider}).`,
      };
    } catch (error) {
      console.error('[transcribeAudioTool] Error:', error);
      return {
        success: false,
        error: 'processing_failed',
        message:
          error instanceof Error
            ? `Error al transcribir el audio: ${error.message}`
            : 'Error desconocido al transcribir el audio.',
      };
    }
  },
});

/**
 * Extract Document Tool
 * Extracts text and data from documents (PDFs, cedulas, contracts)
 *
 * Uses Gemini 2.5 Flash for complex document processing
 */
export const extractDocumentTool = tool({
  description:
    'Extrae texto y datos de documentos (PDFs, cédulas, contratos). Requiere consentimiento.',
  inputSchema: mediaToolParams,
  execute: async (params) => {
    const { conversationId, checkConsent } = params;
    try {
      // 1. Check consent if required
      if (checkConsent) {
        const granted = await hasConsent(conversationId, 'document_processing');
        if (!granted) {
          return {
            success: false,
            error: 'consent_required',
            message:
              'Necesito tu consentimiento para procesar el documento. ¿Puedo proceder? (Sí/No)',
          };
        }
      }

      // 2. Fetch latest media from conversation
      const media = await fetchLatestMediaFromConversation(conversationId);

      if (!media || !media.mediaUrl) {
        return {
          success: false,
          error: 'no_media_found',
          message: 'No encontré ningún documento en la conversación reciente.',
        };
      }

      if (media.mediaType !== 'image' && media.mediaType !== 'document') {
        return {
          success: false,
          error: 'invalid_media_type',
          message: `El archivo adjunto es de tipo ${media.mediaType}, no un documento o imagen.`,
        };
      }

      // 3. Process document through pipeline
      const startTime = Date.now();
      const result = await processImage(media.mediaUrl, {
        forceType: 'document', // Force document processing
        budgetMs: 6000, // 6 seconds max
      });

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        type: result.type,
        data: result.data,
        processingTime,
        model: 'gemini-2.5-flash',
        message: 'Documento procesado correctamente.',
      };
    } catch (error) {
      console.error('[extractDocumentTool] Error:', error);
      return {
        success: false,
        error: 'processing_failed',
        message:
          error instanceof Error
            ? `Error al procesar el documento: ${error.message}`
            : 'Error desconocido al procesar el documento.',
      };
    }
  },
});
