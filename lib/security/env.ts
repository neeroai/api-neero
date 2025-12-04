/**
 * Environment Variable Validation
 * Type-safe validation using Zod schemas
 */

import { z } from 'zod';

/**
 * Schema for OpenAI environment variables
 */
const openAIEnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
});

/**
 * Schema for WhatsApp environment variables
 */
const whatsAppEnvSchema = z.object({
  WHATSAPP_TOKEN: z.string().min(1, 'WHATSAPP_TOKEN is required'),
  WHATSAPP_PHONE_ID: z.string().min(1, 'WHATSAPP_PHONE_ID is required'),
  WHATSAPP_VERIFY_TOKEN: z.string().min(1, 'WHATSAPP_VERIFY_TOKEN is required'),
  WHATSAPP_APP_SECRET: z.string().min(1, 'WHATSAPP_APP_SECRET is required'),
});

/**
 * Schema for application environment variables
 */
const appEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Complete environment schema
 */
const envSchema = z.object({
  ...openAIEnvSchema.shape,
  ...whatsAppEnvSchema.shape,
  ...appEnvSchema.shape,
});

/**
 * Validated environment variables type
 */
export type ValidatedEnv = z.infer<typeof envSchema>;

/**
 * Environment validation error
 */
export class EnvValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: z.ZodError
  ) {
    super(message);
    this.name = 'EnvValidationError';
  }
}

/**
 * Validates all required environment variables
 * Throws EnvValidationError if validation fails
 *
 * @returns Validated environment object
 * @throws EnvValidationError if validation fails
 *
 * @example
 * ```ts
 * // In app startup or API route
 * try {
 *   const env = validateEnv();
 *   console.log('Environment validated successfully');
 * } catch (error) {
 *   if (error instanceof EnvValidationError) {
 *     console.error('Missing environment variables:');
 *     error.errors.errors.forEach(err => {
 *       console.error(`- ${err.path.join('.')}: ${err.message}`);
 *     });
 *   }
 *   process.exit(1);
 * }
 * ```
 */
export function validateEnv(): ValidatedEnv {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errorMessage = 'Environment validation failed. Missing or invalid variables:';
    console.error(errorMessage);

    result.error.errors.forEach((err) => {
      console.error(`- ${err.path.join('.')}: ${err.message}`);
    });

    throw new EnvValidationError(errorMessage, result.error);
  }

  return result.data;
}

/**
 * Validates OpenAI-specific environment variables
 *
 * @returns Validated OpenAI environment
 * @throws EnvValidationError if validation fails
 *
 * @example
 * ```ts
 * const openAIEnv = validateOpenAIEnv();
 * console.log('OpenAI API key configured');
 * ```
 */
export function validateOpenAIEnv(): z.infer<typeof openAIEnvSchema> {
  const result = openAIEnvSchema.safeParse(process.env);

  if (!result.success) {
    throw new EnvValidationError('OpenAI environment validation failed', result.error);
  }

  return result.data;
}

/**
 * Validates WhatsApp-specific environment variables
 *
 * @returns Validated WhatsApp environment
 * @throws EnvValidationError if validation fails
 *
 * @example
 * ```ts
 * const whatsAppEnv = validateWhatsAppEnv();
 * console.log('WhatsApp credentials configured');
 * ```
 */
export function validateWhatsAppEnv(): z.infer<typeof whatsAppEnvSchema> {
  const result = whatsAppEnvSchema.safeParse(process.env);

  if (!result.success) {
    throw new EnvValidationError('WhatsApp environment validation failed', result.error);
  }

  return result.data;
}

/**
 * Checks if environment variable exists without throwing
 *
 * @param key - Environment variable name
 * @returns True if variable exists and is non-empty
 *
 * @example
 * ```ts
 * if (hasEnvVar('OPTIONAL_FEATURE_FLAG')) {
 *   enableFeature();
 * }
 * ```
 */
export function hasEnvVar(key: string): boolean {
  return Boolean(process.env[key]?.trim());
}

/**
 * Gets environment variable with type safety
 *
 * @param key - Environment variable name
 * @param defaultValue - Default value if not set
 * @returns Environment variable value or default
 *
 * @example
 * ```ts
 * const maxRetries = getEnvVar('MAX_RETRIES', '3');
 * const timeout = parseInt(getEnvVar('TIMEOUT_MS', '5000'));
 * ```
 */
export function getEnvVar(key: string, defaultValue = ''): string {
  return process.env[key]?.trim() || defaultValue;
}
