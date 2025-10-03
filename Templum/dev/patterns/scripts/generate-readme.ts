import { promises as fs } from 'fs';
import path from 'path';
import { parse as parseYaml } from 'yaml';

type RawFrontmatter = Record<string, unknown>;

type PatternMeta = {
  filePath: string;
  relativePath: string;
  name: string;
  status: string;
  category: string;
  keywords: string[];
  description: string;
  lastUpdated: string;
  useWhen: string[];
  prerequisites: string[];
  relatedPatterns: string[];
  isDeprecated: boolean;
};

const PATTERNS_DIR = path.resolve(__dirname, '..');
const README_PATH = path.join(PATTERNS_DIR, 'README.md');

const GLYPH_MEANINGS: Record<string, string> = {
  '[ ]': 'todo',
  '[x]': 'complete',
  '[~]': 'in-progress',
  '[-]': 'cancelled',
  '[!]': 'priority',
  '[>]': 'forwarded',
  '[<]': 'scheduled',
  '[?]': 'blocked',
  '[B]': 'implemented-broken',
  '[T]': 'implemented-testing',
  '[D]': 'documenting',
  '[F]': 'failure'
};

const DEPRECATED_KEYWORDS = ['deprecated', 'retired', 'archived', 'superseded', 'legacy', 'migrated'];
const DEPRECATED_GLYPH_MEANINGS = new Set(['cancelled', 'forwarded']);

async function collectPatternFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'scripts') {
        continue;
      }
      const nested = await collectPatternFiles(fullPath);
      files.push(...nested);
    } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name.toLowerCase() !== 'readme.md') {
      files.push(fullPath);
    }
  }

  return files;
}

function extractFrontmatter(content: string): RawFrontmatter | null {
  const match = /^---\s*\n([\s\S]*?)\n---\s*/.exec(content);
  if (!match) {
    return null;
  }

  try {
    return parseYaml(match[1]) as RawFrontmatter;
  } catch (error) {
    throw new Error(`Failed to parse frontmatter: ${(error as Error).message}`);
  }
}

function normaliseString(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (Array.isArray(value) && value.length === 1) {
    const [first] = value;
    if (typeof first === 'string') {
      return first.trim();
    }
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return '';
}

function normaliseList(value: unknown): string[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => normaliseString(item))
      .filter((item) => item.length > 0);
  }
  const asString = normaliseString(value);
  if (asString.length === 0) {
    return [];
  }
  if (asString.includes(',')) {
    return asString
      .split(',')
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);
  }
  return [asString];
}

function determineDeprecation(statusRaw: string): boolean {
  if (!statusRaw) {
    return false;
  }
  const glyphMatch = statusRaw.match(/\[[^\]]+\]/);
  if (glyphMatch) {
    const glyph = glyphMatch[0];
    const meaning = GLYPH_MEANINGS[glyph];
    if (meaning && DEPRECATED_GLYPH_MEANINGS.has(meaning)) {
      return true;
    }
  }

  const lowered = statusRaw.toLowerCase();
  return DEPRECATED_KEYWORDS.some((keyword) => lowered.includes(keyword));
}

function cleanJoin(values: string[]): string {
  if (values.length === 0) {
    return '—';
  }
  return values.join(', ');
}

function escapePipes(value: string): string {
  return value.replace(/\|/g, '\\|');
}

function normaliseDescription(value: unknown): string {
  const description = normaliseString(value);
  return description.length > 0 ? description : '—';
}

function sanitiseListDisplay(values: string[]): string {
  if (values.length === 0) {
    return '—';
  }
  return values.join(', ');
}

function scrubNone(values: string[]): string[] {
  return values.filter((item) => {
    const lowered = item.toLowerCase();
    return lowered !== 'none' && lowered !== 'n/a' && lowered !== 'not applicable';
  });
}

async function loadPatterns(): Promise<PatternMeta[]> {
  const files = await collectPatternFiles(PATTERNS_DIR);
  const patterns: PatternMeta[] = [];

  for (const filePath of files) {
    const content = await fs.readFile(filePath, 'utf8');
    const frontmatter = extractFrontmatter(content);

    if (!frontmatter) {
      continue;
    }

    const name = normaliseString(frontmatter.name) || path.basename(filePath, '.md');
    const statusRaw = normaliseString(frontmatter.status) || normaliseList(frontmatter.status).join(', ');
    const status = statusRaw || '—';
    const category = normaliseString(frontmatter.category) || '—';
    const keywords = normaliseList(frontmatter.keywords);
    const description = normaliseDescription(frontmatter.description);
    const lastUpdated = normaliseString(frontmatter['last-updated']) || normaliseString(frontmatter.lastUpdated) || '—';
    const useWhen = normaliseList(frontmatter['use-when']);
    const prerequisitesRaw = scrubNone(normaliseList(frontmatter.prerequisites));
    const relatedPatterns = scrubNone(normaliseList(frontmatter['related-patterns'] ?? frontmatter.relatedPatterns));

    const relativePath = path.relative(PATTERNS_DIR, filePath).replace(/\\/g, '/');

    patterns.push({
      filePath,
      relativePath,
      name,
      status,
      category,
      keywords,
      description,
      lastUpdated,
      useWhen,
      prerequisites: prerequisitesRaw,
      relatedPatterns,
      isDeprecated: determineDeprecation(status)
    });
  }

  return patterns.sort((a, b) => a.name.localeCompare(b.name));
}

function buildActiveTable(patterns: PatternMeta[]): string {
  if (patterns.length === 0) {
    return '> No active patterns found.';
  }

  const rows = patterns.map((pattern) => {
    const nameCell = `[${pattern.name}](${pattern.relativePath})`;
    const keywordsCell = cleanJoin(pattern.keywords);
    return `| ${nameCell} | ${pattern.status || '—'} | ${pattern.category || '—'} | ${keywordsCell} |`;
  });

  return ['| Pattern | Status | Category | Keywords |', '| --- | --- | --- | --- |', ...rows].join('\n');
}

function buildDeprecatedTable(patterns: PatternMeta[]): string {
  if (patterns.length === 0) {
    return '> No deprecated or migrated patterns currently recorded.';
  }

  const rows = patterns.map((pattern) => {
    const nameCell = `[${pattern.name}](${pattern.relativePath})`;
    const keywordsCell = cleanJoin(pattern.keywords);
    return `| ${nameCell} | ${pattern.status || '—'} | ${pattern.category || '—'} | ${keywordsCell} |`;
  });

  return ['| Pattern | Status | Category | Keywords |', '| --- | --- | --- | --- |', ...rows].join('\n');
}

function buildDetailList(patterns: PatternMeta[]): string {
  if (patterns.length === 0) {
    return '> No patterns available.';
  }

  return patterns
    .map((pattern) => {
      const lines: string[] = [];
      const description = escapePipes(pattern.description);
      lines.push(`- [${pattern.name}](${pattern.relativePath}) | ${pattern.lastUpdated} | ${pattern.category || '—'} | ${description}`);
      const useWhenItems = pattern.useWhen.length > 0 ? pattern.useWhen : ['—'];
      lines.push('  - use-when:');
      useWhenItems.forEach((item) => {
        lines.push(`    - ${item}`);
      });
      lines.push(`  - keywords: ${sanitiseListDisplay(pattern.keywords)}`);
      lines.push(`  - prerequisites: ${sanitiseListDisplay(pattern.prerequisites)}`);
      lines.push(`  - related patterns: ${sanitiseListDisplay(pattern.relatedPatterns)}`);
      return lines.join('\n');
    })
    .join('\n\n');
}

function replaceSection(source: string, marker: string, replacement: string): string {
  const start = `<!-- ${marker} -->`;
  const end = `<!-- /${marker} -->`;
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);

  if (!pattern.test(source)) {
    throw new Error(`Marker ${marker} not found in README.`);
  }

  return source.replace(pattern, `${start}\n${replacement}\n${end}`);
}

async function main() {
  const patterns = await loadPatterns();
  const activePatterns = patterns.filter((pattern) => !pattern.isDeprecated);
  const deprecatedPatterns = patterns.filter((pattern) => pattern.isDeprecated);

  const activeTable = buildActiveTable(activePatterns);
  const deprecatedTable = buildDeprecatedTable(deprecatedPatterns);
  const details = buildDetailList(patterns);

  const readme = await fs.readFile(README_PATH, 'utf8');
  const updated = [
    { marker: 'PATTERN:ACTIVE_TABLE', content: activeTable },
    { marker: 'PATTERN:DEPRECATED_TABLE', content: deprecatedTable },
    { marker: 'PATTERN:DETAIL_LIST', content: details }
  ].reduce((acc, section) => replaceSection(acc, section.marker, section.content), readme);

  await fs.writeFile(README_PATH, `${updated.trimEnd()}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
