import { StringUtils } from '../utils/chainable-string-utils';

export type ColumnAlignment = 'left' | 'right' | 'center';

export function formatColumn(
  value: string | number,
  width: number,
  alignment: ColumnAlignment = 'right'
): string {
  const normalized = typeof value === 'string' ? value : String(value);
  return StringUtils.chain(normalized, { mode: 'terminal' }).pad(width, alignment).value();
}
