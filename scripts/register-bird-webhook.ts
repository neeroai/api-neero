#!/usr/bin/env tsx
/**
 * @file Register Bird Webhook for conversation.created
 * @description One-time script to register webhook subscription in Bird API
 * @module scripts/register-bird-webhook
 *
 * Usage:
 *   tsx scripts/register-bird-webhook.ts
 *
 * Required env vars:
 *   BIRD_ORGANIZATION_ID - Bird organization ID
 *   BIRD_WORKSPACE_ID - Bird workspace ID
 *   BIRD_ACCESS_KEY - Bird API access key
 *   BIRD_WEBHOOK_SECRET - Signing key for webhook verification
 */

import { config } from 'dotenv';

// Load .env.local
config({ path: '.env.local' });

interface WebhookSubscriptionRequest {
  service: 'conversations';
  event: 'conversation.created';
  url: string;
  signingKey?: string;
}

interface WebhookSubscriptionResponse {
  id: string;
  service: string;
  event: string;
  url: string;
  status: string;
  createdAt: string;
}

async function registerWebhook() {
  console.log('='.repeat(80));
  console.log('BIRD WEBHOOK REGISTRATION');
  console.log('='.repeat(80));
  console.log();

  // 1. Validate environment variables
  const organizationId = process.env.BIRD_ORGANIZATION_ID;
  const workspaceId = process.env.BIRD_WORKSPACE_ID;
  const accessKey = process.env.BIRD_ACCESS_KEY;
  const webhookSecret = process.env.BIRD_WEBHOOK_SECRET;

  if (!organizationId) {
    throw new Error('Missing BIRD_ORGANIZATION_ID in .env.local');
  }

  if (!workspaceId) {
    throw new Error('Missing BIRD_WORKSPACE_ID in .env.local');
  }

  if (!accessKey) {
    throw new Error('Missing BIRD_ACCESS_KEY in .env.local');
  }

  console.log('Environment variables validated:');
  console.log(`  Organization ID: ${organizationId}`);
  console.log(`  Workspace ID: ${workspaceId}`);
  console.log(`  Access Key: ${accessKey.substring(0, 10)}...`);
  console.log(`  Webhook Secret: ${webhookSecret ? 'Configured' : 'Not set (optional)'}`);
  console.log();

  // 2. Build webhook subscription request
  const webhookUrl = 'https://api-neero.vercel.app/api/webhooks/bird/conversation-created';

  const requestBody: WebhookSubscriptionRequest = {
    service: 'conversations',
    event: 'conversation.created',
    url: webhookUrl,
  };

  // Add signing key if configured
  if (webhookSecret) {
    requestBody.signingKey = webhookSecret;
  }

  console.log('Webhook subscription configuration:');
  console.log(`  Service: ${requestBody.service}`);
  console.log(`  Event: ${requestBody.event}`);
  console.log(`  URL: ${requestBody.url}`);
  console.log(`  Signing Key: ${webhookSecret ? 'Yes' : 'No'}`);
  console.log();

  // 3. Register webhook via Bird API
  const apiUrl = `https://api.bird.com/organizations/${organizationId}/workspaces/${workspaceId}/webhook-subscriptions`;

  console.log('Registering webhook...');
  console.log(`API Endpoint: ${apiUrl}`);
  console.log();

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `AccessKey ${accessKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bird API error: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const subscription = (await response.json()) as WebhookSubscriptionResponse;

    console.log('SUCCESS - Webhook registered!');
    console.log('='.repeat(80));
    console.log();
    console.log('Subscription details:');
    console.log(`  ID: ${subscription.id}`);
    console.log(`  Service: ${subscription.service}`);
    console.log(`  Event: ${subscription.event}`);
    console.log(`  URL: ${subscription.url}`);
    console.log(`  Status: ${subscription.status}`);
    console.log(`  Created: ${subscription.createdAt}`);
    console.log();
    console.log('='.repeat(80));
    console.log();
    console.log('Next steps:');
    console.log('1. Test webhook by creating a new conversation in Bird Dashboard');
    console.log('2. Check Vercel logs: https://vercel.com/your-project/logs');
    console.log('3. Verify contact normalization in database: contact_normalizations table');
    console.log();
  } catch (error) {
    console.error('ERROR - Failed to register webhook');
    console.error('='.repeat(80));
    console.error();

    if (error instanceof Error) {
      console.error('Error message:', error.message);

      // Common error scenarios
      if (error.message.includes('401')) {
        console.error();
        console.error('Troubleshooting:');
        console.error('- Verify BIRD_ACCESS_KEY is correct');
        console.error('- Check that access key has webhook permissions');
      } else if (error.message.includes('404')) {
        console.error();
        console.error('Troubleshooting:');
        console.error('- Verify BIRD_ORGANIZATION_ID is correct');
        console.error('- Verify BIRD_WORKSPACE_ID is correct');
      } else if (error.message.includes('409') || error.message.includes('already exists')) {
        console.error();
        console.error('Webhook already registered!');
        console.error('To update, first delete existing subscription:');
        console.error(`  DELETE ${apiUrl}/{subscriptionId}`);
      }
    } else {
      console.error('Unknown error:', error);
    }

    console.error();
    process.exit(1);
  }
}

// Run script
registerWebhook().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
