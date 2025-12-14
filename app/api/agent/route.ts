import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkServiceWindow } from '@/lib/bird/service-window';
import { sendTemplateMessage, sendTextMessage } from '@/lib/bird/messages';
import { registerLead } from '@/lib/bird/leads';
import { notifyHandover } from '@/lib/bird/handover';
import { fetchLatestMediaFromConversation } from '@/lib/bird/fetch-latest-media';
import { getOptionalChannelId, getWebhookSecret } from '@/lib/bird/env';

export const runtime = 'edge';

const IncomingMessageSchema = z.object({
  id: z.string().optional(),
  channelId: z.string().optional(),
  conversationId: z.string().optional(),
  sender: z
    .object({
      contact: z
        .object({
          id: z.string().optional(),
          identifierValue: z.string().optional(),
          displayName: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  receiver: z
    .object({
      connector: z.object({ id: z.string().optional() }).optional(),
    })
    .optional(),
  body: z
    .object({
      type: z.enum(['text', 'image', 'file', 'location']).optional(),
      text: z.object({ text: z.string().optional() }).optional(),
    })
    .optional(),
});

const ToolkitSchema = z.object({
  action: z.enum([
    'checkServiceWindow',
    'sendTemplate',
    'sendText',
    'registerLead',
    'handover',
    'fetchLatestMedia',
  ]),
  payload: z.record(z.unknown()),
});

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

async function guardWebhookAuth(request: Request) {
  const secret = getWebhookSecret();
  if (!secret) return true;

  const token = request.headers.get('authorization');
  if (!token) return false;

  return token === `Bearer ${secret}` || token === `AccessKey ${secret}`;
}

async function handleIncoming(body: unknown) {
  const parsed = IncomingMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid incoming payload', detail: parsed.error }, { status: 400 });
  }

  const payload = parsed.data;
  const channelId = payload.channelId ?? payload.receiver?.connector?.id ?? getOptionalChannelId();
  const contactId = payload.sender?.contact?.id;
  const phone = payload.sender?.contact?.identifierValue;
  const conversationId = payload.conversationId;

  if (!channelId || !contactId || !phone) {
    return NextResponse.json(
      { error: 'missing channelId/contactId/phone' },
      { status: 400 }
    );
  }

  let windowState: 'open' | 'closed' = 'closed';
  try {
    const windowResult = await checkServiceWindow({
      channelId,
      contactId,
      phoneNumber: phone,
    });
    windowState = windowResult.state;
  } catch (error) {
    console.error('[agent] service window check failed', error);
  }

  const baseGreeting =
    'Hola, soy Eva, asistente del Dr. Andrés Durán. ¿En qué procedimiento estás interesada/o?';
  const buttons = ['Lipo High Tech 3', 'Mamoplastia', 'Rinoplastia'];

  try {
    if (windowState === 'open') {
      await sendTextMessage({
        channelId,
        to: phone,
        text: baseGreeting,
        buttons,
      });
    } else {
      const templateName = process.env.BIRD_TEMPLATE_REENGAGEMENT ?? 'reengagement_valoracion';
      try {
        await sendTemplateMessage({
          channelId,
          to: phone,
          name: templateName,
          locale: 'es',
          variables: { '1': 'Hola, soy Eva del Dr. Durán.' },
        });
      } catch (error) {
        console.warn('[agent] template send failed, fallback to text', error);
        await sendTextMessage({
          channelId,
          to: phone,
          text: 'Gracias por escribirnos. Para continuar necesito enviarte un mensaje autorizado. ¿Confirmas?',
          buttons: ['Sí, continuar'],
        });
      }
    }
  } catch (error) {
    console.error('[agent] reply send failed', error);
  }

  const intent = payload.body?.text?.text;
  registerLead({
    phone,
    name: payload.sender?.contact?.displayName,
    procedure: intent,
    channel: 'whatsapp',
    conversationId,
  }).catch((error) => console.error('[lead] failed', error));

  const intentLower = intent?.toLowerCase() ?? '';
  const shouldHandover =
    intentLower.includes('precio') ||
    intentLower.includes('pago') ||
    intentLower.includes('agendar') ||
    intentLower.includes('agenda') ||
    intentLower.includes('cita');

  if (shouldHandover) {
    notifyHandover({
      reason: 'user_requested_pricing_or_booking',
      phone,
      conversationId,
      channel: 'whatsapp',
      notes: intent,
    }).catch((error) => console.error('[handover] failed', error));
  }

  return NextResponse.json({
    ok: true,
    windowState,
  });
}

async function handleToolkit(body: unknown) {
  const parsed = ToolkitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid toolkit payload', detail: parsed.error }, { status: 400 });
  }

  const { action, payload } = parsed.data;

  try {
    if (action === 'checkServiceWindow') {
      const input = z
        .object({
          channelId: z.string(),
          contactId: z.string(),
          phoneNumber: z.string(),
        })
        .parse(payload);
      const result = await checkServiceWindow(input);
      return NextResponse.json(result);
    }

    if (action === 'sendTemplate') {
      const input = z
        .object({
          channelId: z.string(),
          to: z.string(),
          name: z.string(),
          locale: z.string().optional(),
          variables: z.record(z.string()).optional(),
        })
        .parse(payload);
      const result = await sendTemplateMessage(input);
      return NextResponse.json(result);
    }

    if (action === 'sendText') {
      const input = z
        .object({
          channelId: z.string(),
          to: z.string(),
          text: z.string(),
          buttons: z.array(z.string()).optional(),
        })
        .parse(payload);
      const result = await sendTextMessage(input);
      return NextResponse.json(result);
    }

    if (action === 'registerLead') {
      const input = z
        .object({
          name: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
          country: z.string().optional(),
          procedure: z.string().optional(),
          modality: z.string().optional(),
          city: z.string().optional(),
          channel: z.string().optional(),
          conversationId: z.string().optional(),
          metadata: z.record(z.unknown()).optional(),
        })
        .parse(payload);
      const result = await registerLead(input);
      return NextResponse.json(result);
    }

    if (action === 'handover') {
      const input = z
        .object({
          reason: z.string(),
          conversationId: z.string().optional(),
          contactId: z.string().optional(),
          phone: z.string().optional(),
          channel: z.string().optional(),
          notes: z.string().optional(),
        })
        .parse(payload);
      const result = await notifyHandover(input);
      return NextResponse.json(result);
    }

    if (action === 'fetchLatestMedia') {
      const input = z
        .object({
          conversationId: z.string().uuid(),
        })
        .parse(payload);
      const result = await fetchLatestMediaFromConversation(input.conversationId);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('[agent] toolkit action failed', error);
    return NextResponse.json({ error: 'action_failed', detail: `${error}` }, { status: 500 });
  }

  return NextResponse.json({ error: 'unsupported action' }, { status: 400 });
}

export async function POST(request: Request) {
  const allowed = await guardWebhookAuth(request);
  if (!allowed) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'invalid json', detail: `${error}` }, { status: 400 });
  }

  if (typeof body === 'object' && body && 'action' in body) {
    return handleToolkit(body);
  }

  return handleIncoming(body);
}
