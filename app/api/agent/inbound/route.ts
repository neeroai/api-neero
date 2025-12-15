import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { AgentInboundRequestSchema, type AgentInboundResponse } from '@/lib/agent/types';
import { reconstructContext, saveMessage, updateConversationState } from '@/lib/agent/conversation';
import { validateResponse, getSafeFallback, extractMetadata } from '@/lib/agent/guardrails';
import {
  analyzePhotoTool,
  transcribeAudioTool,
  extractDocumentTool,
} from '@/lib/agent/tools/media';
import { upsertLeadTool } from '@/lib/agent/tools/crm';
import { sendMessageTool } from '@/lib/agent/tools/whatsapp';
import { createTicketTool, executeHandover } from '@/lib/agent/tools/handover';
import { retrieveKnowledgeTool } from '@/lib/agent/tools/retrieve-knowledge';
import { EVA_SYSTEM_PROMPT } from '@/lib/agent/prompts/eva-system';

export const runtime = 'edge';

/**
 * Authenticate request
 */
function authenticate(request: Request): boolean {
  const apiKey = process.env.NEERO_API_KEY;
  if (!apiKey) {
    // No API key configured, allow all requests
    return true;
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return false;
  }

  const token = authHeader.replace('Bearer ', '').replace('AccessKey ', '');
  return token === apiKey;
}

/**
 * Inbound Agent Endpoint
 * Handles incoming WhatsApp messages from Bird AI Employee
 */
export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    // 1. Authenticate
    if (!authenticate(request)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'invalid json', detail: `${error}` },
        { status: 400 }
      );
    }

    const parsed = AgentInboundRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'invalid request', detail: parsed.error },
        { status: 400 }
      );
    }

    const { context, message } = parsed.data;
    const { conversationId } = context;

    // 3. Check for duplicate message (idempotency)
    // TODO: Implement duplicate detection if needed

    // 4. Reconstruct conversation context
    const conversationContext = await reconstructContext(conversationId);

    // 5. Build message history for AI
    const messages = conversationContext.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add current user message
    const currentMessage = message?.text || '(no text)';
    messages.push({
      role: 'user' as const,
      content: currentMessage,
    });

    // 6. Call AI with tools
    let aiResponse;
    try {
      aiResponse = await generateText({
        model: google('gemini-2.0-flash-exp'),
        system: EVA_SYSTEM_PROMPT,
        messages,
        tools: {
          analyzePhoto: analyzePhotoTool,
          transcribeAudio: transcribeAudioTool,
          extractDocument: extractDocumentTool,
          upsertLead: upsertLeadTool,
          sendMessage: sendMessageTool,
          createTicket: createTicketTool,
          retrieveKnowledge: retrieveKnowledgeTool,
        },
        toolChoice: 'auto',
        temperature: 0.7,
      });
    } catch (error) {
      console.error('[inbound] AI generation failed:', error);
      return NextResponse.json(
        {
          error: 'ai_generation_failed',
          detail: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    const aiText = aiResponse.text;

    // 7. Validate response with guardrails
    const guardrailsValidation = validateResponse(aiText);

    // 7.1 Extract structured metadata (Hybrid Approach)
    const structuredMetadata = extractMetadata(aiText, guardrailsValidation);

    let finalResponse: string;
    let status: AgentInboundResponse['status'] = 'continued';
    let handoverReason: string | undefined;

    if (!guardrailsValidation.safe) {
      console.warn('[inbound] Guardrails violation:', guardrailsValidation.violations);

      // Use safe fallback response
      finalResponse = getSafeFallback(guardrailsValidation.severity);

      // If critical, trigger handover
      if (guardrailsValidation.severity === 'critical') {
        status = 'handover';
        handoverReason = 'guardrails_violation_critical';

        // Create handover ticket
        try {
          await executeHandover({
            reason: 'medical_advice',
            conversationId,
            summary: `Guardrails violation: ${guardrailsValidation.violations.join(', ')}`,
            priority: 'high',
            notes: `Original AI response: ${aiText}`,
          });
        } catch (error) {
          console.error('[inbound] Failed to create handover ticket:', error);
        }
      } else if (guardrailsValidation.severity === 'high') {
        status = 'handover';
        handoverReason = 'guardrails_violation_high';

        // Create handover ticket with medium priority
        try {
          await executeHandover({
            reason: 'pricing',
            conversationId,
            summary: `Guardrails violation: ${guardrailsValidation.violations.join(', ')}`,
            priority: 'medium',
            notes: `Original AI response: ${aiText}`,
          });
        } catch (error) {
          console.error('[inbound] Failed to create handover ticket:', error);
        }
      }
    } else {
      finalResponse = aiText;

      // Check if any tool calls triggered handover
      if (aiResponse.toolCalls && aiResponse.toolCalls.length > 0) {
        const handoverCall = aiResponse.toolCalls.find((call) => 'toolName' in call && call.toolName === 'createTicket');

        if (handoverCall && 'args' in handoverCall) {
          status = 'handover';
          handoverReason = ((handoverCall.args as Record<string, unknown>).reason as string) || 'user_requested';
        }
      }
    }

    // 8. Save messages to database
    try {
      // Save user message
      await saveMessage(conversationId, 'incoming', currentMessage, {
        attachmentsMeta: message?.attachments || undefined,
      });

      // Save AI response with structured metadata
      await saveMessage(conversationId, 'outgoing', finalResponse, {
        model: 'gemini-2.0-flash-exp',
        tokensUsed: aiResponse.usage,
        processingTimeMs: Date.now() - startTime,
        toolCalls: aiResponse.toolCalls,
        metadata: structuredMetadata,
      });
    } catch (error) {
      console.error('[inbound] Failed to save messages:', error);
      // Non-fatal, continue
    }

    // 9. Update conversation state
    try {
      await updateConversationState(conversationId, {
        currentStage: status === 'handover' ? 'requires_human' : 'active',
        requiresHuman: status === 'handover',
        handoverReason,
      });
    } catch (error) {
      console.error('[inbound] Failed to update conversation state:', error);
      // Non-fatal, continue
    }

    // 10. Return response to Bird AI Employee
    const response: AgentInboundResponse = {
      reply: finalResponse,
      channelOps: [], // Could add operations like markAsRead, typing indicators, etc.
      status,
      handoverReason,
      metadata: {
        processingTimeMs: Date.now() - startTime,
        model: 'gemini-2.0-flash-exp',
        tokensUsed: aiResponse.usage?.totalTokens,
        guardrailsViolations: guardrailsValidation.violations,
      },
    };

    console.info('[inbound] Success:', {
      conversationId,
      status,
      processingTimeMs: response.metadata?.processingTimeMs,
      guardrailsViolations: guardrailsValidation.violations.length,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[inbound] Unhandled error:', error);

    return NextResponse.json(
      {
        reply: 'Disculpa, tuve un problema técnico. Un asesor te contactará pronto.',
        status: 'error',
        error: 'internal_server_error',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
