/**
 * Temporary script to fetch Bird conversations for debugging
 * Run: BIRD_ACCESS_KEY=xxx BIRD_WORKSPACE_ID=xxx tsx scripts/fetch-bird-conversations.ts
 */

const accessKey = process.env.BIRD_ACCESS_KEY;
const workspaceId = process.env.BIRD_WORKSPACE_ID;

if (!accessKey || !workspaceId) {
  console.error('Missing BIRD_ACCESS_KEY or BIRD_WORKSPACE_ID');
  process.exit(1);
}

async function fetchConversations() {
  const url = `https://api.bird.com/workspaces/${workspaceId}/conversations?limit=10`;

  console.log('Fetching conversations from:', url);

  const response = await fetch(url, {
    headers: {
      'Authorization': `AccessKey ${accessKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error('API Error:', response.status, response.statusText);
    const errorText = await response.text();
    console.error('Error body:', errorText);
    process.exit(1);
  }

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

fetchConversations().catch(console.error);
