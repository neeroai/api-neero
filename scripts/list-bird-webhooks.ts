#!/usr/bin/env tsx
/**
 * @file List Bird Webhook Subscriptions
 * @description List all webhook subscriptions to verify configuration
 * @module scripts/list-bird-webhooks
 *
 * Usage:
 *   pnpm exec tsx scripts/list-bird-webhooks.ts
 */

import { config } from 'dotenv';

config({ path: '.env.local' });

async function listWebhooks() {
  const organizationId = process.env.BIRD_ORGANIZATION_ID;
  const workspaceId = process.env.BIRD_WORKSPACE_ID;
  const accessKey = process.env.BIRD_ACCESS_KEY;

  if (!organizationId || !workspaceId || !accessKey) {
    throw new Error('Missing required env vars');
  }

  console.log('Fetching webhook subscriptions...');
  console.log();

  const apiUrl = `https://api.bird.com/organizations/${organizationId}/workspaces/${workspaceId}/webhook-subscriptions`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Authorization: `AccessKey ${accessKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bird API error: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();

    console.log('Webhook Subscriptions:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listWebhooks();
