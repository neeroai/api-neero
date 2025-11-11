/**
 * Vercel AI SDK 5.0 Types
 * Source: https://sdk.vercel.ai/docs
 */

import type { CoreMessage, CoreTool, ToolCallPart, ToolResultPart } from 'ai';

// Re-export core types
export type { CoreMessage, CoreTool, ToolCallPart, ToolResultPart };

// Message Types
export interface UserMessage {
  role: 'user';
  content: string;
}

export interface AssistantMessage {
  role: 'assistant';
  content: string;
  toolCalls?: ToolCallPart[];
}

export interface SystemMessage {
  role: 'system';
  content: string;
}

export interface ToolMessage {
  role: 'tool';
  content: ToolResultPart[];
}

export type Message = UserMessage | AssistantMessage | SystemMessage | ToolMessage;

// Streaming Types
export interface StreamingTextResponse {
  textStream: ReadableStream<string>;
  fullStream: ReadableStream<any>;
  text: Promise<string>;
  usage: Promise<{
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }>;
}

// Tool Definition Types
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameter>;
    required?: string[];
  };
  execute: (args: any) => Promise<any> | any;
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  items?: {
    type: string;
  };
}

// Structured Output Types
export interface StructuredOutputConfig<T> {
  schema: T;
  mode?: 'auto' | 'tool';
}

// Generation Config Types
export interface GenerationConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
}

// Error Types
export interface AIError {
  name: string;
  message: string;
  code?: string;
  statusCode?: number;
  cause?: unknown;
}

// Provider Types
export interface OpenAIConfig {
  apiKey: string;
  organization?: string;
  baseURL?: string;
}

// Chat Completion Types
export interface ChatCompletionRequest {
  messages: CoreMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: CoreTool[];
  toolChoice?: 'auto' | 'required' | { type: 'tool'; toolName: string };
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: CoreMessage;
    finishReason: string;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
