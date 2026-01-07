/**
 * CSV Parser Utility
 *
 * Parses CSV files with tab delimiter and handles Bird CRM export format.
 * Supports:
 * - Tab-delimited columns
 * - \N as null values
 * - Column mapping to TypeScript interfaces
 * - Type-safe parsing
 */

import * as fs from 'fs';

export interface CSVParseOptions {
  delimiter?: string;
  nullValue?: string;
  skipHeader?: boolean;
}

/**
 * Parse CSV file into typed array
 *
 * @param filePath - Absolute path to CSV file
 * @param columnMap - Map of CSV column names to object keys
 * @param options - Parse options (delimiter, null handling, etc.)
 * @returns Array of parsed objects
 *
 * @example
 * ```typescript
 * interface Contact {
 *   displayName: string;
 *   phone: string;
 * }
 *
 * const contacts = parseCSVFile<Contact>(
 *   'contacts.csv',
 *   {
 *     'Display name': 'displayName',
 *     'Phone': 'phone'
 *   }
 * );
 * ```
 */
export function parseCSVFile<T extends Record<string, any>>(
  filePath: string,
  columnMap: Record<string, string>,
  options: CSVParseOptions = {}
): T[] {
  const { delimiter = '\t', nullValue = '\\N', skipHeader = true } = options;

  // Read file content
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return [];
  }

  // Parse header row
  const headerLine = lines[0];
  const headers = headerLine.split(delimiter).map((h) => {
    let header = h.trim();
    // Remove surrounding quotes from header names (Bird CRM CSV format)
    if (header.startsWith('"') && header.endsWith('"')) {
      header = header.slice(1, -1);
    }
    return header;
  });

  // Create column index map (CSV column name → array index)
  const columnIndexes: Record<string, number> = {};
  for (const [csvColumn, objectKey] of Object.entries(columnMap)) {
    const index = headers.indexOf(csvColumn);
    if (index !== -1) {
      columnIndexes[objectKey] = index;
    }
  }

  // Parse data rows
  const startIndex = skipHeader ? 1 : 0;
  const results: T[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const values = line.split(delimiter);

    const row: Record<string, any> = {};

    // Map columns to object keys
    for (const [objectKey, columnIndex] of Object.entries(columnIndexes)) {
      let rawValue = values[columnIndex]?.trim() || '';

      // Remove surrounding quotes if present (Bird CRM CSV format)
      if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
        rawValue = rawValue.slice(1, -1);
      }

      // Handle null values
      if (rawValue === nullValue || rawValue === '') {
        row[objectKey] = null;
      } else {
        row[objectKey] = rawValue;
      }
    }

    results.push(row as T);
  }

  return results;
}

/**
 * Parse CSV string content (in-memory parsing)
 *
 * @param content - CSV content as string
 * @param columnMap - Map of CSV column names to object keys
 * @param options - Parse options
 * @returns Array of parsed objects
 */
export function parseCSVString<T extends Record<string, any>>(
  content: string,
  columnMap: Record<string, string>,
  options: CSVParseOptions = {}
): T[] {
  const { delimiter = '\t', nullValue = '\\N', skipHeader = true } = options;

  const lines = content.split('\n').filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return [];
  }

  // Parse header row
  const headerLine = lines[0];
  const headers = headerLine.split(delimiter).map((h) => {
    let header = h.trim();
    // Remove surrounding quotes from header names (Bird CRM CSV format)
    if (header.startsWith('"') && header.endsWith('"')) {
      header = header.slice(1, -1);
    }
    return header;
  });

  // Create column index map
  const columnIndexes: Record<string, number> = {};
  for (const [csvColumn, objectKey] of Object.entries(columnMap)) {
    const index = headers.indexOf(csvColumn);
    if (index !== -1) {
      columnIndexes[objectKey] = index;
    }
  }

  // Parse data rows
  const startIndex = skipHeader ? 1 : 0;
  const results: T[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const values = line.split(delimiter);

    const row: Record<string, any> = {};

    for (const [objectKey, columnIndex] of Object.entries(columnIndexes)) {
      let rawValue = values[columnIndex]?.trim() || '';

      // Remove surrounding quotes if present (Bird CRM CSV format)
      if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
        rawValue = rawValue.slice(1, -1);
      }

      if (rawValue === nullValue || rawValue === '') {
        row[objectKey] = null;
      } else {
        row[objectKey] = rawValue;
      }
    }

    results.push(row as T);
  }

  return results;
}
