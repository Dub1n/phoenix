import prettier from 'prettier';
import { enforceNoteIndentation } from '../schedule-format-helpers.mjs';

async function formatMarkdownIfNeeded(filePath, content) {
  if (!filePath.endsWith('.md')) {
    return content;
  }
  try {
    const config = await prettier.resolveConfig(filePath);
    const options = { ...(config || {}), parser: 'markdown' };
    const formatted = prettier.format(content, options);
    return enforceNoteIndentation(formatted);
  } catch {
    return enforceNoteIndentation(content);
  }
}

export { formatMarkdownIfNeeded };
