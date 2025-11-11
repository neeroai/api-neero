/**
 * System Prompt Templates
 * Reusable prompts for different use cases
 */

/**
 * Default system prompt for general assistant
 */
export const defaultSystemPrompt = `You are a helpful AI assistant. You provide clear, accurate, and concise responses.

Guidelines:
- Be professional and friendly
- Provide factual information when possible
- Admit when you don't know something
- Keep responses focused and relevant
- Use markdown formatting when appropriate`;

/**
 * Customer support assistant prompt
 * Optimized for handling customer inquiries
 */
export const customerSupportPrompt = `You are a customer support assistant. Your goal is to help customers efficiently and professionally.

Guidelines:
- Be empathetic and patient
- Ask clarifying questions when needed
- Provide step-by-step instructions
- Escalate complex issues when appropriate
- Always maintain a positive tone
- Use the customer's name when known`;

/**
 * Function calling assistant prompt
 * Optimized for using tools effectively
 */
export const functionCallingPrompt = `You are an AI assistant with access to various tools and functions.

Guidelines:
- Use tools when they can provide accurate information
- Explain what tools you're using and why
- Combine multiple tool calls when needed
- Always validate tool results before presenting them
- Fall back to general knowledge when tools aren't available`;

/**
 * WhatsApp assistant prompt
 * Optimized for WhatsApp messaging constraints
 */
export const whatsappAssistantPrompt = `You are an AI assistant communicating via WhatsApp.

Guidelines:
- Keep messages concise (WhatsApp users expect brevity)
- Use emojis sparingly and only when appropriate
- Break long responses into multiple messages
- Use bullet points for lists
- Avoid markdown (not well supported in WhatsApp)
- Be conversational and friendly`;

/**
 * Builds a system prompt with custom instructions
 *
 * @param basePrompt - Base system prompt to extend
 * @param customInstructions - Additional instructions to append
 * @returns Combined system prompt
 *
 * @example
 * ```ts
 * const prompt = buildSystemPrompt(
 *   customerSupportPrompt,
 *   'Our company specializes in AI solutions. Operating hours: 9-5 EST.'
 * );
 * ```
 */
export function buildSystemPrompt(
  basePrompt: string,
  customInstructions: string
): string {
  return `${basePrompt}\n\nAdditional Context:\n${customInstructions}`;
}

/**
 * Builds a system prompt with dynamic variables
 *
 * @param template - Template string with {{variable}} placeholders
 * @param variables - Object with variable values
 * @returns Rendered system prompt
 *
 * @example
 * ```ts
 * const template = 'You are {{name}}, a {{role}} assistant. Today is {{date}}.';
 * const prompt = buildDynamicPrompt(template, {
 *   name: 'Alex',
 *   role: 'customer support',
 *   date: new Date().toLocaleDateString()
 * });
 * ```
 */
export function buildDynamicPrompt(
  template: string,
  variables: Record<string, string>
): string {
  return Object.entries(variables).reduce(
    (result, [key, value]) => result.replace(new RegExp(`{{${key}}}`, 'g'), value),
    template
  );
}

/**
 * Formats conversation context for system prompt
 *
 * @param userName - User's name
 * @param conversationHistory - Summary of previous conversations
 * @returns System prompt with context
 *
 * @example
 * ```ts
 * const prompt = buildContextualPrompt(
 *   'John Doe',
 *   'Previous conversation: User asked about pricing, we sent plan options.'
 * );
 * ```
 */
export function buildContextualPrompt(
  userName: string,
  conversationHistory: string
): string {
  return buildDynamicPrompt(
    `${customerSupportPrompt}\n\nConversation Context:\n- User: {{userName}}\n- History: {{history}}`,
    {
      userName,
      history: conversationHistory,
    }
  );
}
