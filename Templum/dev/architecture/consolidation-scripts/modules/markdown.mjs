import prettier from 'prettier';
import { enforceNoteIndentation } from '../schedule-format-helpers.mjs';

const PATH_ROOT_HINTS = new Set([
  'archive',
  'config',
  'dev',
  'docs',
  'examples',
  'haruspex',
  'logs',
  'meta',
  'phoenix-code-lite',
  'scripts',
  'src',
  'templum',
  'tests',
  'tmp'
]);

const SINGLE_QUOTE_PATTERN = /(?<![`])('[^'\n]+')(?![`])/g;
const PATH_CANDIDATE_PATTERN =
  /(?<![`])((?:\.\.?\/|[A-Za-z0-9_.-]+\/)[A-Za-z0-9_.\-*@()+\\{}\[\]]*(?:\/[A-Za-z0-9_.\-*@()+\\{}\[\]]+)*)/g;
const DOT_CHAIN_PATTERN =
  /(?<![`])([^\s()[\]{}:;,.\\\/`]+(?:\.[^\s()[\]{}:;,.\\\/`]+)+)(?![`])/g;
const TRAILING_PUNCTUATION = new Set([')', ']', '}', '.', ',', ':', ';']);

function shouldWrapPathCandidate(token) {
  if (!token || typeof token !== 'string' || !token.includes('/')) {
    return false;
  }
  if (token.startsWith('http://') || token.startsWith('https://') || token.startsWith('mailto:')) {
    return false;
  }
  if (token.includes('\\')) {
    return true;
  }
  const cleanedSegments = token.split('/').filter(Boolean);
  if (!cleanedSegments.length) {
    return false;
  }
  const firstSegment = cleanedSegments[0].toLowerCase();
  if (PATH_ROOT_HINTS.has(firstSegment)) {
    return true;
  }
  if (token.startsWith('./') || token.startsWith('../') || token.startsWith('/')) {
    return true;
  }
  if (token.includes('**')) {
    return true;
  }
  if (token.includes('.') || token.includes('_') || token.includes('-') || /\d/.test(token)) {
    return true;
  }
  if (cleanedSegments.length >= 2 && cleanedSegments.some((segment) => segment.length > 3)) {
    return true;
  }
  return false;
}

function stripTrailingPunctuation(value) {
  let core = value;
  let suffix = '';
  while (core.length > 0 && TRAILING_PUNCTUATION.has(core[core.length - 1])) {
    suffix = `${core[core.length - 1]}${suffix}`;
    core = core.slice(0, -1);
  }
  return { core, suffix };
}

function isInsideInlineCode(source, index) {
  if (index <= 0) {
    return false;
  }
  let count = 0;
  for (let i = 0; i < index; i += 1) {
    if (source[i] === '`') {
      count += 1;
    }
  }
  return count % 2 === 1;
}

function wrapQuotedSegments(line) {
  return line.replace(SINGLE_QUOTE_PATTERN, (match) => {
    if (match.length <= 2) {
      return match;
    }
    return `\`${match}\``;
  });
}

function wrapPathSegments(line) {
  return line.replace(PATH_CANDIDATE_PATTERN, (match, _capture, offset, source) => {
    const precedingTwo = source.slice(Math.max(0, offset - 2), offset);
    if (precedingTwo === '](') {
      return match;
    }
    if (isInsideInlineCode(source, offset)) {
      return match;
    }
    const precedingChar = source[offset - 1];
    const trailingChar = source[offset + match.length];
    if (precedingChar === '`' || trailingChar === '`') {
      return match;
    }
    if (!shouldWrapPathCandidate(match)) {
      return match;
    }
    const { core, suffix } = stripTrailingPunctuation(match);
    if (!core) {
      return match;
    }
    return `\`${core}\`${suffix}`;
  });
}

function wrapDotChainSegments(line) {
  return line.replace(DOT_CHAIN_PATTERN, (match, _capture, offset, source) => {
    if (isInsideInlineCode(source, offset)) {
      return match;
    }
    const precedingChar = source[offset - 1];
    const trailingChar = source[offset + match.length];
    if (precedingChar === '`' || trailingChar === '`') {
      return match;
    }
    const { core, suffix } = stripTrailingPunctuation(match);
    if (!core) {
      return match;
    }
    const segments = core.split('.');
    if (!segments.length || segments[0].length < 2) {
      return match;
    }
    return `\`${core}\`${suffix}`;
  });
}

function prepareMarkdownContent(content) {
  if (typeof content !== 'string') {
    return content;
  }
  const lines = content.split('\n');
  let insideFence = false;
  return lines
    .map((line) => {
      const trimmed = line.trimStart();
      if (trimmed.startsWith('```')) {
        insideFence = !insideFence;
        return line;
      }
      if (insideFence) {
        return line;
      }
      let updated = wrapQuotedSegments(line);
      updated = wrapPathSegments(updated);
      updated = wrapDotChainSegments(updated);
      return updated;
    })
    .join('\n');
}

function normalizeChecklistIndentation(markdown) {
  if (typeof markdown !== 'string') {
    return markdown;
  }
  const lines = markdown.split('\n');
  return lines
    .map((line, index) => {
      const trimmed = line.trimStart();
      if (!trimmed || trimmed.startsWith('```')) {
        return line;
      }
      const leadingSpaces = line.length - trimmed.length;
      const prevLine = index > 0 ? lines[index - 1] : '';
      const prevTrimmed = prevLine.trimStart();
      const prevIsChecklistItem =
        prevTrimmed.startsWith('- [') || prevTrimmed.startsWith('- ') || prevTrimmed.startsWith('* ');
      const isChecklistItem = trimmed.startsWith('- ') || trimmed.startsWith('* ');
      if (isChecklistItem) {
        if (leadingSpaces === 0) {
          return line;
        }
        return leadingSpaces === 2 ? line : `  ${trimmed}`;
      }
      if (prevIsChecklistItem && leadingSpaces !== 2) {
        return `  ${trimmed}`;
      }
      return line;
    })
    .join('\n');
}

async function formatMarkdownIfNeeded(filePath, content) {
  if (typeof content !== 'string') {
    return content;
  }
  const preparedContent = prepareMarkdownContent(content);
  const isMarkdownTarget = typeof filePath === 'string' && filePath.endsWith('.md');
  if (!isMarkdownTarget) {
    return normalizeChecklistIndentation(enforceNoteIndentation(preparedContent));
  }
  try {
    const config = await prettier.resolveConfig(filePath);
    const options = { ...(config || {}), parser: 'markdown' };
    const formatted = prettier.format(preparedContent, options);
    return normalizeChecklistIndentation(enforceNoteIndentation(formatted));
  } catch {
    return normalizeChecklistIndentation(enforceNoteIndentation(preparedContent));
  }
}

export { formatMarkdownIfNeeded };
