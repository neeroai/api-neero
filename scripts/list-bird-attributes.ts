import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import { birdFetch } from '@/lib/bird/client';
import { getBirdConfig } from '@/lib/bird/env';

async function main() {
  console.log('🔍 Listing Bird CRM Custom Attributes\n');

  try {
    const { workspaceId } = getBirdConfig();
    const path = `/workspaces/${workspaceId}/contacts/attributes`;

    console.log(`Fetching attributes from: ${path}\n`);

    const response = await birdFetch(path, { retryCount: 2 });
    const data = await response.json();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Custom Attributes');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (data.results && Array.isArray(data.results)) {
      console.log(`Total attributes: ${data.results.length}\n`);

      // Group by type
      const grouped = data.results.reduce((acc: any, attr: any) => {
        const type = attr.type || 'unknown';
        if (!acc[type]) acc[type] = [];
        acc[type].push(attr);
        return acc;
      }, {});

      for (const [type, attributes] of Object.entries(grouped)) {
        console.log(`\n${type.toUpperCase()} (${(attributes as any[]).length}):`);
        console.log('─'.repeat(50));

        (attributes as any[]).forEach((attr: any) => {
          console.log(`  • ${attr.name || attr.key}`);
          if (attr.key) console.log(`    Key: ${attr.key}`);
          if (attr.displayName) console.log(`    Display: ${attr.displayName}`);
          if (attr.description) console.log(`    Description: ${attr.description}`);
          console.log('');
        });
      }

      // Full JSON output
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📄 Full Response (JSON)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('No attributes found or unexpected response format');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error fetching attributes:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

main();
