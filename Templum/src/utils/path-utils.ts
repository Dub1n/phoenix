import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import { createLogger } from './logger';
import { ErrorHandler } from './error-handler';
import { createTemplumError, TemplumError } from '../types/templum-types';

const logger = createLogger('path-utils');

export interface PathGuardOptions {
  sandbox?: string;
  allowEscape?: boolean;
  allowRelative?: boolean;
  maxLength?: number;
  blockedPaths?: string[];
  blockedSegments?: string[];
  allowedExtensions?: string[];
}

export interface PathOperationResult<T> {
  ok: boolean;
  path: string;
  confidence: number;
  value?: T;
  error?: TemplumError;
  metadata?: Record<string, unknown>;
}

export interface ReadJsonOptions<T> {
  encoding?: BufferEncoding;
  fallback?: T;
}

export interface WriteJsonOptions {
  indent?: number;
}

const DEFAULT_MAX_LENGTH = os.platform() === 'win32' ? 260 : 4096;

class PathGuard {
  private readonly sandbox?: string;
  private readonly allowEscape: boolean;
  private readonly allowRelative: boolean;
  private readonly maxLength: number;
  private readonly blockedPaths: string[];
  private readonly blockedSegments: string[];
  private readonly allowedExtensions?: string[];

  constructor(options: PathGuardOptions = {}) {
    this.sandbox = options.sandbox ? path.resolve(options.sandbox) : undefined;
    this.allowEscape = options.allowEscape ?? false;
    this.allowRelative = options.allowRelative ?? true;
    this.maxLength = options.maxLength ?? DEFAULT_MAX_LENGTH;
    this.blockedPaths = (options.blockedPaths ?? []).map(p => path.resolve(p));
    this.blockedSegments = options.blockedSegments ?? ['..'];
    this.allowedExtensions = options.allowedExtensions;
  }

  resolve(target: string, segments: string[] = []): { path: string; confidence: number } {
    const base = this.normalizeInput(target);
    const resolved = path.normalize(path.join(base, ...segments));

    this.assertLength(resolved);
    this.assertNotBlocked(resolved);
    this.assertSandbox(resolved);
    this.assertAllowedExtension(resolved);

    const confidence = this.computeConfidence(resolved, segments);
    return { path: resolved, confidence };
  }

  withinSandbox(candidate: string): boolean {
    if (!this.sandbox) {
      return true;
    }
    const absolute = path.resolve(candidate);
    if (absolute === this.sandbox) {
      return true;
    }
    const relative = path.relative(this.sandbox, absolute);
    return !relative.startsWith('..') && !path.isAbsolute(relative);
  }

  hasSandbox(): boolean {
    return Boolean(this.sandbox);
  }

  isEscapeAllowed(): boolean {
    return this.allowEscape;
  }

  private normalizeInput(input: string): string {
    if (path.isAbsolute(input)) {
      return path.normalize(input);
    }

    if (!this.sandbox) {
      if (!this.allowRelative) {
        throw createTemplumError(
          `Relative paths are not permitted without sandbox root: ${input}`,
          'PATH_GUARD_RELATIVE_BLOCKED',
          'validation',
          { input }
        );
      }
      return path.resolve(process.cwd(), input);
    }

    if (!this.allowRelative && input.startsWith('..')) {
      throw createTemplumError(
        `Relative traversal blocked for sandboxed path: ${input}`,
        'PATH_GUARD_RELATIVE_BLOCKED',
        'validation',
        { sandbox: this.sandbox, input }
      );
    }

    return path.resolve(this.sandbox, input);
  }

  private assertSandbox(resolved: string): void {
    if (!this.sandbox || this.allowEscape) {
      return;
    }

    if (!this.withinSandbox(resolved)) {
      throw createTemplumError(
        'Path resolution blocked: Attempted to escape sandbox root',
        'PATH_GUARD_BLOCKED',
        'validation',
        { sandbox: this.sandbox, resolved }
      );
    }
  }

  private assertLength(resolved: string): void {
    if (resolved.length > this.maxLength) {
      throw createTemplumError(
        `Path exceeds maximum length (${this.maxLength}): ${resolved.length}`,
        'PATH_LENGTH_EXCEEDED',
        'validation',
        { max: this.maxLength, length: resolved.length, path: resolved }
      );
    }
  }

  private assertNotBlocked(resolved: string): void {
    if (this.blockedPaths.includes(resolved)) {
      throw createTemplumError(
        `Path resolution blocked for guarded target: ${resolved}`,
        'PATH_GUARD_BLOCKED',
        'validation',
        { resolved }
      );
    }

    const segments = resolved.split(path.sep);
    if (segments.some(segment => this.blockedSegments.includes(segment))) {
      throw createTemplumError(
        `Path contains blocked segment: ${resolved}`,
        'PATH_SEGMENT_BLOCKED',
        'validation',
        { resolved, blockedSegments: this.blockedSegments }
      );
    }
  }

  private assertAllowedExtension(resolved: string): void {
    if (!this.allowedExtensions || resolved.endsWith(path.sep)) {
      return;
    }

    const extension = path.extname(resolved);
    if (extension && !this.allowedExtensions.includes(extension)) {
      throw createTemplumError(
        `Extension not permitted for guarded path: ${extension}`,
        'PATH_EXTENSION_BLOCKED',
        'validation',
        { resolved, extension, allowedExtensions: this.allowedExtensions }
      );
    }
  }

  private computeConfidence(resolved: string, segments: string[]): number {
    let confidence = this.sandbox ? 0.95 : 0.9;

    if (segments.some(segment => segment === '.' || segment === '')) {
      confidence -= 0.05;
    }

    return Math.max(0.5, Math.min(1, confidence));
  }
}

export class PathHandle {
  constructor(
    private readonly guard: PathGuard,
    private readonly absolutePath: string,
    private readonly baseConfidence: number
  ) {}

  get path(): string {
    return this.absolutePath;
  }

  get confidence(): number {
    return this.baseConfidence;
  }

  join(...segments: string[]): PathHandle {
    const { path: resolved, confidence } = this.guard.resolve(this.absolutePath, segments);
    return new PathHandle(this.guard, resolved, Math.min(this.baseConfidence, confidence));
  }

  parent(): PathHandle {
    const parentPath = path.dirname(this.absolutePath);
    const { path: resolved, confidence } = this.guard.resolve(parentPath);
    return new PathHandle(this.guard, resolved, Math.min(1, confidence));
  }

  async ensureDir(): Promise<PathOperationResult<PathHandle>> {
    try {
      await fs.mkdir(this.absolutePath, { recursive: true });
      logger.debug('Ensured directory exists', { path: this.absolutePath });
      return { ok: true, path: this.absolutePath, confidence: this.baseConfidence, value: this };
    } catch (error) {
      const templumError = ErrorHandler.handle(error, 'path-utils.ensureDir', { path: this.absolutePath });
      return { ok: false, path: this.absolutePath, confidence: 0, error: templumError };
    }
  }

  async exists(): Promise<PathOperationResult<boolean>> {
    try {
      await fs.access(this.absolutePath);
      return {
        ok: true,
        path: this.absolutePath,
        confidence: this.baseConfidence,
        value: true,
        metadata: { exists: true }
      };
    } catch {
      return {
        ok: true,
        path: this.absolutePath,
        confidence: this.baseConfidence,
        value: false,
        metadata: { exists: false }
      };
    }
  }

  async readText(encoding: BufferEncoding = 'utf-8'): Promise<PathOperationResult<string>> {
    try {
      const buffer = await fs.readFile(this.absolutePath, { encoding });
      logger.debug('Read text file', { path: this.absolutePath, bytes: buffer.length });
      return {
        ok: true,
        path: this.absolutePath,
        confidence: this.baseConfidence,
        value: buffer,
        metadata: { bytes: buffer.length }
      };
    } catch (error) {
      const templumError = ErrorHandler.handle(error, 'path-utils.readText', { path: this.absolutePath });
      return { ok: false, path: this.absolutePath, confidence: 0.2, error: templumError };
    }
  }

  async readJSON<T>(options: ReadJsonOptions<T> = {}): Promise<PathOperationResult<T>> {
    try {
      const encoding = options.encoding ?? 'utf-8';
      const buffer = await fs.readFile(this.absolutePath, { encoding });
      const payload = JSON.parse(buffer) as T;
      logger.debug('Read JSON file', { path: this.absolutePath, bytes: buffer.length });
      return {
        ok: true,
        path: this.absolutePath,
        confidence: this.baseConfidence,
        value: payload,
        metadata: { bytes: buffer.length }
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT' && options.fallback !== undefined) {
        logger.warn('JSON file missing, returning fallback', { path: this.absolutePath });
        return {
          ok: true,
          path: this.absolutePath,
          confidence: 0.5,
          value: options.fallback,
          metadata: { fallback: true }
        };
      }

      const templumError = ErrorHandler.handle(error, 'path-utils.readJSON', { path: this.absolutePath });
      return { ok: false, path: this.absolutePath, confidence: 0.2, error: templumError };
    }
  }

  async writeText(data: string, encoding: BufferEncoding = 'utf-8'): Promise<PathOperationResult<void>> {
    try {
      const parentHandle = this.parent();
      const ensured = await parentHandle.ensureDir();
      if (!ensured.ok) {
        return {
          ok: false,
          path: ensured.path,
          confidence: ensured.confidence,
          error: ensured.error,
          metadata: ensured.metadata
        };
      }

      await fs.writeFile(this.absolutePath, data, { encoding });
      logger.debug('Wrote text file', { path: this.absolutePath, bytes: data.length });
      return { ok: true, path: this.absolutePath, confidence: this.baseConfidence, metadata: { bytes: data.length } };
    } catch (error) {
      const templumError = ErrorHandler.handle(error, 'path-utils.writeText', { path: this.absolutePath });
      return { ok: false, path: this.absolutePath, confidence: 0.2, error: templumError };
    }
  }

  async writeJSON<T>(data: T, options: WriteJsonOptions = {}): Promise<PathOperationResult<void>> {
    try {
      const indent = options.indent ?? 2;
      const serialized = `${JSON.stringify(data, null, indent)}\n`;
      const write = await this.writeText(serialized);
      if (!write.ok) {
        return write;
      }

      return { ok: true, path: this.absolutePath, confidence: this.baseConfidence, metadata: { bytes: serialized.length } };
    } catch (error) {
      const templumError = ErrorHandler.handle(error, 'path-utils.writeJSON', { path: this.absolutePath });
      return { ok: false, path: this.absolutePath, confidence: 0.2, error: templumError };
    }
  }
}

export class PathUtils {
  static from(target: string, guardOptions: PathGuardOptions = {}): PathHandle {
    const guard = new PathGuard(guardOptions);
    const { path: resolved, confidence } = guard.resolve(target);
    return new PathHandle(guard, resolved, confidence);
  }

  static async ensureDir(target: string, guardOptions: PathGuardOptions = {}): Promise<PathOperationResult<PathHandle>> {
    return this.from(target, guardOptions).ensureDir();
  }

  static async exists(target: string, guardOptions: PathGuardOptions = {}): Promise<PathOperationResult<boolean>> {
    return this.from(target, guardOptions).exists();
  }

  static async findUp(start: string, markers: string[], guardOptions: PathGuardOptions = {}): Promise<PathOperationResult<string | null>> {
    const guard = new PathGuard(guardOptions);
    const { path: startPath } = guard.resolve(start);

    let current = path.resolve(startPath);
    let previous = '';

    while (current !== previous) {
      for (const marker of markers) {
        const candidate = path.join(current, marker);
        try {
          await fs.access(candidate);
          logger.debug('Resolved marker via findUp', { start: startPath, marker, directory: current });
          return {
            ok: true,
            path: candidate,
            confidence: guard.hasSandbox() ? 0.95 : 0.9,
            value: current,
            metadata: { marker }
          };
        } catch {
          // continue searching
        }
      }

      previous = current;
      const parent = path.dirname(current);
      if (parent === current) {
        break;
      }

      if (guard.hasSandbox() && !guard.withinSandbox(parent) && !guard.isEscapeAllowed()) {
        break;
      }

      current = parent;
    }

    logger.warn('Marker not found via findUp', { start: startPath, markers });
    return {
      ok: true,
      path: startPath,
      confidence: 0.4,
      value: null,
      metadata: { markers }
    };
  }
}

