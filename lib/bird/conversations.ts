/**
 * @file Bird Conversations API functions
 * @description Exports 2 functions and types
 * @module lib/bird/conversations
 * @exports findConversationByPhone, getConversationMessages
 */
/**
 * Bird Conversations API functions
 *
 * Provides functions to fetch and search conversations via Bird API.
 */

import { birdFetch } from './client';
import { getBirdConfig } from './env';
import type {
  BirdConversation,
  BirdConversationsResponse,
  BirdMessage,
  BirdMessagesResponse,
} from './types';

/**
 * Find conversation by contact phone number
 *
 * Searches all conversations paginated until finding one with a contact
 * participant matching the given phone number (E.164 format).
 *
 * @param phone - Contact phone number in E.164 format (e.g., "+573001234567")
 * @returns Conversation object if found, null otherwise
 */
export async function findConversationByPhone(phone: string): Promise<BirdConversation | null> {
  const { workspaceId } = getBirdConfig();
  const basePath = `/workspaces/${workspaceId}/conversations`;

  let pageToken: string | undefined;

  do {
    const searchParams = new URLSearchParams({ limit: '100' });
    if (pageToken) {
      searchParams.set('pageToken', pageToken);
    }

    const path = `${basePath}?${searchParams.toString()}`;
    const response = await birdFetch(path);
    const data: BirdConversationsResponse = await response.json();

    // Search for phone in conversation participants
    const found = data.results.find((conv) =>
      conv.featuredParticipants?.some((p) => p.contact?.identifierValue === phone)
    );

    if (found) {
      return found;
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return null;
}

/**
 * Fetch all messages for a conversation
 *
 * Retrieves all messages in a conversation using pagination.
 * Messages are returned in ascending order (oldest first).
 *
 * @param conversationId - Bird conversation UUID
 * @returns Array of all messages in the conversation
 */
export async function getConversationMessages(conversationId: string): Promise<BirdMessage[]> {
  const { workspaceId } = getBirdConfig();
  const basePath = `/workspaces/${workspaceId}/conversations/${conversationId}/messages`;

  const messages: BirdMessage[] = [];
  let pageToken: string | undefined;

  do {
    const searchParams = new URLSearchParams({
      limit: '100',
      direction: 'asc',
    });
    if (pageToken) {
      searchParams.set('pageToken', pageToken);
    }

    const path = `${basePath}?${searchParams.toString()}`;
    const response = await birdFetch(path);
    const data: BirdMessagesResponse = await response.json();

    messages.push(...data.results);
    pageToken = data.nextPageToken;
  } while (pageToken);

  return messages;
}
