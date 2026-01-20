/**
 * @file Bird Contacts API
 * @description Exports 8 functions and types
 * @module lib/bird/contacts
 * @exports BirdContact, BirdContactUpdate, addEmailIdentifier, fetchContactById, listAllContacts, searchContactByPhone, updateContact, updateIdentifierSubscription
 */
/**
 * Bird Contacts API
 * Functions for fetching and updating Bird CRM contacts
 */

import { birdFetch } from './client';
import { getBirdConfig } from './env';
import type { BirdContact, BirdContactUpdate } from './types';

// Re-export types for convenience
export type { BirdContact, BirdContactUpdate };

/**
 * Fetch a Bird contact by ID
 *
 * @param contactId - Bird contact UUID
 * @returns Bird contact object
 * @throws Error if contact not found or API request fails
 *
 * @example
 * const contact = await fetchContactById('95fb9a8d-0125-4687-985b-f14ef932ac21');
 * console.log(contact.computedDisplayName); // "John Doe"
 */
export async function fetchContactById(contactId: string): Promise<BirdContact> {
  const { workspaceId } = getBirdConfig();
  const path = `/workspaces/${workspaceId}/contacts/${contactId}`;

  const response = await birdFetch(path, { retryCount: 2 });
  const data = await response.json();

  return data as BirdContact;
}

/**
 * Search for a Bird contact by phone number
 *
 * @param phone - Phone number in any format (Bird normalizes)
 * @returns Bird contact object if found, null otherwise
 *
 * @example
 * const contact = await searchContactByPhone('+573001234567');
 * if (contact) {
 *   console.log(`Found: ${contact.computedDisplayName}`);
 * }
 */
export async function searchContactByPhone(phone: string): Promise<BirdContact | null> {
  const { workspaceId } = getBirdConfig();
  const path = `/workspaces/${workspaceId}/contacts/search`;

  const response = await birdFetch(path, {
    method: 'POST',
    body: JSON.stringify({
      identifier: {
        key: 'phonenumber',
        value: phone,
      },
    }),
    retryCount: 2,
  });

  const data = await response.json();

  // Bird API returns { results: [...] }
  if (data.results && Array.isArray(data.results) && data.results.length > 0) {
    return data.results[0] as BirdContact;
  }

  return null;
}

/**
 * Update a Bird contact's attributes
 *
 * @param contactId - Bird contact UUID
 * @param updates - Partial contact update (typically attributes)
 * @returns Updated Bird contact object
 * @throws Error if contact not found or update fails
 *
 * @example
 * const updated = await updateContact('95fb9a8d-0125-4687-985b-f14ef932ac21', {
 *   attributes: {
 *     email: 'patient@example.com',
 *     country: 'Colombia'
 *   }
 * });
 */
export async function updateContact(
  contactId: string,
  updates: BirdContactUpdate
): Promise<BirdContact> {
  const { workspaceId } = getBirdConfig();
  const path = `/workspaces/${workspaceId}/contacts/${contactId}`;

  const response = await birdFetch(path, {
    method: 'PATCH',
    body: JSON.stringify(updates),
    retryCount: 2,
  });

  const data = await response.json();

  return data as BirdContact;
}

/**
 * Add email identifier to an existing contact
 *
 * Adds an email identifier (not attribute) to a Bird CRM contact.
 * Email identifiers are used for message routing and have subscription status.
 *
 * IMPORTANT: Uses identifierKey "emailaddress" (Bird standard), NOT "email".
 *
 * @param contactId - Bird contact UUID
 * @param email - Email address to add as identifier
 * @returns Updated contact with new identifier
 *
 * @example
 * await addEmailIdentifier('contact-uuid-123', '[email protected]');
 */
export async function addEmailIdentifier(contactId: string, email: string): Promise<BirdContact> {
  const { workspaceId } = getBirdConfig();
  const path = `/workspaces/${workspaceId}/contacts/${contactId}/identifiers`;

  const response = await birdFetch(path, {
    method: 'POST',
    body: JSON.stringify({
      key: 'emailaddress', // Bird standard key (NOT "email")
      value: email,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Bird API error ${response.status}: ${JSON.stringify(errorData)}`);
  }

  return response.json();
}

/**
 * Update identifier subscription status
 *
 * @param identifierKey - Identifier type (e.g., 'phonenumber')
 * @param identifierValue - Identifier value (e.g., '+573001234567')
 * @param subscriptions - Subscription status to update
 * @returns Updated contact
 *
 * @example
 * await updateIdentifierSubscription('phonenumber', '+573001234567', {
 *   subscribedSms: true
 * });
 */
export async function updateIdentifierSubscription(
  identifierKey: string,
  identifierValue: string,
  subscriptions: {
    subscribedSms?: boolean;
    subscribedWhatsapp?: boolean;
    subscribedEmail?: boolean;
    subscribedPush?: boolean;
    subscribedRcs?: boolean;
  }
): Promise<BirdContact> {
  const { workspaceId } = getBirdConfig();
  // Note: Don't encode identifierValue - fetch() will handle URL encoding automatically
  // and Bird API expects the raw phone number format (e.g., +573001234567)
  const path = `/workspaces/${workspaceId}/contacts/identifiers/${identifierKey}/${identifierValue}`;

  const response = await birdFetch(path, {
    method: 'PATCH',
    body: JSON.stringify({ attributes: subscriptions }),
    retryCount: 2,
  });

  return response.json();
}

/**
 * List all contacts in workspace (paginated)
 *
 * @param limit - Number of contacts per page (default 100, max 100)
 * @returns Array of all Bird contacts
 *
 * @example
 * const allContacts = await listAllContacts();
 * console.log(`Total contacts: ${allContacts.length}`);
 */
export async function listAllContacts(limit = 100): Promise<BirdContact[]> {
  const { workspaceId } = getBirdConfig();
  const basePath = `/workspaces/${workspaceId}/contacts`;

  const contacts: BirdContact[] = [];
  let pageToken: string | undefined;

  do {
    const searchParams = new URLSearchParams({ limit: limit.toString() });
    if (pageToken) {
      searchParams.set('pageToken', pageToken);
    }

    const path = `${basePath}?${searchParams.toString()}`;
    const response = await birdFetch(path, { retryCount: 2 });
    const data = await response.json();

    // Bird API returns { results: [...], nextPageToken: "..." }
    if (data.results && Array.isArray(data.results)) {
      contacts.push(...(data.results as BirdContact[]));
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return contacts;
}
