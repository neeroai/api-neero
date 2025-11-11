/**
 * Conversation Context Management
 * Utilities for managing conversation history within token limits
 */

import type { CoreMessage } from 'ai';

/**
 * Estimates token count for a message
 * Rough approximation: 1 token ~= 4 characters
 *
 * @param message - Message to estimate
 * @returns Estimated token count
 */
function estimateTokens(message: CoreMessage): number {
  const content = typeof message.content === 'string'
    ? message.content
    : JSON.stringify(message.content);

  return Math.ceil(content.length / 4);
}

/**
 * Limits conversation history to most recent messages
 * Keeps system messages and truncates older user/assistant messages
 *
 * @param messages - Full conversation history
 * @param limit - Maximum number of messages to keep (excluding system)
 * @returns Truncated message array
 *
 * @example
 * ```ts
 * const messages = [...]; // 50 messages
 * const limited = formatMessagesForContext(messages, 10);
 * // Returns: system messages + last 10 user/assistant messages
 * ```
 */
export function formatMessagesForContext(
  messages: CoreMessage[],
  limit: number
): CoreMessage[] {
  const systemMessages = messages.filter((m) => m.role === 'system');
  const conversationMessages = messages.filter((m) => m.role !== 'system');

  const recentMessages = conversationMessages.slice(-limit);

  return [...systemMessages, ...recentMessages];
}

/**
 * Summarizes old messages to reduce token usage
 * Keeps recent messages and creates summary of older ones
 *
 * @param messages - Full conversation history
 * @param keepRecentCount - Number of recent messages to keep intact
 * @returns Messages with summarized history
 *
 * @example
 * ```ts
 * const messages = [...]; // 100 messages
 * const summarized = summarizeOldMessages(messages, 20);
 * // Returns: system + summary of first 80 + last 20 messages
 * ```
 */
export function summarizeOldMessages(
  messages: CoreMessage[],
  keepRecentCount = 20
): CoreMessage[] {
  if (messages.length <= keepRecentCount) {
    return messages;
  }

  const systemMessages = messages.filter((m) => m.role === 'system');
  const conversationMessages = messages.filter((m) => m.role !== 'system');

  if (conversationMessages.length <= keepRecentCount) {
    return messages;
  }

  const oldMessages = conversationMessages.slice(0, -keepRecentCount);
  const recentMessages = conversationMessages.slice(-keepRecentCount);

  const summaryText = `[Previous conversation summary: ${oldMessages.length} messages exchanged. ` +
    `Topics discussed: ${extractTopics(oldMessages).join(', ')}]`;

  const summaryMessage: CoreMessage = {
    role: 'system',
    content: summaryText,
  };

  return [...systemMessages, summaryMessage, ...recentMessages];
}

/**
 * Builds context window within specified token limit
 * Intelligently truncates messages to fit within budget
 *
 * @param messages - Full conversation history
 * @param maxTokens - Maximum tokens to use for context
 * @returns Truncated messages within token budget
 *
 * @example
 * ```ts
 * const messages = [...]; // Large conversation
 * const context = buildContextWindow(messages, 4000);
 * // Returns: messages that fit within 4000 tokens
 * ```
 */
export function buildContextWindow(
  messages: CoreMessage[],
  maxTokens: number
): CoreMessage[] {
  const systemMessages = messages.filter((m) => m.role === 'system');
  const conversationMessages = messages.filter((m) => m.role !== 'system');

  let totalTokens = systemMessages.reduce(
    (sum, msg) => sum + estimateTokens(msg),
    0
  );

  const includedMessages: CoreMessage[] = [];

  for (let i = conversationMessages.length - 1; i >= 0; i--) {
    const message = conversationMessages[i];
    const messageTokens = estimateTokens(message);

    if (totalTokens + messageTokens > maxTokens) {
      break;
    }

    includedMessages.unshift(message);
    totalTokens += messageTokens;
  }

  return [...systemMessages, ...includedMessages];
}

/**
 * Extracts key topics from messages for summarization
 * Simple keyword extraction based on message content
 *
 * @param messages - Messages to analyze
 * @returns Array of extracted topics
 */
function extractTopics(messages: CoreMessage[]): string[] {
  const topics = new Set<string>();

  for (const message of messages) {
    if (message.role === 'user' && typeof message.content === 'string') {
      const words = message.content.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (word.length > 5) {
          topics.add(word);
          if (topics.size >= 5) break;
        }
      }
    }
  }

  return Array.from(topics);
}

/**
 * Calculates total estimated tokens for message array
 *
 * @param messages - Messages to count
 * @returns Total estimated token count
 *
 * @example
 * ```ts
 * const messages = [...];
 * const total = estimateTotalTokens(messages);
 * console.log(`Context uses approximately ${total} tokens`);
 * ```
 */
export function estimateTotalTokens(messages: CoreMessage[]): number {
  return messages.reduce((sum, msg) => sum + estimateTokens(msg), 0);
}
