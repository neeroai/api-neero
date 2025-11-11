/**
 * Type Re-exports
 * Centralized type imports for convenience
 *
 * @example
 * ```ts
 * // Instead of multiple imports:
 * import { WhatsAppTextMessage } from '@/lib/types/whatsapp';
 * import { CoreMessage } from '@/lib/types/ai';
 *
 * // Use single import:
 * import { WhatsAppTextMessage, CoreMessage } from '@/lib/types';
 * ```
 */

export type {
  WhatsAppWebhookPayload,
  WhatsAppEntry,
  WhatsAppChange,
  WhatsAppValue,
  WhatsAppMetadata,
  WhatsAppContact,
  WhatsAppIncomingMessage,
  WhatsAppBaseMessage,
  WhatsAppTextMessage,
  WhatsAppAudioMessage,
  WhatsAppImageMessage,
  WhatsAppInteractiveMessage,
  WhatsAppOutgoingTextMessage,
  WhatsAppOutgoingInteractiveMessage,
  WhatsAppInteractiveContent,
  WhatsAppButtonsContent,
  WhatsAppListContent,
  WhatsAppStatus,
  WhatsAppSendMessageResponse,
  WhatsAppErrorResponse,
} from './whatsapp';

export type {
  CoreMessage,
  CoreTool,
  ToolCallPart,
  ToolResultPart,
  UserMessage,
  AssistantMessage,
  SystemMessage,
  ToolMessage,
  Message,
  StreamingTextResponse,
  ToolDefinition,
  ToolParameter,
  StructuredOutputConfig,
  GenerationConfig,
  AIError,
  OpenAIConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from './ai';
