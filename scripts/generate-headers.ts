/**
 * @file Header Generation Script
 * @description Auto-generates @file headers for all .ts/.tsx files in lib/ and app/api/
 * @module scripts/generate-headers
 * @exports generateHeaders
 */

import { join } from 'node:path';
import { Project, type SourceFile, SyntaxKind } from 'ts-morph';

interface FileHeader {
  file: string;
  description: string;
  module: string;
  exports: string[];
  runtime?: 'edge' | 'node';
}

interface ProcessResult {
  file: string;
  action: 'created' | 'updated' | 'skipped' | 'error';
  reason: string;
}

/**
 * Checks if file already has valid header
 */
function hasValidHeader(sourceFile: SourceFile): boolean {
  const firstStatement = sourceFile.getStatements()[0];
  if (!firstStatement) return false;

  // Get leading comments
  const leadingComments = firstStatement.getLeadingCommentRanges();
  if (!leadingComments || leadingComments.length === 0) return false;

  const commentText = leadingComments[0].getText();

  // Check for required tags
  const hasFileTag = commentText.includes('@file');
  const hasDescTag = commentText.includes('@description');
  const hasModuleTag = commentText.includes('@module');
  const hasExportsTag = commentText.includes('@exports');

  return hasFileTag && hasDescTag && hasModuleTag && hasExportsTag;
}

/**
 * Extract all exports from source file
 */
function extractExports(sourceFile: SourceFile): string[] {
  const exports: string[] = [];

  // Get all export declarations
  const exportDeclarations = sourceFile.getExportedDeclarations();

  for (const [name] of exportDeclarations) {
    if (name !== 'default') {
      exports.push(name);
    }
  }

  // Check for default exports
  const defaultExport = sourceFile.getDefaultExportSymbol();
  if (defaultExport) {
    exports.push('default');
  }

  return exports.sort();
}

/**
 * Infer @file tag from filename and first comment
 */
function inferFileTag(sourceFile: SourceFile): string {
  const fileName = sourceFile.getBaseName().replace(/\.(ts|tsx)$/, '');

  // Try to get first comment
  const firstStatement = sourceFile.getStatements()[0];
  if (firstStatement) {
    const leadingComments = firstStatement.getLeadingCommentRanges();
    if (leadingComments && leadingComments.length > 0) {
      const commentText = leadingComments[0].getText();
      const lines = commentText.split('\n').map((l) => l.trim());

      // Look for descriptive first line
      for (const line of lines) {
        if (line && !line.startsWith('/*') && !line.startsWith('*') && !line.startsWith('//')) {
          return line;
        }
        if (line.startsWith('* ') && !line.includes('@')) {
          return line.replace('* ', '').trim();
        }
      }
    }
  }

  // Infer from filename
  const words = fileName.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  return words.join(' ');
}

/**
 * Infer @description from exports and filename
 */
function inferDescription(exports: string[], fileName: string): string {
  if (exports.length === 0) {
    return `Utility module for ${fileName}`;
  }

  const mainExport = exports[0];

  // Common patterns
  if (fileName.includes('schema')) return 'Database schema definitions';
  if (fileName.includes('type')) return 'TypeScript type definitions';
  if (fileName.includes('client')) return 'Client implementation';
  if (fileName.includes('util')) return 'Utility functions';
  if (fileName.includes('route')) return 'API route handler';
  if (fileName.includes('test')) return 'Test suite';

  // Based on export count
  if (exports.length === 1) {
    return `Exports ${mainExport}`;
  }

  return `Exports ${exports.length} functions and types`;
}

/**
 * Detect runtime for app/api routes
 */
function detectRuntime(sourceFile: SourceFile): 'edge' | 'node' | undefined {
  const filePath = sourceFile.getFilePath();

  // Only for app/api routes
  if (!filePath.includes('/app/api/')) {
    return undefined;
  }

  // Check for explicit runtime export
  const text = sourceFile.getFullText();
  if (text.includes("export const runtime = 'edge'")) {
    return 'edge';
  }
  if (text.includes("export const runtime = 'nodejs'")) {
    return 'node';
  }

  // Default to edge for Next.js 16 app/api routes
  return 'edge';
}

/**
 * Generate module path from file path
 */
function getModulePath(sourceFile: SourceFile, projectRoot: string): string {
  const filePath = sourceFile.getFilePath();
  const relativePath = filePath.replace(projectRoot + '/', '');

  // Remove file extension
  return relativePath.replace(/\.(ts|tsx)$/, '');
}

/**
 * Generate header comment
 */
function generateHeaderComment(header: FileHeader): string {
  const lines = [
    '/**',
    ` * @file ${header.file}`,
    ` * @description ${header.description}`,
    ` * @module ${header.module}`,
    ` * @exports ${header.exports.join(', ')}`,
  ];

  if (header.runtime) {
    lines.push(` * @runtime ${header.runtime}`);
  }

  lines.push(' */');

  return lines.join('\n');
}

/**
 * Process a single source file
 */
function processFile(sourceFile: SourceFile, projectRoot: string): ProcessResult {
  const fileName = sourceFile.getBaseName();

  try {
    // Check if already has valid header
    if (hasValidHeader(sourceFile)) {
      return {
        file: fileName,
        action: 'skipped',
        reason: 'Already has valid header',
      };
    }

    // Extract information
    const exports = extractExports(sourceFile);
    const fileTag = inferFileTag(sourceFile);
    const description = inferDescription(exports, fileName);
    const modulePath = getModulePath(sourceFile, projectRoot);
    const runtime = detectRuntime(sourceFile);

    // Generate header
    const header: FileHeader = {
      file: fileTag,
      description,
      module: modulePath,
      exports,
      runtime,
    };

    const headerComment = generateHeaderComment(header);

    // Insert header at top (after any shebang/directives)
    const fullText = sourceFile.getFullText();
    const hasShebang = fullText.startsWith('#!');
    const hasUseClient = fullText.includes("'use client'") || fullText.includes('"use client"');
    const hasUseServer = fullText.includes("'use server'") || fullText.includes('"use server"');

    if (hasShebang || hasUseClient || hasUseServer) {
      // Find first line after directives
      const lines = fullText.split('\n');
      let insertIndex = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('#!') || line.includes('use client') || line.includes('use server')) {
          insertIndex = i + 1;
        } else if (line === '') {
        } else {
          break;
        }
      }

      // Insert after directives
      const beforeDirectives = lines.slice(0, insertIndex).join('\n');
      const afterDirectives = lines.slice(insertIndex).join('\n');
      const newContent = `${beforeDirectives}\n\n${headerComment}\n${afterDirectives}`;

      sourceFile.replaceWithText(newContent);
    } else {
      // Insert at very top
      sourceFile.insertStatements(0, headerComment);
    }

    sourceFile.saveSync();

    return {
      file: fileName,
      action: 'created',
      reason: `Added header with ${exports.length} exports`,
    };
  } catch (error) {
    return {
      file: fileName,
      action: 'error',
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Main function to generate headers for all files
 */
export async function generateHeaders() {
  console.log('🚀 Starting header generation...\n');

  // Get project root
  const projectRoot = join(process.cwd());

  // Initialize ts-morph project
  const project = new Project({
    tsConfigFilePath: join(projectRoot, 'tsconfig.json'),
  });

  // Get all source files
  const sourceFiles = project.getSourceFiles([
    'lib/**/*.ts',
    'lib/**/*.tsx',
    'app/api/**/*.ts',
    'app/api/**/*.tsx',
  ]);

  console.log(`📁 Found ${sourceFiles.length} files to process\n`);

  const results: ProcessResult[] = [];

  // Process each file
  for (const sourceFile of sourceFiles) {
    const result = processFile(sourceFile, projectRoot);
    results.push(result);

    // Log progress
    const icon = result.action === 'created' ? '✅' : result.action === 'skipped' ? '⏭️' : '❌';
    console.log(`${icon} ${result.file}: ${result.reason}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log('='.repeat(60));

  const created = results.filter((r) => r.action === 'created').length;
  const skipped = results.filter((r) => r.action === 'skipped').length;
  const errors = results.filter((r) => r.action === 'error').length;

  console.log(`✅ Created: ${created}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📁 Total: ${results.length}`);

  if (errors > 0) {
    console.log('\n❌ Errors:');
    results
      .filter((r) => r.action === 'error')
      .forEach((r) => {
        console.log(`  - ${r.file}: ${r.reason}`);
      });
  }

  console.log('\n✨ Header generation complete!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateHeaders().catch(console.error);
}
