import { getCommandDescriptor, listCommandDescriptors } from './cli-command-registry.mjs';

/**
 * @typedef {import('./cli-command-registry.mjs').CommandDescriptor} CommandDescriptor
 * @typedef {import('./cli-command-registry.mjs').CommandFlagDefinition} CommandFlagDefinition
 */

/**
 * @typedef {Object} ParserContext
 * @property {CommandDescriptor} descriptor
 * @property {Record<string, any>} options
 * @property {Record<string, any>} state
 * @property {Map<string, number>} flagCounts
 */

/**
 * @typedef {Object} ParserResult
 * @property {Record<string, any>} positionals
 * @property {Record<string, any>} options
 * @property {boolean} helpRequested
 */

/**
 * @param {string} name
 * @returns {string}
 */
function defaultTarget(name) {
  return name.replace(/-([a-z])/g, (_, char) => char.toUpperCase()).replace(/^-+/, '');
}

/**
 * @param {string} value
 * @returns {string[]}
 */
function splitCommaValues(value) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/**
 * @param {CommandDescriptor} descriptor
 * @param {CommandFlagDefinition} flag
 * @param {string} rawValue
 * @param {ParserContext} ctx
 * @returns {any}
 */
function coerceValue(descriptor, flag, rawValue, ctx) {
  if (flag.coerce) {
    return flag.coerce(rawValue, ctx);
  }
  switch (flag.type) {
    case 'boolean':
      return true;
    case 'number': {
      const value = Number.parseInt(rawValue, 10);
      if (Number.isNaN(value)) {
        throwUsageError(descriptor, `Flag --${flag.name} expects a number (received "${rawValue}")`);
      }
      return value;
    }
    case 'csv':
      return splitCommaValues(rawValue);
    case 'string':
    default:
      return rawValue;
  }
}

/**
 * @param {CommandDescriptor} descriptor
 * @param {CommandFlagDefinition} flag
 * @param {any} value
 * @param {ParserContext} ctx
 */
function applyFlagValue(descriptor, flag, value, ctx) {
  const target = flag.target || defaultTarget(flag.name);
  const currentCount = ctx.flagCounts.get(flag.name) || 0;
  if (flag.type !== 'boolean' && !flag.multiple && currentCount > 0) {
    throwUsageError(descriptor, `Flag --${flag.name} specified multiple times.`);
  }
  ctx.flagCounts.set(flag.name, currentCount + 1);

  if (flag.apply) {
    flag.apply(value, ctx);
    return;
  }

  if (flag.type === 'boolean') {
    ctx.options[target] = flag.negates ? false : true;
    return;
  }

  if (flag.negates) {
    ctx.options[target] = false;
    return;
  }

  if (flag.type === 'csv' || flag.multiple) {
    const list = Array.isArray(ctx.options[target]) ? ctx.options[target] : [];
    if (Array.isArray(value)) {
      list.push(...value);
    } else {
      list.push(value);
    }
    ctx.options[target] = list;
    return;
  }

  if (flag.appendNewline && typeof ctx.options[target] === 'string') {
    ctx.options[target] = `${ctx.options[target]}\n${value}`;
    return;
  }

  ctx.options[target] = value;
}

/**
 * @param {CommandDescriptor} descriptor
 * @returns {Record<string, any>}
 */
function createDefaultOptions(descriptor) {
  if (typeof descriptor.createOptions === 'function') {
    return descriptor.createOptions();
  }
  return {};
}

/**
 * @param {CommandDescriptor} descriptor
 * @returns {Map<string, CommandFlagDefinition>}
 */
function buildFlagIndex(descriptor) {
  const index = new Map();
  (descriptor.flags || []).forEach((flag) => {
    index.set(`--${flag.name}`, flag);
    if (flag.aliases) {
      flag.aliases.forEach((alias) => {
        const normalized = alias.startsWith('-') ? alias : `--${alias}`;
        index.set(normalized, flag);
      });
    }
  });
  return index;
}

/**
 * @param {CommandDescriptor} descriptor
 * @param {string[]} tokens
 * @returns {ParserResult}
 */
export function parseCommandInvocation(descriptor, tokens) {
  if (!descriptor) {
    throw new Error('Cannot parse command without descriptor.');
  }
  const positionals = {};
  const options = createDefaultOptions(descriptor);
  const state = {};
  const ctx = /** @type {ParserContext} */ ({
    descriptor,
    options,
    state,
    flagCounts: new Map()
  });

  const flagIndex = buildFlagIndex(descriptor);
  const positionalDefs = descriptor.positionals || [];
  let positionalIndex = 0;
  let helpRequested = false;

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token === '--help' || token === '-h') {
      helpRequested = true;
      continue;
    }
    if (token.startsWith('-')) {
      const flag = flagIndex.get(token);
      if (!flag) {
        throwUsageError(descriptor, `Unknown flag ${token}`);
      }
      if (flag.type === 'boolean') {
        applyFlagValue(descriptor, flag, true, ctx);
        continue;
      }
      if (i + 1 >= tokens.length) {
        throwUsageError(descriptor, `Flag ${token} requires a value.`);
      }
      const rawValue = tokens[i + 1];
      i += 1;
      const coerced = coerceValue(descriptor, flag, rawValue, ctx);
      applyFlagValue(descriptor, flag, coerced, ctx);
      continue;
    }
    const positionalDef = positionalDefs[positionalIndex];
    if (!positionalDef) {
      throwUsageError(descriptor, `Unexpected argument "${token}"`);
    }
    let value = token;
    if (positionalDef.type === 'number') {
      const numeric = Number.parseInt(token, 10);
      if (Number.isNaN(numeric)) {
        throwUsageError(
          descriptor,
          `Positional argument ${positionalDef.name} expects a number (received "${token}")`
        );
      }
      value = numeric;
    }
    positionals[positionalDef.name] = value;
    positionalIndex += 1;
  }

  positionalDefs.forEach((def) => {
    if (def.required && !(def.name in positionals)) {
      throwUsageError(descriptor, `Missing required argument <${def.name}>`);
    }
  });

  (descriptor.flags || []).forEach((flag) => {
    const count = ctx.flagCounts.get(flag.name) || 0;
    if (flag.required && count === 0) {
      throwUsageError(descriptor, `Missing required flag --${flag.name}`);
    }
    if (flag.onMissing && count === 0) {
      flag.onMissing(ctx);
    }
  });

  if (descriptor.postParse) {
    descriptor.postParse(ctx);
  }

  if (ctx.state && ctx.state.usageError) {
    throwUsageError(descriptor, ctx.state.usageError);
  }

  return { positionals, options, helpRequested };
}

/**
 * @param {CommandDescriptor} descriptor
 * @returns {string}
 */
export function formatCommandUsage(descriptor) {
  const lines = [descriptor.usage];
  if (descriptor.flags && descriptor.flags.length) {
    const flagLines = descriptor.flags.map((flag) => {
      const aliases = flag.aliases ? flag.aliases.join(', ') : '';
      const aliasPart = aliases ? ` (${aliases})` : '';
      const typePart = flag.type && flag.type !== 'boolean' ? ` <${flag.type}>` : '';
      return `  --${flag.name}${typePart}${aliasPart}${flag.description ? ` — ${flag.description}` : ''}`;
    });
    lines.push('Flags:');
    lines.push(...flagLines);
  }
  if (descriptor.examples && descriptor.examples.length) {
    lines.push('Examples:');
    descriptor.examples.forEach((example) => {
      lines.push(`  ${example}`);
    });
  }
  return lines.join('\n');
}

/**
 * @param {CommandDescriptor} descriptor
 * @param {string} message
 */
export function throwUsageError(descriptor, message) {
  const summary = `${message}\n\nUsage:\n${formatCommandUsage(descriptor)}`;
  const error = new Error(summary);
  error.name = 'UsageError';
  throw error;
}

/**
 * Render a global help summary for all commands.
 * @returns {string}
 */
export function formatGlobalHelp() {
  const lines = ['Usage: npm run consolidate -- <command> [options]', '', 'Commands:'];
  listCommandDescriptors().forEach((descriptor) => {
    lines.push(`  ${descriptor.name.padEnd(16)} ${descriptor.summary}`);
  });
  lines.push('');
  lines.push('Use `<command> --help` to see detailed usage for a command.');
  return lines.join('\n');
}

/**
 * Resolves a descriptor including alias support.
 * @param {string} command
 * @returns {CommandDescriptor|null}
 */
export function resolveDescriptor(command) {
  return getCommandDescriptor(command);
}
