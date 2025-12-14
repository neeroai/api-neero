const BIRD_API_BASE = 'https://api.bird.com';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name}`);
  }
  return value;
}

export function getBirdConfig() {
  const accessKey = requiredEnv('BIRD_ACCESS_KEY');
  const workspaceId = requiredEnv('BIRD_WORKSPACE_ID');

  return { accessKey, workspaceId, apiBase: BIRD_API_BASE };
}

export function getOptionalChannelId(): string | null {
  return process.env.BIRD_CHANNEL_ID ?? null;
}

export function getWebhookSecret(): string | null {
  return process.env.BIRD_WEBHOOK_SECRET ?? null;
}

export { BIRD_API_BASE };
