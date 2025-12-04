# Tool Calling and Agents with AI SDK

Last Updated: 2025-11-11 | AI SDK Version: 5.x

## Overview

Tool calling (function calling) enables AI models to invoke external functions to gather information or perform actions.

**Use Cases**:
- Search web, databases, or APIs
- Execute calendar/reminder operations
- Perform calculations or data transformations
- Multi-step workflows (agentic behavior)

## Basic Concepts

**Tool**: External function the model can invoke
- **description**: What the tool does (helps model decide when to use it)
- **inputSchema**: Parameters with Zod validation
- **execute**: Async function that runs when called

**Tool Call Flow**:
1. User sends prompt
2. Model decides if tools needed
3. Model generates tool call with parameters
4. Tool executes, returns result
5. Model incorporates result into response

## Simple Tool Example

```typescript
import { generateText, tool } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

const { text } = await generateText({
  model: openai('gpt-4o'),
  prompt: 'What is the weather in San Francisco?',
  tools: {
    getWeather: tool({
      description: 'Get current weather for a location',
      inputSchema: z.object({
        location: z.string().describe('City name')
      }),
      execute: async ({ location }) => {
        // Call weather API
        const response = await fetch(
          `https://api.weather.com/v1/${location}`
        )
        return response.json()
      }
    })
  }
})

console.log(text)
// "The weather in San Francisco is 68°F and sunny."
```

## Tool Definition Pattern

```typescript
import { tool } from 'ai'
import { z } from 'zod'

const tools = {
  toolName: tool({
    description: 'What the tool does (helps model decide when to use)',
    inputSchema: z.object({
      param1: z.string().describe('Parameter description'),
      param2: z.number().optional()
    }),
    execute: async ({ param1, param2 }) => {
      // Call API, query DB, or perform operation
      return { result: 'data' }
    }
  })
}
```

**Common patterns**: Single param, multiple params, external API calls, database operations

## Multi-Step Tool Execution (Agentic Loops)

### Basic Multi-Step

```typescript
import { generateText } from 'ai'

const result = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Book me a table at the best Italian restaurant in downtown for tonight at 7pm',
  tools: {
    searchRestaurants: tool({
      description: 'Search for restaurants',
      inputSchema: z.object({
        cuisine: z.string(),
        location: z.string()
      }),
      execute: async ({ cuisine, location }) => {
        return [
          { name: 'Trattoria Roma', rating: 4.5, phone: '555-0100' },
          { name: 'La Bella Italia', rating: 4.7, phone: '555-0101' }
        ]
      }
    }),
    makeReservation: tool({
      description: 'Make a restaurant reservation',
      inputSchema: z.object({
        restaurant: z.string(),
        phone: z.string(),
        time: z.string(),
        partySize: z.number()
      }),
      execute: async ({ restaurant, phone, time, partySize }) => {
        // Call reservation API
        return { confirmed: true, confirmationNumber: 'ABC123' }
      }
    })
  },
  maxToolRoundtrips: 5  // Allow up to 5 tool iterations
})

// Model automatically:
// 1. Calls searchRestaurants for Italian restaurants
// 2. Analyzes results, picks best one
// 3. Calls makeReservation with details
// 4. Generates final response with confirmation
```

### Control Multi-Step with stopWhen

```typescript
import { generateText, stepCountIs } from 'ai'

const result = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Research and summarize the latest AI developments',
  tools: { searchWeb, summarize },
  maxToolRoundtrips: 10,
  stopWhen: stepCountIs(5),  // Stop after 5 steps
  // OR custom condition
  stopWhen: (step) => {
    // Stop if no more tool calls
    return step.toolCalls.length === 0
  }
})
```

### Modify Per-Step with prepareStep

```typescript
const result = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Analyze this data and create a report',
  tools: { getData, analyzeData, generateReport },
  maxToolRoundtrips: 3,

  prepareStep: (step) => {
    // Use cheaper model after first step
    if (step.stepIndex > 0) {
      return {
        model: openai('gpt-4o-mini'),
        tools: { generateReport }  // Limit tools
      }
    }
    return step
  }
})
```

## Real-World Examples (Neero Patterns)

**Reminders (WhatsApp Bot with Supabase)**:
```typescript
const tools = {
  createReminder: tool({
    description: 'Create a reminder',
    inputSchema: z.object({ title: z.string(), datetime: z.string() }),
    execute: async ({ title, datetime }, { userId }) => {
      await supabase.from('reminders').insert({ user_id: userId, title, datetime })
      return { success: true, message: `Reminder "${title}" created` }
    }
  }),
  listReminders: tool({
    description: 'List upcoming reminders',
    inputSchema: z.object({ limit: z.number().default(10) }),
    execute: async ({ limit }, { userId }) => {
      const { data } = await supabase.from('reminders')
        .select('*').eq('user_id', userId).gte('datetime', new Date().toISOString())
        .order('datetime').limit(limit)
      return data
    }
  })
}

const result = await generateText({
  model: openai('gpt-4o-mini'),
  prompt: 'Recuérdame comprar leche mañana a las 9am',
  tools,
  experimental_toolCallContext: { userId: 'user-123' }
})
```

**Expense Tracking**: Similar pattern with `createExpense`, `getExpenseSummary` tools
**Meeting Scheduling (Multi-Step)**: `checkAvailability` → `createMeeting` → `sendMeetingInvite` (maxToolRoundtrips: 5)

## Tool Error Handling

### Handle Tool Execution Errors

```typescript
const tools = {
  fetchUserData: tool({
    description: 'Fetch user data from API',
    inputSchema: z.object({ userId: z.string() }),
    execute: async ({ userId }) => {
      try {
        const response = await fetch(`https://api.example.com/users/${userId}`)
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        return await response.json()
      } catch (error) {
        // Return error information to model
        return {
          error: true,
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  })
}
```

### Tool Call Errors

```typescript
import { generateText, NoSuchToolError, InvalidToolInputError } from 'ai'

try {
  const result = await generateText({
    model: openai('gpt-4o'),
    prompt: 'Create a reminder',
    tools
  })
} catch (error) {
  if (error instanceof NoSuchToolError) {
    console.error('Model called undefined tool:', error.toolName)
  } else if (error instanceof InvalidToolInputError) {
    console.error('Invalid tool input:', error.toolInput)
  }
}
```

### Automatic Recovery in Multi-Step

```typescript
const result = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Get weather for New York',
  tools: {
    getWeather: tool({
      description: 'Get weather',
      inputSchema: z.object({ location: z.string() }),
      execute: async ({ location }) => {
        const response = await fetch(`https://api.weather.com/${location}`)
        if (!response.ok) {
          // Return error - model can retry or use different approach
          return { error: 'Weather service unavailable' }
        }
        return await response.json()
      }
    })
  },
  maxToolRoundtrips: 3  // Allow retries
})
```

## Edge Runtime Patterns

### Tool Calling in Edge Functions

```typescript
// app/api/chat/route.ts
export const runtime = 'edge'

import { streamText, tool } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

export async function POST(req: Request) {
  const { messages, userId } = await req.json()

  const tools = {
    createReminder: tool({
      description: 'Create a reminder',
      inputSchema: z.object({
        title: z.string(),
        datetime: z.string()
      }),
      execute: async ({ title, datetime }) => {
        const supabase = createClient()
        await supabase.from('reminders').insert({
          user_id: userId,
          title,
          datetime
        })
        return { success: true }
      }
    })
  }

  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages,
    tools,
    maxToolRoundtrips: 3  // Limit iterations for Edge timeout (300s)
  })

  return result.toDataStreamResponse()
}
```

## Dynamic Tools

### Runtime-Defined Tools

```typescript
import { dynamicTool } from 'ai'

// For MCP tools or user-defined functions
const tools = {
  customTool: dynamicTool({
    description: 'User-defined tool',
    inputSchema: z.unknown(),  // Runtime validation needed
    execute: async (input) => {
      // Validate at runtime
      const validated = customSchema.parse(input)
      return await executeCustomLogic(validated)
    }
  })
}
```

## Performance Optimization

### Limit Tool Roundtrips

```typescript
// ✅ GOOD: Limit iterations (prevents timeouts)
const result = await generateText({
  model: openai('gpt-4o-mini'),
  prompt: 'Complex task',
  tools,
  maxToolRoundtrips: 3  // Max 3 iterations
})

// ❌ BAD: Unlimited iterations
const result = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Complex task',
  tools
  // No limit - may timeout or cost too much
})
```

### Use Cheaper Models for Tools

```typescript
const result = await generateText({
  model: openai('gpt-4o-mini'),  // Cheaper for tool calling
  prompt: 'Schedule a meeting',
  tools,
  maxToolRoundtrips: 5,

  prepareStep: (step) => {
    // Use premium model only for final response
    if (step.toolCalls.length === 0) {
      return { model: openai('gpt-4o') }
    }
    return step
  }
})
```

### Parallel Tool Execution

Tools execute sequentially by default. For parallel execution, use model-specific features or manual orchestration.

## Next Steps

- [Multi-Modal](./05-multi-modal.md) - Vision, audio, embeddings with tools
- [Providers](./06-providers.md) - OpenAI, Groq tool calling support
- [Edge Compatibility](./07-edge-compatibility.md) - Tool calling limits

## Related Documentation

- [Structured Output](./03-structured-output.md)
- [WhatsApp Integration](../INTEGRATIONS/whatsapp-business.md)
- [Supabase Integration](../INTEGRATIONS/supabase.md)

---

Token Count: ~1,200 tokens | Lines: 585 | Format: Code > Tables > Lists (tool-focused)
