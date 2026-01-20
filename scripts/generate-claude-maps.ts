/**
 * @file CLAUDE.md Generation Script
 * @description Auto-generates CLAUDE.md semantic maps from file headers
 * @module scripts/generate-claude-maps
 * @exports generateClaudeMaps
 */

import { Project, type SourceFile } from 'ts-morph';
import { writeFileSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

interface FileInfo {
  name: string;
  path: string;
  fileTag: string;
  description: string;
  exports: string[];
  lines: number;
}

interface ModuleConfig {
  path: string;
  name: string;
  description: string;
  tags: string[];
  purpose: string;
  criticalPatterns?: string[];
  quickStart?: string;
}

/**
 * Extract header information from a source file
 */
function extractHeaderInfo(sourceFile: SourceFile): FileInfo | null {
  const fileName = sourceFile.getBaseName();
  const filePath = sourceFile.getFilePath();
  const lineCount = sourceFile.getFullText().split('\n').length;

  // Get first comment (should be our header)
  const firstStatement = sourceFile.getStatements()[0];
  if (!firstStatement) return null;

  const leadingComments = firstStatement.getLeadingCommentRanges();
  if (!leadingComments || leadingComments.length === 0) return null;

  const commentText = leadingComments[0].getText();

  // Extract tags
  const fileMatch = commentText.match(/@file\s+(.+)/);
  const descMatch = commentText.match(/@description\s+(.+)/);
  const exportsMatch = commentText.match(/@exports\s+(.+)/);

  if (!fileMatch || !descMatch || !exportsMatch) return null;

  const fileTag = fileMatch[1].trim();
  const description = descMatch[1].trim();
  const exports = exportsMatch[1].split(',').map(e => e.trim());

  return {
    name: fileName,
    path: filePath,
    fileTag,
    description,
    exports,
    lines: lineCount
  };
}

/**
 * Extract header info from file content (for excluded files)
 */
function extractHeaderFromContent(filePath: string, fileName: string): FileInfo | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const lineCount = lines.length;

    // Find JSDoc comment at start
    let commentStart = -1;
    let commentEnd = -1;

    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const line = lines[i].trim();
      if (line.startsWith('/**')) {
        commentStart = i;
      } else if (commentStart !== -1 && line.endsWith('*/')) {
        commentEnd = i;
        break;
      }
    }

    if (commentStart === -1 || commentEnd === -1) return null;

    const commentText = lines.slice(commentStart, commentEnd + 1).join('\n');

    // Extract tags
    const fileMatch = commentText.match(/@file\s+(.+)/);
    const descMatch = commentText.match(/@description\s+(.+)/);
    const exportsMatch = commentText.match(/@exports\s+(.+)/);

    if (!fileMatch || !descMatch || !exportsMatch) return null;

    const fileTag = fileMatch[1].trim();
    const description = descMatch[1].trim();
    const exports = exportsMatch[1].split(',').map(e => e.trim());

    return {
      name: fileName,
      path: filePath,
      fileTag,
      description,
      exports,
      lines: lineCount
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get all TypeScript files in a directory (for excluded modules)
 */
function getAllTsFiles(dirPath: string, relativeTo: string): FileInfo[] {
  const files: FileInfo[] = [];

  function scanDir(currentPath: string) {
    const entries = readdirSync(currentPath);

    for (const entry of entries) {
      const fullPath = join(currentPath, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip test directories
        if (entry === '__tests__' || entry === 'node_modules') continue;
        scanDir(fullPath);
      } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
        // Skip test files
        if (entry.includes('.test.') || entry.includes('.spec.')) continue;

        const info = extractHeaderFromContent(fullPath, entry);
        if (info) {
          // Make path relative
          const relativePath = fullPath.replace(relativeTo + '/', '');
          files.push({
            ...info,
            name: relativePath
          });
        }
      }
    }
  }

  scanDir(dirPath);
  return files;
}

/**
 * Generate YAML frontmatter for CLAUDE.md
 */
function generateFrontmatter(config: ModuleConfig): string {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');

  return `---
title: "${config.name} - Semantic Map"
summary: "${config.description.slice(0, 200)}"
description: "${config.purpose}"
version: "1.0"
date: "${today}"
updated: "${now}"
tags: ${JSON.stringify(config.tags)}
scope: "project"
module: "${config.path}"
---`;
}

/**
 * Generate Files table from file info
 */
function generateFilesTable(files: FileInfo[]): string {
  if (files.length === 0) return '';

  const rows = files.map(f => {
    const exportsStr = f.exports.join(', ');
    return `| ${f.name} | ${f.fileTag} | ${exportsStr} | ${f.lines} |`;
  });

  return `## Files (Auto-generated from headers)

| File | @file | @exports | Lines |
|------|-------|----------|-------|
${rows.join('\n')}

**Read headers**: All files have complete @file/@description/@module/@exports headers. Read file headers before reading full file contents.`;
}

/**
 * Read existing INDEX.md to extract patterns and examples
 */
function extractFromIndexMd(modulePath: string): { patterns?: string[]; quickStart?: string } {
  const indexPath = join(process.cwd(), modulePath, 'INDEX.md');

  if (!existsSync(indexPath)) {
    return {};
  }

  const content = readFileSync(indexPath, 'utf-8');
  const patterns: string[] = [];
  let quickStart: string | undefined;

  // Extract Critical Patterns section
  const patternsMatch = content.match(/##\s+Critical Patterns([\s\S]+?)(?=##|$)/i);
  if (patternsMatch) {
    const patternSection = patternsMatch[1].trim();
    const patternLines = patternSection.split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*\*\*(.+?)\*\*:/, '**$1**:').trim());
    patterns.push(...patternLines);
  }

  // Extract Usage/Quick Start section
  const usageMatch = content.match(/##\s+(?:Usage|Quick Start)([\s\S]+?)(?=##|$)/i);
  if (usageMatch) {
    quickStart = usageMatch[1].trim();
  }

  return { patterns: patterns.length > 0 ? patterns : undefined, quickStart };
}

/**
 * Generate Critical Patterns section
 */
function generatePatternsSection(patterns?: string[]): string {
  if (!patterns || patterns.length === 0) return '';

  return `## Critical Patterns

${patterns.join('\n')}`;
}

/**
 * Generate Quick Start section
 */
function generateQuickStartSection(quickStart?: string, modulePath?: string): string {
  if (quickStart) {
    return `## Quick Start

${quickStart}`;
  }

  // Generate default quick start based on module
  return `## Quick Start

\`\`\`typescript
// Import from module
import { ... } from '@/${modulePath}';

// Basic usage example
// TODO: Add specific usage examples
\`\`\``;
}

/**
 * Generate complete CLAUDE.md content
 */
function generateClaudeMd(config: ModuleConfig, files: FileInfo[]): string {
  const frontmatter = generateFrontmatter(config);
  const filesTable = generateFilesTable(files);
  const patterns = generatePatternsSection(config.criticalPatterns);
  const quickStart = generateQuickStartSection(config.quickStart, config.path);

  const estimatedTokens = Math.floor((frontmatter.length + filesTable.length + patterns.length + quickStart.length) / 4);

  return `${frontmatter}

## Purpose

${config.purpose}

**IMPORTANT**: This is a semantic map of the \`${config.path}/\` codebase. All files are documented with @file headers. Claude Code should read this map to understand the module structure without exploring individual files.

---

${filesTable}

---

${quickStart}

${patterns ? `\n---\n\n${patterns}` : ''}

---

**Token Budget**: ~${estimatedTokens} tokens
**Last Updated**: ${new Date().toISOString().split('T')[0]}
`;
}

/**
 * Module configurations
 */
const modules: ModuleConfig[] = [
  {
    path: 'lib',
    name: 'Core Library',
    description: 'Core library modules for api-neero: AI processing, Bird CRM integration, database, normalization, agent tools',
    purpose: 'Root library containing all core modules',
    tags: ['library', 'core', 'api-neero']
  },
  {
    path: 'lib/ai',
    name: 'AI Processing',
    description: 'Multimodal AI processing: image classification/routing, audio transcription, embeddings, timeouts. Gemini 2.0/2.5 Flash, Groq Whisper v3.',
    purpose: 'AI processing pipeline for images, audio, and text embeddings',
    tags: ['ai', 'multimodal', 'gemini', 'whisper', 'embeddings']
  },
  {
    path: 'lib/bird',
    name: 'Bird CRM Client',
    description: 'Bird.com CRM integration: contacts, conversations, messages, media download, handover, service windows.',
    purpose: 'Client library for Bird CRM API integration',
    tags: ['bird-crm', 'client', 'api-integration']
  },
  {
    path: 'lib/db',
    name: 'Database Layer',
    description: 'Database schema and client for Neon PostgreSQL with pgvector. Drizzle ORM, semantic search.',
    purpose: 'Database schema and query utilities',
    tags: ['database', 'postgresql', 'pgvector', 'drizzle']
  },
  {
    path: 'lib/normalization',
    name: 'Contact Normalization',
    description: 'Contact data extraction: phone numbers (regex+AI), names, addresses, emails. Hybrid extraction with validation.',
    purpose: 'Contact data normalization and validation',
    tags: ['normalization', 'contact-data', 'validation']
  },
  {
    path: 'lib/agent',
    name: 'Agent Orchestration',
    description: 'Agent tools and orchestration: guardrails, consent management, RAG (retrieveKnowledge), prompts.',
    purpose: 'Agent tools and conversation management',
    tags: ['agent', 'tools', 'rag', 'orchestration']
  },
  {
    path: 'app/api',
    name: 'API Routes',
    description: 'Next.js 16 Edge Runtime API routes: /bird (main), /test-*, /embeddings. <9s timeout.',
    purpose: 'API route handlers for all endpoints',
    tags: ['api', 'routes', 'edge-runtime', 'next.js']
  }
];

/**
 * Main function to generate CLAUDE.md files
 */
export async function generateClaudeMaps() {
  console.log('🗺️  Starting CLAUDE.md generation...\n');

  const projectRoot = join(process.cwd());

  // Initialize ts-morph project
  const project = new Project({
    tsConfigFilePath: join(projectRoot, 'tsconfig.json'),
  });

  for (const moduleConfig of modules) {
    console.log(`📁 Processing module: ${moduleConfig.path}`);

    // Get pattern for this module
    const pattern = `${moduleConfig.path}/**/*.ts`;
    const sourceFiles = project.getSourceFiles(pattern);

    // Filter strategy depends on module
    let filesToInclude: SourceFile[];

    if (moduleConfig.path === 'lib') {
      // For root lib/, list subdirectories not files
      // Skip this - will be handled differently
      filesToInclude = [];
    } else if (moduleConfig.path === 'app/api') {
      // For app/api, include all route.ts files
      filesToInclude = sourceFiles.filter(sf =>
        sf.getBaseName() === 'route.ts' && !sf.getFilePath().includes('__tests__')
      );
    } else {
      // For other modules, include all files (excluding tests)
      filesToInclude = sourceFiles.filter(sf =>
        !sf.getFilePath().includes('__tests__')
      );
    }

    console.log(`  Found ${filesToInclude.length} files`);

    // Extract header info from each file
    let filesInfo: FileInfo[] = [];

    if (filesToInclude.length === 0 && moduleConfig.path !== 'lib') {
      // If ts-morph found 0 files, try reading directly from filesystem
      // This handles modules excluded in tsconfig.json
      console.log(`  Module excluded from tsconfig, scanning filesystem...`);
      const modulePath = join(projectRoot, moduleConfig.path);
      filesInfo = getAllTsFiles(modulePath, modulePath);
      console.log(`  Found ${filesInfo.length} files via filesystem`);
    } else {
      // Use ts-morph results
      for (const sourceFile of filesToInclude) {
        const info = extractHeaderInfo(sourceFile);
        if (info) {
          // Make path relative to module
          const relativePath = info.path.replace(projectRoot + '/' + moduleConfig.path + '/', '');
          filesInfo.push({
            ...info,
            name: relativePath
          });
        }
      }
    }

    // Sort files alphabetically
    filesInfo.sort((a, b) => a.name.localeCompare(b.name));

    // Extract patterns and examples from existing INDEX.md
    const { patterns, quickStart } = extractFromIndexMd(moduleConfig.path);

    // Add extracted patterns to config
    const configWithPatterns = {
      ...moduleConfig,
      criticalPatterns: patterns,
      quickStart
    };

    // Generate CLAUDE.md content
    const claudeMdContent = generateClaudeMd(configWithPatterns, filesInfo);

    // Write file
    const outputPath = join(projectRoot, moduleConfig.path, 'CLAUDE.md');
    writeFileSync(outputPath, claudeMdContent, 'utf-8');

    console.log(`  ✅ Created ${moduleConfig.path}/CLAUDE.md (${filesInfo.length} files)\n`);
  }

  console.log('✨ CLAUDE.md generation complete!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateClaudeMaps().catch(console.error);
}
