import fs from 'fs/promises';
import { constants as fsConstants } from 'fs';
import path from 'path';
import { createLogger, Logger } from './logger';
import { ErrorHandler } from './error-handler';
import { PathValidationOptions, validatePath as runPathValidation } from './validator';

export class PathUtils {
  private static logger: Logger = createLogger('path-utils');

  static safeJoin(base: string, ...segments: string[]): string {
    const result = path.resolve(base, ...segments);
    const normalizedBase = path.resolve(base);
    if (!result.startsWith(normalizedBase)) {
      const error = `Resolved path '${result}' escapes base '${normalizedBase}'.`;
      this.logger.error(error, undefined, { base, segments });
      throw ErrorHandler.handle(new Error(error), 'path-utils.safeJoin', { base, segments, resolved: result });
    }
    return result;
  }

  static normalize(value: string): string {
    return path.normalize(value);
  }

  static relative(from: string, to: string): string {
    return path.relative(from, to);
  }

  static async exists(targetPath: string): Promise<boolean> {
    try {
      await fs.access(targetPath, fsConstants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  static async ensureDir(directoryPath: string): Promise<void> {
    const validation = runPathValidation(directoryPath, { allowRelative: false });
    if (!validation.isValid) {
      throw ErrorHandler.handle(new Error(validation.errors.join('; ')), 'path-utils.ensureDir', {
        path: directoryPath
      });
    }

    try {
      await fs.mkdir(validation.value!, { recursive: true });
    } catch (error) {
      throw ErrorHandler.handle(error, 'path-utils.ensureDir', { path: validation.value });
    }
  }

  static async readJSON<T = unknown>(filePath: string, options: PathValidationOptions = {}): Promise<T> {
    const validation = runPathValidation(filePath, options);
    if (!validation.isValid || !validation.value) {
      throw ErrorHandler.handle(new Error(validation.errors.join('; ')), 'path-utils.readJSON', {
        path: filePath
      });
    }

    try {
      const content = await fs.readFile(validation.value, 'utf-8');
      return JSON.parse(content) as T;
    } catch (error) {
      throw ErrorHandler.handle(error, 'path-utils.readJSON', { path: validation.value });
    }
  }

  static async writeJSON(filePath: string, data: unknown, options: PathValidationOptions = {}): Promise<void> {
    const validation = runPathValidation(filePath, options);
    if (!validation.isValid || !validation.value) {
      throw ErrorHandler.handle(new Error(validation.errors.join('; ')), 'path-utils.writeJSON', {
        path: filePath
      });
    }

    const directory = path.dirname(validation.value);
    await fs.mkdir(directory, { recursive: true });

    try {
      const serialized = JSON.stringify(data, null, 2);
      await fs.writeFile(validation.value, serialized, 'utf-8');
    } catch (error) {
      throw ErrorHandler.handle(error, 'path-utils.writeJSON', { path: validation.value });
    }
  }

  static validatePath(targetPath: string, options: PathValidationOptions = {}) {
    return runPathValidation(targetPath, options);
  }
}

export const {
  safeJoin,
  normalize,
  relative,
  exists,
  ensureDir,
  readJSON,
  writeJSON,
  validatePath
} = PathUtils;
