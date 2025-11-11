/**
 * User Management Patterns
 * NOTE: Interfaces only - implementation left to user
 *
 * These interfaces define the contract for user operations.
 * Implement these with your database of choice (PostgreSQL, MySQL, etc.)
 */

/**
 * User data structure
 */
export interface UserData {
  id?: string;
  phoneNumber: string;
  name: string;
  whatsappId: string;
  preferences?: UserPreferences;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * User preferences structure
 */
export interface UserPreferences {
  language?: string;
  timezone?: string;
  notifications?: boolean;
  [key: string]: unknown;
}

/**
 * Interface: Create new user
 *
 * Implementation example:
 * ```ts
 * export async function createUser(data: Omit<UserData, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserData> {
 *   const db = await getDatabase();
 *
 *   const result = await db.insert(users)
 *     .values({
 *       ...data,
 *       createdAt: new Date(),
 *       updatedAt: new Date()
 *     })
 *     .returning();
 *
 *   return result[0];
 * }
 * ```
 */
export interface CreateUser {
  (data: Omit<UserData, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserData>;
}

/**
 * Interface: Get user by ID
 *
 * Implementation example:
 * ```ts
 * export async function getUserById(id: string): Promise<UserData | null> {
 *   const db = await getDatabase();
 *
 *   const result = await db.select()
 *     .from(users)
 *     .where(eq(users.id, id))
 *     .limit(1);
 *
 *   return result[0] || null;
 * }
 * ```
 */
export interface GetUserById {
  (id: string): Promise<UserData | null>;
}

/**
 * Interface: Get user by phone number
 *
 * Implementation example:
 * ```ts
 * export async function getUserByPhone(phoneNumber: string): Promise<UserData | null> {
 *   const db = await getDatabase();
 *
 *   const result = await db.select()
 *     .from(users)
 *     .where(eq(users.phoneNumber, phoneNumber))
 *     .limit(1);
 *
 *   return result[0] || null;
 * }
 * ```
 */
export interface GetUserByPhone {
  (phoneNumber: string): Promise<UserData | null>;
}

/**
 * Interface: Get user by WhatsApp ID
 *
 * Implementation example:
 * ```ts
 * export async function getUserByWhatsAppId(whatsappId: string): Promise<UserData | null> {
 *   const db = await getDatabase();
 *
 *   const result = await db.select()
 *     .from(users)
 *     .where(eq(users.whatsappId, whatsappId))
 *     .limit(1);
 *
 *   return result[0] || null;
 * }
 * ```
 */
export interface GetUserByWhatsAppId {
  (whatsappId: string): Promise<UserData | null>;
}

/**
 * Interface: Update user preferences
 *
 * Implementation example:
 * ```ts
 * export async function updateUserPreferences(
 *   userId: string,
 *   preferences: Partial<UserPreferences>
 * ): Promise<UserData> {
 *   const db = await getDatabase();
 *
 *   const user = await getUserById(userId);
 *   if (!user) {
 *     throw new Error('User not found');
 *   }
 *
 *   const updatedPreferences = {
 *     ...user.preferences,
 *     ...preferences
 *   };
 *
 *   const result = await db.update(users)
 *     .set({
 *       preferences: updatedPreferences,
 *       updatedAt: new Date()
 *     })
 *     .where(eq(users.id, userId))
 *     .returning();
 *
 *   return result[0];
 * }
 * ```
 */
export interface UpdateUserPreferences {
  (userId: string, preferences: Partial<UserPreferences>): Promise<UserData>;
}

/**
 * Interface: Update user data
 *
 * Implementation example:
 * ```ts
 * export async function updateUser(
 *   userId: string,
 *   data: Partial<Omit<UserData, 'id' | 'createdAt' | 'whatsappId'>>
 * ): Promise<UserData> {
 *   const db = await getDatabase();
 *
 *   const result = await db.update(users)
 *     .set({
 *       ...data,
 *       updatedAt: new Date()
 *     })
 *     .where(eq(users.id, userId))
 *     .returning();
 *
 *   if (!result[0]) {
 *     throw new Error('User not found');
 *   }
 *
 *   return result[0];
 * }
 * ```
 */
export interface UpdateUser {
  (
    userId: string,
    data: Partial<Omit<UserData, 'id' | 'createdAt' | 'whatsappId'>>
  ): Promise<UserData>;
}

/**
 * Interface: Delete user
 *
 * Implementation example:
 * ```ts
 * export async function deleteUser(userId: string): Promise<void> {
 *   const db = await getDatabase();
 *
 *   await db.delete(users)
 *     .where(eq(users.id, userId));
 * }
 * ```
 */
export interface DeleteUser {
  (userId: string): Promise<void>;
}

/**
 * Interface: Get or create user
 * Useful for WhatsApp webhooks where users may not exist yet
 *
 * Implementation example:
 * ```ts
 * export async function getOrCreateUser(
 *   whatsappId: string,
 *   phoneNumber: string,
 *   name: string
 * ): Promise<UserData> {
 *   const existingUser = await getUserByWhatsAppId(whatsappId);
 *
 *   if (existingUser) {
 *     return existingUser;
 *   }
 *
 *   return await createUser({
 *     whatsappId,
 *     phoneNumber,
 *     name
 *   });
 * }
 * ```
 */
export interface GetOrCreateUser {
  (whatsappId: string, phoneNumber: string, name: string): Promise<UserData>;
}

/**
 * Helper: Sanitize user data before storage
 * Removes sensitive information and validates structure
 *
 * @param data - Raw user data
 * @returns Sanitized user data
 *
 * @example
 * ```ts
 * import { sanitizePhoneNumber } from '@/lib/security/sanitize';
 *
 * const rawData = {
 *   phoneNumber: '+1 (555) 123-4567',
 *   name: 'John Doe',
 *   whatsappId: '15551234567'
 * };
 *
 * const sanitized = sanitizeUserData(rawData);
 * const user = await createUser(sanitized);
 * ```
 */
export function sanitizeUserData(
  data: Omit<UserData, 'id' | 'createdAt' | 'updatedAt'>
): Omit<UserData, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    phoneNumber: data.phoneNumber.trim(),
    name: data.name.trim(),
    whatsappId: data.whatsappId.trim(),
    preferences: data.preferences,
  };
}

/**
 * Helper: Validate user preferences
 * Ensures preferences conform to expected structure
 *
 * @param preferences - Raw preferences object
 * @returns Validated preferences
 *
 * @example
 * ```ts
 * const prefs = validatePreferences({
 *   language: 'es',
 *   timezone: 'America/Bogota',
 *   notifications: true,
 *   customField: 'value'
 * });
 *
 * await updateUserPreferences(userId, prefs);
 * ```
 */
export function validatePreferences(preferences: unknown): UserPreferences {
  if (!preferences || typeof preferences !== 'object') {
    return {};
  }

  const prefs = preferences as Record<string, unknown>;

  return {
    language: typeof prefs.language === 'string' ? prefs.language : undefined,
    timezone: typeof prefs.timezone === 'string' ? prefs.timezone : undefined,
    notifications: typeof prefs.notifications === 'boolean' ? prefs.notifications : undefined,
    ...Object.fromEntries(
      Object.entries(prefs).filter(
        ([key]) => !['language', 'timezone', 'notifications'].includes(key)
      )
    ),
  };
}
