/**
 * Example Tool Definitions
 * Demonstrates Vercel AI SDK tool calling patterns
 */

import { tool } from 'ai';
import { z } from 'zod';

/**
 * Example tool: Get current time
 * Demonstrates simple tool with no parameters
 *
 * @example
 * ```ts
 * import { generateText } from 'ai';
 * import { openai } from '@/lib/ai/openai';
 * import { getCurrentTimeTool } from '@/lib/ai/tools';
 *
 * const { text } = await generateText({
 *   model: openai('gpt-4o-mini'),
 *   prompt: 'What time is it?',
 *   tools: { getCurrentTime: getCurrentTimeTool }
 * });
 * ```
 */
export const getCurrentTimeTool = tool({
  description: 'Get the current time in ISO 8601 format',
  parameters: z.object({}),
  execute: async () => {
    return {
      time: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  },
});

/**
 * Example tool: Calculate sum
 * Demonstrates tool with parameters and validation
 *
 * @example
 * ```ts
 * import { generateText } from 'ai';
 * import { openai } from '@/lib/ai/openai';
 * import { calculateSumTool } from '@/lib/ai/tools';
 *
 * const { text } = await generateText({
 *   model: openai('gpt-4o-mini'),
 *   prompt: 'What is 25 plus 17?',
 *   tools: { calculateSum: calculateSumTool }
 * });
 * ```
 */
export const calculateSumTool = tool({
  description: 'Add two numbers together',
  parameters: z.object({
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
  }),
  execute: async ({ a, b }) => {
    return {
      sum: a + b,
      operation: `${a} + ${b} = ${a + b}`,
    };
  },
});

/**
 * Example tool: Get weather
 * Demonstrates tool with enum parameters and async execution
 *
 * Note: This is a mock implementation. Replace with real weather API.
 *
 * @example
 * ```ts
 * import { generateText } from 'ai';
 * import { openai } from '@/lib/ai/openai';
 * import { getWeatherTool } from '@/lib/ai/tools';
 *
 * const { text } = await generateText({
 *   model: openai('gpt-4o-mini'),
 *   prompt: 'What is the weather in London?',
 *   tools: { getWeather: getWeatherTool }
 * });
 * ```
 */
export const getWeatherTool = tool({
  description: 'Get current weather for a location',
  parameters: z.object({
    location: z.string().describe('City name or coordinates'),
    unit: z.enum(['celsius', 'fahrenheit']).default('celsius').describe('Temperature unit'),
  }),
  execute: async ({ location, unit }) => {
    // Mock implementation - replace with real weather API
    const temperature = unit === 'celsius' ? 20 : 68;
    const symbol = unit === 'celsius' ? 'C' : 'F';

    return {
      location,
      temperature: `${temperature}${symbol}`,
      condition: 'Partly cloudy',
      humidity: '65%',
      windSpeed: '10 km/h',
    };
  },
});

/**
 * Collection of all example tools
 * Use this for quick testing of tool calling
 *
 * @example
 * ```ts
 * import { generateText } from 'ai';
 * import { openai } from '@/lib/ai/openai';
 * import { exampleTools } from '@/lib/ai/tools';
 *
 * const { text } = await generateText({
 *   model: openai('gpt-4o-mini'),
 *   prompt: 'What time is it and what is 5 + 3?',
 *   tools: exampleTools
 * });
 * ```
 */
export const exampleTools = {
  getCurrentTime: getCurrentTimeTool,
  calculateSum: calculateSumTool,
  getWeather: getWeatherTool,
};
