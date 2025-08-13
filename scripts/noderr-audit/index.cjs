#!/usr/bin/env node

/*
  Noderr Post-Installation Audit (NDv1.9)
  - Verifies environment_context completeness and environment distinction
  - Verifies architecture conventions and NodeID/spec coverage
  - Verifies MVP analysis presence and tracker alignment
  - Optionally auto-creates missing specs
  - Generates logs and a final report

  Usage:
    node scripts/noderr-audit/index.cjs [--apply] [--scan] [--verbose]

  Flags:
    --apply   Apply fixes (create missing spec files)
    --scan    Enable code scanning for potential missing components (conservative)
    --verbose Verbose logging
*/

const fs = require('fs');
const path = require('path');

/** Utility helpers */
function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    return null;
  }
}

function writeText(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function listFiles(dir, predicate = () => true) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile())
      .map((e) => path.join(dir, e.name))
      .filter(predicate);
  } catch {
    return [];
  }
}

function listFilesRecursive(dir, predicate = () => true, acc = []) {
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) listFilesRecursive(full, predicate, acc);
      else if (entry.isFile() && predicate(full)) acc.push(full);
    }
  } catch {
    // ignore
  }
  return acc;
}

/** CLI args */
const args = {
  apply: process.argv.includes('--apply'),
  scan: process.argv.includes('--scan'),
  verbose: process.argv.includes('--verbose'),
  updateLocations: process.argv.includes('--update-locations'),
};

/** Paths */
const ROOT = process.cwd();
const NODERR_DIR = path.join(ROOT, 'noderr');
const SPECS_DIR = path.join(NODERR_DIR, 'specs');
const ARCH_FILE = path.join(NODERR_DIR, 'noderr_architecture.md');
const ENV_FILE = path.join(NODERR_DIR, 'environment_context.md');
const PROJECT_FILE = path.join(NODERR_DIR, 'noderr_project.md');
const TRACKER_FILE = path.join(NODERR_DIR, 'noderr_tracker.md');
const LOG_FILE = path.join(NODERR_DIR, 'noderr_log.md');
const AUDIT_DIR = path.join(NODERR_DIR, 'audit');
const ARCH_VERIFY_LOG = path.join(AUDIT_DIR, 'architecture_verify_log.txt');
const MVP_ANALYSIS_LOG = path.join(AUDIT_DIR, 'mvp_analysis_log.txt');
const ENV_VERIFY_LOG = path.join(AUDIT_DIR, 'env_verify_log.txt');
const GAP_ANALYSIS_LOG = path.join(AUDIT_DIR, 'gap_analysis_log.txt');
const FINAL_REPORT = path.join(AUDIT_DIR, 'final_audit_report.md');
const SRC_DIR = path.join(ROOT, 'phoenix-code-lite', 'src');

fs.mkdirSync(AUDIT_DIR, { recursive: true });

/** Phase 1: Verify Install Completeness */
function countPlaceholdersInEnvironmentContext(text) {
  const placeholderRegex = /\[[A-Z][A-Za-z0-9_\- ]{1,50}\]/g;
  const matches = text.match(placeholderRegex) || [];
  return matches.length;
}

function extractEnvUrls(text) {
  const devMatch = text.match(/local_dev_preview:[\s\S]*?url:\s*\"([^\"]+)\"/);
  const prodMatch = text.match(/public_deployed_app:[\s\S]*?url:\s*\"([^\"]+)\"/);
  const devUrl = devMatch ? devMatch[1] : '';
  const prodUrl = prodMatch ? prodMatch[1] : '';
  return { devUrl, prodUrl };
}

function checkEnvUsageInstructions(text) {
  return /Primary development testing URL|DO NOT.*test|Use.*for.*testing/i.test(text);
}

function verifyEnvironment() {
  const envText = readText(ENV_FILE);
  let lines = [];
  if (!envText) {
    lines.push('❌ FAIL: environment_context.md not found');
    writeText(ENV_VERIFY_LOG, lines.join('\n'));
    return { ok: false, placeholders: -1, devUrl: '', prodUrl: '', hasUsage: false };
  }

  const placeholders = countPlaceholdersInEnvironmentContext(envText);
  const { devUrl, prodUrl } = extractEnvUrls(envText);
  const hasUsage = checkEnvUsageInstructions(envText);

  if (placeholders === 0) {
    lines.push('✅ PASS: Environment context shows 0 obvious placeholders');
  } else {
    lines.push(`⚠️ WARN: Detected ${placeholders} potential placeholders (heuristic)`);
  }

  if (devUrl && prodUrl) {
    lines.push('✅ PASS: Both development and production URLs documented');
    lines.push(`Development URL: ${devUrl}`);
    lines.push(`Production URL: ${prodUrl}`);
  } else {
    lines.push('❌ FAIL: Environment distinction missing (dev/prod URL not both found)');
  }

  if (hasUsage) {
    lines.push('✅ PASS: Clear instructions on which URL to use for testing');
  } else {
    lines.push('⚠️ WARN: Missing clear instructions on URL usage');
  }

  writeText(ENV_VERIFY_LOG, lines.join('\n'));
  return { ok: devUrl && prodUrl && placeholders === 0 && hasUsage, placeholders, devUrl, prodUrl, hasUsage };
}

/** Architecture parsing */
function extractNodeIdsFromArchitecture(text) {
  const regex = /\b([A-Za-z0-9_]+)\s*\[/g;
  const ids = new Set();
  let m;
  while ((m = regex.exec(text)) !== null) {
    const id = m[1];
    if (id.startsWith('L_')) continue;
    if (['User', 'graph', 'subgraph'].includes(id)) continue;
    ids.add(id);
  }
  return Array.from(ids);
}

function verifyArchitecture() {
  const archText = readText(ARCH_FILE);
  const lines = ['=== ARCHITECTURE GENERATOR CONVENTIONS CHECK ==='];
  if (!archText) {
    lines.push('❌ FAIL: noderr_architecture.md not found');
    writeText(ARCH_VERIFY_LOG, lines.join('\n'));
    return { ok: false, nodeIds: [], legendPresent: false, invalidCount: 0 };
  }

  const legendPresent = /subgraph\s+Legend/.test(archText);
  lines.push(legendPresent ? '✅ PASS: Legend subgraph found' : '❌ FAIL: Missing required Legend subgraph');

  const nodeIds = extractNodeIdsFromArchitecture(archText);
  let invalidCount = 0;
  for (const id of nodeIds) {
    // Allow TYPE_Name and multi-segment TYPE_Name_Part conventions
    if (!/^[A-Z]+(?:_[A-Za-z0-9]+)+$/.test(id)) {
      invalidCount++;
      lines.push(`❌ Invalid NodeID format: ${id} (expected TYPE_Name or TYPE_Name_Part)`);
    }
  }
  if (invalidCount === 0) {
    lines.push('✅ PASS: All NodeIDs follow TYPE_Name convention');
  }

  if (/L_UI\[\//.test(archText)) {
    lines.push('✅ PASS: Legend defines UI component shape');
  } else {
    lines.push('⚠️ WARN: Legend missing UI component shape definition');
  }

  writeText(ARCH_VERIFY_LOG, lines.join('\n'));
  return { ok: legendPresent && invalidCount === 0, nodeIds, legendPresent, invalidCount };
}

/** Specs coverage */
function listSpecFiles() {
  const files = listFiles(SPECS_DIR, (p) => p.toLowerCase().endsWith('.md'));
  // Only count files that match NodeID naming convention: TYPE_Name or TYPE_Name_Part
  return files.filter((p) => /^[A-Z]+(?:_[A-Za-z0-9]+)+\.md$/.test(path.basename(p)));
}

function toKebabCase(input) {
  // Split on underscores and transitions, join to kebab
  const parts = input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s.toLowerCase());
  return parts.join('-');
}

function deriveNameFromNodeId(nodeId) {
  const segments = nodeId.split('_');
  if (segments.length < 2) return '';
  // drop the first TYPE segment, keep the rest
  return segments.slice(1).join('_');
}

function extractStubFromCode(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const fileExt = path.extname(filePath).toLowerCase();
    
    // Handle different file types according to code stub templates
    if (fileExt === '.json') {
      // JSON files: "stub": { "title": "[Config Name - Type]", ... }
      try {
        const jsonContent = JSON.parse(raw);
        if (jsonContent.stub) {
          return {
            title: (jsonContent.stub.title || '').replace(/^\[|\]$/g, '').trim(),
            tags: Array.isArray(jsonContent.stub.tags) ? jsonContent.stub.tags : [],
            provides: Array.isArray(jsonContent.stub.provides) ? jsonContent.stub.provides : [],
            requires: Array.isArray(jsonContent.stub.requires) ? jsonContent.stub.requires : [],
            description: (jsonContent.stub.description || '').replace(/^\[|\]$/g, '').trim()
          };
        }
      } catch (jsonError) {
        // If JSON parsing fails, fall through to other methods
      }
    } else if (fileExt === '.md') {
      // Markdown files: <!-- title: [Document Title - Type] ... -->
      const htmlCommentMatch = raw.match(/<!--[\s\S]*?-->/i);
      if (htmlCommentMatch) {
        const comment = htmlCommentMatch[0];
        return {
          title: extractFieldFromComment(comment, 'title'),
          tags: extractArrayFieldFromComment(comment, 'tags'),
          provides: extractArrayFieldFromComment(comment, 'provides'),
          requires: extractArrayFieldFromComment(comment, 'requires'),
          description: extractFieldFromComment(comment, 'description')
        };
      }
    } else if (['.js', '.ts', '.jsx', '.tsx'].includes(fileExt)) {
      // JavaScript/TypeScript files: /**--- * title: [Module Name - Component Type] ... * ---*/
      const jsdocStubMatch = raw.match(/\/\*\*---[\s\S]*?---\*\//i);
      if (jsdocStubMatch) {
        const stub = jsdocStubMatch[0];
        return {
          title: extractFieldFromStub(stub, 'title'),
          tags: extractArrayFieldFromStub(stub, 'tags'),
          provides: extractArrayFieldFromStub(stub, 'provides'),
          requires: extractArrayFieldFromStub(stub, 'requires'),
          description: extractFieldFromStub(stub, 'description')
        };
      }
    }
    
    // Fallback to legacy title extraction
    const lines = raw.split(/\r?\n/).slice(0, 60);
    for (const line of lines) {
      const m = line.match(/^[\s/*#-]*title\s*:\s*(.+)$/i);
      if (m) {
        return {
          title: m[1].replace(/^\[|\]$/g, '').trim(),
          tags: [],
          provides: [],
          requires: [],
          description: ''
        };
      }
    }
    
    // Final fallback: first non-empty comment line as title
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^(\/\/|\*|\/\*|\*\*|#)/.test(trimmed)) {
        const cleaned = trimmed.replace(/^\/\//, '').replace(/^\*+\s?/, '').replace(/^#\s?/, '').replace(/^\/\*+\s?/, '').trim();
        if (cleaned && cleaned.length <= 120) {
          return {
            title: cleaned,
            tags: [],
            provides: [],
            requires: [],
            description: ''
          };
        }
      }
    }
  } catch {}
  return {
    title: '',
    tags: [],
    provides: [],
    requires: [],
    description: ''
  };
}

function extractFieldFromStub(stubContent, fieldName) {
  const regex = new RegExp(`\\*\\s*${fieldName}\\s*:\\s*\\[?([^\\]\\n]+)\\]?`, 'i');
  const match = stubContent.match(regex);
  return match ? match[1].trim() : '';
}

function extractArrayFieldFromStub(stubContent, fieldName) {
  const fieldValue = extractFieldFromStub(stubContent, fieldName);
  if (!fieldValue) return [];
  return fieldValue.split(',').map(item => item.trim()).filter(Boolean);
}

function extractFieldFromComment(commentContent, fieldName) {
  const regex = new RegExp(`${fieldName}\\s*:\\s*\\[?([^\\]\\n]+)\\]?`, 'i');
  const match = commentContent.match(regex);
  return match ? match[1].trim() : '';
}

function extractArrayFieldFromComment(commentContent, fieldName) {
  const fieldValue = extractFieldFromComment(commentContent, fieldName);
  if (!fieldValue) return [];
  return fieldValue.split(',').map(item => item.trim()).filter(Boolean);
}

// Keep backward compatibility function
function extractTitleFromCode(filePath) {
  const stub = extractStubFromCode(filePath);
  return stub.title;
}

function extractTitleFromSpecText(text) {
  const m = text.match(/^\s*-\s*File\s+Title\s*:\s*(.+)$/mi);
  return m ? m[1].trim() : '';
}

function findLikelyImplementationPaths(nodeId, expectedTitle = '', maxResults = 3) {
  if (!fileExists(SRC_DIR)) return [];
  const name = deriveNameFromNodeId(nodeId);
  const kebab = toKebabCase(name);
  const rawLower = name.replace(/_/g, '').toLowerCase();
  const variants = [kebab, rawLower];
  const expect = (expectedTitle || '').toLowerCase();

  const candidates = listFilesRecursive(
    SRC_DIR,
    (p) => /\.(ts|tsx|js|jsx)$/i.test(p)
  );
  const scored = [];
  for (const file of candidates) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const base = path.basename(file).toLowerCase();
    const relLower = rel.toLowerCase();
    const codeTitle = extractTitleFromCode(file).toLowerCase();
    let score = 0;
    // Title match takes precedence
    if (expect && codeTitle && codeTitle === expect) score += 10;
    // Heuristic name matches
    for (const v of variants) {
      if (!v) continue;
      if (base.includes(v)) score += 3;
      if (relLower.includes(`/${v}`)) score += 2;
      if (relLower.includes(v)) score += 1;
    }
    if (score > 0) scored.push({ file: rel, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxResults).map((s) => s.file);
}

function updateSpecLocationAndTitle(specPath, nodeId, locations) {
  const text = readText(specPath);
  if (!text) return;
  
  // Get stub information from the first available location
  let stubData = { title: '', tags: [], provides: [], requires: [], description: '' };
  if (locations && locations.length > 0) {
    const abs = path.join(ROOT, locations[0]);
    stubData = extractStubFromCode(abs);
  }

  let newText = text;
  
  // Update Location
  const locLine = (locations && locations.length > 0)
    ? `- Location: ${locations.join(', ')}`
    : `- Location: [path/to/${nodeId}]`;
  newText = newText.replace(/^-\s*Location:.*$/m, locLine);

  // Update or add File Title
  if (stubData.title) {
    if (/^-\s*File\s+Title:/mi.test(newText)) {
      newText = newText.replace(/^-\s*File\s+Title:.*$/m, `- File Title: ${stubData.title}`);
    } else {
      newText = newText.replace(/^-\s*Location:.*$/m, (m) => `${m}\n- File Title: ${stubData.title}`);
    }
  }

  // Update or add Tags
  if (stubData.tags.length > 0) {
    const tagsLine = `- Tags: [${stubData.tags.join(', ')}]`;
    if (/^-\s*Tags:/mi.test(newText)) {
      newText = newText.replace(/^-\s*Tags:.*$/m, tagsLine);
    } else {
      // Insert after File Title or Location
      const insertAfter = /^-\s*File\s+Title:/mi.test(newText) ? /^-\s*File\s+Title:.*$/m : /^-\s*Location:.*$/m;
      newText = newText.replace(insertAfter, (m) => `${m}\n${tagsLine}`);
    }
  }

  // Update or add Provides
  if (stubData.provides.length > 0) {
    const providesLine = `- Provides: [${stubData.provides.join(', ')}]`;
    if (/^-\s*Provides:/mi.test(newText)) {
      newText = newText.replace(/^-\s*Provides:.*$/m, providesLine);
    } else {
      // Insert after Interfaces line or create before it
      if (/^-\s*Interfaces:/mi.test(newText)) {
        newText = newText.replace(/^-\s*Interfaces:.*$/m, (m) => `${providesLine}\n${m}`);
      } else {
        // Insert after Tags or File Title or Location
        const insertAfter = /^-\s*Tags:/mi.test(newText) ? /^-\s*Tags:.*$/m : 
                           /^-\s*File\s+Title:/mi.test(newText) ? /^-\s*File\s+Title:.*$/m : 
                           /^-\s*Location:.*$/m;
        newText = newText.replace(insertAfter, (m) => `${m}\n${providesLine}`);
      }
    }
  }

  // Update Dependencies with Requires data
  if (stubData.requires.length > 0) {
    const requiresLine = `- Dependencies: [${stubData.requires.join(', ')}]`;
    newText = newText.replace(/^-\s*Dependencies:.*$/m, requiresLine);
  }

  // Add Code Stub Information section if we have additional data
  if (stubData.description || stubData.tags.length > 0 || stubData.provides.length > 0) {
    // Check if Code Stub Information section exists
    if (!/## Code Stub Information/mi.test(newText)) {
      // Add the section before Discovery Context
      const stubSection = `## Code Stub Information
${stubData.description ? `- Description: ${stubData.description}` : ''}
${stubData.tags.length > 0 ? `- Categories: [${stubData.tags.join(', ')}]` : ''}
${stubData.provides.length > 0 ? `- Capabilities: [${stubData.provides.join(', ')}]` : ''}
${stubData.requires.length > 0 ? `- Requirements: [${stubData.requires.join(', ')}]` : ''}

`;
      
      newText = newText.replace(/^## Discovery Context/m, `${stubSection}## Discovery Context`);
    } else {
      // Update existing Code Stub Information section
      if (stubData.description) {
        if (/^-\s*Description:/mi.test(newText)) {
          newText = newText.replace(/^-\s*Description:.*$/m, `- Description: ${stubData.description}`);
        } else {
          newText = newText.replace(/^## Code Stub Information$/m, (m) => `${m}\n- Description: ${stubData.description}`);
        }
      }
      
      if (stubData.tags.length > 0) {
        const categoriesLine = `- Categories: [${stubData.tags.join(', ')}]`;
        if (/^-\s*Categories:/mi.test(newText)) {
          newText = newText.replace(/^-\s*Categories:.*$/m, categoriesLine);
        } else {
          const insertAfter = /^-\s*Description:/mi.test(newText) ? /^-\s*Description:.*$/m : /^## Code Stub Information$/m;
          newText = newText.replace(insertAfter, (m) => `${m}\n${categoriesLine}`);
        }
      }
      
      if (stubData.provides.length > 0) {
        const capabilitiesLine = `- Capabilities: [${stubData.provides.join(', ')}]`;
        if (/^-\s*Capabilities:/mi.test(newText)) {
          newText = newText.replace(/^-\s*Capabilities:.*$/m, capabilitiesLine);
        } else {
          const insertAfter = /^-\s*Categories:/mi.test(newText) ? /^-\s*Categories:.*$/m :
                             /^-\s*Description:/mi.test(newText) ? /^-\s*Description:.*$/m : 
                             /^## Code Stub Information$/m;
          newText = newText.replace(insertAfter, (m) => `${m}\n${capabilitiesLine}`);
        }
      }
      
      if (stubData.requires.length > 0) {
        const requirementsLine = `- Requirements: [${stubData.requires.join(', ')}]`;
        if (/^-\s*Requirements:/mi.test(newText)) {
          newText = newText.replace(/^-\s*Requirements:.*$/m, requirementsLine);
        } else {
          const insertAfter = /^-\s*Capabilities:/mi.test(newText) ? /^-\s*Capabilities:.*$/m :
                             /^-\s*Categories:/mi.test(newText) ? /^-\s*Categories:.*$/m :
                             /^-\s*Description:/mi.test(newText) ? /^-\s*Description:.*$/m : 
                             /^## Code Stub Information$/m;
          newText = newText.replace(insertAfter, (m) => `${m}\n${requirementsLine}`);
        }
      }
    }
  }

  writeText(specPath, newText);
}

function ensureSpecForNodeId(nodeId) {
  const specPath = path.join(SPECS_DIR, `${nodeId}.md`);
  const specExists = fileExists(specPath);
  let specText = specExists ? readText(specPath) : '';
  let expectedTitle = specExists ? extractTitleFromSpecText(specText) : '';
  const locations = findLikelyImplementationPaths(nodeId, expectedTitle);

  if (specExists) {
    updateSpecLocationAndTitle(specPath, nodeId, locations);
    return { created: false, path: specPath };
  }

  // Compose new spec with stub data
  const locationLine = locations.length > 0 ? locations.join(', ') : `[path/to/${nodeId}]`;
  let stubData = { title: '', tags: [], provides: [], requires: [], description: '' };
  if (locations.length > 0) {
    const abs = path.join(ROOT, locations[0]);
    stubData = extractStubFromCode(abs);
  }

  // Build Implementation Details section
  let implDetails = `- Location: ${locationLine}`;
  if (stubData.title) implDetails += `\n- File Title: ${stubData.title}`;
  if (stubData.tags.length > 0) implDetails += `\n- Tags: [${stubData.tags.join(', ')}]`;
  if (stubData.provides.length > 0) implDetails += `\n- Provides: [${stubData.provides.join(', ')}]`;
  implDetails += `\n- Interfaces: [APIs, methods]`;
  if (stubData.requires.length > 0) {
    implDetails += `\n- Dependencies: [${stubData.requires.join(', ')}]`;
  } else {
    implDetails += `\n- Dependencies: [list]`;
  }
  implDetails += `\n- Dependents: [list]`;

  // Build Code Stub Information section if we have data
  let stubSection = '';
  if (stubData.description || stubData.tags.length > 0 || stubData.provides.length > 0) {
    stubSection = `## Code Stub Information
${stubData.description ? `- Description: ${stubData.description}` : ''}
${stubData.tags.length > 0 ? `- Categories: [${stubData.tags.join(', ')}]` : ''}
${stubData.provides.length > 0 ? `- Capabilities: [${stubData.provides.join(', ')}]` : ''}
${stubData.requires.length > 0 ? `- Requirements: [${stubData.requires.join(', ')}]` : ''}

`;
  }

  const template = `# ${nodeId}.md

## Purpose
Describe what this component does.

## Current Implementation Status
⚪ PLANNED (default) — Update to 🟢 VERIFIED if implemented

## Implementation Details
${implDetails}

${stubSection}## Discovery Context
Explain origin and why it matters.

## ARC Verification Criteria
- [ ] Functional behavior validated
- [ ] Input validation verified
- [ ] Error handling verified
- [ ] Performance acceptable
- [ ] Security considerations addressed

## Technical Debt & Improvements
- Notes here
`;
  writeText(specPath, template);
  return { created: true, path: specPath };
}

function updateAllSpecLocations() {
  const specs = listSpecFiles();
  let updated = 0;
  for (const spec of specs) {
    const nodeId = path.basename(spec, '.md');
    const specText = readText(spec) || '';
    const expectedTitle = extractTitleFromSpecText(specText);
    const locations = findLikelyImplementationPaths(nodeId, expectedTitle);
    updateSpecLocationAndTitle(spec, nodeId, locations);
    updated++;
  }
  return updated;
}

/** MVP analysis */
function verifyMvpAnalysis() {
  const projectText = readText(PROJECT_FILE) || '';
  const trackerText = readText(TRACKER_FILE) || '';
  const lines = ['=== MVP COMPLETENESS VERIFICATION ==='];

  const hasMvpSection = /Key Features \(In Scope for MVP\)/.test(projectText);
  lines.push(hasMvpSection ? '✅ MVP features section found' : '❌ CRITICAL: MVP features section missing');

  const hasMvpImplementationStatus = /MVP Implementation Status|MVP Completion/i.test(projectText);
  lines.push(hasMvpImplementationStatus ? '✅ MVP implementation status documented' : '❌ MISSING: MVP implementation analysis not found');

  const plannedMissing = (trackerText.match(/Required for MVP|PLANNED.*MVP|Missing.*MVP/gi) || []).length;
  lines.push(`Components identified as missing for MVP: ${plannedMissing}`);

  writeText(MVP_ANALYSIS_LOG, lines.join('\n'));
  return { ok: hasMvpSection && hasMvpImplementationStatus, plannedMissing, hasMvpSection };
}

/** Optional gap scan (conservative) */
function scanForPotentialMissingComponents() {
  if (!args.scan) return [];
  const candidates = [];
  const SRC = path.join(ROOT, 'phoenix-code-lite', 'src');
  if (!fileExists(SRC)) return candidates;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && /\.(ts|tsx|js|jsx|py)$/i.test(entry.name)) {
        const rel = path.relative(SRC, full).replace(/\\/g, '/');
        const parts = rel.split('/');
        const prefix = parts[0] || 'UTIL';
        const base = path.basename(entry.name).replace(/\.[^.]+$/, '');
        const suggested = `${prefix.toUpperCase()}_${base.replace(/[^A-Za-z0-9]/g, '')}`;
        candidates.push({ file: full, suggestedNodeId: suggested });
      }
    }
  };
  walk(SRC);
  return candidates;
}

/** Final report generation */
function buildFinalReport(context) {
  const lines = [];
  const now = new Date();
  const stamp = now.toISOString();
  let totalScore = 0;

  const envCompleteScore = context.env.placeholders === 0 ? 10 : 0;
  const envUrlsScore = context.env.devUrl && context.env.prodUrl ? 10 : 0;
  const specsCoverageScore = context.coverage.match ? 10 : 0;
  const archConvScore = context.arch.legendPresent && context.arch.invalidCount === 0 ? 10 : (context.arch.legendPresent ? 5 : 0);
  const envDocScore = context.env.hasUsage ? 10 : 5;
  const mvpAnalysisScore = context.mvp.ok ? 15 : (context.mvp.hasMvpSection ? 8 : 0);
  const missingIdentifiedScore = (context.mvp.plannedMissing >= 0 ? 10 : 0);
  const docsQualityScore = context.coverage.specCount > 0 ? 10 : 3;
  const archAlignScore = context.arch.nodeIds.length > 0 ? 5 : 0;
  const nextStepsScore = 5;
  const blockersScore = 5;

  totalScore = envCompleteScore + envUrlsScore + specsCoverageScore + archConvScore + envDocScore + mvpAnalysisScore + missingIdentifiedScore + docsQualityScore + archAlignScore + nextStepsScore + blockersScore;

  lines.push('# Post-Installation Audit Report');
  lines.push(`Date: ${stamp}`);
  lines.push(`System Health Score: ${totalScore}/100`);
  lines.push('');

  lines.push('## 📊 Install Promise Verification');
  lines.push(`- Environment Context: ${context.env.placeholders === 0 ? '✅ 0 placeholders' : `⚠️ ${context.env.placeholders} potential placeholders`}`);
  lines.push(`- Dev/Prod Distinction: ${(context.env.devUrl && context.env.prodUrl) ? '✅ Clear' : '❌ Missing'}`);
  lines.push(`- Complete System Specs: ${context.coverage.match ? '✅ Perfect match' : `❌ ${context.coverage.nodeIdCount - context.coverage.specCount} missing specs`}`);
  lines.push(`- Architecture Conventions: ${context.arch.legendPresent && context.arch.invalidCount === 0 ? '✅ Follows Generator' : '⚠️ Check issues in architecture_verify_log.txt'}`);
  lines.push(`- MVP Analysis: ${context.mvp.ok ? '✅ Complete' : '⚠️ Needs improvement'}`);
  lines.push('');

  lines.push('## 🌐 Environment Distinction');
  lines.push(`- Development URL: ${context.env.devUrl || 'N/A'}`);
  lines.push(`- Production URL: ${context.env.prodUrl || 'N/A'}`);
  lines.push(`- Usage Instructions Present: ${context.env.hasUsage ? '✅ Yes' : '⚠️ No'}`);
  lines.push('');

  lines.push('## 🏗️ Coverage');
  lines.push(`- NodeIDs in architecture: ${context.coverage.nodeIdCount}`);
  lines.push(`- Spec files in noderr/specs: ${context.coverage.specCount}`);
  lines.push(`- Coverage Match: ${context.coverage.match ? '✅ Yes' : '❌ No'}`);
  if (context.createdSpecs.length > 0) {
    lines.push('- Auto-created specs:');
    for (const s of context.createdSpecs) lines.push(`  - ${s}`);
  }
  lines.push('');

  lines.push('## 🔍 Logs');
  lines.push(`- Architecture: ${path.relative(ROOT, ARCH_VERIFY_LOG)}`);
  lines.push(`- Environment: ${path.relative(ROOT, ENV_VERIFY_LOG)}`);
  lines.push(`- MVP: ${path.relative(ROOT, MVP_ANALYSIS_LOG)}`);
  lines.push(`- Gaps: ${path.relative(ROOT, GAP_ANALYSIS_LOG)}`);
  lines.push('');

  lines.push('## 🚀 Recommended Next Steps');
  if (!context.coverage.match) {
    lines.push('- Create specs for all NodeIDs missing spec files (use --apply to auto-create stubs).');
  }
  if (!context.env.devUrl || !context.env.prodUrl) {
    lines.push('- Ensure both development and production URLs are documented in noderr/environment_context.md.');
  }
  if (!context.env.hasUsage) {
    lines.push('- Add clear testing usage instructions near access URLs (use dev URL only).');
  }
  if (!context.mvp.ok) {
    lines.push('- Add MVP implementation status/percentage to noderr/noderr_project.md.');
  }

  writeText(FINAL_REPORT, lines.join('\n'));
}

/** Insert audit entry into noderr_log.md */
function prependAuditLogEntry({ score, devUrl, prodUrl, coverageMatch }) {
  const text = readText(LOG_FILE);
  if (!text) return;
  const marker = '**[NEWEST ENTRIES APPEAR HERE - DO NOT REMOVE THIS MARKER]**';
  const idx = text.indexOf(marker);
  const stamp = new Date().toISOString();
  const entry = [
    '---',
    '**Type:** SystemAudit',
    `**Timestamp:** ${stamp}`,
    '**Details:**',
    `Post-installation audit completed.`,
    `- System Health Score (approx): ${score}`,
    `- Environment Distinction: ${(devUrl && prodUrl) ? 'CLEAR' : 'MISSING'}`,
    `- Coverage Match (NodeIDs vs Specs): ${coverageMatch ? 'YES' : 'NO'}`,
    `- See final report: ${path.relative(ROOT, FINAL_REPORT)}`,
    '---',
  ].join('\n');

  if (idx !== -1) {
    const before = text.slice(0, idx + marker.length);
    const after = text.slice(idx + marker.length);
    writeText(LOG_FILE, `${before}\n${entry}\n${after}`);
  }
}

/** Main */
(function main() {
  console.log('🔎 Running Noderr Post-Installation Audit...');

  // Always refresh locations and titles at start of audit
  updateAllSpecLocations();

  // Phase 1: Environment
  const env = verifyEnvironment();

  // Architecture
  const arch = verifyArchitecture();
  const nodeIds = arch.nodeIds || [];

  // Coverage
  const specs = listSpecFiles();
  const specSet = new Set(specs.map((p) => path.basename(p, '.md')));
  const missingNodeIds = nodeIds.filter((id) => !specSet.has(id));
  const createdSpecs = [];

  if (missingNodeIds.length > 0) {
    const gapLines = ['=== GAP ANALYSIS RESULTS ==='];
    gapLines.push(`NodeIDs without spec files: ${missingNodeIds.length}`);
    for (const id of missingNodeIds) {
      const res = ensureSpecForNodeId(id);
      if (res.created) createdSpecs.push(res.path);
    }
    gapLines.push(`✅ Created ${createdSpecs.length} missing spec stubs`);
    writeText(GAP_ANALYSIS_LOG, gapLines.join('\n'));
  } else {
    writeText(GAP_ANALYSIS_LOG, '✅ NO GAPS FOUND: All NodeIDs have corresponding spec files');
  }

  // MVP analysis
  const mvp = verifyMvpAnalysis();

  // Optional scan (conservative)
  const scanResults = scanForPotentialMissingComponents();
  if (args.scan && scanResults.length > 0) {
    const lines = [readText(GAP_ANALYSIS_LOG) || '', '', '=== CONSERVATIVE CODE SCAN SUGGESTIONS ==='];
    lines.push(`Candidates found: ${scanResults.length}`);
    lines.push('Examples (first 10):');
    for (const s of scanResults.slice(0, 10)) {
      lines.push(`- ${path.relative(ROOT, s.file)} -> ${s.suggestedNodeId}`);
    }
    writeText(GAP_ANALYSIS_LOG, lines.join('\n'));
  }

  // Build final report
  const coverage = {
    nodeIdCount: nodeIds.length,
    specCount: specs.length,
    match: nodeIds.length === specs.length,
  };

  buildFinalReport({ env, arch, coverage, createdSpecs, mvp });

  // Prepend audit entry into log
  prependAuditLogEntry({
    score: 'see report',
    devUrl: env.devUrl,
    prodUrl: env.prodUrl,
    coverageMatch: coverage.match,
  });

  console.log(`✅ Audit complete. See ${path.relative(ROOT, FINAL_REPORT)}`);
})();
