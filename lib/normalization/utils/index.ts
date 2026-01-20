/**
 * @file Normalization Utilities - Barrel Export
 * @description Re-exports all normalization utilities for convenient importing
 * @module lib/normalization/utils
 * @exports cleanDisplayName, removeEmojis, EMOJI_PATTERN, isValidName, isOnlyEmojis, isInstagramUsername, splitFullName
 */

export { cleanDisplayName, removeEmojis, EMOJI_PATTERN } from './cleaning';
export { isValidName, isOnlyEmojis, isInstagramUsername } from './validation';
export { splitFullName } from './splitting';
