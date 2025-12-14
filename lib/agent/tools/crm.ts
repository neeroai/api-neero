import { tool } from 'ai';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { leads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { registerLead as registerLeadWebhook } from '@/lib/bird/leads';

const upsertLeadSchema = z.object({
  conversationId: z.string().uuid().describe('UUID de la conversación en Bird'),
  name: z.string().min(2).optional().describe('Nombre completo del paciente'),
  phone: z
    .string()
    .min(7)
    .optional()
    .describe('Número de teléfono (formato internacional)'),
  email: z.string().email().optional().describe('Correo electrónico'),
  country: z.string().min(2).optional().describe('País (ej: Colombia)'),
  city: z.string().optional().describe('Ciudad (ej: Bogotá)'),
  procedureInterest: z
    .string()
    .optional()
    .describe('Procedimiento de interés (ej: Rinoplastia, Mamoplastia)'),
  stage: z
    .enum(['new', 'contacted', 'qualified', 'appointment_scheduled'])
    .default('new')
    .describe('Etapa en el funnel de conversión'),
  metadata: z
    .record(z.unknown())
    .optional()
    .describe('Metadata adicional (custom fields)'),
});

/**
 * Upsert Lead Tool
 * Creates or updates lead in CRM with patient data
 *
 * Stores in Neon PostgreSQL and optionally syncs to external CRM via webhook
 */
export const upsertLeadTool = tool({
  description:
    'Crea o actualiza lead en CRM con datos del paciente. Registra procedimientos de interés, datos de contacto, y etapa del funnel.',
  inputSchema: upsertLeadSchema,
  execute: async (params) => {
    const {
      conversationId,
      name,
      phone,
      email,
      country,
      city,
      procedureInterest,
      stage,
      metadata,
    } = params;
    try {
      // 1. Check if lead already exists
      const existing = await db
        .select()
        .from(leads)
        .where(eq(leads.conversationId, conversationId))
        .limit(1);

      let leadData;

      if (existing.length > 0 && existing[0]) {
        // 2a. Update existing lead
        const updated = await db
          .update(leads)
          .set({
            name: name ?? existing[0].name,
            phone: phone ?? existing[0].phone,
            email: email ?? existing[0].email,
            country: country ?? existing[0].country,
            city: city ?? existing[0].city,
            procedureInterest: procedureInterest ?? existing[0].procedureInterest,
            stage,
            metadata: metadata ?? existing[0].metadata,
            updatedAt: new Date(),
          })
          .where(eq(leads.conversationId, conversationId))
          .returning();

        leadData = updated[0];

        if (leadData) {
          console.info('[upsertLeadTool] Lead updated:', {
            leadId: leadData.leadId,
            stage,
          });
        }
      } else {
        // 2b. Insert new lead
        const inserted = await db
          .insert(leads)
          .values({
            conversationId,
            name,
            phone,
            email,
            country,
            city,
            procedureInterest,
            stage,
            source: 'whatsapp',
            metadata,
          })
          .returning();

        leadData = inserted[0];

        if (leadData) {
          console.info('[upsertLeadTool] Lead created:', {
            leadId: leadData.leadId,
            stage,
          });
        }
      }

      if (!leadData) {
        throw new Error('Failed to create or update lead');
      }

      // 3. Optionally sync to external CRM via webhook
      if (process.env.LEADS_WEBHOOK_URL) {
        await registerLeadWebhook({
          name: leadData.name ?? undefined,
          phone: leadData.phone ?? undefined,
          email: leadData.email ?? undefined,
          country: leadData.country ?? undefined,
          city: leadData.city ?? undefined,
          procedure: leadData.procedureInterest ?? undefined,
          channel: 'whatsapp',
          conversationId,
          metadata: leadData.metadata as Record<string, unknown> | undefined,
        }).catch((error) => {
          console.warn('[upsertLeadTool] Webhook sync failed:', error);
        });
      }

      return {
        success: true,
        leadId: leadData.leadId,
        stage: leadData.stage,
        isNew: existing.length === 0,
        message: existing.length === 0 ? 'Lead creado exitosamente.' : 'Lead actualizado.',
      };
    } catch (error) {
      console.error('[upsertLeadTool] Error:', error);
      return {
        success: false,
        error: 'upsert_failed',
        message:
          error instanceof Error
            ? `Error al guardar lead: ${error.message}`
            : 'Error desconocido al guardar lead.',
      };
    }
  },
});
