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

/** CLI args */
const args = {
  apply: process.argv.includes('--apply'),
  scan: process.argv.includes('--scan'),
  verbose: process.argv.includes('--verbose'),
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
    if (!/^[A-Z]+_[A-Za-z0-9]+$/.test(id)) {
      invalidCount++;
      lines.push(`❌ Invalid NodeID format: ${id} (expected TYPE_Name)`);
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
  return listFiles(SPECS_DIR, (p) => p.toLowerCase().endsWith('.md'));
}

function ensureSpecForNodeId(nodeId) {
  const specPath = path.join(SPECS_DIR, `${nodeId}.md`);
  if (fileExists(specPath)) return { created: false, path: specPath };
  const template = `# ${nodeId}.md

## Purpose
Describe what this component does.

## Current Implementation Status
⚪ PLANNED (default) — Update to 🟢 VERIFIED if implemented

## Implementation Details
- Location: [path/to/${nodeId}]
- Interfaces: [APIs, methods]
- Dependencies: [list]
- Dependents: [list]

## Discovery Context
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
    if (args.apply) {
      for (const id of missingNodeIds) {
        const res = ensureSpecForNodeId(id);
        if (res.created) createdSpecs.push(res.path);
      }
      gapLines.push(`✅ Created ${createdSpecs.length} missing spec stubs`);
    } else {
      gapLines.push('ℹ️ Run with --apply to auto-create missing spec stubs.');
    }
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
