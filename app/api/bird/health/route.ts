/**
 * Bird Actions Health Check Endpoint
 * Verifies API and AI service availability
 * Edge Runtime compatible
 */

import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Health check response
 */
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    gemini: boolean;
    groq: boolean;
    openai?: boolean;
  };
  errors?: string[];
}

/**
 * GET /api/bird/health
 * Check API and AI service health status
 */
export async function GET(): Promise<Response> {
  const errors: string[] = [];
  const services = {
    gemini: false,
    groq: false,
    openai: undefined as boolean | undefined,
  };

  // Check Gemini API key (required)
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    services.gemini = true;
  } else {
    errors.push('Missing GOOGLE_GENERATIVE_AI_API_KEY');
  }

  // Check Groq API key (required)
  if (process.env.GROQ_API_KEY) {
    services.groq = true;
  } else {
    errors.push('Missing GROQ_API_KEY');
  }

  // Check OpenAI API key (optional - fallback for audio)
  if (process.env.OPENAI_API_KEY) {
    services.openai = true;
  }

  // Determine overall health status
  // healthy: gemini + groq (primary audio provider)
  // degraded: gemini present but missing groq (only openai fallback)
  // unhealthy: missing gemini or both audio providers
  const hasGemini = services.gemini;
  const hasGroq = services.groq;
  const hasOpenAI = services.openai === true;

  let status: HealthCheckResponse['status'];
  if (hasGemini && hasGroq) {
    status = 'healthy'; // Primary configuration
  } else if (hasGemini && hasOpenAI && !hasGroq) {
    status = 'degraded'; // Only fallback audio available
  } else {
    status = 'unhealthy'; // Missing critical services
  }

  const response: HealthCheckResponse = {
    status,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services,
    errors: errors.length > 0 ? errors : undefined,
  };

  // Return 503 if unhealthy (critical services unavailable)
  const statusCode = status === 'unhealthy' ? 503 : 200;

  return NextResponse.json(response, { status: statusCode });
}
