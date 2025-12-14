import { tool } from 'ai';
import { z } from 'zod';
import { checkServiceWindow } from '@/lib/bird/service-window';
import { sendTextMessage, sendTemplateMessage } from '@/lib/bird/messages';
import { db } from '@/lib/db/client';
import { leads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const sendMessageSchema = z.object({
  conversationId: z.string().uuid().describe('UUID de la conversación en Bird'),
  text: z.string().min(1).describe('Texto del mensaje a enviar'),
  buttons: z
    .array(z.string())
    .max(3)
    .optional()
    .describe('Botones de respuesta rápida (máximo 3)'),
  useTemplate: z
    .boolean()
    .default(true)
    .describe('Si debe usar template cuando ventana está cerrada'),
  templateName: z
    .string()
    .optional()
    .describe('Nombre del template (si useTemplate=true y ventana cerrada)'),
});

/**
 * Send Message Tool
 * Sends WhatsApp message with automatic 24h service window check
 *
 * IMPORTANT:
 * - Inside 24h window: Can send normal text messages
 * - Outside 24h window: Must use WhatsApp approved templates
 * - Templates require Meta approval (~24h process)
 *
 * WhatsApp Compliance:
 * - 24h service window starts after user message
 * - Templates bypass the 24h window restriction
 * - Maximum 3 buttons per message
 */
export const sendMessageTool = tool({
  description:
    'Envía mensaje de WhatsApp verificando ventana de 24h. Automáticamente usa template si la ventana está cerrada.',
  inputSchema: sendMessageSchema,
  execute: async (params) => {
    const { conversationId, text, buttons, useTemplate, templateName } = params;
    try {
      // 1. Get lead data to extract phone and channelId
      const leadData = await db
        .select()
        .from(leads)
        .where(eq(leads.conversationId, conversationId))
        .limit(1);

      if (leadData.length === 0 || !leadData[0] || !leadData[0].phone) {
        return {
          success: false,
          error: 'lead_not_found',
          message: 'No se encontró información del contacto en la conversación.',
        };
      }

      const phone = leadData[0].phone;
      const channelId = process.env.BIRD_CHANNEL_ID;

      if (!channelId) {
        return {
          success: false,
          error: 'missing_config',
          message: 'BIRD_CHANNEL_ID no configurado.',
        };
      }

      // 2. Check 24h service window
      let windowState: 'open' | 'closed' = 'closed';
      try {
        const windowResult = await checkServiceWindow({
          channelId,
          contactId: leadData[0].leadId, // Using leadId as contactId
          phoneNumber: phone,
        });
        windowState = windowResult.state;
      } catch (error) {
        console.warn('[sendMessageTool] Service window check failed, assuming closed:', error);
      }

      // 3. Send message based on window state
      if (windowState === 'open') {
        // Inside 24h window: send normal text message
        await sendTextMessage({
          channelId,
          to: phone,
          text,
          buttons,
        });

        return {
          success: true,
          windowState: 'open',
          method: 'text_message',
          message: 'Mensaje enviado (ventana de 24h abierta).',
        };
      }

      // Outside 24h window: must use template
      if (useTemplate) {
        const template = templateName || process.env.BIRD_TEMPLATE_REENGAGEMENT || 'reengagement';

        try {
          await sendTemplateMessage({
            channelId,
            to: phone,
            name: template,
            locale: 'es',
            variables: {
              '1': text.substring(0, 100), // First 100 chars as template variable
            },
          });

          return {
            success: true,
            windowState: 'closed',
            method: 'template',
            templateName: template,
            message: 'Template enviado (ventana de 24h cerrada).',
          };
        } catch (error) {
          console.error('[sendMessageTool] Template send failed:', error);

          // Fallback: inform user about window restriction
          return {
            success: false,
            error: 'template_send_failed',
            windowState: 'closed',
            message:
              'No se pudo enviar el mensaje. La ventana de 24h está cerrada y el template falló.',
          };
        }
      }

      // useTemplate=false and window closed: not allowed
      return {
        success: false,
        error: 'window_closed',
        windowState: 'closed',
        message:
          'No se puede enviar mensaje. La ventana de 24h está cerrada y useTemplate=false.',
      };
    } catch (error) {
      console.error('[sendMessageTool] Error:', error);
      return {
        success: false,
        error: 'send_failed',
        message:
          error instanceof Error
            ? `Error al enviar mensaje: ${error.message}`
            : 'Error desconocido al enviar mensaje.',
      };
    }
  },
});
