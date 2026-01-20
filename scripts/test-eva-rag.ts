/**
 * End-to-End RAG Pipeline Test with Eva
 * Tests the complete flow: User Query → retrieveKnowledge → Eva Response
 */
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';
dotenv.config({ path: '.env.local' });

interface TestCase {
  query: string;
  expectedToolUse: boolean;
  expectedKeywords: string[];
  description: string;
}

const testCases: TestCase[] = [
  {
    query: '¿Cuánto dura la recuperación de rinoplastia?',
    expectedToolUse: true,
    expectedKeywords: ['10-14 días', 'rinoplastia', 'recuperación', '12 meses'],
    description: 'Procedure recovery time query (should use retrieveKnowledge)',
  },
  {
    query: 'Tengo dolor después de la cirugía',
    expectedToolUse: false, // Should escalate to human (urgent symptom)
    expectedKeywords: ['conectar', 'Dr. Durán', 'asesor'],
    description: 'Urgent symptom (should NOT use retrieveKnowledge, should escalate)',
  },
  {
    query: '¿Dónde está ubicada la clínica?',
    expectedToolUse: true,
    expectedKeywords: ['Calle 119', 'Bogotá', 'Usaquén'],
    description: 'Location query (should use retrieveKnowledge)',
  },
  {
    query: '¿Cuánto cuesta una rinoplastia?',
    expectedToolUse: false, // Should escalate to human (pricing)
    expectedKeywords: ['asesor', 'cotización'],
    description: 'Pricing query (should NOT use retrieveKnowledge, should escalate)',
  },
];

async function testEvaRAG() {
  console.log('🤖 Testing End-to-End RAG Pipeline with Eva\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const API_URL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}/api/agent/inbound`
    : 'http://localhost:3000/api/agent/inbound';

  console.log(`API Endpoint: ${API_URL}\n`);

  let passed = 0;
  let failed = 0;

  for (const [index, testCase] of testCases.entries()) {
    console.log(`Test ${index + 1}/${testCases.length}: ${testCase.description}`);
    console.log(`Query: "${testCase.query}"`);

    const conversationId = randomUUID();
    const requestBody = {
      context: {
        conversationId,
        contactId: randomUUID(),
        channelId: randomUUID(),
        platform: 'whatsapp',
      },
      message: {
        text: testCase.query,
        timestamp: new Date().toISOString(),
      },
    };

    const startTime = Date.now();

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.NEERO_API_KEY ? { Authorization: `Bearer ${process.env.NEERO_API_KEY}` } : {}),
        },
        body: JSON.stringify(requestBody),
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        console.log(`❌ FAILED: HTTP ${response.status}`);
        console.log(`   Response: ${await response.text()}\n`);
        failed++;
        continue;
      }

      const data = await response.json();
      const reply = data.reply || '';

      // Check 9-second timeout constraint
      if (duration > 9000) {
        console.log(`❌ FAILED: Exceeded 9s timeout (${duration}ms)`);
        failed++;
        continue;
      }

      // Check if keywords are present in response
      const hasKeywords = testCase.expectedKeywords.some((keyword) =>
        reply.toLowerCase().includes(keyword.toLowerCase())
      );

      if (hasKeywords) {
        console.log(`✅ PASSED (${duration}ms)`);
        console.log(`   Reply: ${reply.substring(0, 150)}...`);
        console.log(`   Status: ${data.status || 'continued'}`);
        console.log(`   Model: ${data.metadata?.model || 'unknown'}\n`);
        passed++;
      } else {
        console.log(`❌ FAILED: Missing expected keywords`);
        console.log(`   Expected one of: ${testCase.expectedKeywords.join(', ')}`);
        console.log(`   Got: ${reply.substring(0, 150)}...\n`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ FAILED: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      failed++;
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📊 Test Summary:');
  console.log(`   Total: ${testCases.length}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('💡 Troubleshooting:');
    console.log('   - Ensure dev server is running: pnpm dev');
    console.log('   - Check environment variables are loaded');
    console.log('   - Verify AI_GATEWAY_API_KEY is valid');
    console.log('   - Check agent route is properly configured\n');
  } else {
    console.log('🎉 All end-to-end tests passed! RAG pipeline working correctly.\n');
  }
}

testEvaRAG().catch((error) => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
