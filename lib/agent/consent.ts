import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { consents, leads } from '@/lib/db/schema';
import type { ConsentType } from './types';

/**
 * Check if user has granted consent for specific data processing
 *
 * @param leadId - UUID of the lead
 * @param consentType - Type of consent to check
 * @returns True if consent granted, false otherwise
 */
export async function checkConsent(leadId: string, consentType: ConsentType): Promise<boolean> {
  const result = await db
    .select()
    .from(consents)
    .where(and(eq(consents.leadId, leadId), eq(consents.consentType, consentType)))
    .limit(1);

  return result.length > 0 && (result[0]?.granted || false);
}

/**
 * Request consent from user via WhatsApp message
 * This function prepares the consent request message
 *
 * @param conversationId - UUID of the conversation
 * @param consentType - Type of consent to request
 * @returns Consent request message to send to user
 */
export function getConsentRequestMessage(consentType: ConsentType): string {
  const messages: Record<ConsentType, string> = {
    photo_analysis:
      'Para analizar tu foto de manera precisa, necesito tu consentimiento para procesar la imagen. ' +
      'Los datos se procesarán de forma segura y confidencial según la Ley 1581/2012 de Colombia. ' +
      '¿Me autorizas a analizar la foto? (Responde Sí o No)',

    audio_transcription:
      'Para transcribir tu nota de voz, necesito tu consentimiento para procesar el audio. ' +
      'El audio se procesará de forma segura y confidencial según la Ley 1581/2012 de Colombia. ' +
      '¿Me autorizas a transcribir el audio? (Responde Sí o No)',

    document_processing:
      'Para procesar tu documento, necesito tu consentimiento para extraer y analizar la información. ' +
      'Los datos se procesarán de forma segura y confidencial según la Ley 1581/2012 de Colombia. ' +
      '¿Me autorizas a procesar el documento? (Responde Sí o No)',

    appointment_booking:
      'Para agendar tu cita, necesito tu consentimiento para almacenar tus datos de contacto y disponibilidad. ' +
      'Los datos se procesarán de forma segura y confidencial según la Ley 1581/2012 de Colombia. ' +
      '¿Me autorizas a procesar tus datos para la cita? (Responde Sí o No)',
  };

  return messages[consentType];
}

/**
 * Record user consent in database
 *
 * @param leadId - UUID of the lead
 * @param conversationId - UUID of the conversation
 * @param consentType - Type of consent
 * @param granted - Whether consent was granted (true) or denied (false)
 * @param method - How consent was obtained (e.g., 'whatsapp_message', 'verbal')
 * @param ipAddress - Optional IP address (if available)
 * @param userAgent - Optional user agent (if available)
 * @returns Inserted consent record
 */
export async function recordConsent(
  leadId: string,
  conversationId: string,
  consentType: ConsentType,
  granted: boolean,
  method: string,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    additionalInfo?: Record<string, unknown>;
  }
): Promise<void> {
  await db.insert(consents).values({
    leadId,
    conversationId,
    consentType,
    granted,
    method,
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
    metadata: metadata?.additionalInfo,
  });

  console.info('[consent] recorded:', {
    leadId,
    consentType,
    granted,
    method,
  });
}

/**
 * Revoke consent (mark as denied)
 *
 * @param leadId - UUID of the lead
 * @param consentType - Type of consent to revoke
 */
export async function revokeConsent(leadId: string, consentType: ConsentType): Promise<void> {
  // Instead of deleting, we insert a new record with granted=false
  // This maintains an audit trail of consent changes
  await db.insert(consents).values({
    leadId,
    conversationId: '', // Unknown at revocation time
    consentType,
    granted: false,
    method: 'revoked',
  });

  console.info('[consent] revoked:', { leadId, consentType });
}

/**
 * Get all consents for a lead
 *
 * @param leadId - UUID of the lead
 * @returns Array of consent records
 */
export async function getLeadConsents(leadId: string) {
  return db.select().from(consents).where(eq(consents.leadId, leadId));
}

/**
 * Check if consent is required for conversation context
 * Determines if we need to ask for consent before processing
 *
 * @param conversationId - UUID of the conversation
 * @param consentType - Type of consent
 * @returns True if consent needs to be requested, false if already granted
 */
export async function requiresConsentRequest(
  conversationId: string,
  consentType: ConsentType
): Promise<boolean> {
  // Get lead ID from conversation
  const leadData = await db
    .select()
    .from(leads)
    .where(eq(leads.conversationId, conversationId))
    .limit(1);

  if (leadData.length === 0 || !leadData[0]) {
    // No lead yet, consent required
    return true;
  }

  // Check if consent already granted
  const hasConsent = await checkConsent(leadData[0].leadId, consentType);
  return !hasConsent;
}
