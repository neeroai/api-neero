/**
 * @file Normalization Utilities - Barrel Export
 * @description Re-exports all normalization utilities for convenient importing
 * @module lib/normalization/utils
 * @exports cleanDisplayName, removeEmojis, EMOJI_PATTERN, isValidName, isOnlyEmojis, isInstagramUsername, splitFullName
 */

export { cleanDisplayName, EMOJI_PATTERN, removeEmojis } from './cleaning';
export { splitFullName } from './splitting';
export { isInstagramUsername, isOnlyEmojis, isValidName } from './validation';
