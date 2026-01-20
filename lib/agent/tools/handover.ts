/**
 * @file Handover
 * @description Exports 2 functions and types
 * @module lib/agent/tools/handover
 * @exports createTicketTool, executeHandover
 */
import { tool } from 'ai';
import { z } from 'zod';
import { notifyHandover as notifyHandoverWebhook } from '@/lib/bird/handover';
import { markForHandover } from '../conversation';

const createTicketSchema = z.object({
  reason: z
    .enum([
      'pricing',
      'medical_advice',
      'complaint',
      'urgent_symptom',
      'complex_scheduling',
      'other',
    ])
    .describe('Razón de la escalación'),
  conversationId: z.string().uuid().describe('UUID de la conversación en Bird'),
  summary: z
    .string()
    .min(10)
    .describe('Resumen del contexto de la conversación (qué necesita el usuario)'),
  priority: z
    .enum(['low', 'medium', 'high', 'urgent'])
    .default('medium')
    .describe('Prioridad del ticket'),
  notes: z.string().optional().describe('Notas adicionales para el agente humano'),
});

/**
 * Shared handover logic (exported for use outside tool context)
 */
export async function executeHandover(params: z.infer<typeof createTicketSchema>) {
  const { reason, conversationId, summary, priority, notes } = params;
  try {
    // 1. Mark conversation for handover in database
    await markForHandover(conversationId, reason);

    // 2. Notify external system (Slack, CRM, helpdesk)
    const webhookResult = await notifyHandoverWebhook({
      reason,
      conversationId,
      channel: 'whatsapp',
      notes: notes || summary,
    });

    // 3. Return result
    if (webhookResult.delivered) {
      return {
        success: true,
        reason,
        priority,
        webhookDelivered: true,
        message: 'Conversación escalada a agente humano. Un asesor te contactará pronto.',
      };
    }

    // Webhook not configured or failed (but DB marked)
    return {
      success: true,
      reason,
      priority,
      webhookDelivered: false,
      message:
        'Conversación marcada para revisión humana (webhook no configurado o falló). Un asesor te contactará pronto.',
    };
  } catch (error) {
    console.error('[executeHandover] Error:', error);
    return {
      success: false,
      error: 'handover_failed',
      message:
        error instanceof Error
          ? `Error al escalar conversación: ${error.message}`
          : 'Error desconocido al escalar conversación.',
    };
  }
}

/**
 * Create Ticket Tool (Human Handover)
 * Escalates conversation to human agent with structured context
 *
 * Use cases:
 * - Pricing inquiries (specific prices, payment plans)
 * - Medical advice requests (diagnosis, prescriptions)
 * - Complaints or dissatisfaction
 * - Urgent symptoms or medical emergencies
 * - Complex scheduling requirements
 */
export const createTicketTool = tool({
  description:
    'Escala conversación a agente humano con contexto estructurado. Usa cuando el usuario requiere precios específicos, consejo médico, tiene queja, o situación urgente.',
  inputSchema: createTicketSchema,
  execute: async (params) => {
    return executeHandover(params);
  },
});
