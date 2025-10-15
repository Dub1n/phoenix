import { createLogger, LogLevel, type Logger } from '../utils/logger';

type SkinLoggerDomain = 'universal-skin-engine' | 'skin-version-manager';

export type SkinLoggerSegment = 'core' | 'rendering' | 'validation' | 'integration';

const baseLoggers = new Map<SkinLoggerDomain, Logger>();
const segmentLoggers = new Map<string, Logger>();

function getBaseLogger(domain: SkinLoggerDomain): Logger {
  let logger = baseLoggers.get(domain);
  if (!logger) {
    logger = createLogger(domain);
    logger.setLevel(LogLevel.WARN);
    baseLoggers.set(domain, logger);
  }
  return logger;
}

export function getSkinLogger(
  domain: SkinLoggerDomain,
  segment: SkinLoggerSegment = 'core',
): Logger {
  if (segment === 'core') {
    return getBaseLogger(domain);
  }

  const key = `${domain}:${segment}` as const;
  let logger = segmentLoggers.get(key);
  if (!logger) {
    logger = getBaseLogger(domain).child(segment);
    segmentLoggers.set(key, logger);
  }
  return logger;
}
